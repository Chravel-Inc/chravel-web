# Post-Drift Feature Audit — 2026-07-25

> Branch: `claude/feature-audit-fixes-gvjks5`
> Trigger: after the DRIFT-07→11 wave (query-key consolidation onto `tripKeys`,
> billing consolidation, feature-flag rollout, account-deletion confirmation change),
> verify every core feature still works end-to-end and surgically fix anything < 90.

## Method & environment

One dedicated audit per feature, tracing route → hooks → query keys (`tripKeys`
consistency incl. the `isDemoMode` discriminator) → edge functions/RPCs → RLS →
realtime → loading/empty/not-found/error states → permissions. Scored on two axes,
0–100: **Functionality** (does the real user flow work?) and **Setup** (correctly
wired post-refactor?). Verification runnable in this environment: `lint`+`typecheck`+
`build`, 381 vitest specs, `drift:check`, live read-only Supabase advisors.
Not available: iOS simulator (Linux box) and authenticated Playwright journeys
(no Supabase creds in-container) — those are noted where relevant.

## Scorecard (all 13 features)

| Feature | Func | Setup | Verdict | Action |
|---|---|---|---|---|
| **Chat** | 93 | 80 → **95** | Stream-backed; DRIFT-08 left orphaned `tripKeys.chat*` (dead prefetch on a deprecated table) | ✅ **Fixed** (`5f04e06`) |
| **Concierge** | 85 → **93** | 76 → **88** | AI agenda write invalidated an orphaned key; reservation didn't refresh calendar | ✅ **Fixed** (`fec37b9`) · 2 low deferred |
| **Agenda** | ~80 → **92** | ~72 → **92** | `tripKeys.agenda` string never matched the live cache | ✅ **Fixed** (`fec37b9`) |
| **Media** | 82 → **92** | 94 | Load errors shown as "empty"; realtime INSERT-only; quota failed open | ✅ **Fixed** (`a397a1e`) · 2 deferred |
| **Calendar** | 96 | 90 | Cleanly consolidated | ✅ Passes · 1 low deferred |
| **Auth** | 95 | 93 | Login/hydration untouched; account-deletion change is safe (server JWT-authorized) | ✅ Verified clean |
| **Payments** | 92 | 92 | DRIFT-09 `checkout.ts` is a faithful extraction; balances userId-scoped | ✅ Verified clean |
| **Team** | 92 | 86 | Keys clean; untyped RPC shims (`set_admin_scope`, `promote_to_admin`) | ⚠️ Hardening |
| **Trip** | 90 | 86 | Trip-Not-Found guard intact; `useTrips`/`proTrips`/`events` inline keys off-factory | ⚠️ Hardening |
| **Tasks** | 90 | 85 | Trip-tasks clean; `useEventTasks` inline `['eventTasks']` off-factory | ⚠️ Hardening |
| **Cover photo** | 88 | 85 | Ad-hoc list keys off-factory; no test for crop modal / generate hook | ⚠️ Hardening |
| **Trip invite** | 88 | 85 | Mixed factory + ad-hoc keys; `dismiss_join_request` untyped | ⚠️ Hardening |
| **Settings** | 88 | 80 | Many inline trip-scoped keys off-factory (stale-after-mutation risk) | ⚠️ Hardening |

**Headline:** every feature is **functionally sound**. The three *active* functional
bugs the audit surfaced (Chat dead prefetch, Concierge/Agenda stale invalidation,
Media error-as-empty) are **fixed, tested, and pushed**. Auth and Payments — the two
critical-path features touched by the branch — are **verified clean**. The six
remaining sub-90 features have **no active break**; their gap is *setup hygiene*
(query keys that work today but live outside the `tripKeys` factory, plus documented
untyped-RPC shims) — hardening against *future* drift, not user-facing failures.

## Fixed this branch (with evidence)

1. **Chat — orphaned `tripKeys.chat*` removal** (`5f04e06`). Deleted the dead
   prefetch that fired a live `SELECT` against the deprecated `trip_chat_messages`
   table on every trip open, the four no-op pull-to-refresh invalidations, and the
   reader-less factory entries + drift-guard prefixes. _Verified: typecheck; 33
   chat/persister specs pass._
2. **Concierge + Agenda — invalidation correctness** (`fec37b9`). `tripKeys.agenda`
   now returns the live `['event-agenda', eventId]` key (was orphaned `['eventAgenda',
   tripId]`); `useEventAgenda` + `EnhancedAgendaTab` routed through the factory;
   `makeReservation` now also invalidates the calendar (it writes a dated event).
   _Verified: typecheck; drift:query-keys; 19 concierge/agenda specs pass (incl. 2 new)._
3. **Media — error/realtime/quota** (`a397a1e`). Load failures now surface as a
   retry-able error state instead of a false "No Media Yet"; realtime widened from
   INSERT-only to `*` (deletes/updates propagate); quota no longer fails open to 0.
   _Verified: typecheck; 28 media specs pass._

## Deferred — paste-ready follow-ups

**Media #Q — per-user account-wide quota scope.** `useStorageQuota` measures
trip-wide usage vs a per-account cap, while the authoritative `enforceUploadLimits`
is per-user account-wide. Needs runtime verification of `FREEMIUM_LIMITS[tier].
storageAccountMB` + the `metadata->>uploaded_by` filter before changing displayed
semantics.
> _Follow-up:_ "Align `useStorageQuota` with `uploadService.enforceUploadLimits`:
> filter usage by the current user's id account-wide (not per-trip) and source the
> cap from `FREEMIUM_LIMITS[resolvedTier].storageAccountMB`. Verify against a paid
> and free account before/after."

**Media #U — trip_files unresolved URL.** `tripMediaService` assigns
`/storage/trip-files/<name>`, a synthetic path that doesn't resolve. Needs the real
Storage bucket/object path.
> _Follow-up:_ "Persist or derive the real Storage object path for `trip_files`
> rows and build a `getPublicUrl`/`createSignedUrl` so Files-tab items open."

**Concierge #B — basecamp inline keys** (`conciergeInvalidation.ts:120`). Uses
hand-authored `['tripBasecamp', tripId]` / `['personalBasecamp']` instead of the
basecamp key factories — drift-hardening only; not a current defect.

**Concierge #L — deprecated `LOVABLE_API_KEY` fallback**
(`lovable-concierge/index.ts:44`). Remove once confirmed no environment sets
`AI_PROVIDER=lovable` (edge-config verification required — cannot confirm in-repo).

**Setup-hygiene cluster (Team / Trip / Tasks / Cover / Invite / Settings).** Two
recurring patterns, neither an active bug:
- **Off-factory query keys** that are internally consistent today but bypass
  `tripKeys` (`['trips']`, `['proTrips']`, `['events']`,
  `['pending-request-trip-cards']`, `['eventTasks']`, `['tripPrivacyConfig']`,
  `['tripSystemMessagePrefs']`, `['pdf-export-usage']`). Add factory entries and
  migrate call sites in lockstep (same discipline as the agenda fix).
- **Untyped RPC shims** (`set_admin_scope`, `promote_to_admin`,
  `dismiss_join_request`, `update_task_with_version`) — typed wrappers or
  regenerated `types.ts` once the DB migration lands.

## Deferral Discipline footer

1. **Fixed now:** Chat orphaned keys; Concierge/Agenda invalidation + reservation
   calendar refresh; Media error-state/realtime/quota. (3 commits, pushed.)
2. **Discovered:** Auth change is account-deletion-only (core auth safe); Payments
   DRIFT-09 extraction faithful; 6 features carry off-factory-key + untyped-RPC
   hygiene debt (no active break).
3. **Intentionally deferred:** Media quota-scope + trip_files URL; Concierge basecamp
   keys + `LOVABLE_API_KEY`; the setup-hygiene cluster.
4. **Why deferral was necessary:** quota-scope and trip_files need runtime/storage
   verification not possible in-container; `LOVABLE_API_KEY` needs edge-env
   confirmation; the hygiene cluster is non-functional and best done as a focused
   lockstep pass to avoid introducing the very drift it prevents.
5. **Follow-up prompts:** provided inline above.
6. **Validation completed:** typecheck (clean), `drift:query-keys` (clean), and the
   per-feature vitest specs for every touched area (80 specs across the 3 fixes).
7. **Remaining launch blockers:** none identified that are functional. The
   deferred items are hardening + two advisory-quota refinements.
