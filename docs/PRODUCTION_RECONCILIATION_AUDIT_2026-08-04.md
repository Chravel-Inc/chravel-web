# Production-Readiness Reconciliation Audit — 2026-08-04

> Scope: full-stack reconciliation of chravel-web against production Supabase
> project `jmjiyekmxwsxkfnqwyaa` (ChravelApp) — schema/migration drift, code→DB
> contract drift, realtime configuration, storage, edge-function deployment
> drift, dead code, build/deploy config, and CSP/observability.
> Branch: `claude/chravel-production-audit-5zqoai`. Builds on the 2026-08-02
> launch audit (PR #880/#881) — items fixed there are not re-reported.

## Executive result

Nine production defects were verified against the live database and fixed the
same day (all DB changes applied via MCP and recorded in
`schema_migrations`, all mirrored as committed migrations):

| # | Defect (verified live) | Fix |
|---|---|---|
| 1 | **Every confirm-gated mutating AI-concierge action failed** — `execute-concierge-tool` throws when reserving an idempotency key and `concierge_tool_idempotency` never existed (original migration declared `trip_id uuid`; `trips.id` is TEXT, so it could never apply) | `20260804190000_create_concierge_tool_idempotency` (trip_id text, owner-scoped RLS) |
| 2 | **Every account data export failed** — `export-user-data` uploads to bucket `user-data-exports`, absent from prod | `20260804190100_create_user_data_exports_bucket` (private bucket, per-user folder policies) |
| 3 | **Realtime dead for most features** — clients hold `postgres_changes` subscriptions on 25 tables; only 5 were in the `supabase_realtime` publication. Polls/tasks/calendar/payments/members/roles/media/basecamps received no events (chat worked, masking it) | `20260804190400_add_realtime_publication_tables` (+20 tables; RLS still filters delivery) |
| 4 | **Email bounce suppression silently no-oped** — `should_suppress_email` RPC and `email_bounces` table missing | `20260804190200_email_bounce_suppression` (fail-closed RLS, service-role-only RPC) |
| 5 | **Dead unsubscribe link in every outgoing email** — pointed at `/functions/v1/unsubscribe-email`, which has never existed, with a forgeable `btoa` token | Link now goes to notification settings; signed one-click unsubscribe tracked as follow-up |
| 6 | **PWA service worker broken on Vercel** — `buildCommand: "vite build"` skipped `build-sw.cjs` (raw `__WB_MANIFEST` shipped), and `importScripts('/workbox-sw.js')` referenced a path no host serves | Vercel now runs `npm run build`; build rewrites the import to the emitted `/workbox-vX.Y.Z/` copy (verified in dist: 541 files precached) |
| 7 | **Sentry + PostHog fully CSP-blocked in prod** (hosts in neither policy; header/meta CSPs had diverged — browsers enforce the intersection) | One unified CSP in both `vercel.json` and `index.html` (telemetry hosts, ggpht + Stream CDN media; meta also drops unneeded `unsafe-inline`/`unsafe-eval`) |
| 8 | **`ai_concierge` kill switch read by nothing** (seeded 2026-07-30, never wired) | Enforced in `lovable-concierge` + `execute-concierge-tool` (503 when disabled; fails open if the flag store is down) |
| 9 | **Active functions referencing nonexistent tables** — `delete-account` (`trip_messages`), `export-trip` (`trip_accommodations`, silently dropping lodging from exports), `push-notifications` (`push_tokens` save/remove actions) | Repointed to `trip_chat_messages` / `trip_personal_basecamps`; dead actions removed |

Migration history reconciliation: **22 live-only migrations** (Lovable/MCP
applied, never committed) were backfilled into the repo **verbatim** from
`schema_migrations.statements` — the repo can now reproduce the live schema for
those; the deploy workflow skips them (version/name already recorded).

Dead code: **8 edge functions deleted** (`daily-digest`, `message-scheduler`,
`update-location`, `delete-stale-locations`, `seed-mock-messages`,
`cleanup-staging-tables`, `populate-search-index`, `file-ai-parser`) — each had
zero callers anywhere in the repo, no live cron schedule, no `config.toml`
block, and referenced tables that do not exist in prod. Plus: demo-trip data
leak out of `SavedRecommendations` (real-user surface listed the 12 hardcoded
demo trips), unguarded `/dev/billing-preview` route now DEV-gated, dead
`/search` navigation fixed, org-dashboard fetch errors no longer masquerade as
"no trips", 5 stale feature-flag rows deleted
(`20260804190300_remove_stale_feature_flags`), stale `knip_output.txt` deleted,
`FEATURE_STATUS_MATRIX.md` stamped stale.

Gates: `lint-migrations.ts` and `check-rls-coverage.ts` (working but never
wired) are now in `drift-check.mjs` and npm scripts. `types.ts` regenerated
from live schema (purely additive).

Validation: `lint` 0 errors · `typecheck` clean · 28 related src tests + 300
edge-function tests pass · production build + SW verified · `drift:check`
11 passed / 0 failed / 2 skipped (external creds) · security review of the
diff: no high-confidence findings.

## Deliberately NOT done (with reasons)

- **Dormant known-gap RPCs left unprovisioned**: OCR limits
  (`check_ocr_rate_limit`/`increment_ocr_usage` — caller `process-receipt-ocr`
  has no invoker), artifact search (`find_similar_artifacts`/
  `search_trip_artifacts` — live `trip_artifacts` has no embedding columns,
  `gmail_smart_import` flag is OFF, client falls back gracefully),
  `redact_pii_from_text` (caller dormant), permission resolver (shelved by
  design). Creating them now would be speculative backend for gated features.
  See `docs/MIGRATION_SYNC.md` for the provisioning trigger conditions.
- **32 live edge functions with no repo source were NOT undeployed**
  (irreversible without source): `758f320b-…` (UUID-named), `advertiser-management`,
  `ai-image-checker(+-shared-cors)`, `approve-join-request`, `concierge-tts`,
  `elevenlabs-conversation-token`, `elevenlabs-tts`, `export-trip-summary`,
  `gemini-chat`, `gemini-tts`, `gemini-voice-proxy`, `gemini-voice-session`,
  `generate-audio-summary`, `getstream-token`, `google-calendar-sync`,
  `link-preview`, `livekit-token`, `openai-chat`, `organization-billing-portal`,
  `perplexity-chat`, `photo-upload`, `search`, `send-organization-invite`,
  `send-push-notification`, `send-scheduled-broadcasts`, `send-trip-notification`,
  `share-preview`, `voice-assistant`, `voice-processing`, `waitlist-signup`,
  `xai-voice-session`. Caveat before deleting: `waitlist-signup`,
  `approve-join-request`, `share-preview`, `getstream-token`,
  `send-organization-invite`, `google-calendar-sync`, `organization-billing-portal`
  may still be hit by external surfaces or older bundles — pull each function's
  source (`get_edge_function`) and 7-day invocation logs first, archive source,
  then undeploy in batches.
- **`ai-answer` / `ai-search` / `ai-features` repo dirs kept** despite being
  dead (phantom RPCs, no callers): each has a `[functions.*]` block in the
  protected `supabase/config.toml`; deleting the dirs would orphan the blocks
  and fail the edge-function parity gate. Manual step: remove the three blocks
  from `config.toml`, delete the three dirs, and remove their entries from
  `formerMemberAccessHardening20260723.test.ts`.
- **`event-reminders` has no live cron schedule** — the function is deployed
  and config'd but nothing fires it, so event reminders never send. Decide:
  schedule it (`cron.schedule` + `CRON_SECRET` header, mirroring
  `chravel-dispatch-notification-deliveries`) or remove the feature surface.
- **Dependency hygiene deferred** (≈30 dev-only packages in `dependencies`,
  dual lockfiles `bun.lock`+`package-lock.json`, `happy-dom`+`jsdom`): touching
  lockfiles is guarded in this repo and the change is broad; do it as its own
  PR with CI green before/after.

## Manual/dashboard actions still required (carried over + new)

1. Enable **Leaked Password Protection** (Supabase → Auth → Policies) — from the 2026-08-02 audit, still pending.
2. Set repo variable **`MIGRATIONS_AUTOAPPLY=true`** so `deploy-migrations.yml` actually runs for future branches.
3. Slim or manually deploy the **`mcp` function** (25MB bundle, stale at v25). Also note: any local `npm run build` regenerates `supabase/functions/mcp/index.ts` with a broken project ref if `VITE_SUPABASE_PROJECT_ID` is unset — `git restore` it (see agent memory).
4. `config.toml` cleanup for `ai-answer`/`ai-search`/`ai-features` (above).
5. Decide + execute orphaned-function undeployment (above).
6. Add `chravel://auth-callback` to Supabase Auth redirect URLs (from TODO.md) if not yet done.

## Follow-up prompts (paste-ready)

- "Implement a signed one-click unsubscribe: HMAC token (new `UNSUBSCRIBE_SIGNING_SECRET`), an `unsubscribe-email` edge function that validates and flips `notification_preferences.email_enabled`, update `send-email-with-retry` to embed it, and add the secret to validateSecrets + env examples."
- "Extend `scripts/check-schema-drift.ts` to also scan `supabase/functions/` `.from()` calls (service-role tables like `notification_deliveries` need an allowlist); fix the remaining references it surfaces (gmail_import_* tables are flag-gated dormant), then wire it into CI."
- "Provision Smart Import artifact search: adapt `20260310200000_trip_artifacts_multimodal.sql` to the live `trip_artifacts` shape (add embedding columns + RPCs), verify pgvector, then enable `gmail_smart_import` for a cohort via `useGradualFeature`."
- "Schedule `event-reminders` via `cron.schedule` with the `CRON_SECRET` header pattern used by `chravel-dispatch-notification-deliveries`, or delete the function and its config block if event reminders are not a launch feature."
- "Dependency hygiene PR: move dev-only packages to devDependencies, drop `bun.lock` (or make it authoritative and drop package-lock), remove `happy-dom` or `jsdom`, re-run full CI."

## Rollback notes

- All five new DB migrations are additive; forward-recovery: `DROP TABLE public.concierge_tool_idempotency` / `DROP TABLE public.email_bounces` + `DROP FUNCTION public.should_suppress_email(text)` / `DELETE FROM storage.buckets WHERE id='user-data-exports'` (+ its four policies) / `ALTER PUBLICATION supabase_realtime DROP TABLE …` for the 20 added tables / re-`INSERT` the five flag rows. None hold data yet beyond what users create post-fix.
- Code changes revert cleanly per commit; the SW/CSP commit is the only one that changes deploy behavior (`vercel.json`), and reverting it restores the previous (broken-SW) state without side effects.
