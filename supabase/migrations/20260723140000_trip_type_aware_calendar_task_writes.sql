-- Trip-type-aware calendar + task write authorization (2026-07-23)
--
-- PROBLEM (confirmed against live pg_policies on prod jmjiyekmxwsxkfnqwyaa):
--   `trip_events` and `trip_tasks` writes were gated ONLY on active trip
--   membership (policies "Allow calendar event create/update/delete" and
--   "Trip members can create tasks"). On PRO and EVENT trips this contradicts the
--   permission model — an `event_attendee` / `pro_viewer` (an ordinary active
--   member) could create/update/DELETE any calendar event, and the DELETE policy
--   had no per-row ownership check at all, so a single attendee could wipe the
--   entire shared schedule of an event with thousands of attendees. Task creation
--   had the same "any active member" gap.
--
-- FIX:
--   Keep the CONSUMER model unchanged (all members equal: any active member may
--   create/update/delete). For PRO and EVENT trips, restrict writes to the trip
--   owner, trip admins, and coordinators holding the relevant capability — plus,
--   for update/delete, the event/task's own creator. This mirrors the live
--   `can_edit_trip_cover` authority model (creator-or-admin) and the existing
--   coordinator policies (which are left in place and continue to OR-in access).
--
--   The June-2026 "permission resolver" functions (can_trip_actor /
--   permission_matrix_allows) are NOT deployed to prod, so this uses only live
--   primitives: is_active_trip_member, is_trip_admin, has_coordinator_capability.
--
-- SELECT/viewing policies are intentionally NOT changed — this migration only
-- narrows write access, so it cannot cause Trip-Not-Found, auth desync, an RLS
-- read leak, or payment-state drift.
--
-- REVERSAL: drop the two helper functions and recreate the previous policies with
--   USING/WITH CHECK = "(is_active_trip_member(auth.uid(), trip_id) OR trips.created_by
--   = auth.uid())" (their pre-2026-07-23 definitions).

-- ── Helper: who may manage the shared calendar of a trip ──────────────────────
CREATE OR REPLACE FUNCTION public.can_manage_trip_calendar(_user_id uuid, _trip_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.trips t
    WHERE t.id = _trip_id
      AND public.is_active_trip_member(_user_id, _trip_id)
      AND (
        -- Consumer trips keep the open model: every active member is equal.
        COALESCE(t.trip_type, 'consumer') = 'consumer'
        -- Pro/Event: only the trip owner, trip admins, or a coordinator with the
        -- shared-calendar capability may manage other people's events.
        OR t.created_by = _user_id
        OR public.is_trip_admin(_user_id, _trip_id)
        OR public.has_coordinator_capability(_user_id, _trip_id, 'can_manage_shared_calendar')
      )
  );
$$;

-- ── Helper: who may create tasks on a trip ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.can_create_trip_task(_user_id uuid, _trip_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.trips t
    WHERE t.id = _trip_id
      AND public.is_active_trip_member(_user_id, _trip_id)
      AND (
        COALESCE(t.trip_type, 'consumer') = 'consumer'
        OR t.created_by = _user_id
        OR public.is_trip_admin(_user_id, _trip_id)
        OR public.has_coordinator_capability(_user_id, _trip_id, 'can_manage_shared_tasks')
      )
  );
$$;

-- ── trip_events: replace membership-only write policies ───────────────────────
-- (The parallel "Coordinators can insert/update/delete calendar events" policies
--  are intentionally left untouched.)
DROP POLICY IF EXISTS "Allow calendar event creation" ON public.trip_events;
CREATE POLICY "Allow calendar event creation"
  ON public.trip_events
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND public.can_manage_trip_calendar(auth.uid(), trip_id)
  );

DROP POLICY IF EXISTS "Allow calendar event updates" ON public.trip_events;
CREATE POLICY "Allow calendar event updates"
  ON public.trip_events
  FOR UPDATE
  USING (
    public.can_manage_trip_calendar(auth.uid(), trip_id)
    OR created_by = auth.uid()
  )
  WITH CHECK (
    public.can_manage_trip_calendar(auth.uid(), trip_id)
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Allow calendar event deletion" ON public.trip_events;
CREATE POLICY "Allow calendar event deletion"
  ON public.trip_events
  FOR DELETE
  USING (
    public.can_manage_trip_calendar(auth.uid(), trip_id)
    OR created_by = auth.uid()
  );

-- ── trip_tasks: replace membership-only INSERT policy ─────────────────────────
-- (UPDATE/DELETE are already creator-scoped + coordinator-gated; left untouched.)
DROP POLICY IF EXISTS "Trip members can create tasks" ON public.trip_tasks;
CREATE POLICY "Trip members can create tasks"
  ON public.trip_tasks
  FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id
    AND public.can_create_trip_task(auth.uid(), trip_id)
  );

-- Least-privilege: these helpers back RLS decisions; no need for anon EXECUTE.
REVOKE EXECUTE ON FUNCTION public.can_manage_trip_calendar(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_create_trip_task(uuid, text) FROM anon;
