-- ============================================================================
-- Fix broadcast notification fanout: trigger was attached to the wrong table
-- with the wrong column references.
--
-- Root cause (docs/research/synthetic-user-testing/REPORT.md §5 C3):
--   20260512160000_canonical_trip_notification_fanout.sql attached
--   trigger_notify_broadcast to public.trip_broadcasts — a table no migration
--   creates and which is absent from production (not in generated types).
--   The app writes broadcasts to public.broadcasts
--   (src/services/broadcastService.ts, src/services/unifiedMessagingService.ts),
--   whose schema is: trip_id TEXT, created_by UUID, message TEXT,
--   priority TEXT, is_sent BOOLEAN, scheduled_for TIMESTAMPTZ, metadata JSONB.
--   There is no `title` and no `content` column, yet the canonical
--   notify_on_broadcast() referenced NEW.title / NEW.content.
--
-- Failure modes this migration corrects:
--   1. On databases lacking trip_broadcasts (production), 20260512160000
--      errored at the trip_broadcasts statements, so NONE of the canonical
--      fanout ever applied there (notifications.fanout_event_key and
--      create_notification_for_trip_members are absent from generated types).
--      This migration therefore idempotently (re)creates that infrastructure.
--   2. On any database where 20260512160000 DID apply, the pre-existing
--      trigger_notify_broadcast ON public.broadcasts (from 20251114220642)
--      now executes the canonical body, and every broadcast INSERT aborts at
--      runtime with `record "new" has no field "title"`. This migration
--      replaces the body with correct column references.
--   3. The canonical create_notification_for_trip_members used
--      `ON CONFLICT (user_id, type, fanout_event_key) DO NOTHING` against a
--      PARTIAL unique index. Postgres only infers a partial unique index when
--      the conflict target carries the matching predicate, so every fanout
--      insert would have failed with 42P10. The predicate is added below;
--      dedup semantics are otherwise unchanged.
--
-- Semantics preserved from the canonical implementation (20260512160000):
-- actor exclusion, membership iteration over trip_members, preference gating
-- via should_send_notification, deterministic per-recipient idempotency keys,
-- and ON CONFLICT DO NOTHING dedup. This is a retarget + reference fix, not a
-- fanout redesign.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Canonical idempotency infrastructure (no-op where 20260512160000 applied)
-- ----------------------------------------------------------------------------

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS fanout_event_key TEXT
  GENERATED ALWAYS AS ((metadata->>'fanout_event_key')) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_user_type_fanout_event_key_uidx
  ON public.notifications (user_id, type, fanout_event_key)
  WHERE fanout_event_key IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 2) Canonical fanout function (verbatim copy of 20260512160000 except the
--    ON CONFLICT partial-index predicate fix described in the header)
-- ----------------------------------------------------------------------------

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

-- ----------------------------------------------------------------------------
-- 3) Broadcast wrapper with correct column references for public.broadcasts
--    (content column is `message`; there is no `title`; trip_id is TEXT)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notify_on_broadcast()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip_uuid UUID;
BEGIN
  -- broadcasts.trip_id is TEXT; demo/mock trips can carry non-UUID ids.
  -- A notification fanout must never abort the broadcast INSERT itself,
  -- so skip fanout (instead of raising) when trip_id is not a UUID.
  BEGIN
    v_trip_uuid := NEW.trip_id::uuid;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN NEW;
  END;

  PERFORM public.create_notification_for_trip_members(
    v_trip_uuid,
    NEW.created_by,
    'broadcast',
    'broadcast',
    NEW.id,
    'broadcasts',
    COALESCE(NEW.priority, 'normal'),
    '/trip/' || NEW.trip_id || '?tab=broadcasts',
    'New broadcast',
    LEFT(COALESCE(NEW.message, ''), 140),
    jsonb_build_object('broadcast_id', NEW.id),
    'broadcast:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notify_on_broadcast IS
  'Canonical broadcast notification fanout for public.broadcasts (message/created_by/priority columns; TEXT trip_id). Routes through create_notification_for_trip_members.';

-- ----------------------------------------------------------------------------
-- 4) Re-attach the trigger to the table the app actually writes to
-- ----------------------------------------------------------------------------

-- Remove the misplaced trigger if a trip_broadcasts table exists anywhere
-- (DROP TRIGGER IF EXISTS still errors when the TABLE is missing, so guard it).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'trip_broadcasts'
  ) THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trigger_notify_broadcast ON public.trip_broadcasts';
  END IF;
END $$;

DROP TRIGGER IF EXISTS trigger_notify_broadcast ON public.broadcasts;
CREATE TRIGGER trigger_notify_broadcast
  AFTER INSERT ON public.broadcasts
  FOR EACH ROW
  -- Preserve the pre-canonical gate (20251114220642): scheduled-but-unsent
  -- broadcasts must not notify at INSERT time.
  WHEN (NEW.is_sent = TRUE OR NEW.scheduled_for IS NULL)
  EXECUTE FUNCTION public.notify_on_broadcast();
