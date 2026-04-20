

## Direct answer
**No.** The previous fix only covered `addToCalendar`, `createTask`, and `createPoll`. Everything else (Basecamp, Places, Payments, Broadcasts, Reminders, Budget, Agenda, edits/deletes, reservations, trip details, header image) still parks rows in `trip_pending_actions` and either:
- relies on the client hook auto-confirm (works only for ~10 tools), or
- has **no client confirm handler at all** (~15 tools — silently dead writes).

That's why your earlier sessions kept "succeeding" without anything appearing.

## Goal
Every non-destructive concierge write executes against the real table immediately, server-side, when the caller is the trip member — same model as Calendar/Tasks/Polls.

## Scope — tools to upgrade to server-side fast-path

**Tier 1 — pure additions (auto-confirm, no UX change):**
- `setBasecamp` → `trip_basecamps` upsert
- `savePlace` → `trip_links` insert
- `addExpense` → `trip_payment_messages` + `payment_splits` (already has client path; move server-side)
- `setTripBudget` → `trip_budgets` upsert (currently has no real table write — needs one)
- `addReminder` → `trip_reminders` insert (same — needs real write)
- `addToAgenda` → `trip_event_agenda` insert
- `createBroadcast` → `trip_broadcasts` insert
- `closePoll` → `trip_polls` update `status='closed'`
- `updateTripDetails` → `trips` update (already has client path; move server-side)
- `setTripHeaderImage` / `generateTripImage` → `trips.cover_image_url` update
- `splitTaskAssignments` → `trip_tasks` bulk insert
- `duplicateCalendarEvent` / `cloneActivity` → `trip_events` insert (move server-side)
- `bulkMarkTasksDone` → `task_status` upsert (move server-side)

**Tier 2 — edits/deletes (keep behind explicit confirm):**
- `updateCalendarEvent`, `deleteCalendarEvent`, `bulkDeleteCalendarEvents`, `updateTask`, `deleteTask`, `settleExpense`
- These mutate/destroy existing data — leave the pending-action gate so the user must tap "Confirm" in the chat card. Safety > speed.

**Tier 3 — external side effects (keep as preview/draft):**
- `emitReservationDraft`, `emitSmartImportPreview`, `makeReservation`, `bulkDeleteCalendarEvents` (preview)
- These already render preview/draft UI in the chat. Leave as-is.

## Implementation pattern

Refactor `functionExecutor.ts` with a single helper:

```ts
async function commitOrPend(
  toolName: string,
  pendingPayload: Record<string, unknown>,
  realInsert: () => Promise<{ error: unknown; id?: string }>,
  options: { autoConfirm: boolean },
)
```

For Tier 1 tools: insert pending → run `realInsert()` → if success, mark `trip_pending_actions.status='confirmed'` and return `{ pending: false, promoted: true, entityId }`. If real insert fails, leave pending row + return `{ pending: true }` so the client safety net retries.

For Tier 2/3: unchanged — return `{ pending: true }`.

`toolResultContracts.ts` already accepts `PromotedActionEnvelope` from the prior change — reuse it.

## Files changed

| File | Change |
|---|---|
| `supabase/functions/_shared/functionExecutor.ts` | Add `commitOrPend` helper; wire Tier 1 tools through it |
| `supabase/functions/_shared/concierge/toolResultContracts.ts` | (verify) `PromotedActionEnvelope` accepts all Tier 1 actionTypes |
| `src/hooks/usePendingActions.ts` | Remove now-redundant client confirm cases for Tier 1 tools (keep as fallback for edits/deletes) — also extend invalidation switch to cover new tools (basecamp, places, broadcasts, budget, reminder, agenda) |
| `src/lib/conciergeInvalidation.ts` | Already covers most keys — verify `addReminder`, `setTripBudget`, `closePoll`, `addToAgenda` map to the right query keys |
| `supabase/functions/_shared/__tests__/functionExecutor.test.ts` | Add assertions: Tier 1 tools insert into real tables and mark pending confirmed |

## Verification (after deploy)

1. "Set our base camp to The Beverly Hilton" → switch to Places/Overview → basecamp visible. ✅
2. "Save Sugarfish to our places" → Places tab → link present. ✅
3. "Add a $120 dinner expense split with everyone" → Payments → row + splits present. ✅
4. "Set our trip budget to $5000" → Payments → budget visible. ✅
5. "Send a broadcast: bus leaves at 8am" → Broadcasts → message present. ✅
6. "Remind me Friday at 6pm to pack chargers" → Reminders/Calendar → reminder present. ✅
7. "Close the dinner poll" → Polls → status closed. ✅
8. Edit/Delete flows still show inline Confirm card (Tier 2 unchanged). ✅
9. Refresh mid-flow → safety net still promotes any stragglers. ✅
10. `npm run typecheck && npm run lint && npm run build` pass; updated tests green.

## Risk
**MEDIUM.** Touches 13 write paths. Mitigations:
- Tier 2/3 (edits/deletes/external) deliberately untouched — destructive ops still require user click.
- Each tool gated on `userId === auth.uid()` via existing `requireAuth`; RLS still enforces.
- Real-insert failure leaves pending row → client fallback unchanged → never regresses below today's behavior.
- Per-tool changes are independent; rollback any single tool without affecting the others.

