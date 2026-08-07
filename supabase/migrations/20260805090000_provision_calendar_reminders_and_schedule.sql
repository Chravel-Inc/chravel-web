-- Provision the calendar-reminders pipeline and schedule its drain.
--
-- WHY: the event-reminders edge function (deployed, config'd verify_jwt=false,
-- guarded by CRON_SECRET via _shared/cronGuard.ts) drains a calendar_reminders
-- queue that has NEVER existed in production — its defining migration
-- (20260214103000_sms_delivery_architecture.sql) declared trip_id UUID against
-- trips.id TEXT so it could never apply, and the cron job that was supposed to
-- fire the function sent the wrong auth header (x-notification-secret vs the
-- expected x-cron-secret) and was never scheduled anyway. Net effect: event
-- reminders have never fired for anyone.
--
-- This migration extracts ONLY the reminder pipeline from that old
-- multi-purpose SMS file (SMS itself was removed 2026-07-30), corrected:
--   - trip_id is TEXT (matches live trips.id / trip_events.trip_id)
--   - member fan-out targets ACTIVE members only (status IS NULL OR 'active'),
--     matching the former-member hardening pass
--   - cron uses the Bearer service-role pattern proven by
--     chravel-process-account-deletions, at */5 (the 3h/1h/15m reminder types
--     imply a high-frequency drain; the function limits 250/run)
--
-- Idempotent throughout.

CREATE TABLE IF NOT EXISTS public.calendar_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.trip_events(id) ON DELETE CASCADE,
  trip_id TEXT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('3h', '1h', '15m')),
  reminder_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, recipient_user_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_reminders_due
ON public.calendar_reminders(reminder_at, sent_at)
WHERE sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_reminders_user
ON public.calendar_reminders(recipient_user_id, reminder_at DESC);

-- Recipients may read their own reminders; all writes go through the
-- SECURITY DEFINER sync triggers and the service-role edge function.
ALTER TABLE public.calendar_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own calendar reminders" ON public.calendar_reminders;
CREATE POLICY "Users can view own calendar reminders"
  ON public.calendar_reminders
  FOR SELECT
  TO authenticated
  USING (recipient_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.set_calendar_reminder_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_calendar_reminders_updated_at ON public.calendar_reminders;
CREATE TRIGGER trigger_calendar_reminders_updated_at
  BEFORE UPDATE ON public.calendar_reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_calendar_reminder_updated_at();

-- Reminder policy: single next reminder per (event, user), coarsest first.
CREATE OR REPLACE FUNCTION public.compute_calendar_reminder_schedule(
  p_event_start TIMESTAMPTZ,
  p_reference TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(reminder_at TIMESTAMPTZ, reminder_type TEXT)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  IF p_event_start IS NULL OR p_event_start <= p_reference THEN
    RETURN;
  END IF;

  IF (p_event_start - p_reference) >= INTERVAL '3 hours' THEN
    reminder_at := p_event_start - INTERVAL '3 hours';
    reminder_type := '3h';
  ELSIF (p_event_start - p_reference) >= INTERVAL '1 hour' THEN
    reminder_at := p_event_start - INTERVAL '1 hour';
    reminder_type := '1h';
  ELSE
    reminder_at := GREATEST(p_event_start - INTERVAL '15 minutes', p_reference);
    reminder_type := '15m';
  END IF;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.compute_calendar_reminder_schedule(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon;

-- Keep calendar_reminders synchronized with trip_events.
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
      -- Demo-seeded trips carry member rows for synthetic users that do not
      -- exist in auth.users; the FK would reject them.
      AND EXISTS (SELECT 1 FROM auth.users au WHERE au.id = tm.user_id)
  LOOP
    INSERT INTO public.calendar_reminders (
      event_id,
      trip_id,
      recipient_user_id,
      reminder_type,
      reminder_at
    )
    VALUES (
      NEW.id,
      NEW.trip_id,
      v_member.user_id,
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

DROP TRIGGER IF EXISTS trigger_sync_event_calendar_reminders ON public.trip_events;
CREATE TRIGGER trigger_sync_event_calendar_reminders
  AFTER INSERT OR UPDATE OF start_time, include_in_itinerary, trip_id
  ON public.trip_events
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_event_calendar_reminders();

-- Keep reminders in sync when members are added/removed.
CREATE OR REPLACE FUNCTION public.sync_member_calendar_reminders()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event RECORD;
  v_schedule RECORD;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.calendar_reminders
    WHERE trip_id = OLD.trip_id
      AND recipient_user_id = OLD.user_id
      AND sent_at IS NULL;
    RETURN OLD;
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
    DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_member_calendar_reminders_insert ON public.trip_members;
CREATE TRIGGER trigger_sync_member_calendar_reminders_insert
  AFTER INSERT ON public.trip_members
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_member_calendar_reminders();

DROP TRIGGER IF EXISTS trigger_sync_member_calendar_reminders_delete ON public.trip_members;
CREATE TRIGGER trigger_sync_member_calendar_reminders_delete
  AFTER DELETE ON public.trip_members
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_member_calendar_reminders();

-- Backfill reminders for existing future events (active members only).
INSERT INTO public.calendar_reminders (
  event_id,
  trip_id,
  recipient_user_id,
  reminder_type,
  reminder_at
)
SELECT
  e.id,
  e.trip_id,
  tm.user_id,
  CASE
    WHEN (e.start_time - NOW()) >= INTERVAL '3 hours' THEN '3h'
    WHEN (e.start_time - NOW()) >= INTERVAL '1 hour' THEN '1h'
    ELSE '15m'
  END AS reminder_type,
  CASE
    WHEN (e.start_time - NOW()) >= INTERVAL '3 hours' THEN e.start_time - INTERVAL '3 hours'
    WHEN (e.start_time - NOW()) >= INTERVAL '1 hour' THEN e.start_time - INTERVAL '1 hour'
    ELSE GREATEST(e.start_time - INTERVAL '15 minutes', NOW())
  END AS reminder_at
FROM public.trip_events e
JOIN public.trip_members tm
  ON tm.trip_id = e.trip_id
  AND (tm.status IS NULL OR tm.status = 'active')
JOIN auth.users au ON au.id = tm.user_id
WHERE e.start_time > NOW()
  AND COALESCE(e.include_in_itinerary, TRUE) = TRUE
ON CONFLICT (event_id, recipient_user_id) DO NOTHING;

-- Schedule the drain: every 5 minutes, Bearer service-role auth (the header
-- form _shared/cronGuard.ts accepts alongside x-cron-secret).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
    RAISE NOTICE 'cron schema not available; skipping event-reminders schedule.';
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'chravel-event-reminders') THEN
    PERFORM cron.unschedule('chravel-event-reminders');
  END IF;

  PERFORM cron.schedule(
    'chravel-event-reminders',
    '*/5 * * * *',
    $cron$
    SELECT net.http_post(
      url := 'https://jmjiyekmxwsxkfnqwyaa.supabase.co/functions/v1/event-reminders',
      headers := ('{"Content-Type":"application/json","Authorization":"Bearer ' ||
                  current_setting('app.settings.service_role_key', true) || '"}')::jsonb,
      body := '{}'::jsonb
    );
    $cron$
  );
END $$;
