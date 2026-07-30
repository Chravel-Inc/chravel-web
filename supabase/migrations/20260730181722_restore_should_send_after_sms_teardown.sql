-- Restore should_send_notification after SMS leftovers teardown.
--
-- 20260730180203 (as first applied on ChravelApp) recreated this function from
-- an older pre-20260708 body: DEFAULT p_channel='push' and missing in_app /
-- mentions / chat aliases. That made 2-arg fan-out callers treat push_enabled as
-- an in-app creation gate — the bug fixed in 20260708120000 / 20260709120000.
--
-- This migration restores the 20260709120000 contract. SMS stays disabled.
-- Idempotent. Does not touch trips, trip_members, auth, payment tables, or RLS.

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
    -- No prefs row: plain chat defaults off, everything else (incl. mentions) on.
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
      v_channel_enabled := false; -- Twilio / SMS notifications removed
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
