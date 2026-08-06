-- Fix: former members kept receiving event reminders after leave_trip().
--
-- leave_trip() (20260705182923) soft-deletes membership: it sets
-- trip_members.status = 'left' and leaves the row in place (so trip
-- history/roster stays intact). sync_member_calendar_reminders() only ran on
-- INSERT and DELETE, so a status transition to 'left' never cleared the
-- member's pending calendar_reminders rows — event-reminders would go on
-- notifying a departed member with the event title, trip name, and start
-- time until the reminder's scheduled fire time passed. Caught by review on
-- PR #888.
--
-- Fix: extend sync_member_calendar_reminders() to also handle
-- UPDATE OF status — delete unsent reminders when a member goes inactive,
-- and fan out reminders when a member becomes active again (rejoin), mirroring
-- the existing INSERT/DELETE branches. Idempotent (CREATE OR REPLACE +
-- DROP TRIGGER IF EXISTS / CREATE TRIGGER).

CREATE OR REPLACE FUNCTION public.sync_member_calendar_reminders()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event RECORD;
  v_schedule RECORD;
  v_was_active BOOLEAN;
  v_is_active BOOLEAN;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.calendar_reminders
    WHERE trip_id = OLD.trip_id
      AND recipient_user_id = OLD.user_id
      AND sent_at IS NULL;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    v_was_active := (OLD.status IS NULL OR OLD.status = 'active');
    v_is_active := (NEW.status IS NULL OR NEW.status = 'active');

    IF v_was_active AND NOT v_is_active THEN
      -- Member just went inactive (e.g. leave_trip() sets status='left').
      -- Clear any reminders not yet sent so they stop receiving event details
      -- for a trip they can no longer see.
      DELETE FROM public.calendar_reminders
      WHERE trip_id = NEW.trip_id
        AND recipient_user_id = NEW.user_id
        AND sent_at IS NULL;
      RETURN NEW;
    ELSIF NOT v_was_active AND v_is_active THEN
      -- Member rejoined; fall through to the same fan-out as INSERT below.
      NULL;
    ELSE
      -- No active-state transition (e.g. some other column changed under
      -- UPDATE OF status due to a no-op write) — nothing to do.
      RETURN NEW;
    END IF;
  END IF;

  -- Synthetic demo members have no auth.users row; skip (FK would reject).
  IF NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = NEW.user_id) THEN
    RETURN NEW;
  END IF;

  FOR v_event IN
    SELECT id, trip_id, start_time, include_in_itinerary
    FROM public.trip_events
    WHERE trip_id = NEW.trip_id
      AND start_time > NOW()
      AND COALESCE(include_in_itinerary, TRUE) = TRUE
  LOOP
    SELECT * INTO v_schedule
    FROM public.compute_calendar_reminder_schedule(v_event.start_time, NOW());

    IF v_schedule.reminder_at IS NULL THEN
      CONTINUE;
    END IF;

    INSERT INTO public.calendar_reminders (
      event_id,
      trip_id,
      recipient_user_id,
      reminder_type,
      reminder_at
    )
    VALUES (
      v_event.id,
      v_event.trip_id,
      NEW.user_id,
      v_schedule.reminder_type,
      v_schedule.reminder_at
    )
    ON CONFLICT (event_id, recipient_user_id)
    DO UPDATE SET
      reminder_type = EXCLUDED.reminder_type,
      reminder_at = EXCLUDED.reminder_at,
      updated_at = NOW()
    WHERE public.calendar_reminders.sent_at IS NULL;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_member_calendar_reminders_update ON public.trip_members;
CREATE TRIGGER trigger_sync_member_calendar_reminders_update
  AFTER UPDATE OF status ON public.trip_members
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.sync_member_calendar_reminders();
