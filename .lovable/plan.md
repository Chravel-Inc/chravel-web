

## Root cause

The concierge **never writes directly** to `trip_events` / `trip_tasks` / `trip_polls`. It uses a two-phase confirmation pattern:

1. **Phase 1 (server, `functionExecutor.ts`):** `addToCalendar` / `createTask` / `createPoll` insert into a buffer table `trip_pending_actions` with `status='pending'` and return `{ pending: true, pendingActionId }`.
2. **Phase 2 (client, `usePendingActions.ts`):** A polling hook fetches pending rows, and an auto-confirm `useEffect` calls the real insert into `trip_tasks` / `trip_events` for actions created by the current user.

`toolResultContracts.ts` line 61–66 hard-enforces this — any direct write attempt is rejected with `"must return a pending action envelope before execution"`.

**The bug: `usePendingActions(tripId)` is only mounted inside `AIConciergeChat.tsx`** (single call site, confirmed via grep). That component lives behind the **Concierge tab**. The instant the user navigates away from the Concierge tab to **Calendar** or **Tasks**, the hook unmounts → no polling → no auto-confirm → the row stays parked in `trip_pending_actions` forever, and Calendar/Tasks show nothing.

This matches the screenshots exactly: AI claimed it added "Dinner at SUGARFISH" to the calendar and "Check Sugarfish waitlist" to tasks — both rows exist in `trip_pending_actions`, neither was promoted to the real tables because the user clicked away before auto-confirm fired.

Secondary aggravators:
- Auto-confirm is a `useEffect` that depends on the query firing once mounted — even if the user stays on Concierge, there's a small window between the AI returning and the query refetching. The streaming hook *does* invalidate (line 515 of `useConciergeStreaming.ts`), but if the user navigates within ~200ms it's lost.
- Auto-confirm processes one action at a time per render — multi-tool calls (calendar + task in one message, like the Sugarfish screenshot) take 2 round-trips.

## Fix — three surgical changes

**Goal:** by the time the user clicks Calendar/Tasks, the data is already there. No unmount race, no stale buffer.

### Change 1 — Hoist `usePendingActions` to the trip-level shell (primary fix)

Move the `usePendingActions(tripId)` call from `AIConciergeChat.tsx` up to the trip detail container that wraps **all** trip tabs (e.g. `TripDetailPage` / `ProTripDetailDesktop` / wherever the tab switcher lives). The hook must stay mounted for the entire trip session, not just while the Concierge tab is active.

`AIConciergeChat.tsx` keeps reading the same hook (or via a small context) so its inline confirm/reject UI still works.

**Why this is correct:** `trip_pending_actions` is a trip-scoped concern, not a Concierge-tab concern. The auto-confirm responsibility belongs at the trip shell layer.

### Change 2 — Auto-confirm in a single batch, not one per render

In `usePendingActions.ts` (lines 386–399), replace the "process first item only" effect with a `Promise.all` over **all** self-owned pending actions. A two-tool concierge response (calendar + task) gets promoted in one tick instead of two refetch cycles.

### Change 3 — Server-side fast-path: confirm inline for the message author

In `supabase/functions/_shared/functionExecutor.ts`, after inserting the pending row for `createTask` / `addToCalendar` / `createPoll`, immediately perform the real insert into `trip_tasks` / `trip_events` / `trip_polls` **when the caller is the trip member who initiated the request** (which is always true for text + voice concierge today — `userId` comes from `requireAuth`). Then mark the pending row `confirmed` server-side in the same transaction.

This makes the write atomic and removes the client round-trip entirely. The pending-action envelope is preserved in the response shape (so existing UI/tests don't break) but `pending: true` becomes informational — the row is already in the real table.

The `usePendingActions` client path becomes a **safety net** for edge cases (other trip members confirming AI suggestions, future approval workflows) rather than the primary commit path.

## Files changed

| File | Change |
|---|---|
| `src/pages/...TripDetail*.tsx` (the shell wrapping the tab switcher) | Mount `usePendingActions(tripId)` once |
| `src/components/AIConciergeChat.tsx` | Read the hook from a small context (or keep call — the hook is already idempotent per tripId via TanStack key) |
| `src/hooks/usePendingActions.ts` | Batch auto-confirm via `Promise.all`; keep idempotency guard |
| `supabase/functions/_shared/functionExecutor.ts` | After pending insert for `createTask`/`addToCalendar`/`createPoll`, immediately insert into the real table + mark pending `confirmed` (when caller = trip member) |
| `supabase/functions/_shared/__tests__/functionExecutor.test.ts` | Update assertions to expect both inserts |

## Verification

1. Open Concierge → "Add dinner at Sugarfish Friday at 5pm and remind me to check the waitlist" → immediately switch to Calendar tab → event present. Switch to Tasks tab → task present. No "Confirm" click required.
2. Refresh the page mid-flow: pending rows still get promoted on next mount (safety net intact).
3. Reject path still works for any pending row that wasn't auto-promoted.
4. Multi-tool message creates both rows in a single round-trip (network tab shows no second confirm).
5. `npm run typecheck && npm run lint && npm run build` pass.
6. Existing `functionExecutor.test.ts` and `toolResultContracts.test.ts` updated and green.

## Risk

**MEDIUM.** Touching the write path of the concierge. Mitigations:
- Pending-action envelope shape is preserved → no contract break with frontend.
- Server-side promotion is gated on `userId === auth.uid()` so RLS still applies.
- If the real insert fails, we leave the pending row as a fallback for the client hook — net behavior never *worse* than today.
- Rollback = revert the executor change; client hoist is independently safe.

