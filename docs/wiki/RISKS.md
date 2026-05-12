# Risk Register

Field-drift, RLS, dead code, and deferred fixes discovered during wiki generation at SHA `1e833665`.

**Scope:** Top-10 entity drift sweep + RLS sweep + realtime filter sweep + concierge tool sync sweep + store single-writer sweep + `any` type sweep on critical paths.

> Format: severity / type / files / evidence / paste-ready follow-up prompt per `CLAUDE.md` deferral discipline.

## Severity legend
- **P0** - should gate next deploy
- **P1** - should be fixed in the next sprint
- **P2** - opportunistic cleanup

Statuses: `open` (default), `accepted`, `fixed`. Preserve `accepted` across regens.

---

## R-001 - Unfiltered realtime subscription on `profiles` table

**Severity:** P1
**Status:** open
**Type:** Realtime filter gap (memory #20)
**Files:**
- `src/components/mobile/MobileTripPayments.tsx` (channel `mobile-payments-profiles-${tripId}`)

**Evidence:**
```ts
.channel(`mobile-payments-profiles-${tripId}`)
.on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
  queryClient.invalidateQueries({ queryKey: tripKeys.payments(tripId) });
})
```
The subscription name encodes `tripId` but the filter does not. This subscription receives **every** profile change globally (across all users), then triggers `invalidateQueries` for one trip's payments. At scale this is wasteful and can leak who is updating profiles in real time.

**Recommended fix (paste-ready prompt):**
```
Title: Filter MobileTripPayments profile-changes subscription to trip members only
Why: At scale this subscription receives every profile change globally, triggering wasted invalidations and leaking activity metadata.
Files: src/components/mobile/MobileTripPayments.tsx (the .on('postgres_changes') block)
Risk: LOW - changes only the filter expression; behavior remains the same for in-trip members.
Fix: Add `filter: 'user_id=in.(...)'` scoped to the trip member user IDs, or restructure to listen on `trip_members` table.
Acceptance: Subscription only fires for profile updates of users in the current trip.
Test: Unit test the channel filter string; integration test: mock multiple profile updates, assert only in-trip ones trigger invalidate.
Rollback: Revert the file.
Launch-blocker? No, but P1 sprint candidate per memory #20.
```

---

## R-002 - Inline query keys bypassing `tripKeys` factory

**Severity:** P2
**Status:** open
**Type:** Drift / consistency
**Files:**
- `src/hooks/useTripPrivacyConfig.ts` - `['tripPrivacyConfig', tripId]`
- `src/hooks/useProTrips.ts` - `['trips']` (used in `invalidateQueries`, three call sites)
- `src/hooks/useTripPolls.ts` - `['tripPolls', tripId, isDemoMode]` (multiple call sites)

**Evidence:**
```ts
// useTripPolls.ts
queryKey: ['tripPolls', tripId, isDemoMode],
// repeated for cancelQueries / invalidateQueries
```
`tripKeys.polls(tripId, isDemoMode)` exists in `src/lib/queryKeys.ts:32-35` but the hook constructs the same array inline. The strings drift independently when refactored.

**Recommended fix (paste-ready prompt):**
```
Title: Replace inline trip query keys with tripKeys factory
Why: Inline keys drift from the factory definitions on rename and produce cache-collision risk. Memory #2.
Files:
  - src/hooks/useTripPolls.ts (all `['tripPolls', tripId, isDemoMode]`)
  - src/hooks/useProTrips.ts (all `['trips']`)
  - src/hooks/useTripPrivacyConfig.ts (`['tripPrivacyConfig', tripId]`) - extend factory if missing
Risk: LOW - mechanical replacement.
Fix: Import tripKeys from src/lib/queryKeys and replace each inline key with tripKeys.polls(...), tripKeys.lists(), etc. Add `privacyConfig: (tripId) => ['tripPrivacyConfig', tripId]` to the factory if needed.
Acceptance: rg "queryKey:\s*\[['\"]trip" src/hooks returns zero hits.
Test: existing unit tests still pass; add a tripKeys factory test.
Rollback: Revert each hook file.
Launch-blocker? No.
```

---

## R-003 - `any` types in `useAuth.updateProfile` return signature

**Severity:** P2
**Status:** open
**Type:** Critical-path type weakness
**Files:**
- `src/hooks/useAuth.tsx:116` - `updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: any }>;`
- `src/hooks/useAuth.tsx:1174` - implementation signature mirrors

**Evidence:**
```ts
updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: any }>;
```
Eslint-disabled comments mark this as intentional ("Supabase error type is loosely typed"), but auth is the #1 critical path per `CLAUDE.md`. A typed `PostgrestError | AuthError | null` would catch errors with better DX.

**Recommended fix (paste-ready prompt):**
```
Title: Type useAuth.updateProfile error as PostgrestError | AuthError | null
Why: Critical-path code; `any` defeats refactor safety. Currently disabled via eslint-disable comments.
Files: src/hooks/useAuth.tsx:116, 1174, 1199 (and related profile-update sites)
Risk: LOW - return shape unchanged for callers; just narrows the type.
Fix: Import PostgrestError from @supabase/supabase-js. Change `{ error?: any }` to `{ error?: PostgrestError | null }`. Verify callers handle the typed shape (most check truthy).
Acceptance: No `any` types remain in useAuth.tsx critical path. Typecheck passes.
Test: Existing tests pass.
Rollback: Revert useAuth.tsx.
Launch-blocker? No.
```

---

## R-004 - Field-drift sweep: TOP-10 ENTITIES (sampled, not exhaustive)

**Severity:** P1
**Status:** open
**Type:** Field-name drift across DB → edge → TS → UI

The top-10 entity audit was scoped to the strategic surfaces called out in `CLAUDE.md` and memory #2. Each entity was traced from DB column (in migrations + `src/integrations/supabase/types.ts`) → edge function I/O shape → TS interface (in `src/types/` or `src/features/`) → query result → UI prop. This pass surfaced the following watch-items as **areas to verify in the next deep audit**, not confirmed drift:

| Entity | Drift watch-points |
|---|---|
| Trip | `trips.created_at` vs `Trip.createdAt`; `trip_type` vs `tripType`; `cover_image_url` vs `coverImage` |
| TripMember | `trip_members.role` enum vs TS `proRole` enum (13 values in `useAuth.tsx:74-87`) |
| Message | `trip_chat_messages.sender_id` vs Stream's `user.id`; custom fields forwarding (memory #28) |
| Broadcast | `broadcasts.recipients` shape (JSON) vs `RecipientSelector` types |
| CalendarEvent | `synced_calendar_events.external_event_id` vs `CalendarEvent.externalId` (memory #15 dedupe key) |
| Payment | `payment_splits.status` enum (pending/confirmed/settled) vs union type (memory #16) |
| Receipt | `receipts.parsed_data` JSON shape vs Receipt interface |
| Profile | `profiles.display_name` vs `private_profiles.email` split — see `useAuth.tsx:226-276` schema-drift fallback |
| Task | `trip_tasks.status` enum vs UI status filter |
| Poll | poll table column names not extracted in this pass |

**Note from `useAuth.tsx:226-276`:** there is already explicit schema-drift handling in `fetchUserProfile` that retries with minimal columns when the full select fails. This is **evidence that drift is a recurring problem** — but it's gracefully degraded.

**Recommended fix (paste-ready prompt):**
```
Title: Exhaustive top-10 entity field-drift audit
Why: Memory #2 / #19 - field-name drift is the recurring P0 bug class. This wiki pass scoped to the 10 strategic entities; a deeper sweep should compare each TS interface field name to each DB column name programmatically.
Files: src/integrations/supabase/types.ts (generated) vs every src/types/*.ts and src/features/*/types.ts; cross-ref with supabase/migrations
Risk: AUDIT-ONLY first (no code change); fixes per finding land separately.
Fix: Write a script `scripts/audit-field-drift.ts` that loads types.ts and grep-extracts CREATE TABLE columns, emits a report of mismatches. Triage each into "rename TS to match DB" or "introduce explicit transformer".
Acceptance: Report committed under `docs/audits/`. Each mismatch becomes its own P1/P2 follow-up.
Test: Script self-test on a known-aligned entity.
Rollback: N/A (audit only).
Launch-blocker? No, but precondition for confident future schema work.
```

---

## R-005 - Mock tables co-exist in production schema

**Severity:** P1
**Status:** open (intentional but risky)
**Type:** Demo/prod contamination risk (memory #27)
**Files:**
- `supabase/migrations/*_mock_messages*.sql` (presence verified via inventory)
- `supabase/functions/seed-mock-messages/`
- Production tables: `mock_messages`, `mock_broadcasts`

**Evidence:** Both `mock_messages` and `mock_broadcasts` appear in the production `public` schema. Demo paths read from them; production write paths should never target them. Memory #27 documents that the mock-ID tier gate disables consumer-only features for all real trips — which only works as long as the read/write split is honored.

**Recommended fix (paste-ready prompt):**
```
Title: Audit mock_messages/mock_broadcasts read/write boundary
Why: Memory #27 - any code path that writes to a mock table from a real-user session would contaminate the demo surface.
Files: rg "mock_messages|mock_broadcasts" src/ supabase/functions/
Risk: AUDIT first.
Fix: Verify all writes are from edge functions seeded by `seed-mock-messages` only. Add a Postgres trigger that REJECTs writes to mock_* tables from any role except service_role (defense in depth).
Acceptance: Trigger in place + integration test that asserts a regular user JWT cannot insert into mock_messages.
Test: New integration test.
Rollback: Drop the trigger.
Launch-blocker? No (current behavior is correct, but defense in depth would prevent future regressions).
```

---

## R-006 - Concierge tool registry has 75 tool definitions — verify 5-file sync coverage

**Severity:** P1
**Status:** open
**Type:** Concierge tool sync (memory #26)
**Files:**
- `supabase/functions/_shared/concierge/toolRegistry.ts` (75 `name:` entries via grep)
- `supabase/functions/_shared/functionExecutor.ts` (143 KB dispatcher)
- `supabase/functions/_shared/voiceToolDeclarations.ts`
- `supabase/functions/execute-concierge-tool/`
- `src/features/chat/components/ConciergeActionCard*.tsx` and `PendingActionCard.tsx`

**Evidence:** 75 tool entries detected in `toolRegistry.ts` (rough count via grep `name:`). The wiki documents 38 active tools — discrepancy suggests either inactive tools, sub-tools, or registry growth since the documentation baseline.

**Recommended fix (paste-ready prompt):**
```
Title: Concierge tool 5-file sync coverage audit
Why: Memory #26 - adding a tool requires 5-file sync (registry + executor + confirm handler + voice declarations + UI renderer). Miss one and the tool silently fails. Need an automated audit to confirm every registered tool has all 5 sites wired up.
Files:
  - supabase/functions/_shared/concierge/toolRegistry.ts (canonical set)
  - supabase/functions/_shared/functionExecutor.ts
  - supabase/functions/_shared/voiceToolDeclarations.ts
  - supabase/functions/execute-concierge-tool/index.ts (confirm handler switch)
  - src/features/chat/components/PendingActionCard.tsx (UI renderer)
Risk: AUDIT.
Fix: Add `scripts/audit-concierge-tools.ts` that loads the registry, scans the other 4 files for each tool name, and reports gaps. Wire into CI as a soft check.
Acceptance: Report shows zero unmatched tools, or every gap has a documented reason.
Test: Script self-test.
Rollback: Remove the script.
Launch-blocker? No.
```

---

## R-007 - `broadcast_views` RLS uses SECURITY INVOKER pattern - document explicitly

**Severity:** P2
**Status:** open
**Type:** RLS pattern documentation
**Files:**
- `supabase/migrations/20250201000002_fix_broadcast_view_functions_security.sql`

**Evidence:** The fix migration explicitly notes "Use SECURITY INVOKER so RLS policies on broadcast_views table apply" — confirms `broadcast_views` is RLS-gated but via the security-invoker function pattern. This is correct, but the pattern isn't documented in the wiki RLS section and could be confused with missing RLS.

**Recommended fix (paste-ready prompt):**
```
Title: Document SECURITY INVOKER pattern for broadcast_views in wiki
Why: The wiki RLS sweep nearly flagged this as missing-RLS; the actual pattern is SECURITY INVOKER + table-level RLS. Future audits should not re-flag it.
Files: docs/wiki/architecture/05-auth-and-rls.md (add a "SECURITY INVOKER vs DEFINER" section)
Risk: NONE (docs only).
Fix: Append a paragraph + cite the migration.
Acceptance: Wiki RLS section mentions both DEFINER and INVOKER patterns.
Test: N/A.
Rollback: Revert docs.
Launch-blocker? No.
```

---

## R-008 - Concierge cache cleared on signout but Stream channels may persist

**Severity:** P2
**Status:** open
**Type:** Cross-store cleanup completeness
**Files:**
- `src/hooks/useAuth.tsx:1114` (`supabase.removeAllChannels()` only sweeps Supabase Realtime)
- `src/services/stream/streamChannelFactory.ts` (Stream channel lifecycle)

**Evidence:** Sign-out tears down `supabase.removeAllChannels()`, `queryClient.clear()`, `conciergeCacheService.clearAllCaches()`, `useNotificationRealtimeStore.clearAll()`, but does not explicitly tear down Stream Chat connections. Stream's own cleanup may run via component unmount, but a sign-out-then-stay-on-page scenario could leak.

**Recommended fix (paste-ready prompt):**
```
Title: Tear down Stream Chat client on sign-out
Why: Defense in depth - sign-out clears Supabase realtime + Query cache + concierge cache, but Stream Chat client connection may persist until component unmount.
Files: src/hooks/useAuth.tsx signOut function (around line 1100-1148); add a service call to disconnect Stream Chat.
Risk: LOW.
Fix: Import a streamService.disconnect() helper; add it to the signOut cleanup sequence between the realtime teardown and supabase.auth.signOut().
Acceptance: After sign-out, no live Stream WS connection in browser devtools network tab.
Test: E2E test (Playwright) that signs in, opens chat, signs out, asserts no chat WS connection.
Rollback: Revert.
Launch-blocker? No (current behavior may be fine because the auth-state change typically triggers a redirect).
```

---

## R-009 - "Lineup replace import" can hard-delete on transient insert failures

**Severity:** P1
**Status:** open
**Type:** Data-loss risk (already in `DEBUG_PATTERNS.md`)
**Files:**
- `src/hooks/useEventLineup.ts`
- `src/hooks/useEventLineupFiles.ts`

**Evidence:** Documented in `DEBUG_PATTERNS.md` as a known pattern. Bulk "replace import" sequences delete-then-insert; a transient insert failure leaves the user with an empty lineup.

**Recommended fix (paste-ready prompt):**
```
Title: Make event lineup replace-import transactional with snapshot
Why: DEBUG_PATTERNS.md - transient insert failures during bulk replace can wipe lineup data without recovery.
Files: src/hooks/useEventLineup.ts (the replace mutation), src/hooks/useEventLineupFiles.ts.
Risk: MEDIUM - touches a multi-step write.
Fix: Either (a) snapshot the pre-replace state into a temporary table, perform insert, then delete on success; or (b) prefer upsert + delete-orphans pattern; or (c) wrap in a Postgres function (RPC) that runs in a single transaction.
Acceptance: Failure injection test: inject an error mid-insert, assert lineup data is preserved.
Test: Vitest with mock supabase that throws on the Nth insert.
Rollback: Revert to non-transactional flow.
Launch-blocker? P1 sprint candidate; not gating current deploy if event/lineup use is low.
```

---

## R-010 - Capability token default secret fallback (DEBUG_PATTERNS #1)

**Severity:** P0
**Status:** open (carried over from DEBUG_PATTERNS.md)
**Type:** Security
**Files:**
- Edge functions that mint capability tokens (e.g., voice, image-proxy paths)

**Evidence:** Per `DEBUG_PATTERNS.md` entry #1. Capability tokens with a default-secret fallback can be forged if the production secret is misconfigured.

**Recommended fix (paste-ready prompt):**
```
Title: Audit all capability-token-minting edge functions for default-secret fallback
Why: DEBUG_PATTERNS #1 - any function with `const SECRET = Deno.env.get('X') || 'default'` is forgeable.
Files: rg "Deno.env.get\\(.+\\) \\|\\| '" supabase/functions/
Risk: AUDIT first.
Fix: Replace fallback with a startup assertion via `_shared/validateSecrets.ts` requireSecrets() that throws if the secret is missing or equal to a known default placeholder.
Acceptance: rg of all token-minting fns shows zero `|| 'fallback'` patterns; CI smoke test confirms each fn fails-closed on missing secret.
Test: Vitest / Deno test that asserts each fn throws when CAPABILITY_TOKEN_SECRET is unset.
Rollback: Revert (but don't - this is a P0).
Launch-blocker? YES - this is the P0 carry-over from DEBUG_PATTERNS.
```

---

## R-011 - CronGuard fail-open on missing secret (DEBUG_PATTERNS #4)

**Severity:** P0
**Status:** open (carried over from DEBUG_PATTERNS.md)
**Type:** Security
**Files:**
- `supabase/functions/_shared/cronGuard.ts`
- Cron-only functions: `event-reminders`, `dispatch-notification-deliveries`, `payment-reminders`, `daily-digest`, `delete-stale-locations`, `process-account-deletions`, `cleanup-staging-tables`

**Evidence:** Per `DEBUG_PATTERNS.md` entry #4. If `CRON_SECRET` is unset in the runtime, the guard may fail-open (allow the call). Every cron-only function must fail-closed.

**Recommended fix (paste-ready prompt):**
```
Title: Make CronGuard fail-closed on missing CRON_SECRET
Why: DEBUG_PATTERNS #4 - fail-open means anyone can hit a cron-only endpoint if the secret rotates out.
Files: supabase/functions/_shared/cronGuard.ts; cron-only functions list above.
Risk: LOW.
Fix: cronGuard returns 401 immediately if `Deno.env.get('CRON_SECRET')` is null/undefined. Combine with validateSecrets() requireSecrets at function startup.
Acceptance: Unit test: cronGuard with no CRON_SECRET set returns 401.
Test: Deno test.
Rollback: Revert cronGuard.ts (but don't).
Launch-blocker? YES.
```

---

## R-012 - LiveKit voice prereqs not validated at session creation

**Severity:** P1
**Status:** open
**Type:** Voice silent-failure (memory #14)
**Files:**
- `supabase/functions/livekit-token/`
- `supabase/functions/gemini-voice-session/`

**Evidence:** Memory #14 - LiveKit agent deployment + room metadata are prerequisites for voice. If either is absent, token mint succeeds but the session does nothing user-visible.

**Recommended fix (paste-ready prompt):**
```
Title: livekit-token preflight checks for agent + room metadata
Why: Memory #14 - silent voice failures waste user attention. The token-mint path should refuse to mint if prerequisites aren't met.
Files: supabase/functions/livekit-token/index.ts
Risk: LOW.
Fix: Before minting token, verify (a) LiveKit room metadata is present (b) agent endpoint responds to a healthz. On failure, return 503 with a structured error code.
Acceptance: Failure-injection test: stop the agent, hit livekit-token, assert 503 with `error_code: 'voice_agent_unavailable'`.
Test: Integration test.
Rollback: Revert.
Launch-blocker? No (user-visible degradation, not a deploy blocker).
```

---

## RLS sweep result summary

Best-effort grep across 358 migrations: every `CREATE TABLE` candidate that appeared without RLS in one migration was confirmed RLS-enabled in a later migration (notably `20260210000000_security_audit_rls_fixes.sql`). **No P0 RLS gap detected in this pass.** A future deeper sweep should compare table list to RLS-enabled list at the database level (live introspection), not migration grep, for confidence.

---

## Drift-sweep coverage gap (must call out per `CLAUDE.md` Deferral Discipline)

**Intentionally deferred:**
- Field-drift sweep on tables 11+ (205 remaining tables) — see R-004 paste-ready prompt for the exhaustive audit.
- Voice tool registry exhaustive sync verification — see R-006.
- Per-policy RLS introspection vs migration grep — needs live DB connection.

**Why:** Token + time budget on this regen pass. The 10 entities chosen are the strategic surfaces; the remaining 205 tables include search indices, demo tables, audit logs, and rate-limit tables that are lower drift risk.

---

<!-- RISKS_INSERT_BELOW -->

## R-013 - `gemini-voice-session` and `gemini-voice-proxy` declared in `supabase/config.toml` but no implementation on disk

**Severity:** P1
**Status:** open
**Type:** Stale config / dead reference
**Files:**
- `supabase/config.toml:106-107` declares `[functions.gemini-voice-session] verify_jwt = false`
- `supabase/config.toml:118-119` declares `[functions.gemini-voice-proxy] verify_jwt = false`
- **No corresponding directories under `supabase/functions/`** (verified via `ls`)

**Evidence:**
```
$ ls supabase/functions/ | grep -E "^gemini"
gemini-tts
$ ls supabase/functions/ | grep -E "voice"
(no matches)
```
The config declares two voice-related functions that aren't deployed. Voice in practice is implemented via `livekit-token` (mints LiveKit room JWT) + `gemini-tts` + the LiveKit voice agent deployed via `.github/workflows/deploy-agent.yml`. The Gemini Live direct path appears to be aspirational or removed.

**Recommended fix (paste-ready prompt):**
```
Title: Remove stale gemini-voice-session/gemini-voice-proxy from supabase/config.toml OR re-add implementations
Why: Stale config entries mislead readers/auditors and trip up wiki-style citations. Decide whether the Gemini Live direct path is still planned or has been replaced by LiveKit only.
Files: supabase/config.toml:106-119
Risk: NONE (config-only).
Fix:
  Option A (most likely): Delete the [functions.gemini-voice-session] and [functions.gemini-voice-proxy] blocks. Update voice docs to reflect LiveKit + gemini-tts as the actual path.
  Option B: Re-create the function directories with stubs if Gemini Live direct path is on the roadmap.
Acceptance: Every entry in supabase/config.toml corresponds to a directory under supabase/functions/. Add a CI check that asserts this.
Test: scripts/check-config-functions-parity.cjs.
Rollback: Revert config edit.
Launch-blocker? No.
```
