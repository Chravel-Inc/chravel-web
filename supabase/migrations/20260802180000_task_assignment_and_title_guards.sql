-- Task hardening follow-ups to 20260802120300.
--
-- 1) task_assignments INSERT only required that the CALLER be a member of the task's trip. Two gaps:
--    (a) no role gate, so on a pro/event trip a viewer/attendee who cannot create tasks could still
--        create assignments — inconsistent with the trip-type-aware model can_create_trip_task
--        encodes; (b) no check that the ASSIGNEE is a member of the trip, so a caller could assign an
--        arbitrary user id and the notify_on_task_assignment trigger would mint a notification for
--        that person — assignment-driven notification spam / griefing.
--    Tighten to: caller is the task creator or may create tasks on the trip, AND the assignee is an
--    active member of that same trip. The app only ever assigns real trip members, so no legitimate
--    flow is affected. This policy only adds AND conditions — it never widens access.
--
-- 2) trip_tasks.title had no length constraint (the old CHECK lived on the superseded user_trips
--    schema). The client caps at 140 chars in the UI only, so a direct API call could store a
--    multi-megabyte title. Add a server-side CHECK matching the UI, applied NOT VALID so existing
--    rows are never rejected retroactively.
--
-- Regression scope: task write authorization only. No trip fetch/existence, auth hydration, RLS
-- read visibility, or payment state is touched.

DROP POLICY IF EXISTS "Trip members can assign tasks" ON public.task_assignments;
CREATE POLICY "Trip members can assign tasks"
  ON public.task_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = assigned_by
    AND EXISTS (
      SELECT 1
      FROM public.trip_tasks tt
      WHERE tt.id = task_assignments.task_id
        AND (
          tt.creator_id = (SELECT auth.uid())
          OR public.can_create_trip_task((SELECT auth.uid()), tt.trip_id)
        )
    )
    AND EXISTS (
      SELECT 1
      FROM public.trip_tasks tt
      JOIN public.trip_members tm ON tm.trip_id = tt.trip_id
      WHERE tt.id = task_assignments.task_id
        AND tm.user_id = task_assignments.user_id
        AND (tm.status IS NULL OR tm.status = 'active')
    )
  );

ALTER TABLE public.trip_tasks DROP CONSTRAINT IF EXISTS trip_tasks_title_length_chk;
ALTER TABLE public.trip_tasks
  ADD CONSTRAINT trip_tasks_title_length_chk
  CHECK (char_length(title) BETWEEN 1 AND 140) NOT VALID;
