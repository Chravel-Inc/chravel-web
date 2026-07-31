-- Role-targeted broadcast fanout (extends 20260715210000 generic alert copy).
-- When broadcasts.metadata.target_role_ids is a non-empty UUID array, notify only
-- members who hold one of those roles (user_trip_roles ∩ trip_members), gated by
-- should_send_notification('broadcasts'). Otherwise preserve the existing
-- all-members path via create_notification_for_trip_members.
--
-- Safety verification (chravel-no-regressions):
-- - Trip Not Found: no trip query/route/auth-hydration changes.
-- - Auth desync: no auth/session changes; SECURITY DEFINER trigger only.
-- - RLS leaks: role filter narrows recipients (still requires trip membership +
--   preference gate); never widens beyond prior all-member fanout.
-- - Payment drift: no payment/entitlement tables touched.
-- Preserves generic trip-scoped alert titles/bodies from 20260715210000
-- (no message snippet / PII in the Alerts panel).

CREATE OR REPLACE FUNCTION public.notify_on_broadcast()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip_uuid UUID;
  v_target_roles JSONB;
  v_role_ids UUID[];
  v_member RECORD;
  v_trip_name TEXT;
  v_event_key TEXT;
  v_title TEXT;
  v_message TEXT;
BEGIN
  BEGIN
    v_trip_uuid := NEW.trip_id::uuid;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN NEW;
  END;

  SELECT COALESCE(NULLIF(TRIM(t.name), ''), 'your trip')
    INTO v_trip_name
  FROM public.trips t
  WHERE t.id = NEW.trip_id;

  v_trip_name := COALESCE(v_trip_name, 'your trip');
  v_title := 'New broadcast in ' || v_trip_name;
  v_message :=
    'A new broadcast was posted in your ' ||
    CASE WHEN v_trip_name = 'your trip' THEN 'trip' ELSE v_trip_name || ' trip' END ||
    '.';

  v_target_roles := COALESCE(NEW.metadata->'target_role_ids', '[]'::jsonb);

  IF jsonb_typeof(v_target_roles) = 'array' AND jsonb_array_length(v_target_roles) > 0 THEN
    SELECT ARRAY_AGG(DISTINCT (value #>> '{}')::uuid)
      INTO v_role_ids
    FROM jsonb_array_elements(v_target_roles) AS t(value)
    WHERE (value #>> '{}') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

    IF v_role_ids IS NOT NULL AND cardinality(v_role_ids) > 0 THEN
      FOR v_member IN
        SELECT DISTINCT utr.user_id
        FROM public.user_trip_roles utr
        INNER JOIN public.trip_members tm
          ON tm.trip_id = utr.trip_id
         AND tm.user_id = utr.user_id
        WHERE utr.trip_id = NEW.trip_id
          AND utr.role_id = ANY (v_role_ids)
          AND utr.user_id IS NOT NULL
          AND utr.user_id IS DISTINCT FROM NEW.created_by
          AND NOT COALESCE(tm.notifications_muted, false)
      LOOP
        IF public.should_send_notification(v_member.user_id, 'broadcasts') THEN
          v_event_key := 'broadcast:' || NEW.id::text || ':' || v_member.user_id::text;

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
            v_trip_uuid,
            'broadcast',
            v_title,
            v_message,
            jsonb_build_object(
              'broadcast_id', NEW.id,
              'tab', 'broadcasts',
              'trip_id', NEW.trip_id,
              'trip_name', v_trip_name,
              'actor_user_id', NEW.created_by,
              'entity_type', 'broadcast',
              'entity_id', NEW.id,
              'priority', COALESCE(NEW.priority, 'normal'),
              'deep_link', '/trip/' || NEW.trip_id || '?tab=broadcasts',
              'target_role_ids', v_target_roles,
              'fanout_event_key', v_event_key
            ),
            false,
            true
          )
          ON CONFLICT (user_id, type, fanout_event_key)
            WHERE fanout_event_key IS NOT NULL
            DO NOTHING;
        END IF;
      END LOOP;

      RETURN NEW;
    END IF;
  END IF;

  PERFORM public.create_notification_for_trip_members(
    NEW.trip_id,
    NEW.created_by,
    'broadcast',
    'broadcast',
    NEW.id,
    'broadcasts',
    COALESCE(NEW.priority, 'normal'),
    '/trip/' || NEW.trip_id || '?tab=broadcasts',
    v_title,
    v_message,
    jsonb_build_object('broadcast_id', NEW.id, 'tab', 'broadcasts'),
    'broadcast:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notify_on_broadcast() IS
  'Broadcast fanout with generic trip-scoped alert copy; role-scoped when metadata.target_role_ids is set.';
