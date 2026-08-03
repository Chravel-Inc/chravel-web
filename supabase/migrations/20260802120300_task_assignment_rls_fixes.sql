-- B11 + B12: group/multi-assignee task creation failed, and task edits collided.
--
-- B11: creating a task in group mode bulk-inserts a task_status row per assignee, but the only
-- task_status write policy was self-scoped ("Users can manage their own task status",
-- WITH CHECK auth.uid() = user_id). The co-member rows were rejected, so the task was created and
-- everyone notified, but with zero completion rows + an error toast. Add an INSERT policy that lets
-- a task manager (the task creator, or anyone who can create tasks on the trip) initialize status
-- rows for ACTIVE trip members. The self-scoped policy stays for a user's own completion toggles.
--
-- B12: task_assignments only had INSERT + SELECT policies. The edit path deletes all assignments
-- then re-inserts; with no DELETE policy the delete was a silent no-op and the re-insert hit a
-- duplicate-key error, so editing a task (even just its title) threw and assignees could never be
-- removed. Add a DELETE policy scoped to the assigner or a task manager.
--
-- Both policies are additive and tightly scoped (task ownership + active trip membership) — they
-- do not widen cross-trip access, do not touch trip loading/auth, and cannot leak rows.

DROP POLICY IF EXISTS "Task managers can initialize assignee status" ON public.task_status;
CREATE POLICY "Task managers can initialize assignee status"
  ON public.task_status
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.trip_tasks tt
      WHERE tt.id = task_status.task_id
        AND (tt.creator_id = auth.uid() OR public.can_create_trip_task(auth.uid(), tt.trip_id))
    )
    AND EXISTS (
      SELECT 1
      FROM public.trip_tasks tt
      JOIN public.trip_members tm ON tm.trip_id = tt.trip_id
      WHERE tt.id = task_status.task_id
        AND tm.user_id = task_status.user_id
        AND (tm.status IS NULL OR tm.status = 'active')
    )
  );

DROP POLICY IF EXISTS "Task managers can delete task assignments" ON public.task_assignments;
CREATE POLICY "Task managers can delete task assignments"
  ON public.task_assignments
  FOR DELETE
  TO authenticated
  USING (
    assigned_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.trip_tasks tt
      WHERE tt.id = task_assignments.task_id
        AND (tt.creator_id = auth.uid() OR public.can_create_trip_task(auth.uid(), tt.trip_id))
    )
  );
