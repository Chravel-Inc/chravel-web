-- Fix a stale-reminder leak in sync_event_calendar_reminders (20260805090000),
-- found in review before it could affect a real event: the trigger fires
-- AFTER UPDATE OF trip_id, but on the "still valid" branch it only fans
-- reminders OUT to the new trip's members — it never fanned unsent reminders
-- IN for members who belonged only to the OLD trip. If an event's trip_id is
-- ever reassigned, those members would keep a pending reminder pointed at an
-- event they can no longer see.
--
-- Not reachable via today's UI (event-edit forms always resubmit the modal's
-- own trip_id context, never a different one), but the trigger should be
-- correct regardless of caller discipline. Fix: after the fan-out, delete any
-- unsent reminder for this event whose recipient is no longer an active
-- member of NEW.trip_id.
--
-- Idempotent: CREATE OR REPLACE.

CREATE OR REPLACE FUNCTION public.sync_event_calendar_reminders()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schedule RECORD;
  v_member RECORD;
BEGIN
  IF NEW.start_time IS NULL
     OR NEW.start_time <= NOW()
     OR COALESCE(NEW.include_in_itinerary, TRUE) = FALSE THEN
    DELETE FROM public.calendar_reminders
    WHERE event_id = NEW.id
      AND sent_at IS NULL;
    RETURN NEW;
  END IF;

  SELECT * INTO v_schedule
  FROM public.compute_calendar_reminder_schedule(NEW.start_time, NOW());

  IF v_schedule.reminder_at IS NULL THEN
    DELETE FROM public.calendar_reminders
    WHERE event_id = NEW.id
      AND sent_at IS NULL;
    RETURN NEW;
  END IF;

  FOR v_member IN
    SELECT user_id
    FROM public.trip_members tm
    WHERE tm.trip_id = NEW.trip_id
      AND (tm.status IS NULL OR tm.status = 'active')
      AND EXISTS (SELECT 1 FROM auth.users au WHERE au.id = tm.user_id)
  LOOP
    INSERT INTO public.calendar_reminders (
      event_id, trip_id, recipient_user_id, reminder_type, reminder_at
    )
    VALUES (
      NEW.id, NEW.trip_id, v_member.user_id, v_schedule.reminder_type, v_schedule.reminder_at
    )
    ON CONFLICT (event_id, recipient_user_id)
    DO UPDATE SET
      trip_id = EXCLUDED.trip_id,
      reminder_type = EXCLUDED.reminder_type,
      reminder_at = EXCLUDED.reminder_at,
      updated_at = NOW()
    WHERE public.calendar_reminders.sent_at IS NULL;
  END LOOP;

  -- Drop unsent reminders for anyone no longer an active member of NEW.trip_id
  -- (covers trip_id reassignment; membership removal is also handled by
  -- sync_member_calendar_reminders, this is a defensive backstop for both).
  DELETE FROM public.calendar_reminders
  WHERE event_id = NEW.id
    AND sent_at IS NULL
    AND recipient_user_id NOT IN (
      SELECT tm.user_id
      FROM public.trip_members tm
      WHERE tm.trip_id = NEW.trip_id
        AND (tm.status IS NULL OR tm.status = 'active')
    );

  RETURN NEW;
END;
$$;
