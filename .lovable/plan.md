

# Universal Concierge → UI Sync Fix

## Problem

When the concierge writes data (tasks, places, basecamp, calendar, polls, expenses), the changes don't appear in the corresponding tabs. Two root causes:

1. **Query key mismatches** — the invalidation map targets keys that don't match the actual query keys used by hooks
2. **Pending actions require manual confirm** — for tasks/polls/calendar/expenses, data sits in a buffer table until the user clicks "Confirm", but the confirm button may not render or the user doesn't realize they need to click it

## Current Architecture (two write paths)

```text
DIRECT writes (no confirmation needed):
  savePlace, setBasecamp, settleExpense, addToAgenda, makeReservation
  → functionExecutor.ts writes to DB directly
  → Client invalidates via getConciergeInvalidationQueryKey()
  → BUT query keys are WRONG so invalidation is a no-op

PENDING writes (confirmation required):
  createTask, createPoll, addToCalendar, addExpense, duplicateCalendarEvent, etc.
  → functionExecutor.ts writes to trip_pending_actions
  → PendingActionCard renders in chat → user clicks Confirm
  → usePendingActions executes real insert → invalidates correct keys
  → BUT user must manually find and click Confirm
```

## Fix Plan

### 1. Fix query key mismatches in conciergeInvalidation.ts

| Tool | Current key (wrong) | Correct key(s) |
|------|---------------------|-----------------|
| `savePlace` | `['tripPlaces', tripId]` | `['tripPlaces', tripId]` + `['tripLinks', tripId]` (prefix match) |
| `setBasecamp` (trip) | `['tripBasecamp', tripId]` | `['tripBasecamp', tripId]` + `['trip', tripId]` (basecamp lives on trip row) |
| `setBasecamp` (personal) | not handled | `['personalBasecamp']` (prefix invalidate) |
| `addToAgenda` | `['eventAgenda', tripId]` | Correct ✓ |

**Change:** Update `getConciergeInvalidationQueryKey` to return an array of keys (or call multiple invalidations). For `savePlace`, also invalidate `tripLinks`. For `setBasecamp`, also invalidate `personalBasecamp` and trip detail.

### 2. Broaden invalidation call in useConciergeStreaming.ts

Currently line 582-587 does a single `invalidateQueries` call. Change to:
- Support multiple query keys per tool (from step 1)
- Use `{ queryKey, exact: false }` for prefix-based matching so `['tripLinks', tripId]` catches `['tripLinks', tripId, isDemoMode]`

### 3. Add auto-confirm for self-initiated pending actions

In `usePendingActions.ts`, add an effect: when a new pending action appears where `action.user_id === currentUser.id`, auto-confirm it immediately. This eliminates the manual click for the user who asked the concierge to do something.

Safeguards:
- Only auto-confirm actions created by the current user
- RLS still enforces trip membership on the actual insert
- Other trip members still see the confirm/reject card for actions affecting them

### 4. Fix the prompt to stop overclaiming (backend)

In `supabase/functions/_shared/promptBuilder.ts`, add instruction: when a tool returns `pending: true`, say "I've prepared [thing] for your confirmation" not "Created ✅". This prevents the trust gap while auto-confirm is rolling out.

### 5. Redeploy lovable-concierge

After prompt changes.

## Files Changed

1. `src/lib/conciergeInvalidation.ts` — return multiple query keys per tool; fix savePlace/setBasecamp mappings
2. `src/features/concierge/hooks/useConciergeStreaming.ts` — support multi-key invalidation with prefix matching
3. `src/hooks/usePendingActions.ts` — add auto-confirm effect for self-initiated actions
4. `supabase/functions/_shared/promptBuilder.ts` — fix overclaiming language
5. Redeploy `lovable-concierge` edge function

## Risk
- **Low** — invalidation key fixes are pure config. Auto-confirm is scoped to requesting user only; RLS still enforces access on actual DB writes. Prompt fix is text-only.
- Rollback: revert the auto-confirm effect if any issues; manual confirm still works as fallback.

