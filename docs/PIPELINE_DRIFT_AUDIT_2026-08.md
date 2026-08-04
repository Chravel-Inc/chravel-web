# Pipeline Drift Audit — 2026-08-04

Follow-up to `APP_STORE_LAUNCH_AUDIT_2026-08.md`. That audit found three never-applied migrations
by accident, while chasing unrelated bugs. This one is the systematic sweep: **what else never made
it to production?**

## Method

Migration archaeology does not work here. Lovable records its migrations in
`supabase_migrations.schema_migrations` under **different version numbers than its own filenames**
(file `20250731005514_1321d110-…` is recorded as version `20250731010119`), so filename-to-ledger
matching produces hundreds of false positives — 424 of 530 files "look" unapplied.

The reliable question is not *was this migration recorded* but **does the code call something that
does not exist in production**. So:

1. Pulled the live inventory — 117 tables, 6 views, 147 functions, 336 policies, 103 triggers,
   7 storage buckets.
2. Extracted every `.rpc('…')` and `.from('…')` in `src/**` and `supabase/functions/**`
   (tests excluded), then subtracted storage-bucket and view references to kill false positives.
3. Diffed against the live inventory, then read each call site to classify the **failure mode** —
   fail-closed (user-visible break) vs fail-open (silent degradation) vs dead code.

Result: **66 distinct RPCs called, 22 missing. 120 distinct relations used, 23 missing.**

Every claim below was verified against the live database, not inferred from migration files.

---

## P0 — Confirmed live breakage, FIXED

### The AI Concierge was broken for every free and Explorer user

`lovable-concierge` calls `get_concierge_trip_usage` as a **pre-check before the model runs**, and
it **fails closed**:

```ts
if (!serverDemoMode && user && tripQueryLimit !== null && hasTripId) {
  const { data, error: tripUsageError } = await supabase.rpc('get_concierge_trip_usage', { p_trip_id: tripId });
  if (tripUsageError) {
    return buildUsageVerificationUnavailableResponse(corsHeaders);   // ← every request, RPC absent
  }
```

`tripQueryLimit` comes from `src/lib/conciergeTripQueryLimits.ts`: `free: 3`, `explorer: 25`,
`frequent_chraveler: null`. The gate therefore runs for **free and Explorer users** and is skipped
only for Frequent Chraveler — and for super admins, who explicitly set `tripQueryLimit = null`.

So any authenticated free or Explorer user asking the Concierge a trip-scoped question got
"usage verification unavailable" instead of an answer. **The founder is a super admin, which is
exactly why this never showed up in internal testing.** A second fail-closed call
(`increment_concierge_trip_usage`) sat *after* the model call, so on the Frequent Chraveler path it
would have burned the model tokens and then discarded the answer.

Root cause: `20260213110000_add_concierge_trip_usage_counters.sql` never reached production — table,
both RPCs, and all four RLS policies absent.

**Fixed:** applied 2026-08-04, with two hardening changes carried back into the repo file:
- membership predicates made NULL-tolerant to match `is_active_trip_member()`;
- the backfill now skips `concierge_usage` rows whose trip no longer exists (`concierge_trip_usage
  .trip_id` has an FK to `trips(id)`, so one orphaned historical row would have aborted the whole
  migration).

Verified live: both RPCs resolve, table exists with RLS, `authenticated` holds EXECUTE.

Related and still missing: `checkMonthlyTokenBudget` reads `concierge_usage`, which **does** exist,
and fails **open** — so the monthly token budget was never the blocker.

---

## P1 — Silent degradation: the feature works, the protection does not

These all fail open. Nothing errors, so nothing was ever reported — the guarantee simply is not there.

| Missing | Call site | What is actually lost |
|---|---|---|
| `get_concierge_trip_history` | `lovable-concierge` | Returns `[]` on error, so **the Concierge has no conversation memory** — it cannot reference anything you said earlier in the trip. |
| `update_task_with_version` | `src/hooks/useTripTasks.ts` | Explicit "RPC not found — fall through to direct UPDATE". Task editing works but **loses optimistic-concurrency protection**; concurrent edits are last-write-wins. |
| `get_trip_mutation_permissions` | `src/hooks/useMutationPermissions.ts` | Documented fallback to client-side matrix. The **server-side permission resolver never runs** — mutation permissions in the UI are decided client-side only. RLS is still the real gate at the DB, so this is defense-in-depth that is absent, not an open door. Note this also means `permissionMatrix.generated.ts` drift-checking guards a path that never executes server-side. |
| `should_suppress_email` + `email_bounces` | `send-email-with-retry` | `return data \|\| false` — suppression never applies and bounces are never recorded. **Hard-bounced and complaint addresses keep getting mail**, which is a sending-reputation risk. |

---

## Not a problem — verified dead code

Reported by the scan, confirmed harmless. Recorded so nobody re-investigates them:

- **`can_trip_actor_for_user`** — `assertTripActorPermission()` fails closed and would throw
  `PERMISSION_DENIED` on every call, but grep shows it is referenced **only by its own test file**.
  No production caller. (Worth noting: a security guard that is written, tested, and wired to
  nothing.)
- **`push_tokens`** — `push-notifications/index.ts` reads/writes this non-existent table in
  `registerPushToken`/`removePushToken`, but the app registers through
  `src/services/pushTokenService.ts` → `push_device_tokens` (which exists), and the only invocation
  of that function from the app is `action: 'send_email'`. The broken paths are unreachable.
- **`profiles_public`** (17 call sites) and **`avatars`** — false positives: a view and a storage
  bucket. Both exist.

---

## Inventory resolution (2026-08-04)

Every item below was classified **shipped** (live code path — fix it), **unfinished** (built but
correctly flag-gated off — make it work for when the flag flips), or **abandoned** (unreachable —
remove it). Reachability was determined from `functions.invoke()` call sites in `src/**`, the
`cron.job` table, and cross-function references — not from guesswork.

### Shipped and live → fixed

| Item | Decision |
|---|---|
| `google_places_cache`, `google_maps_api_usage` + 6 RPCs | **Applied, after a rewrite.** See below — the original would not have worked. |
| `feature_flags.cohort_domains` / `cohort_user_ids` | **Applied.** Found via `check-schema-drift`, not the RPC scan. `20260724120000` never reached production, so `useGradualFeature()` / `isFeatureEnabledForUser()` — the cohort + percentage rollout mechanism `docs/BRANCHING_AND_ROLLOUTS.md` documents as *the* way to ramp a feature — queried columns that did not exist. Gradual rollout was impossible; only all-or-nothing kill switches worked. |
| `trip_files` export (`export-user-data`) | **Code fixed.** It read `file.storage_path` against a `trip-files` bucket. `trip_files` has no `storage_path` column (it has `file_url`) and there is no `trip-files` bucket, so the guard was permanently false and the loop never executed — **every data export silently omitted the user's uploaded files.** Now derives the object path from `file_url` and signs against `trip-media`. |
| `push_tokens` (`push-notifications`) | **Code fixed** — repointed to the real `push_device_tokens`. Unreachable in practice (the app registers via `pushTokenService.ts` and only ever invokes this function with `action: 'send_email'`), so this removes a landmine rather than restoring behavior. |

**The Places cache migration was unfinished, not merely unapplied.** Four defects, all fixed:

1. **Authorization** — the functions were `SECURITY INVOKER` while both tables had RLS policies for
   `service_role` only. The browser calls as `authenticated`, so every read returned NULL and every
   write was rejected: a permanent 0% hit rate. Now `SECURITY DEFINER` + `SET search_path`, with the
   tables deny-all to clients.
2. **Client-supplied `user_id`** — `record_api_usage` / `get_hourly_usage` / `get_daily_usage` took
   the caller's `p_user_id`. Combined with `SECURITY DEFINER` that would let any user write usage as,
   and read usage of, anyone else. Identity now always comes from `auth.uid()`.
3. **`p_days || 7`** is string concatenation, not a null-guard — `p_days = 7` became `'77'` days.
4. **`UNIQUE (user_id, …)` with NULL `user_id` never conflicts**, so the `ON CONFLICT DO UPDATE`
   never matched and every request inserted a new row instead of incrementing. Now
   `UNIQUE NULLS NOT DISTINCT`.

A fifth issue surfaced *while applying*: `REVOKE EXECUTE … FROM PUBLIC` left `anon` still able to
execute, because Supabase's `ALTER DEFAULT PRIVILEGES` grants new functions to `anon` **explicitly**
in addition to the implicit PUBLIC grant. Both had to be revoked. This is the exact mirror image of
the `check_invite_code_exists` bug, where the grant was on PUBLIC and `REVOKE … FROM anon` was the
no-op — worth remembering as a pair.

### Unfinished but correctly gated off → no user impact today

| Item | Decision |
|---|---|
| `google_calendar_accounts` | **Applied.** `calendar-auth` is app-invoked and would fail on connect, but `google_calendar_sync` is off (the flag row did not even exist, and `useFeatureFlag` defaults to `false`), so the UI is hidden. Applying creates the table + token-free `_safe` view and seeds the flag **off** — nothing turns on, the landmine is gone. |
| Gmail import — `gmail_import_artifacts`, `gmail_import_message_logs`, `gmail_token_audit_logs` | **Deferred deliberately.** `gmail_smart_import` is `enabled=false, rollout=0` in production, so there is no live breakage. Restoring it means applying three large, interdependent migrations (`20260315000000_gmail_hardening`, `20260401000000_smart_import`, `20260524090000_gmail_import_durable_checkpoints`) against a production DB where `gmail_accounts` already partially exists. That is a reviewed migration exercise, not a blind apply, and it must not ride along in a launch PR. **Must be done before `gmail_smart_import` is ever flipped on.** |

### Abandoned → deleted

Ten edge functions with **zero references** anywhere in `src/`, `supabase/functions/`, `scripts/` or
`e2e/`, no cron entry, and a core table that does not exist — so they provably could not have worked:

`daily-digest` · `message-scheduler` · `update-location` · `delete-stale-locations` ·
`populate-search-index` · `cleanup-staging-tables` · `seed-mock-messages` · `file-ai-parser` ·
`process-receipt-ocr` · `verify-identity`

**Two things this does NOT do.** Deleting the source does **not** undeploy them — all of them remain
live in production, still holding their secrets and still accepting traffic. Undeploying is a
separate manual step (`supabase functions delete <name>`, or the dashboard). And four more
abandoned functions were left in place — `event-reminders`, `ai-features`, `ai-answer`, `ai-search`
— because they are pinned in `supabase/config.toml`, which agents are forbidden to edit; deleting
their source would leave that file referencing functions that no longer exist.

### Verified non-defects

Recorded so nobody re-investigates: `private_profiles` (deliberate legacy handling — the code
comments *"not deployed in live DB"* and skips gracefully), `trip_activity_log` (falls back to a
union of recent tasks/events/links), `search_trip_artifacts` (throws into a `catch` that returns a
tool-level failure; the conversation continues), `find_similar_artifacts`, and the previously
recorded `can_trip_actor_for_user` / `profiles_public` / `avatars`.

`export-trip`, `image-upload` and `artifact-search` are **kept** — they still have live references,
so their missing dependencies are unfinished work, not dead code.

---

## Original inventory (superseded by the resolution above)

Confirmed absent from production and reachable from code, but each belongs to a feature whose
intended status only you can confirm (shipped / abandoned / never finished). Not fixed, because
"apply the migration" is the wrong move if the feature was deliberately dropped.

**Missing RPCs:** `create_verification_session` (verify-identity) · `check_ocr_rate_limit`,
`increment_ocr_usage`, `redact_pii_from_text` (process-receipt-ocr) · `get_trip_pdf_export_usage`,
`increment_trip_pdf_export_usage` (export-trip) · `search_trip_artifacts`, `find_similar_artifacts`
(artifact-search / artifact-ingest) · `get_trip_context` (ai-answer) · `get_trip_search_data`
(ai-search) · `get_places_cache`, `set_places_cache`, `get_daily_usage`, `get_hourly_usage`,
`record_api_usage` (`src/services/googlePlacesCache.ts`).

**Missing tables:** `google_calendar_accounts` (calendar-auth — Google Calendar connect) ·
`concierge_tool_idempotency` (execute-concierge-tool) · `trip_activity_log`
(`_shared/functionExecutor.ts`) · `gmail_import_artifacts`, `gmail_import_message_logs`,
`gmail_token_audit_logs` (Gmail import) · `calendar_reminders` · `daily_digests`, `messages`
(daily-digest) · `scheduled_messages` (message-scheduler) · `realtime_locations` · `private_profiles`
· `shared_inbound_items` · `search_index` · `trip_accommodations` · `trip_messages` (delete-account)
· `message_templates` · `mock_messages` · `file_ai_extractions` · `advertiser_profiles` ·
`email_bounces`.

**Also:** `export-user-data` writes to a **`trip-files` storage bucket that does not exist** (live
buckets: `advertiser-assets`, `avatars`, `chat-media`, `event-agendas`, `trip-covers`, `trip-media`,
`trip-voice-notes`). This is the same class of bug as the `file-upload` function, which was fixed in
the previous audit by repointing it at `trip-media`.

The `src/services/googlePlacesCache.ts` group is the one most worth a decision soon: it is
**frontend** code, so those five RPCs 404 in the browser on every Places lookup, and the caching and
quota-limiting they implement are simply not happening.

---

## Structural findings

1. **`deploy-migrations.yml` has never run.** It is gated on repo variable `MIGRATIONS_AUTOAPPLY`,
   which is unset — the job reported `skipped` on all 11 historical runs. Every agent-authored
   migration that ever reached production got there by hand. That is the mechanism behind all of the
   above.

2. **The workflow's Lovable-detection regex is too narrow.** It skips
   `^[0-9]{14}-[0-9a-fA-F]{8}-` — dash-separated only. Lovable also emits **underscore**-separated
   UUID filenames (`20250731005514_1321d110-2283-414b-…`), and 203 such files are in the repo. Those
   would be classified as agent migrations and re-applied. Today the blast radius is limited because
   the workflow only processes files *changed in the push*, but the moment `MIGRATIONS_AUTOAPPLY` is
   turned on and someone touches an old Lovable migration, it will replay against production.
   **Widen the pattern to `^[0-9]{14}[-_][0-9a-fA-F]{8}-` before enabling the switch.**

3. **32 edge functions are live in production with no source in the repo** (134 deployed vs 102
   function directories). These are orphans from deleted or renamed features. They still hold their
   secrets and still accept traffic.

4. **`CLAUDE.md` claims 756 RLS policies; production has 336.** Stale documentation, not a security
   finding, but it means the number is not a usable reference point.

---

## What was fixed in this pass

- Applied `20260213110000_add_concierge_trip_usage_counters` (P0 — Concierge restored for free and
  Explorer users), hardened and synced back to the repo file.
- `mcp` edge function moved off `npm:` specifiers to esm.sh, dropping the esbuild binaries that
  produced the 25 MB / HTTP 413 deploy failure; removed from `EXCLUDED_FUNCTIONS`.
- `deploy-functions.yml` deploys per function, so a single bad bundle fails only itself and is named
  in the job summary instead of silently masking every function that sorts after it.
