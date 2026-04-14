
Confirmed disconnect:

1. Pending concierge writes are still not executing immediately.
   - In `src/features/concierge/hooks/useConciergeStreaming.ts`, the code hits an early `return` as soon as it receives `{ pending: true, pendingActionId }`.
   - Because of that early return, it never invalidates `['pendingActions', tripId]`.
   - `usePendingActions` has no realtime subscription for `trip_pending_actions`; it only auto-confirms after its query refetches.
   - Net effect: the task/poll/calendar action gets parked in `trip_pending_actions`, the assistant claims success, and the destination tab stays empty.

2. Direct-write cache invalidation is still wrong for Base Camp.
   - `setBasecamp` currently invalidates `['trip', tripId]`, but the actual trip basecamp UI uses `tripBasecampKeys.trip(tripId)` = `['tripBasecamp', tripId]`.
   - Personal basecamp uses the `['personalBasecamp', tripId, userId]` family, so prefix invalidation is fine there.
   - Result: Base Camp can save successfully but Places still looks stale.

3. The fallback confirmation UI is not reliable.
   - `ChatMessages.tsx` rebuilds pending cards with empty `payload` and does not pass the stored `title/detail`.
   - So when auto-confirm fails, the confirmation card is easy to miss or looks incomplete.

4. AI-created task writes are not parity writes.
   - In `src/hooks/usePendingActions.ts`, `createTask` inserts into `trip_tasks` only.
   - The normal manual task path also creates `task_status` and `task_assignments`.
   - This is not the main reason the tab stays empty, but it leaves AI-created tasks inconsistent and risks follow-on UI bugs.

Why the empty states are especially bad:
- Tasks and polls decide “first-use” state from `length === 0`.
- If the pending action never confirms/refetches, the app keeps showing “Create your first task/poll” even though concierge just said it made one.

Implementation plan:

1. Fix the actual pending-action trigger
   - In `src/features/concierge/hooks/useConciergeStreaming.ts`, invalidate/refetch `['pendingActions', tripId]` before returning from the pending branch.
   - This makes the existing auto-confirm effect actually see new pending rows.
   - Hardening option: call `confirmActionAsync(pendingActionId)` directly for self-initiated actions so the flow does not depend on cache freshness.

2. Make pending confirmations write the same shape as manual creation
   - In `src/hooks/usePendingActions.ts`, after `createTask` inserts the task row, also insert `task_status` and `task_assignments`.
   - Review `createPoll` and `addToCalendar` for the same parity check against their normal hooks.
   - Keep immediate query invalidation after confirm so the first item clears the empty state right away.

3. Fix Base Camp / Places invalidation keys
   - In `src/lib/conciergeInvalidation.ts`, change `setBasecamp` to invalidate `['tripBasecamp', tripId]` and `['personalBasecamp']`.
   - Keep trip detail invalidation too if other surfaces depend on trip row data.
   - Re-verify Explorer/Places mappings against actual query keys so direct writes always refresh the correct tab.

4. Fix the backup confirmation card
   - In `src/features/chat/components/ChatMessages.tsx`, pass the real `title` and `detail` through to `PendingActionCard`.
   - That way, if a write still needs confirmation, the user sees a clear card instead of a vague or blank state.

5. Verify the trust-critical flows end to end
   - First task on an empty Tasks tab
   - First poll on an empty Polls tab
   - First calendar event on an empty Calendar tab
   - Trip Base Camp update in Places
   - Personal Base Camp update in Places
   - Save place / Explorer update
   - Success condition: no manual refresh, no stale empty CTA, and the created item is visible immediately in the destination tab.

Files to change:
- `src/features/concierge/hooks/useConciergeStreaming.ts`
- `src/hooks/usePendingActions.ts`
- `src/lib/conciergeInvalidation.ts`
- `src/features/chat/components/ChatMessages.tsx`

This is the real root cause chain: pending actions are being created, but the client never tells the pending-actions query to refetch, so auto-confirm never fires. Base Camp has a separate invalidation-key bug. If you want, send a new request and I’ll implement this exact fix set end-to-end.
