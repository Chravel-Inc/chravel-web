# Scale Hardening — 2026-08-05

Companion to `PIPELINE_DRIFT_AUDIT_2026-08.md`. That audit was defensive: find what silently broke.
This one is proactive: **what breaks when the app actually grows.**

Everything below was measured against production, not inferred.

---

## Applied

### 1. RLS policies re-evaluated `auth.uid()` once per row

| | before | after |
|---|---|---|
| policies in `public` | 345 | 345 |
| bare `auth.uid()` in `USING` | 245 | 0 |
| bare `auth.uid()` in `WITH CHECK` | 137 | 0 |
| optimized `(select auth.uid())` | 0 | 319 |

Postgres treats a bare `auth.uid()` in a policy predicate as a per-row function call — scan 50,000
rows, call it 50,000 times. Wrapped in a scalar subquery the planner hoists it into a one-time
InitPlan. `auth.uid()` is `STABLE`, so the two forms are semantically identical.

The cost is `O(rows scanned)`, which is why it was invisible: at 214 `trip_members` and 589
`trip_chat_messages` it costs nothing, and it will keep costing nothing right up until the first
table hits five figures.

**Migration:** `20260805120000_optimize_rls_auth_uid_initplan.sql`. The 319 policies are not
hand-edited — the migration reads each policy's own deparsed definition from `pg_policies`,
substitutes only the function-call token, and rebuilds it with an identical name, table,
permissive-ness, role list and command. It then snapshots, re-normalizes and compares every
predicate, aborting the whole transaction on any deviation.

That guard earned its keep on the first run: it aborted on all 319, because Postgres re-deparses
`(select auth.uid())` as `( SELECT auth.uid() AS uid)` and the original normalizer did not match
that. Restructured as unwrap-then-wrap, which is idempotent regardless of what form the policies
are currently stored in.

### 2. 43 foreign keys with no index

Postgres indexes primary keys and unique constraints automatically. It never indexes a foreign key —
that is the child table's job, and 43 were missing. Every parent `DELETE` had to sequentially scan
the child to prove nothing referenced it, and deleting a single trip cascades through ~20 child
tables. Now zero unindexed FKs.

**Migration:** `20260805120100_index_unindexed_foreign_keys.sql`, generated from
`pg_constraint`/`pg_index` rather than written by hand.

### 3. Nothing had a retention policy

The database had four cron jobs and none of them pruned anything. `cleanup_rate_limits()` existed as
a function and was scheduled nowhere, so the rate limiter's own table accumulated expired rows
indefinitely.

**Migration:** `20260805120200_data_retention_jobs.sql` adds `run_data_retention()` (daily) and an
hourly rate-limit sweep. First run pruned 24 `ai_queries`, 43 already-read notifications and 6
`notification_logs`.

Two deliberate calls:

- **`webhook_events` is kept 400 days, not 90.** It is not telemetry — it is the Stripe/RevenueCat
  idempotency guard, so its retention window *is* its replay-protection window. Pruning it would let
  a replayed event be processed twice. Rows are ~100 bytes; that window is set by payment
  correctness, not storage.
- **The compliance audit logs are never pruned** (`security_audit_log`, `admin_audit_logs`,
  `payment_audit_log`, `entitlement_audit_log`). `admin_audit_logs` is hash-chained, and both it and
  `security_audit_log` carry triggers that reject `DELETE` outright. Trimming them must be an
  explicit archival decision, never an automated job.

---

## Not applied — needs you: 40 orphaned edge functions

**134 functions are deployed. 94 have source in this repo.** The other 40 are live, routable over
HTTP, still hold whatever secrets they read from the environment, and cannot be reviewed because
there is nothing left to read.

This happens because `supabase functions deploy` only ever adds or updates — it never removes.
Deleting source does not undeploy anything, which is why "clean up the dead functions" is the wrong
instinct: it makes the endpoint *less* reviewable while leaving it just as reachable.

**Evidence they are dead:** 24 hours of edge logs show traffic to exactly eight functions
(`push-client-config`, `check-subscription`, `log-auth-event`, `get-invite-preview`, `stream-token`,
`lovable-concierge`, `process-account-deletions`, `health`) — every one of which has source in the
repo. Zero requests reached any of the 40.

**25 of the 40 have `verify_jwt = false`**, so they accept unauthenticated requests at the gateway.
In-repo functions compensate with an in-body `requireAuth`; for these we cannot confirm that, because
there is no body to read.

### Undeploy order

**Wave 1 — superseded security-sensitive predecessors.** These are the ones that matter: each is an
older, unhardened path to something that has since been locked down.

`getstream-token` (superseded by `stream-token`) · `approve-join-request` (superseded by the
hardened RPC that pins `role='member'`) · `send-trip-notification`, `send-push-notification`,
`send-scheduled-broadcasts` (superseded by the fanout/dispatch pipeline) · `send-organization-invite`
(superseded by `invite-organization-member`) · `organization-billing-portal` (superseded by
`customer-portal`) · `photo-upload` (superseded by `image-upload`) · `export-trip-summary`
(superseded by `export-trip`) · `google-calendar-sync` (superseded by `calendar-sync`) ·
`758f320b-b3aa-4a5f-bc50-a82d2c87431d` (a UUID-named scratch deploy)

**Wave 2 — AI/voice provider proxies.** These hold third-party API keys and most are
`verify_jwt = false`. An unauthenticated proxy in front of a metered AI API is a billing-abuse
vector, not just clutter.

`elevenlabs-conversation-token` · `elevenlabs-tts` · `gemini-chat` · `gemini-tts` ·
`gemini-voice-proxy` · `gemini-voice-session` · `openai-chat` · `xai-voice-session` · `livekit-token`
· `concierge-tts` · `voice-assistant` · `voice-processing` · `generate-audio-summary` ·
`perplexity-chat` · `ai-image-checker` · `ai-image-checker-shared-cors` · `search` · `link-preview` ·
`share-preview`

**Wave 3 — the rest.** `advertiser-management` · `waitlist-signup` · plus the eight whose source
`main` removed in `a88082a` (`cleanup-staging-tables`, `daily-digest`, `delete-stale-locations`,
`file-ai-parser`, `message-scheduler`, `populate-search-index`, `seed-mock-messages`,
`update-location`).

### How

```bash
SUPABASE_ACCESS_TOKEN=... ./scripts/check-edge-function-drift.sh jmjiyekmxwsxkfnqwyaa --print-undeploy
```

It prints the `supabase functions delete` commands and never runs them — undeploying is irreversible
from the CLI. Go one wave at a time and watch the edge logs in between. Anything still taking traffic
is not dead: restore its source and bring it back under review instead of deleting it.

The script exits non-zero on drift, so wire it into CI once the backlog is cleared and this can never
silently accumulate again.

---

## Two live issues the edge logs surfaced

Not part of this work, but visible while gathering evidence and worth a look:

- **`check-subscription` is returning `401` repeatedly** — many `POST … 401` entries interleaved with
  `200`s from the same clients. Either tokens are expiring mid-session or the client is calling it
  before auth hydration completes. Worth confirming it is not users intermittently losing their
  subscription state.
- **`get-invite-preview` returned a `404`** on a real request — an invite link that resolved to
  nothing.

---

## Setup changes worth making

1. **Create a staging environment.** `docs/BRANCHING_AND_ROLLOUTS.md` still lists staging as
   "TO CREATE", and merging to `main` auto-deploys to production with no approval gate. Every finding
   in this session and the last existed because a change reached production with nothing between it
   and users. This is the highest-value process fix available.
2. **Set `MIGRATIONS_AUTOAPPLY=true`** (Settings → Secrets and variables → Actions → Variables).
   `deploy-migrations.yml` has never run — it reported `skipped` on all 11 historical runs — which is
   the root cause of every never-applied migration found so far. Do this *after* confirming the
   Lovable-origin regex fix from the previous PR is on `main`.
3. **Protect `main`.** Require a PR and passing checks. Right now a direct push deploys to
   production.
4. **Add `check-edge-function-drift.sh` to CI** once the 40 orphans are cleared.
5. **Run Supabase's own advisors periodically** (`get_advisors` for `security` and `performance`).
   They catch this class of issue continuously rather than once per audit.
