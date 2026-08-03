-- B6: undo_calendar_import_batch bypassed the Pro/Event calendar-management gate.
-- It authorized any active member OR the trip creator, so on a Pro/Event trip any attendee
-- could call it (with force_delete_edited) and wipe the entire shared schedule — reopening the
-- hole that 20260723140000 closed for direct DELETEs. Replace the ad-hoc membership/creator
-- check with can_manage_trip_calendar(), which enforces: consumer = any active member;
-- pro/event = creator, admin, or a coordinator with the shared-calendar capability.
--
-- CREATE OR REPLACE preserves the signature and the rest of the body verbatim; only the
-- authorization block changes. This strictly tightens access (never widens it).

CREATE OR REPLACE FUNCTION public.undo_calendar_import_batch(
  p_batch_id uuid,
  p_force_delete_edited boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid UUID := auth.uid();
  v_batch public.calendar_import_batches%ROWTYPE;
  v_reverted INTEGER := 0;
  v_conflicted INTEGER := 0;
  v_already_gone INTEGER := 0;
  v_remaining INTEGER := 0;
  v_event RECORD;
  v_snapshot JSONB;
  v_matches BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_batch
  FROM public.calendar_import_batches
  WHERE id = p_batch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Import batch not found';
  END IF;

  -- Trip-type-aware authorization: consumer = any active member; pro/event = creator/admin/
  -- coordinator. Mirrors the trip_events DELETE RLS so an ordinary attendee cannot wipe a
  -- shared schedule via this SECURITY DEFINER path.
  IF NOT public.can_manage_trip_calendar(v_uid, v_batch.trip_id::text) THEN
    RAISE EXCEPTION 'Not authorized to undo this import';
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_remaining
  FROM public.trip_events
  WHERE import_batch_id = p_batch_id
    AND trip_id = v_batch.trip_id;

  -- Only treat as repeat-safe no-op when status is reverted AND no events remain.
  IF v_batch.status = 'reverted' AND v_remaining = 0 THEN
    RETURN jsonb_build_object(
      'batch_id', v_batch.id,
      'status', 'reverted',
      'reverted', COALESCE(v_batch.events_reverted, 0),
      'conflicted', COALESCE(v_batch.events_conflicted, 0),
      'already_gone', 0,
      'repeat_safe', true
    );
  END IF;

  FOR v_event IN
    SELECT id, title, start_time, end_time, location, description, source_data
    FROM public.trip_events
    WHERE import_batch_id = p_batch_id
      AND trip_id = v_batch.trip_id
  LOOP
    v_snapshot := COALESCE(v_event.source_data -> 'import_snapshot', '{}'::jsonb);
    v_matches :=
      COALESCE(v_event.title, '') = COALESCE(v_snapshot ->> 'title', v_event.title, '')
      AND COALESCE(v_event.start_time::text, '') = COALESCE(v_snapshot ->> 'start_time', v_event.start_time::text, '')
      AND COALESCE(v_event.end_time::text, '') = COALESCE(v_snapshot ->> 'end_time', COALESCE(v_event.end_time::text, ''))
      AND COALESCE(v_event.location, '') = COALESCE(v_snapshot ->> 'location', COALESCE(v_event.location, ''));

    IF v_matches OR p_force_delete_edited THEN
      DELETE FROM public.trip_events
      WHERE id = v_event.id
        AND trip_id = v_batch.trip_id;
      v_reverted := v_reverted + 1;
    ELSE
      v_conflicted := v_conflicted + 1;
    END IF;
  END LOOP;

  v_already_gone := GREATEST(v_remaining - (v_reverted + v_conflicted), 0);

  UPDATE public.calendar_import_batches
  SET
    status = 'reverted',
    events_reverted = v_reverted,
    events_conflicted = v_conflicted,
    reverted_at = now()
  WHERE id = p_batch_id;

  RETURN jsonb_build_object(
    'batch_id', p_batch_id,
    'status', 'reverted',
    'reverted', v_reverted,
    'conflicted', v_conflicted,
    'already_gone', v_already_gone,
    'repeat_safe', true
  );
END;
$function$;
