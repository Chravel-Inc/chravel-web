-- RPC actor-authorization hardening (2026-07-23)
--
-- Deep audit of SECURITY DEFINER RPCs that take a user_id / act on a trip found three
-- issues where the function trusted a parameter instead of the authenticated actor:
--
-- 1. update_trip_basecamp_with_version had NO authorization check whatsoever. Being
--    SECURITY DEFINER it bypasses RLS, so ANY authenticated caller could relocate ANY
--    trip's basecamp (name/address/coordinates) by passing its trip_id, and the
--    unvalidated p_user_id was written to the change log. The intended model is
--    client-side only today (useTripBasecamp.ts: "pro/event trips restrict basecamp to
--    admins/organizers") and was therefore trivially bypassable by calling the RPC
--    directly. Enforce it server-side: consumer = any active member; pro/event = trip
--    owner / admin / coordinator. The actor is auth.uid(); p_user_id is ignored for auth.
--    (Version-conflict logic is preserved verbatim to avoid any behavior change.)
--
-- 2. mark_broadcast_viewed inserted a read-receipt for an arbitrary p_user_id with no
--    check — a caller could forge "viewed" receipts for other users. Enforce self.
--
-- 3. increment_sms_counter / check_sms_rate_limit / is_user_sms_entitled read or mutate
--    another user's SMS quota/entitlement by user_id with no actor check. They have no
--    client or edge TS caller (server-internal helpers), so restrict EXECUTE to
--    service_role by revoking anon + authenticated.
--
-- These only tighten authorization — no Trip-Not-Found, auth desync, RLS read leak, or
-- payment drift. REVERSAL: CREATE OR REPLACE the prior bodies / re-GRANT EXECUTE.

-- 1. Basecamp update: enforce trip-type-aware authorization ---------------------
CREATE OR REPLACE FUNCTION public.update_trip_basecamp_with_version(
  p_trip_id text, p_current_version integer, p_name text, p_address text,
  p_latitude double precision, p_longitude double precision, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_current_version INTEGER;
  v_new_version INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  -- Actor authorization (previously absent). Consumer = any active member;
  -- pro/event = trip owner / admin / coordinator only. p_user_id is NOT trusted.
  IF NOT EXISTS (
    SELECT 1
    FROM public.trips t
    WHERE t.id = p_trip_id
      AND public.is_active_trip_member(v_uid, p_trip_id)
      AND (
        COALESCE(t.trip_type, 'consumer') = 'consumer'
        OR t.created_by = v_uid
        OR public.is_trip_admin(v_uid, p_trip_id)
        OR public.is_trip_coordinator(v_uid, p_trip_id)
      )
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'NOT_AUTHORIZED',
      'message', 'You do not have permission to change the basecamp for this trip'
    );
  END IF;

  -- Version-conflict logic preserved verbatim from the original definition.
  SELECT basecamp_version INTO v_current_version
  FROM trips
  WHERE id = p_trip_id
  FOR UPDATE;

  IF v_current_version != p_current_version THEN
    RETURN jsonb_build_object(
      'success', false,
      'conflict', true,
      'current_version', v_current_version,
      'message', 'Basecamp was modified by another user'
    );
  END IF;

  v_new_version := v_current_version + 1;

  UPDATE trips SET
    basecamp_name = p_name,
    basecamp_address = p_address,
    basecamp_latitude = p_latitude,
    basecamp_longitude = p_longitude,
    basecamp_version = v_new_version,
    updated_at = NOW()
  WHERE id = p_trip_id;

  -- Log with the authenticated actor, never the caller-supplied p_user_id.
  BEGIN
    PERFORM log_basecamp_change(
      p_trip_id, v_uid, 'trip', 'updated',
      NULL, NULL, NULL, NULL,
      p_name, p_address, p_latitude, p_longitude
    );
  EXCEPTION
    WHEN undefined_function THEN NULL;
  END;

  RETURN jsonb_build_object('success', true, 'new_version', v_new_version);
END;
$function$;

-- 2. Broadcast read-receipt: enforce self --------------------------------------
CREATE OR REPLACE FUNCTION public.mark_broadcast_viewed(p_broadcast_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: you can only mark broadcasts viewed for yourself';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'broadcast_views') THEN
    INSERT INTO broadcast_views (broadcast_id, user_id, viewed_at)
    VALUES (p_broadcast_id, p_user_id, NOW())
    ON CONFLICT (broadcast_id, user_id) DO NOTHING;
  END IF;
END;
$function$;

-- 3. SMS quota/entitlement helpers: service-role only --------------------------
REVOKE EXECUTE ON FUNCTION public.increment_sms_counter(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_sms_rate_limit(uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_user_sms_entitled(uuid) FROM anon, authenticated;
