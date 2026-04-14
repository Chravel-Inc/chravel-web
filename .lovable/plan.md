

# Fix Task Creation Error + Default to Group Task

## Problem 1: "Could not find the 'idempotency_key' column of 'trip_tasks' in the schema cache"

The `trip_tasks` table has no `idempotency_key` column, but `useTripTasks.ts` line 636 inserts one. Same issue exists for `trip_polls` in `useTripPolls.ts` line 309.

**Fix:** Remove `idempotency_key` from the insert objects in both files. Idempotency can be handled at a different layer if needed later — right now it's blocking all task and poll creation.

## Problem 2: Default task type should be "Group Task"

In `TaskCreateForm.tsx` line 38, the default `taskMode` is `'solo'`. Change it to `'poll'` (which maps to "Group Task - Everyone needs to complete this").

## Problem 3: Hide member selector for group tasks

In `TaskCreateForm.tsx` lines 211-217, the `CollaboratorSelector` is always rendered. For group tasks (`taskMode === 'poll'`), it should be hidden entirely since it auto-assigns to everyone anyway. The `CollaboratorSelector` already auto-selects all members for group tasks (line 44-48), but the dropdown is still shown and confusable.

**Fix:** Wrap the `CollaboratorSelector` in a conditional: only render when `taskMode === 'solo'`. For group tasks, show a simple "Assigned to everyone" label instead.

## Files Changed

1. **`src/hooks/useTripTasks.ts`** — Remove `idempotency_key` from the task insert object (line 636)
2. **`src/hooks/useTripPolls.ts`** — Remove `idempotency_key` from the poll insert object (line 309)
3. **`src/components/todo/TaskCreateForm.tsx`** — Default `taskMode` to `'poll'`; conditionally hide `CollaboratorSelector` for group tasks, show "Assigned to everyone" text instead

## Risk
Low — removing a column reference that doesn't exist fixes a hard blocker. UI defaults are cosmetic. No schema or RLS changes.
