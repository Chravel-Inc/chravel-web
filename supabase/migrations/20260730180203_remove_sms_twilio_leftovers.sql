-- Finish Twilio/SMS removal that never landed in production.
--
-- Context: application code already stopped sending SMS (push + email + in-app
-- only). Migration 20260604120000_remove_sms_notifications.sql exists in the
-- repo but was never applied to ChravelApp — sms_* columns and helper RPCs
-- remain. This migration is idempotent and completes the teardown.
--
-- No-regressions: does not touch trips, trip_members, auth, payment tables, or
-- trip RLS. Fan-out is already push-only in production.
--
-- CHECK constraints on notification_deliveries.channel / notification_logs.type
-- stay widened (may still list 'sms') so historical rows do not fail. Nothing
-- produces new sms deliveries once the fan-out is push-only.

-- Cancel any leftover queued/processing SMS rows (audit history preserved).
-- Prod status enum: queued | processing | sent | failed | cancelled (no 'skipped').
UPDATE public.notification_deliveries
SET
  status = 'cancelled'::public.notification_delivery_status,
  error_message = COALESCE(error_message, 'sms_channel_removed'),
  updated_at = NOW()
WHERE channel = 'sms'
  AND status::text IN ('queued', 'processing');

-- Drop SMS entitlement enforcement if still present.
DROP TRIGGER IF EXISTS trigger_enforce_sms_entitlement ON public.notification_preferences;
DROP FUNCTION IF EXISTS public.enforce_sms_entitlement_on_preferences();
DROP FUNCTION IF EXISTS public.is_user_sms_entitled(UUID);

-- Drop SMS rate-limit helpers.
DROP FUNCTION IF EXISTS public.check_sms_rate_limit(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.increment_sms_counter(UUID);

-- Drop SMS compliance table if present.
DROP TABLE IF EXISTS public.sms_opt_in;

-- Drop phone validator used only by SMS prefs.
ALTER TABLE public.notification_preferences
  DROP CONSTRAINT IF EXISTS valid_sms_phone_number;
DROP FUNCTION IF EXISTS public.validate_phone_number(TEXT);

-- Recreate should_send_notification so it no longer reads sms_* columns.
CREATE OR REPLACE FUNCTION public.should_send_notification(
  p_user_id uuid,
  p_notification_type text,
  p_channel text DEFAULT 'push'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefs RECORD;
  v_type_enabled BOOLEAN;
  v_channel_enabled BOOLEAN;
BEGIN
  SELECT * INTO v_prefs
  FROM notification_preferences
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    IF p_channel = 'sms' THEN
      RETURN false;
    END IF;
    RETURN true;
  END IF;

  CASE p_channel
    WHEN 'push' THEN v_channel_enabled := v_prefs.push_enabled;
    WHEN 'email' THEN v_channel_enabled := v_prefs.email_enabled;
    WHEN 'sms' THEN v_channel_enabled := false; -- SMS / Twilio removed
    ELSE v_channel_enabled := true;
  END CASE;

  IF NOT v_channel_enabled THEN
    RETURN false;
  END IF;

  CASE p_notification_type
    WHEN 'broadcasts' THEN v_type_enabled := v_prefs.broadcasts;
    WHEN 'chat_messages', 'messages' THEN v_type_enabled := v_prefs.chat_messages;
    WHEN 'tasks' THEN v_type_enabled := v_prefs.tasks;
    WHEN 'payments' THEN v_type_enabled := v_prefs.payments;
    WHEN 'calendar', 'calendar_events' THEN v_type_enabled := v_prefs.calendar_events;
    WHEN 'polls' THEN v_type_enabled := v_prefs.polls;
    WHEN 'join_requests' THEN v_type_enabled := v_prefs.join_requests;
    WHEN 'trip_invites' THEN v_type_enabled := v_prefs.trip_invites;
    WHEN 'basecamp_updates' THEN v_type_enabled := v_prefs.basecamp_updates;
    ELSE v_type_enabled := true;
  END CASE;

  RETURN COALESCE(v_type_enabled, true);
END;
$$;

-- Drop SMS preference columns.
ALTER TABLE public.notification_preferences
  DROP COLUMN IF EXISTS sms_enabled,
  DROP COLUMN IF EXISTS sms_phone_number,
  DROP COLUMN IF EXISTS sms_sent_today,
  DROP COLUMN IF EXISTS last_sms_reset_date;
