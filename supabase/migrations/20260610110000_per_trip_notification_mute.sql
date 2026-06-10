-- ============================================================================
-- Per-trip notification mute (NOTIFICATION_AUDIT.md gap: preferences were
-- global-only; users in busy trips could only escape via OS-level mute, which
-- kills the whole channel).
--
--   1. trip_members.notifications_muted — per-membership mute flag.
--   2. set_trip_notifications_muted(p_trip_id, p_muted) — self-service RPC;
--      a member can mute/unmute only their OWN membership row.
--   3. create_notification_for_trip_members — re-created with a mute gate in
--      the member loop. Muting suppresses fanout at the single canonical choke
--      point, which also suppresses downstream push/email deliveries (those
--      are driven off notification rows). Body otherwise identical to
--      20260610090000_fix_broadcast_notification_fanout_table.sql.
--   4. Kill-switch feature flag for the UI toggle (CLAUDE.md feature-flag rule).
-- ============================================================================

-- 1) Per-membership mute flag
ALTER TABLE public.trip_members
  ADD COLUMN IF NOT EXISTS notifications_muted BOOLEAN NOT NULL DEFAULT false;

-- 2) Self-service mute RPC — callers can only mutate their own membership row
CREATE OR REPLACE FUNCTION public.set_trip_notifications_muted(
  p_trip_id UUID,
  p_muted BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID;
  v_updated INTEGER;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  UPDATE public.trip_members
     SET notifications_muted = COALESCE(p_muted, false),
         updated_at = now()
   WHERE trip_id = p_trip_id
     AND user_id = v_caller;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_A_MEMBER');
  END IF;

  RETURN jsonb_build_object('success', true, 'muted', COALESCE(p_muted, false));
END;
$$;

-- 3) Canonical fanout with the mute gate (body otherwise identical to
--    20260610090000; the only change is the notifications_muted predicate).
CREATE OR REPLACE FUNCTION public.create_notification_for_trip_members(
  p_trip_id UUID,
  p_actor_user_id UUID,
  p_notification_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_preference_key TEXT,
  p_priority TEXT DEFAULT 'normal',
  p_deep_link TEXT DEFAULT NULL,
  p_title TEXT DEFAULT NULL,
  p_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_event_key TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member RECORD;
  v_trip_name TEXT;
  v_inserted_count INTEGER := 0;
  v_event_key TEXT;
  v_effective_event_key TEXT;
  v_entity_id_text TEXT := COALESCE(p_entity_id::TEXT, 'none');
BEGIN
  IF p_trip_id IS NULL THEN
    RAISE EXCEPTION 'create_notification_for_trip_members requires p_trip_id';
  END IF;

  SELECT t.name INTO v_trip_name
  FROM public.trips t
  WHERE t.id = p_trip_id;

  -- Strong, deterministic idempotency key usable across trigger/webhook retries
  v_effective_event_key := COALESCE(
    p_event_key,
    CONCAT_WS(':', p_trip_id::TEXT, p_notification_type, p_entity_type, v_entity_id_text)
  );

  FOR v_member IN
    SELECT tm.user_id
    FROM public.trip_members tm
    WHERE tm.trip_id = p_trip_id
      AND tm.user_id IS NOT NULL
      AND NOT COALESCE(tm.notifications_muted, false)
      AND (p_actor_user_id IS NULL OR tm.user_id <> p_actor_user_id)
  LOOP
    -- Single-source membership + preference gate
    IF public.should_send_notification(v_member.user_id, p_preference_key) THEN
      v_event_key := CONCAT(v_effective_event_key, ':', v_member.user_id::TEXT);

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
        v_member.user_id,
        p_trip_id,
        p_notification_type,
        COALESCE(p_title, 'Trip update in ' || COALESCE(v_trip_name, 'your trip')),
        COALESCE(p_message, 'There is a new update.'),
        COALESCE(p_metadata, '{}'::jsonb)
          || jsonb_build_object(
            'trip_id', p_trip_id,
            'trip_name', v_trip_name,
            'actor_user_id', p_actor_user_id,
            'entity_type', p_entity_type,
            'entity_id', p_entity_id,
            'priority', COALESCE(p_priority, 'normal'),
            'deep_link', p_deep_link,
            'fanout_event_key', v_event_key
          ),
        false,
        true
      )
      -- Predicate is required for Postgres to infer the partial unique index
      -- notifications_user_type_fanout_event_key_uidx (fix for 42P10).
      ON CONFLICT (user_id, type, fanout_event_key)
        WHERE fanout_event_key IS NOT NULL
        DO NOTHING;

      IF FOUND THEN
        v_inserted_count := v_inserted_count + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN v_inserted_count;
END;
$$;

-- 4) Kill switch for the mute toggle UI (takes effect within the 60s client cache)
INSERT INTO public.feature_flags (key, enabled, description)
VALUES (
  'per_trip_notification_mute',
  true,
  'Per-trip notification mute toggle in trip options. Disable to hide the toggle (existing mutes keep suppressing fanout).'
)
ON CONFLICT (key) DO NOTHING;
