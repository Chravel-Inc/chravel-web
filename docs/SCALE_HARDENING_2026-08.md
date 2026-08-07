# Scale Hardening — 2026-08-05

Companion to `PIPELINE_DRIFT_AUDIT_2026-08.md`. That audit was defensive: find what silently broke.
This one is proactive: **what breaks when the app actually grows.**

Everything below was measured against production, not inferred.

---

## P0 — Payments could not work at all. FIXED.

**No payment of any kind — Stripe or RevenueCat — could ever have granted an entitlement.**

All four payment paths upsert into `user_entitlements` with
`onConflict: 'user_id,purchase_type'`:

| function | call sites |
|---|---|
| `stripe-webhook` | 3 |
| `revenuecat-webhook` | 1 |
| `check-subscription` | 1 |
| `sync-revenuecat-entitlement` | 1 |

The live table had only `PRIMARY KEY (user_id)`. PostgREST's `onConflict` requires a unique or
exclusion constraint matching those exact columns, so every one of those upserts raised:

```
42P10: there is no unique or exclusion constraint matching the ON CONFLICT specification
```

Confirmed by running the webhook's exact statement against production before the fix. The failure
mode is silent from the outside and self-perpetuating: the webhook catches the error, releases its
idempotency marker, and returns 500 so RevenueCat retries — which fails identically, forever. A user
would be charged by Apple and never receive access.

Root cause: `20260413090000_user_entitlements_composite_purchase_key` — which widens the key so a
subscription and a Trip Pass can coexist for one user — had never been applied. Same pipeline drift
as everything else in this audit, but on the revenue path.

**Fixed and verified.** The primary key is now `(user_id, purchase_type)`. The full sequence was
replayed against production with a real user — INITIAL_PURCHASE inserts, RENEWAL updates in place
rather than duplicating, and a Trip Pass coexists with the subscription — then the test rows were
removed.

Two things checked and found already correct: `webhook_events` has `UNIQUE (event_id)`, so the
idempotency guard genuinely works; and the client SDK path is sound — a missing API key surfaces an
explicit `NOT_CONFIGURED` rather than failing silently, and there is both a pre-purchase product-ID
assertion and a runtime audit of live offerings against the required IDs.

**Still needs a human, in the RevenueCat dashboard** — none of this is verifiable from the repo:
1. `REVENUECAT_WEBHOOK_SECRET` in Supabase must match the Authorization header configured on the
   RevenueCat webhook. The function compares them timing-safely and rejects on mismatch.
2. The webhook URL must point at `…/functions/v1/revenuecat-webhook`.
3. Entitlement IDs in `src/constants/revenuecat.ts` are still commented `PLACEHOLDER: Update these
   IDs after creating entitlements in RevenueCat dashboard`. They default to `chravel_explorer` /
   `chravel_frequent_chraveler` and must match the dashboard exactly.
4. `VITE_REVENUECAT_IOS_API_KEY` must be set in the iOS build environment.

**Run one real sandbox purchase before launch.** After it completes, `user_entitlements` should hold
a `source='revenuecat'` row and `webhook_events` an `rc_`-prefixed row. Both were empty at audit
time, which is consistent with a path that has never once succeeded.

### Dashboard audit results (2026-08-05) — four more breaks, none visible from the repo

A read-only pass over the RevenueCat dashboard found that the primary-key bug was not the only thing
stopping payments. In fix order, because these interact:

1. **The webhook Authorization header is empty.** `revenuecat-webhook` compares the incoming
   `Authorization` header against `REVENUECAT_WEBHOOK_SECRET` and rejects on mismatch — an absent
   header fails that check, so **every** delivery 401s. This is a second, independent break on the
   same path as the primary key. The webhook URL itself is correct and there are no stale duplicate
   endpoints.

2. **Three products grant nothing.** `com.chravel.explorer.monthly`, `com.chravel.explorer.annual`
   and `com.chravel.frequentchraveler.monthly` have no entitlement attached. A purchase would
   succeed and unlock nothing.

3. **Pro entitlement identifiers are wrong.** The dashboard has `pro_starter` / `pro_growth`; the
   canonical names — asserted by `iap-parity.test.ts` and used as the key into `ENTITLEMENT_TO_TIER`
   — are `chravel_pro_starter` / `chravel_pro_growth`. Tier resolution is a direct lookup by
   entitlement id, so an unmatched key means Pro never resolves and the buyer stays on whatever
   other entitlement they hold.

4. **The current offering sells the wrong SKUs.** Six of its eight packages point at an older
   `com.chravel.app.*` naming scheme rather than the eight IDs pinned in `appstore/asc-products.json`.
   Two of those legacy Pro products are attached to *both* their Pro entitlement and
   `chravel_frequent_chraveler`, so buying Pro Starter today also grants Frequent Chraveler — and,
   combined with (3), the buyer resolves as `frequent-chraveler` rather than Pro.

**Fix order matters.** Repointing the offering at the new product IDs *first* would make things
worse: the three products in (2) have no entitlement, so purchases would start succeeding and
granting nothing. Attach entitlements before touching the offering.

**Not a defect:** `chravel_pro_enterprise` is absent from the dashboard. Enterprise is contact-sales
with no IAP (`REQUIRED_IOS_PRODUCT_IDS` contains no Enterprise product), so there is nothing to
attach it to.

**Resolved (2026-08-07) — keep the Non-consumable products as they are; one pass per Apple ID.**

Both passes are configured as **Non-consumable**, which Apple treats as owned permanently. They are
time-limited by design — 30 days at $39.99, 90 days at $74.99 — so on iOS **each pass can be bought
exactly once, ever**: RevenueCat expires the entitlement after the window, and the App Store then
resolves any repeat purchase for free without granting anything.

Non-Renewing Subscription is the type Apple documents for fixed-duration access and would allow
repurchase, but **Apple fixes an IAP's type at creation and never lets you change it**, and a
product ID cannot be reused even after deletion — so switching means new SKUs (`…​.explorer.v2`),
fresh App Store Connect entries, and a `REVENUECAT_PRODUCTS` / `asc-products.json` swap. Product
decision: **not worth the launch complexity.** Keep the existing products, prices, and names, and
make the one-pass-per-Apple-ID model work properly in code.

The resulting model, which is coherent on its own terms: buy one pass, use it for a trip, then move
to a subscription for anything further. Note it is **iOS-only** — the web/Stripe path has no
ownership model and repurchases fine, so passes remain repeatable there.

Lifetime access as a one-time Non-consumable was considered and declined: Chravel's marginal cost
per user is not zero (concierge inference, Stream MAU, Supabase egress), so a lifetime buyer is an
unbounded liability priced with no retention data. It can be added later; it cannot be un-sold.

`src/constants/revenuecat.ts` still carries a comment asserting the passes "MUST be created as
non-renewing subscriptions". That is now the aspirational path, not the shipped one — the code was
updated to match the products that actually exist.

### 6. A purchase that granted nothing reported success. FIXED.

`purchaseByProductId` returned `success: true` for any resolved StoreKit transaction. A resolved
transaction is not a grant, and two situations that both exist today prove it:

- **An already-owned Non-consumable.** Apple resolves the repeat purchase without charging and
  without granting, because the pass window is computed from the original purchase date. The app
  reported *"Trip Pass activated! Premium features are unlocking now"* over an unchanged account.
  This is the exact failure mode the store-type decision above accepts, so it had to be handled.
- **A product attached to no entitlement in RevenueCat.** Resolves identically. Three products were
  in this state during the 2026-08-05 dashboard audit — the client-side twin of the
  `isUnmappedGrantingPurchase` guard added to the webhook in (5).

Nothing in the codebase mapped a product to the entitlement it sells (`ENTITLEMENT_TO_TIER` covers
entitlement → tier only), so nothing *could* tell the difference. `PRODUCT_ID_TO_ENTITLEMENT` adds
the missing half and `classifyPurchaseGrant` discriminates the three outcomes by where the expected
entitlement appears: active → granted; present but inactive → `ALREADY_OWNED`; absent → `NOT_GRANTED`.
It fails **open** for an unmapped product, because rejecting a real charged purchase is worse than
not verifying one.

Purchase surfaces then stop offering a pass the Apple ID already owns: `useOwnedTripPasses` reads
`allPurchasedProductIdentifiers` (which retains non-consumables permanently — the same property that
makes the pass unsellable twice is what makes ownership knowable) and both `TripPassModal` and
`ConsumerBillingSection` render "Already used" plus a subscription nudge instead of a dead button.
That hook also fails open: if RevenueCat is unreachable the button stays live, since an unnecessary
attempt now ends in an accurate message while a wrongly hidden button silently costs a sale.

`PricingSection.handlePassPurchase` had a hand-rolled copy of `handlePurchaseResult`'s branches and
so would have silently missed both new error codes; it now calls the shared handler.

### 5. `NON_RENEWING_PURCHASE` was not a recognized event. FIXED.

Found while validating the type change, but **it was already broken with Non-consumables** — this is
not a consequence of the switch. RevenueCat fires `NON_RENEWING_PURCHASE` for every non-subscription
product (consumable, non-consumable, and non-renewing subscription alike); `INITIAL_PURCHASE` is
auto-renewable-only. `SUBSCRIPTION_EVENTS` in `revenuecat-webhook/eventState.ts` omitted it, so
`index.ts` short-circuited every Trip Pass delivery with `{skipped: true}` and the webhook never
wrote a `purchase_type='pass'` row.

That left `sync-revenuecat-entitlement`, called client-side after purchase, as the only path — and
`revenuecatClient.ts:527` only `console.warn`s when that call fails while still returning
`success: true`. A dropped sync (network loss, backgrounded app, missing
`REVENUECAT_SECRET_API_KEY` → 503) billed the customer and granted nothing, with no backstop.

Adding the event exposed a second hazard. `derivePlanFromEntitlements` returns `'free'` for empty
`entitlement_ids`, which is correct for EXPIRATION but catastrophic for a purchase — and an
unattached store product produces exactly that payload, which is the state three products in (2)
were in. Persisting it would overwrite a live row with `plan='free'`, revoking access the customer
just paid for; buying a second pass while the first was still active is the concrete way it bites.
`isUnmappedGrantingPurchase` now blocks the write for granting events only (purchase / renewal /
uncancellation / extension / product change) and logs the misconfiguration, while leaving genuine
revocations untouched. Both fixes have regression tests verified to fail when reverted.

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

### How we know they are dead — and how we got the evidence standard wrong first

**The weak argument (do not rely on this).** 24 hours of edge logs showed traffic to exactly eight
functions, all with source in the repo, and zero requests to any of the 40. That reads like proof and
is not: the app has not launched, so low traffic is the expected state for *everything*. Absence of
traffic in a pre-launch window is close to worthless as evidence.

A second method was also wrong. The first pass searched for `functions.invoke('name')` and concluded
nothing called the orphans — but that pattern misses raw `fetch()` to `/functions/v1/<name>`, which
is exactly how `stream-token`, `export-trip`, `delete-account`, `stream-join-channel` and
`execute-concierge-tool` are called. A caller could have been missed the same way.

**The strong argument, and the standard to use.** Three checks, all repeatable:

1. **No caller anywhere.** Search the whole repo — every extension, not just TS — for the function
   name, covering `functions.invoke`, raw `fetch('/functions/v1/…')`, config, and native. Every
   reference to the 40 resolves to documentation, an archived design note, this audit, or a string
   label (`joinRequestMutations.ts` uses `'approve-join-request'` as a `syncFailureContext` tag, not
   an invocation). There are no native call sites — the iOS shell is a Capacitor wrapper with no
   Swift/Kotlin of its own.
2. **A live replacement exists and is the path actually taken.** Not "a similarly named function
   exists" — the specific call the app makes.
3. **The orphan's own dependencies are gone.** The most decisive check, because it proves the
   function cannot work even if something did call it.

Worked example — **`photo-upload`**, one that looked most alarming:

| | |
|---|---|
| writes to bucket | `trip-photos` — **does not exist** |
| inserts into table | `trip_photos` — **does not exist** |
| identity | trusts a client-supplied `userId` from form data, with no trip-membership check |
| CORS | `Access-Control-Allow-Origin: '*'` — a stale copy predating the exact-match allowlist |
| what the app actually does | uploads straight to Supabase Storage — `storage.from('trip-media')`, 13 call sites, **104 live objects** |

So photo upload is not lost by deleting it. `photo-upload` is a fossil of an older architecture whose
bucket and table no longer exist; every invocation would 500 at the upload. It is simultaneously
dead *and* the kind of thing worth removing on its own merits.

The same resolution for the others most likely to look load-bearing:

| Orphan | What actually serves that capability today |
|---|---|
| `approve-join-request` | the `approve_join_request` **RPC** — `src/lib/joinRequestMutations.ts:42` |
| `getstream-token` | `fetch('/functions/v1/stream-token')` — `streamTokenService.ts:49` |
| `export-trip-summary` | `export-user-data` (invoke) and `export-trip` (fetch) |
| `photo-upload` | direct `storage.from('trip-media')` upload with RLS on the path segments |

**The residual risk this cannot rule out** is external callers configured outside the repo — a
provider webhook still pointed at an old endpoint, or an older cached web bundle still calling
`getstream-token`. That is why the workflow archives the source before deleting, and why
`waitlist-signup`, `approve-join-request`, `share-preview`, `getstream-token`,
`send-organization-invite`, `google-calendar-sync` and `organization-billing-portal` deserve a check
of their 7-day invocation logs — and of the Stripe / RevenueCat / Google redirect URLs — before
their wave runs.

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

### How — three options, best first

**1. GitHub Action (recommended).** `.github/workflows/undeploy-orphan-functions.yml`. The repo
already stores `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_ID` as Actions secrets, so this needs no
local setup and leaves an audit trail in the run log.

> Actions → **Undeploy Orphan Edge Functions** → Run workflow → pick a wave → Run.
> It dry-runs by default. To actually delete: set `dry_run` to `false` **and** type `UNDEPLOY` in the
> confirm box.

Two vetoes make it hard to misfire. It refuses to delete any function whose source exists in
`supabase/functions/` — checked against the fresh checkout at delete time, so restoring a file is a
complete override even if the name is still listed in a wave. And it skips anything not currently
deployed. Run one wave, watch the edge logs 15–30 minutes, then run the next.

**2. Local CLI.** Same effect, if you'd rather watch it happen:

```bash
SUPABASE_ACCESS_TOKEN=... ./scripts/check-edge-function-drift.sh jmjiyekmxwsxkfnqwyaa --print-undeploy
```

Prints the `supabase functions delete` commands without running them, so you can paste the ones you
want.

**3. Browser agent on the Supabase dashboard — last resort.** Worth being straight about why: it is
40 destructive clicks against production, driven by an agent that has to re-find the UI after every
navigation, with no dry run, no repo-source veto, and no audit trail beyond the dashboard's own. The
two options above do the identical thing with a confirmation gate and a log. Use this only if the
Actions secrets are unavailable.

If you do use it, drive it one wave at a time and paste this, substituting the wave list:

> On this Supabase dashboard I'm going to remove some deployed Edge Functions. Work only inside
> Project → Edge Functions for project `jmjiyekmxwsxkfnqwyaa`.
>
> Delete exactly these functions, one at a time, and nothing else:
> `<paste one wave's names here>`
>
> For each name:
> 1. Open Edge Functions and find that exact function. If it isn't in the list, skip it and tell me.
> 2. Before deleting, open its Invocations/Logs and check the last 7 days. If it shows ANY
>    invocations, STOP, do not delete it, and report the name and the count.
> 3. Otherwise delete it and confirm it's gone from the list.
>
> Rules: match names exactly — never a prefix or partial match, and never anything not on my list
> (`stream-token` and `send-push` in particular must not be touched). Do not change any function's
> settings, secrets, or JWT verification. Do not touch Database, Auth, or Storage. If a name is
> ambiguous or a page doesn't look like what you expected, stop and ask me.
>
> When you're finished, list what you deleted, what you skipped, and why.

The script exits non-zero on drift and is already wired into the Drift Check workflow as
reporting-only. Once these 40 are cleared, delete the `continue-on-error: true` line there so it
actually gates and this can never silently accumulate again.

---

## Two live issues the edge logs surfaced

- **`check-subscription` 401 storm — FIXED.** `src/billing/entitlements.ts` invoked it with no auth
  gate. The function requires an `Authorization` header and answers 401 without one, so every call
  made while signed out, or before auth hydrated, was a guaranteed failure. The error was caught and
  returned free entitlements — which made "signed out" and "signed in but unsubscribed"
  indistinguishable at that layer, the exact auth-desync shape where a paid user can momentarily
  render as free. Now resolves the unauthenticated case directly. (`useConsumerSubscription`, the
  other caller, already guarded on `userId`.)
- **`get-invite-preview` 404** — a single request for an invite code that resolved to nothing. That
  is the correct response for an expired or mistyped code; left alone as expected behaviour.

---

## Also applied: the three remaining fail-open degradations

From `PIPELINE_DRIFT_AUDIT_2026-08.md`. Email suppression had already been fixed on `main`, leaving
three — all restored, all previously never-applied:

| RPC | Was | Now |
|---|---|---|
| `get_concierge_trip_history` | Returned `[]` on error, so **the Concierge had no conversation memory** | Applied |
| `update_task_with_version` | Task edits fell through to a direct UPDATE — **no optimistic concurrency**, last-write-wins | Applied, after fixing a `UUID`/`TEXT` mismatch that would have thrown on every non-UUID trip id, and realigning authorization from `role='admin'` to the `has_coordinator_capability` the live policy actually uses |
| `get_trip_mutation_permissions` | **Server-side permission resolver never ran**; every UI affordance decided client-side | Applied as `20260805130000`, resolver half only |

**`20260626140000` stays unapplied on purpose.** Its second half DROPs and REPLACEs the RLS policies
on `trip_tasks`, `trip_polls`, `trip_events` and `trip_links`. That is the highest-blast-radius
change available in this schema, it is not what was broken, and it needs a full permission test
matrix first. The resolver — the part that was actually missing — was extracted into its own
migration.

Applying it surfaced that **`permission_matrix_allows` had never been valid SQL**: plpgsql closes a
`CASE` statement with `END CASE;`, and both the migration and `scripts/generate-permission-matrix.mjs`
emitted a bare `END`, so creating the function raised `42601`. The generator is fixed and the
artifact regenerated — which also picked up the `pro_coordinator` role the old migration predates.
CI had been drift-checking `supabase/sql/permission_matrix_allows.generated.sql` against
`config/permission-matrix.json` the entire time without anyone noticing the artifact could not
execute.

Verified live: the resolver returns `consumer_member` on consumer trips (113 memberships),
`event_attendee`/`event_organizer` on events (29/14), `pro_admin`/`pro_editor` on pro (15/31), with
basecamp-admin correctly restricted to admins and organizers.

### Gmail import: out of scope for MVP (product decision, 2026-08-05)

`gmail_import_artifacts`, `gmail_import_message_logs` and `gmail_token_audit_logs` are missing, and
they are staying missing. `gmail_smart_import` is `enabled=false, rollout=0` in production because
Gmail import was judged overkill for MVP — not because it is mid-rollout. So this is settled scope,
not a deferral, and nothing here is a launch blocker.

What that means in practice:

- **No live breakage.** The flag gates the UI (`SmartImportSettings`, `CalendarImportModal` both read
  `useFeatureFlag('gmail_smart_import', false)`), and `useFeatureFlag` defaults to `false` when a
  flag row is absent, so the surface is off in every direction.
- **The code stays.** `gmail-auth` and `gmail-import-worker` keep their source and remain deployed.
  Deleting them would trade a reviewable, flagged-off feature for an unreviewable orphan — exactly
  the mistake the 40 orphans above represent.
- **The one precondition.** If Gmail import is ever picked back up, the three migrations
  (`20260315000000_gmail_hardening`, `20260401000000_smart_import`,
  `20260524090000_gmail_import_durable_checkpoints`) must be applied and tested **before** the flag
  is flipped. They are interdependent and land against a database where `gmail_accounts` already
  partially exists, so that is a reviewed exercise with its own test pass — never a same-day flip.

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
