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
--
-- should_send_notification is restored to the 20260709 contract (DEFAULT
-- 'in_app', mentions/chat aliases, sms always false) — do NOT use DEFAULT
-- 'push' (that regressed in-app creation gating; see 20260708120000).

-- Cancel leftover queued/processing SMS rows when the prod-shaped schema exists.
-- Repo migration history uses status enum without 'cancelled' and column `error`
-- (not error_message). Guard so fresh `db reset` does not fail parse/apply.
DO $$
BEGIN
  IF to_regclass('public.notification_deliveries') IS NULL THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'notification_delivery_status'
      AND e.enumlabel = 'cancelled'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notification_deliveries'
      AND column_name = 'error_message'
  ) THEN
    UPDATE public.notification_deliveries
    SET
      status = 'cancelled'::public.notification_delivery_status,
      error_message = COALESCE(error_message, 'sms_channel_removed'),
      updated_at = NOW()
    WHERE channel = 'sms'
      AND status::text IN ('queued', 'processing');
  END IF;
END $$;

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

-- Drop SMS preference columns first so should_send cannot read them.
ALTER TABLE public.notification_preferences
  DROP COLUMN IF EXISTS sms_enabled,
  DROP COLUMN IF EXISTS sms_phone_number,
  DROP COLUMN IF EXISTS sms_sent_today,
  DROP COLUMN IF EXISTS last_sms_reset_date;

-- Recreate should_send_notification with the post-20260709 contract
-- (DEFAULT in_app; mentions/chat aliases; sms always false).
CREATE OR REPLACE FUNCTION public.should_send_notification(
  p_user_id uuid,
  p_notification_type text,
  p_channel text DEFAULT 'in_app'::text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_prefs RECORD;
  v_type_enabled BOOLEAN;
  v_channel_enabled BOOLEAN;
BEGIN
  SELECT * INTO v_prefs
  FROM notification_preferences
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    IF p_channel IN ('push', 'email', 'sms') THEN
      IF p_channel = 'sms' THEN
        RETURN false;
      END IF;
      RETURN true;
    END IF;
    IF p_notification_type IN ('chat', 'chat_messages', 'messages') THEN
      RETURN false;
    END IF;
    RETURN true;
  END IF;

  CASE p_channel
    WHEN 'in_app' THEN
      v_channel_enabled := true;
    WHEN 'push' THEN
      v_channel_enabled := COALESCE(v_prefs.push_enabled, true);
    WHEN 'email' THEN
      v_channel_enabled := COALESCE(v_prefs.email_enabled, false);
    WHEN 'sms' THEN
      v_channel_enabled := false;
    ELSE
      v_channel_enabled := true;
  END CASE;

  IF NOT v_channel_enabled THEN
    RETURN false;
  END IF;

  CASE p_notification_type
    WHEN 'broadcasts', 'broadcast' THEN v_type_enabled := v_prefs.broadcasts;
    WHEN 'mentions', 'mention' THEN v_type_enabled := COALESCE(v_prefs.mentions, true);
    WHEN 'chat', 'chat_messages', 'messages' THEN
      v_type_enabled := v_prefs.chat_messages;
    WHEN 'tasks', 'task' THEN v_type_enabled := v_prefs.tasks;
    WHEN 'payments', 'payment' THEN v_type_enabled := v_prefs.payments;
    WHEN 'calendar', 'calendar_events', 'event' THEN v_type_enabled := v_prefs.calendar_events;
    WHEN 'polls', 'poll' THEN v_type_enabled := v_prefs.polls;
    WHEN 'join_requests', 'join_request' THEN v_type_enabled := v_prefs.join_requests;
    WHEN 'trip_invites', 'trip_invite', 'invite' THEN v_type_enabled := v_prefs.trip_invites;
    WHEN 'basecamp_updates', 'basecamp' THEN v_type_enabled := v_prefs.basecamp_updates;
    ELSE v_type_enabled := true;
  END CASE;

  RETURN COALESCE(v_type_enabled, true);
END;
$function$;
