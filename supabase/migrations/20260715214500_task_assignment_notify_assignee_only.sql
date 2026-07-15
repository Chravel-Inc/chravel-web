-- ============================================================================
-- Fix notify_on_task_assignment: notify ONLY the assignee.
--
-- ROOT CAUSE:
--   Canonical fanout (20260512160000 → 20260715210000) routed task assignments
--   through create_notification_for_trip_members(p_actor_user_id := NEW.user_id).
--   That helper notifies every OTHER trip member and EXCLUDES the actor — so the
--   assignee never got the Alerts/push row, and everyone else did.
--
-- ORIGINAL (20251105000000) correctly targeted ARRAY[NEW.user_id] only.
--
-- FIX:
--   Insert a single notifications row for NEW.user_id (the assignee), gated by
--   should_send_notification(..., 'tasks') and per-trip mute. Keep generic
--   trip-scoped copy. No schema/RLS/auth/payment-state changes.
--
-- REGRESSION CHECK:
--   Trip Not Found: N/A (no trip query/route changes)
--   Auth desync: N/A (no auth changes)
--   RLS leaks: N/A (CREATE OR REPLACE function only; no new tables/policies)
--   Payment state drift: N/A (task assignment notifications only)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_on_task_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip_id TEXT;
  v_trip_name TEXT;
  v_title TEXT;
  v_body TEXT;
  v_event_key TEXT;
  v_muted BOOLEAN := false;
BEGIN
  -- Assignee is required; nothing to notify without a recipient.
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Skip self-assignment noise (assigner == assignee).
  IF NEW.assigned_by IS NOT NULL AND NEW.assigned_by = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT t.trip_id::text INTO v_trip_id
  FROM public.trip_tasks t
  WHERE t.id = NEW.task_id;

  IF v_trip_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Demo/mock non-UUID trip ids cannot cast into notifications.trip_id (uuid).
  BEGIN
    PERFORM v_trip_id::uuid;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN NEW;
  END;

  SELECT COALESCE(NULLIF(TRIM(tr.name), ''), 'your trip')
    INTO v_trip_name
  FROM public.trips tr
  WHERE tr.id = v_trip_id;

  v_trip_name := COALESCE(v_trip_name, 'your trip');
  v_title := 'Task assigned in ' || v_trip_name;
  v_body := 'A task was assigned to you in your ' ||
    CASE WHEN v_trip_name = 'your trip' THEN 'trip' ELSE v_trip_name || ' trip' END || '.';

  -- Per-trip mute on the assignee's membership.
  SELECT COALESCE(tm.notifications_muted, false)
    INTO v_muted
  FROM public.trip_members tm
  WHERE tm.trip_id = v_trip_id
    AND tm.user_id = NEW.user_id
  LIMIT 1;

  IF COALESCE(v_muted, false) THEN
    RETURN NEW;
  END IF;

  IF NOT public.should_send_notification(NEW.user_id, 'tasks') THEN
    RETURN NEW;
  END IF;

  v_event_key :=
    'task_assignment:' || NEW.task_id::text || ':' || NEW.user_id::text;

  INSERT INTO public.notifications (
    user_id,
    trip_id,
    type,
    title,
    message,
    metadata,
    is_read,
    is_visible
  )
  VALUES (
    NEW.user_id,
    v_trip_id::uuid,
    'task',
    v_title,
    v_body,
    jsonb_build_object(
      'trip_id', v_trip_id,
      'trip_name', v_trip_name,
      'task_id', NEW.task_id,
      'assignee_user_id', NEW.user_id,
      'assigned_by', NEW.assigned_by,
      'entity_type', 'task',
      'entity_id', NEW.task_id,
      'tab', 'tasks',
      'deep_link', '/trip/' || v_trip_id || '?tab=tasks',
      'fanout_event_key', v_event_key
    ),
    false,
    true
  )
  ON CONFLICT (user_id, type, fanout_event_key)
    WHERE fanout_event_key IS NOT NULL
    DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notify_on_task_assignment() IS
  'Notify ONLY the assignee on task_assignments INSERT. Gated by tasks preference + per-trip mute. Does not fan out to other trip members.';
