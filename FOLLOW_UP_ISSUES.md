# Follow-Up Issue Plans

> Paste-ready issue plans for items intentionally deferred under DEFERRAL_DISCIPLINE.md §1.
> Each entry must include every section in DEFERRAL_DISCIPLINE.md §3 — no optional fields.
> When an entry is filed as a GitHub issue, link the issue here and leave the plan in place.

---

## R-004 · Top-10 entity schema-drift exhaustive audit

- **Title:** Top-10 entity schema-drift audit + remove `useAuth.fetchUserProfile` fallback

- **Why this matters:** `src/hooks/useAuth.tsx:226-276` contains an explicit two-step fallback that retries `profiles.select(...)` with a narrower column list when the full select fails. The fallback is graceful degradation, not a fix — it proves that field drift between code and live schema is a recurring failure mode but currently hides it. Hiding the drift means any other call site that selects the same columns will silently break, and the auth path itself becomes load-bearing for the fallback. The same drift class likely exists across the other top-10 entities (trips, trip_members, messages, channels, broadcasts, calendar_events, payment_splits, media_attachments, notifications).

- **Files likely involved:**
  - `src/hooks/useAuth.tsx` (fallback at lines 226-276)
  - `src/integrations/supabase/types.ts` (generated types — currently stale relative to live schema is the suspected root cause)
  - All `.from('<entity>').select(...)` call sites for the top-10 entities (`profiles`, `trips`, `trip_members`, `messages`, `channels`, `broadcasts`, `calendar_events`, `payment_splits`, `media_attachments`, `notifications`)
  - `scripts/check-schema-drift.ts` (new — see Recommended fix)
  - `.github/workflows/ci.yml` (new pretypecheck step)

- **Current risk:** MEDIUM
  - Auth path masks drift today; if the fallback ever stops matching live schema, login breaks silently for users whose profile rows lack the minimal-select columns.
  - Other entities have no fallback — drift there manifests as direct PostgREST errors, broken queries, or missing UI fields (the same vector that produced the "trace field names end-to-end" lesson).
  - Zero-tolerance adjacency: useAuth lives on the auth critical path.

- **Recommended fix:**
  1. Run `mcp__supabase__generate_typescript_types` against the live project and overwrite `src/integrations/supabase/types.ts`. Diff to verify no unexpected drops/renames.
  2. For each of the 10 entities, grep every `.from('<entity>').select('<cols>')` call site. Verify each column exists in the regenerated `types.ts`. Fix any mismatches at the call-site (rename, drop, or alias).
  3. Remove the schema-drift fallback in `useAuth.tsx:242-265`. If the full select fails after step 2, treat the failure as a real error (return `null`, log to Sentry) instead of falling back.
  4. Add `scripts/check-schema-drift.ts` — a CI lint that parses every `.from('<table>').select('<cols>')` literal in `src/` and asserts every column name exists in `types.ts` for that table. Wire as a pretypecheck step. (This catches future drift at PR time.)
  5. (Optional, stretch) Add a weekly GitHub Actions job that regenerates `types.ts` via the Supabase MCP and opens a PR if the file changes — closes the loop on "types went stale because nobody ran the generator".

- **Acceptance criteria:**
  - `src/integrations/supabase/types.ts` matches live schema (verified by clean re-run of `generate_typescript_types`).
  - `useAuth.fetchUserProfile` no longer contains a fallback `.select(...)` path.
  - All 10 entities' `.select()` calls reference only columns present in `types.ts`.
  - `scripts/check-schema-drift.ts` runs in CI and passes; introducing a fake-column select fails the check locally.
  - No regression in auth E2E: existing `useAuth` tests pass with explicit mocks (per `LESSONS.md`).

- **Test plan:**
  - Unit: extend `useAuth` tests to assert that a profile-select error returns `null` (not a fallback object).
  - Unit: add a `check-schema-drift.test.ts` that feeds a fixture with a known-missing column and asserts the lint flags it.
  - Manual: log in as a real user post-merge; verify display name, real name, name preference, and subscription fields render.
  - Manual: load a trip page, payments tab, calendar tab, broadcasts tab — verify no console errors and all fields populate.
  - Negative: rename a column locally without regenerating types — `check-schema-drift.ts` must fail CI.

- **Rollback plan:** Revert the branch. The fallback path is preserved in git history; restoring it is one revert away. No data migration risk — this is read-path only.

- **Launch-blocking?** No, but high-leverage. The fallback masks a class of bug that has bitten this team multiple times (per `LESSONS.md` "Trace field names end-to-end"). Removing it before launch reduces post-launch silent-failure surface. Schedule for the next maintenance sprint.

---

## Concierge pending-action confirm-handler gaps (discovered by `scripts/audit-concierge-tools.ts`)

- **Title:** Add usePendingActions confirm cases for `emitBulkDeletePreview` and `splitTaskAssignments`

- **Why this matters:** Both tools insert into `trip_pending_actions` from `supabase/functions/_shared/functionExecutor.ts` but have no corresponding case in `src/hooks/usePendingActions.ts`'s `switch (action.tool_name)` block. This is the exact failure mode documented in `agent_memory.jsonl` #25: confirm card appears to work, but produces no data because the confirm handler has no case for the tool. Discovered automatically by `scripts/audit-concierge-tools.ts` (Fix #4 in branch `claude/fix-gemini-voice-config-8Z5tm`).

- **Files likely involved:**
  - `src/hooks/usePendingActions.ts` (add cases inside the execute switch and the success-toast switch)
  - `supabase/functions/_shared/functionExecutor.ts` (verify the insert payload shape for each tool)
  - `src/hooks/useVoiceToolHandler.ts` (verify these tools are wired into the voice confirm path too, if applicable)
  - Tests in `src/hooks/__tests__/usePendingActions.test.ts` (or create if missing)

- **Current risk:** MEDIUM
  - User-visible silent failure: confirm card renders, user taps Confirm, nothing happens, no error toast.
  - `emitBulkDeletePreview` is reachable from the calendar-action query class; user-facing.
  - `splitTaskAssignments` is reachable from the task-action query class; user-facing.

- **Recommended fix:**
  1. Inspect the `payload` shape inserted by each tool in `functionExecutor.ts`.
  2. Add a `case` to the primary switch in `usePendingActions.ts` that re-executes the mutation server-side (or via the appropriate service module).
  3. Add the corresponding success-toast label entry.
  4. Add unit tests covering each new case.
  5. Re-run `npx tsx scripts/audit-concierge-tools.ts` — both warnings should disappear.

- **Acceptance criteria:**
  - `scripts/audit-concierge-tools.ts` reports 0 W1 warnings.
  - Manual: confirm card for each tool produces the expected DB write and success toast.

- **Test plan:**
  - Unit: mock a pending action with `tool_name: 'emitBulkDeletePreview'` and verify confirm executes the bulk-delete flow.
  - Unit: same for `splitTaskAssignments`.
  - Manual: trigger each tool from the text concierge, confirm via card, verify result.

- **Rollback plan:** Revert the additions to `usePendingActions.ts`. No schema changes. Pre-fix behavior (silent failure) is restored — strictly safe.

- **Launch-blocking?** No, but should ship before either tool's UX is promoted in onboarding/marketing. Currently low-traffic; impact is bounded.
