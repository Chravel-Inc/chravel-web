-- Settings: enforce Quiet Hours + fix a broken 'mentions' branch.
--
-- 1) QUIET HOURS (P2). ConsumerNotificationsSection writes quiet_hours_enabled / quiet_start /
--    quiet_end / timezone, but should_send_notification (the canonical server-side delivery gate)
--    never read them, so users who enabled Quiet Hours still received notifications around the
--    clock — the setting was a false promise.
--    Suppress only the interruptive channels (push, email) inside the window. 'in_app' is a passive
--    feed the user pulls when they open the app; suppressing it would silently drop notifications
--    from history rather than merely deferring an interruption.
--    Fails OPEN: a malformed time or timezone string must never swallow notifications.
--
-- 2) BROKEN 'mentions' BRANCH (live bug found while verifying the above). The function assigned
--    COALESCE(v_prefs.mentions, true), but notification_preferences has no `mentions` column (it has
--    `mentions_only`, which is a *filter mode*, not an enable flag). Reading an undefined field of a
--    RECORD raises 42703, so should_send_notification(uid, 'mentions', ...) threw for every user
--    holding a preferences row — verified against production:
--        ERROR: record "v_prefs" has no field "mentions"
--    Mentions have no dedicated opt-out column, so they are always allowed once the channel gate
--    passes. (Deliberately NOT mapped to mentions_only, which means "limit chat notifications to
--    mentions" and would invert the intent.)
--
-- NOTE: this body is copied verbatim from the live definition and extended; this function must
-- always be replaced from the latest body, never an older copy.

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

  -- Quiet hours: suppress interruptive channels inside the user's local quiet window.
  IF p_channel IN ('push', 'email')
     AND COALESCE(v_prefs.quiet_hours_enabled, false)
     AND NULLIF(v_prefs.quiet_start, '') IS NOT NULL
     AND NULLIF(v_prefs.quiet_end, '') IS NOT NULL
  THEN
    DECLARE
      v_now_local TIME;
      v_quiet_start TIME;
      v_quiet_end TIME;
    BEGIN
      v_now_local := (now() AT TIME ZONE COALESCE(NULLIF(v_prefs.timezone, ''), 'UTC'))::time;
      v_quiet_start := v_prefs.quiet_start::time;
      v_quiet_end := v_prefs.quiet_end::time;

      IF v_quiet_start = v_quiet_end THEN
        -- Degenerate window (zero length) — treat as quiet hours disabled.
        NULL;
      ELSIF v_quiet_start < v_quiet_end THEN
        -- Same-day window, e.g. 09:00 -> 17:00
        IF v_now_local >= v_quiet_start AND v_now_local < v_quiet_end THEN
          RETURN false;
        END IF;
      ELSE
        -- Overnight window, e.g. 22:00 -> 08:00
        IF v_now_local >= v_quiet_start OR v_now_local < v_quiet_end THEN
          RETURN false;
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Bad time/timezone data must not block delivery.
      NULL;
    END;
  END IF;

  CASE p_notification_type
    WHEN 'broadcasts', 'broadcast' THEN v_type_enabled := v_prefs.broadcasts;
    -- No `mentions` column exists; mentions are always allowed once the channel gate passes.
    WHEN 'mentions', 'mention' THEN v_type_enabled := true;
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
