-- Fix: update_task_with_version RPC auth bypass
-- Problem: Original function trusted caller-supplied p_creator_id parameter
-- instead of auth.uid(). Also missing trip membership check.
-- Fix: Drop old signature, recreate with auth.uid() + trip membership + capability override.
--
-- REWRITTEN 2026-08-05. This migration had never been applied to production (verified: no
-- update_task_with_version of any signature exists), and as written it would have been broken in
-- two ways. src/hooks/useTripTasks.ts calls it for optimistic-concurrency protection on task edits
-- and, on "function does not exist", falls through to a direct UPDATE — so task editing works today
-- but concurrent edits are silently last-write-wins.
--
-- Three defects fixed versus the original:
--
--   1. TYPE MISMATCH. v_trip_id was declared UUID, but trip_tasks.trip_id is TEXT (verified against
--      the live schema). Any non-UUID trip id — the carlton-* trips, every event trip — would have
--      raised `invalid input syntax for type uuid` on the very first statement. This is the same
--      bug that was fixed in update_event_with_version by 20260802140000.
--
--   2. AUTHORIZATION DIVERGED FROM RLS. The function allowed creator-or-`role='admin'`, but the
--      live trip_tasks UPDATE policies are:
--          "Task creators can update their tasks"    -> auth.uid() = creator_id
--          "Coordinators can update trip tasks"      -> has_coordinator_capability(
--                                                          auth.uid(), trip_id,
--                                                          'can_manage_shared_tasks')
--      A Pro/Event coordinator holding the shared-tasks capability could edit via a direct UPDATE
--      but would have been rejected by this RPC with 42501 — behaviour depending on which code path
--      the client happened to take. Now mirrors the policy exactly, so the RPC can never grant more
--      than RLS already does, nor less.
--
--   3. NO ACTIVE-STATUS FILTER on the membership check, so a member who had left the trip still
--      passed it.
--
-- Regression scope: authorization for one task-edit RPC, tightened to match the RLS already
-- enforced on the same table. No trip fetch, auth hydration, or payment surface is touched.

DROP FUNCTION IF EXISTS public.update_task_with_version(UUID, INTEGER, UUID, TEXT, TEXT, TIMESTAMPTZ, BOOLEAN);

CREATE OR REPLACE FUNCTION public.update_task_with_version(
  p_task_id UUID,
  p_current_version INTEGER,
  p_title TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_due_at TIMESTAMPTZ DEFAULT NULL,
  p_is_poll BOOLEAN DEFAULT NULL
)
RETURNS SETOF trip_tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actual_version INTEGER;
  v_creator_id UUID;
  v_trip_id TEXT;   -- trip_tasks.trip_id is TEXT, not UUID.
BEGIN
  SELECT version, creator_id, trip_id
  INTO v_actual_version, v_creator_id, v_trip_id
  FROM trip_tasks
  WHERE id = p_task_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found' USING ERRCODE = 'P0002';
  END IF;

  -- Caller must be an ACTIVE member of the task's trip.
  IF NOT EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_id = v_trip_id
      AND user_id = auth.uid()
      AND (status IS NULL OR status = 'active')
  ) THEN
    RAISE EXCEPTION 'Access denied: not a trip member' USING ERRCODE = '42501';
  END IF;

  -- Mirror the trip_tasks UPDATE policies exactly: own task, or coordinator capability.
  IF NOT (
    v_creator_id = auth.uid()
    OR public.has_coordinator_capability(auth.uid(), v_trip_id, 'can_manage_shared_tasks')
  ) THEN
    RAISE EXCEPTION 'Access denied: only the task creator or a task coordinator can edit'
      USING ERRCODE = '42501';
  END IF;

  IF COALESCE(v_actual_version, 1) != COALESCE(p_current_version, 1) THEN
    RAISE EXCEPTION 'Task has been modified by another user (expected version %, found %)',
      p_current_version, v_actual_version
      USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
  UPDATE trip_tasks
  SET
    title = CASE WHEN p_title IS NULL THEN title ELSE NULLIF(p_title, '') END,
    description = CASE WHEN p_description IS NULL THEN description ELSE NULLIF(p_description, '') END,
    due_at = CASE WHEN p_due_at IS NULL THEN due_at ELSE p_due_at END,
    is_poll = COALESCE(p_is_poll, is_poll),
    version = COALESCE(v_actual_version, 1) + 1,
    updated_at = NOW()
  WHERE id = p_task_id
  RETURNING *;
END;
$$;

-- Function body enforces membership + creator/coordinator. anon must never reach it: revoke the
-- implicit PUBLIC grant as well as the explicit anon one Supabase's default privileges add.
REVOKE EXECUTE ON FUNCTION public.update_task_with_version(
  UUID, INTEGER, TEXT, TEXT, TIMESTAMPTZ, BOOLEAN
) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_task_with_version(
  UUID, INTEGER, TEXT, TEXT, TIMESTAMPTZ, BOOLEAN
) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_task_with_version(
  UUID, INTEGER, TEXT, TEXT, TIMESTAMPTZ, BOOLEAN
) TO authenticated;
