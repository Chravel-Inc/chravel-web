# Production-Readiness Reconciliation Audit — Pass 2 (2026-08-05)

> Follow-up pass to `docs/PRODUCTION_RECONCILIATION_AUDIT_2026-08-04.md` (merged
> to `main`). Scope: the second-pass recommendations from that report — half-wired
> features, production hygiene, the biggest bundle-size win, dead-code
> consolidation, and the demo-preview privilege-escalation tightening.
> Branch: `claude/chravel-production-audit-5zqoai` (restarted from a fresh `main`
> per the merged-PR workflow).

## Executive result

Every item from the pass-1 "second pass" recommendation list was implemented,
verified against live prod where applicable, and independently reviewed
(security + semantic passes). One **High-severity vulnerability was introduced
by this pass and caught before merge**: a batched email send leaked one
recipient's signed unsubscribe token to every other recipient in the same
call. Fixed same-session with a regression test proving both the exploit and
the fix.

## Findings and resolutions

### A. Half-wired features now working end-to-end

| # | Defect (verified live) | Fix |
|---|---|---|
| 1 | **Event reminders never fired.** `event-reminders` was deployed but `calendar_reminders` never existed in prod (defining migration used `trip_id uuid` against `trips.id TEXT`), and no cron ever called it | `20260805090000` provisions the table + sync triggers (active-member fan-out, `auth.users` existence guard for demo-seeded members) + backfills 27 reminders + schedules `chravel-event-reminders` (*/5, Bearer auth) |
| 2 | **Found while wiring #1: `chravel-dispatch-notification-deliveries` cron was failing every single minute** (2,880 failures/48h) — string-concatenated a NULL `service_role_key` setting into a header, throwing before the request was even queued. `chravel-process-account-deletions` had the same defect. `daily-embedding-refresh` was dead (schema error + sends the anon key to a function requiring a user JWT; `trip_embeddings` confirmed 0 rows) | `20260805091500` rewrites both Bearer jobs NULL-safe with `jsonb_build_object`, unschedules the dead embedding job. Owner action: one `ALTER DATABASE` line to set the service-role key (documented in the migration) |
| 3 | **Review caught a stale-reminder leak**: if an event's `trip_id` is ever reassigned, members of the old trip who aren't on the new one keep a pending reminder for an event they can no longer see | `20260805092000` — trigger now deletes unsent reminders for non-members of `NEW.trip_id` after fan-out. Not reachable via today's UI, fixed defensively |
| 4 | **Email CTAs pointed at `app.chravelapp.com`**, an unconfirmed/likely-dead domain, while the product serves at `chravel.app` | `notificationContentBuilder.ts` `APP_URL` corrected |
| 5 | **Every outgoing email had a dead unsubscribe link** (404 endpoint, forgeable token) | New `unsubscribe-email` edge function + `_shared/unsubscribeToken.ts` (HMAC derived from the service-role key) + `/unsubscribe` SPA page. **Found and fixed a High-severity bug in this same feature — see §C** |
| 6 | **Legacy chat pagination was a silent no-op** on the non-Stream transport | Confirmed the branch is demo-fixture-only (nothing to paginate) — documented in place rather than building unneeded pagination |
| 7 | **4 silently-swallowed error sites with real user impact**: ad impression/click tracking (revenue data), account-deletion sign-out failure, pro-channel read-receipt flush (permanent stuck badges), 3× calendar offline-cache writes | All now report via `errorTracking` or dev-visible `console.warn`; none change control flow |

### B. Production hygiene

| # | Item | Resolution |
|---|---|---|
| 8 | **32 live edge functions with no repo source** | 31/32 archived (source + README with per-function risk notes and exact `supabase functions delete` commands) to `supabase/functions-archive/`. `xai-voice-session` lost server-side (Management API `InternalServerErrorException`, 3 attempts) — flagged, no backup. **Not undeployed this pass** — deletion is irreversible and needs your final go-ahead (see below) |
| 9 | **3 dead functions removed** (`ai-answer`, `ai-search`, `ai-features` — phantom RPCs, zero callers). Config.toml blocks left in place (protected file) with a baseline exception + justification in `docs/ACTIVE/drift/DRIFT_AUDIT.md` |
| 10 | **`mcp` projectRef** — already resolved upstream (PR #884 hand-owns the bundle); verified correct, nothing to do |
| 11 | **Dependency hygiene**: ~26 dev-only packages moved from `dependencies` to `devDependencies` (build tooling, linters, test infra — zero version changes, verified diff against `main`), dead `happy-dom` removed (vitest hardcodes `jsdom`), stale unused `bun.lock` deleted, `package-lock.json` regenerated via `npm install --package-lock-only` and verified with a clean `npm ci` |
| 12 | **Sentry sourcemaps**: `vite.config.ts` now emits `hidden` maps only when `SENTRY_AUTH_TOKEN` is present at build time; `scripts/upload-sourcemaps.cjs` uploads and deletes them post-build so they never ship. Inert by default (no maps at all, same as before) until you wire the token + build-command change in Vercel |

### C. Biggest bundle-size win

`src/mockData/polls.ts` (3,149 lines) converted from a static import to a
dynamic `import()` in `useTripPolls.ts` and `demoModeService.getMockPolls`
(now `async`; 5 call sites updated to `await`). Verified in `dist/`: it is now
its own 44KB lazy chunk instead of shipping in the main bundle for every user.
Remaining heavy fixtures (`tripsData.ts`, the `pro-trips/` barrel) need a
wider refactor than this pass and are documented as follow-up.

### D. Consolidation / dead-code cleanup

- **Two duplicate `OptimizedImage` components** → the mobile variant's CDN
  transform (`getOptimizedImageUrl`) ported into its one caller
  (`RecommendationCard`), duplicate file deleted.
- **`mockRolesService.seedRolesForTrip`** — a deprecated method that was
  already a no-op (`return []`) — deleted along with its two dead call sites.
- **Demo-mode storage key drift**: `secureStorageService` was still
  reading/writing the legacy `TRIPS_DEMO_MODE` boolean key, which
  `demoModeStore`'s one-time migration deletes — the two stores fought each
  other and the migration never converged. Now both read/write
  `TRIPS_DEMO_VIEW`. Telemetry's demo-mode check also only read the legacy
  key, mislabeling every post-migration demo session as real — fixed.
- **`streamCanary`** — confirmed live (wired into `useStreamTripChat`), kept
  as-is.
- **Paywall modals** — `TripPassModal` (one-time IAP) and `ProUpgradeModal`
  (B2B Pro tier, iOS-IAP-exempt) are genuinely distinct products, kept.
  `UpgradeModal` and `PlusUpsellModal` are true duplicates (same two consumer
  tiers, `UpgradeModal` has the more complete billing/IAP integration) —
  **not merged this pass**: `PlusUpsellModal` has 14 trigger sites vs.
  `UpgradeModal`'s 4, and the merge direction matters for iOS compliance;
  flagged as a follow-up requiring its own focused pass.

### E. Product-decision tightening (as directed)

`InternalAdminRoute`'s `allowDemoPreview` bypass (guards `/recs`,
`/advertiser`) now requires **no authenticated session** (`!user`), not just
the demo localStorage flag. A signed-in non-admin flipping that flag now falls
through to the normal super-admin gate instead of getting a free pass — closes
the path where a real (non-admin) session could reach admin-preview surfaces.
Two new tests confirm both directions (signed-in non-admin blocked,
signed-in super-admin still admitted). `RecommendationCard` impression/click
tracking is now also skipped in demo mode (was writing real analytics rows
from mock-data views).

## C (continued). Vulnerability found and fixed in this pass

**Batched email send leaked a working unsubscribe credential across
recipients** (High, confidence 0.92, caught by independent security review
before merge): `send-email-with-retry` computed the personalized,
signed-unsubscribe-token footer from `recipients[0]` only, then broadcast the
identical HTML — containing that one token — to every address in the same
`to` array. Any co-recipient in a batched send could extract recipient[0]'s
valid token and silently disable their email notifications.

**Fix:** personalization only fires for single-recipient sends
(`recipients.length === 1`); batched sends use the generic settings-only
footer. Verified both ways — a regression test
(`supabase/functions/send-email-with-retry/__tests__/unsubscribeTokenLeak.test.ts`)
fails against the vulnerable code and passes against the fix.

A second, lower-severity defect was found and fixed in the same feature during
self-review: `UnsubscribePage.tsx` classified *any* non-2xx response from the
edge function as "invalid/expired link" — including a genuine 500 (valid
token, DB write failed), which wrongly told the user to give up instead of
retry. Fixed to distinguish on HTTP status (400 → invalid, else → retryable
error), with a regression test proving the distinction.

## Validation evidence

- `npm run lint` — 0 errors (355 pre-existing warnings, unchanged)
- `npx tsc --noEmit` — clean
- `npm run build` — succeeds; SW verified (543 files precached)
- `npx vitest run supabase/functions` — **303/303 passed** (up from 300 in
  pass 1: +3 for `unsubscribeTokenLeak.test.ts`)
- Direct frontend test run across every changed surface (polls async
  conversion, demo-fixture lazy-load, calendar service, `InternalAdminRoute`,
  `SavedRecommendations`) — **32/32 passed**; `UnsubscribePage.test.tsx` —
  **5/5 passed**
- `npm run drift:check` — **11/11 passed**, 2 skipped (external credentials,
  same as pass 1)
- `npx tsc --noEmit` / lint / build re-verified clean after the dependency
  reorganization, including a full `rm -rf node_modules && npm ci` from the
  regenerated lockfile
- Every DB change applied via MCP and re-queried live: `calendar_reminders`
  27 rows, `chravel-event-reminders` cron active, dead embedding job gone,
  both Bearer jobs rewritten and active, `trip_embeddings` confirmed 0 rows
  before removing its refresh job
- Security review (independent agent): 1 High finding (above), fixed and
  re-verified; no other high-confidence findings
- Semantic review: self-directed (the launched review agent did not return
  after repeated container restarts) covering every item its brief asked for
  — package.json version stability (byte-identical, confirmed against `main`),
  `profiles.email` uniqueness/error-handling in `buildEmailFooterLink`
  (safe — `.maybeSingle()` returns `data: null` on ambiguity, guarded before
  use), the `UnsubscribePage` status-classification bug (found and fixed,
  above), and the `InternalAdminRoute` test correctness (confirmed by
  inspection: the new tests fail against the pre-fix `!user`-less condition)

## Deliberately not done (irreversible — needs your go-ahead)

**Undeploying the 31 archived + 1 unarchived orphaned live edge functions.**
Archival (source capture) is complete and inert. Two callouts before
executing deletions:
- `xai-voice-session` has no archived backup (Management API failure) —
  confirm you don't need it, or pull it from the Supabase Dashboard first.
- `share-preview` may still receive traffic from old share links being
  unfurled externally — check invocation logs before deleting.
- `send-push-notification` is a fully unauthenticated push endpoint (no auth
  code, `verify_jwt=false`) — deleting it is a **security improvement**,
  safe to prioritize first.
- `waitlist-signup` belongs to a different product ("Broadcast Ntwrk",
  saintmarlolabs.com) living in this Supabase project — confirm before
  deleting in case it's still wired to an external form.

Say the word (all-at-once or in batches) and I'll run the
`supabase functions delete` commands from the archive README.

## Remaining risks (unchanged from pass 1, still pending owner action)

Leaked Password Protection toggle, `MIGRATIONS_AUTOAPPLY=true` repo variable,
`mcp` function bundle slimming, `ai-answer`/`ai-search`/`ai-features`
`config.toml` block removal, `unsubscribe-email` GET-path `verify_jwt=false`
config block (POST/invoke path works today without it), Sentry env wiring in
Vercel for sourcemap upload to activate, `PlusUpsellModal`/`UpgradeModal`
consolidation (needs a focused pass for iOS-IAP correctness).

## Changed files

28 modified/deleted, 10 new (5 migrations, 2 edge functions +
`_shared/unsubscribeToken.ts`, `UnsubscribePage.tsx`,
`scripts/upload-sourcemaps.cjs`), plus `supabase/functions-archive/` (96
archived files + README, outside the lint/typecheck/build toolchain like
`codebase-atlas/`). Full list in `git diff --stat` on the branch.
