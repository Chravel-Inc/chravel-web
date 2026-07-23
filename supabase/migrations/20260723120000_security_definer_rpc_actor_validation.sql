-- SECURITY DEFINER RPC actor validation (fail-closed hardening)
--
-- Audit scope: every SECURITY DEFINER function in `public` that accepts a
-- user-identity parameter (p_user_id / _user_id / target_user_id /
-- requesting_user_id / _member_id). Each was checked for whether it re-derives
-- or verifies the actor against auth.uid(), or whether it blindly TRUSTS the
-- passed-in id and can therefore act on behalf of an arbitrary user.
--
-- Correctly guarded already (no change): vote_on_poll, vote_on_poll_batch,
--   remove_vote_from_poll, toggle_task_status, ensure_trip_membership (all
--   RAISE on auth.uid() <> p_user_id); the admin-action RPCs promote_to_admin,
--   demote_from_admin, assign_trip_role, assign_user_to_role,
--   remove_user_from_role, set_admin_scope, assign_org_seat, transfer_org_seat
--   (all gate the ACTOR, auth.uid(), as trip/org admin — the target being a
--   parameter is intentional); and the service_role-only helpers
--   create_notification, send_notification, create_notification_for_trip_members,
--   check_and_increment_smart_import_usage (not granted to anon/authenticated).
--
-- The functions below TRUSTED their id parameter while being reachable by
-- anon/authenticated. This migration makes each fail closed. All changes
-- preserve the exact function signatures (no generated-type drift) and the
-- legitimate call paths (verified against the live schema on 2026-07-23).

-- ---------------------------------------------------------------------------
-- 1. update_trip_basecamp_with_version  (HIGH)
-- ---------------------------------------------------------------------------
-- Previously performed NO authorization at all: no auth.uid() check, no trip
-- membership/admin check. As SECURITY DEFINER it bypasses the `trips` RLS that
-- the client's non-RPC fallback (basecampService.tryDirectBasecampUpdate) relies
-- on, so any caller who knew a trip id + version could overwrite that trip's
-- basecamp and spoof the p_user_id audit attribution.
--
-- Fix (fail closed):
--   * require an authenticated caller (auth.uid() IS NOT NULL);
--   * re-derive the actor: p_user_id must equal auth.uid() (no acting-as-other);
--   * enforce the same authority as the RLS UPDATE path — can_edit_trip_cover()
--     (consumer trips: any member; pro/event trips: creator or admin). This also
--     rejects non-existent trips (the helper returns false).
-- Reverse: restore the prior body from migration
--   20260206000000_fix_trip_basecamp_save.sql (and later revisions).
CREATE OR REPLACE FUNCTION public.update_trip_basecamp_with_version(
  p_trip_id text,
  p_current_version integer,
  p_name text,
  p_address text,
  p_latitude double precision,
  p_longitude double precision,
  p_user_id uuid
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_version INTEGER;
  v_new_version INTEGER;
BEGIN
  -- Fail closed: verify the actor before touching any trip data.
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized basecamp update request';
  END IF;

  IF NOT public.can_edit_trip_cover(p_trip_id, auth.uid()) THEN
    RAISE EXCEPTION 'You do not have permission to edit this trip basecamp';
  END IF;

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

  BEGIN
    PERFORM log_basecamp_change(
      p_trip_id,
      auth.uid(),
      'trip',
      'updated',
      NULL, NULL, NULL, NULL,
      p_name, p_address, p_latitude, p_longitude
    );
  EXCEPTION
    WHEN undefined_function THEN
      NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'new_version', v_new_version
  );
END;
$function$;

-- Defense in depth: anon can never satisfy the auth.uid() guard above.
REVOKE EXECUTE ON FUNCTION public.update_trip_basecamp_with_version(
  text, integer, text, text, double precision, double precision, uuid
) FROM anon;

-- ---------------------------------------------------------------------------
-- 2. log_basecamp_change  (MEDIUM)
-- ---------------------------------------------------------------------------
-- Trusted p_user_id and had no auth check, so an authenticated caller could
-- forge basecamp_change_history rows attributed to any user for any trip.
-- Its only real caller is update_trip_basecamp_with_version (internal PERFORM,
-- which runs as the definer/owner and is unaffected by the anon revoke below).
--
-- Fix (fail closed): when a JWT actor is present it must match p_user_id.
-- auth.uid() IS NULL (service_role / trusted internal contexts) is still
-- allowed so the existing internal call path keeps working.
-- Reverse: drop the guard block below.
CREATE OR REPLACE FUNCTION public.log_basecamp_change(
  p_trip_id text,
  p_user_id uuid,
  p_scope text,
  p_action text,
  p_old_name text DEFAULT NULL::text,
  p_old_address text DEFAULT NULL::text,
  p_old_lat double precision DEFAULT NULL::double precision,
  p_old_lng double precision DEFAULT NULL::double precision,
  p_new_name text DEFAULT NULL::text,
  p_new_address text DEFAULT NULL::text,
  p_new_lat double precision DEFAULT NULL::double precision,
  p_new_lng double precision DEFAULT NULL::double precision
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Fail closed: a client may only log history attributed to itself.
  IF auth.uid() IS NOT NULL AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized basecamp history write';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'basecamp_change_history') THEN
    INSERT INTO basecamp_change_history (
      trip_id, user_id, scope, action,
      old_name, old_address, old_latitude, old_longitude,
      new_name, new_address, new_latitude, new_longitude
    ) VALUES (
      p_trip_id, p_user_id, p_scope, p_action,
      p_old_name, p_old_address, p_old_lat, p_old_lng,
      p_new_name, p_new_address, p_new_lat, p_new_lng
    );
  END IF;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.log_basecamp_change(
  text, uuid, text, text, text, text, double precision, double precision,
  text, text, double precision, double precision
) FROM anon;

-- ---------------------------------------------------------------------------
-- 3. mark_broadcast_viewed  (LOW)
-- ---------------------------------------------------------------------------
-- Trusted p_user_id with no auth check: any caller could record broadcast read
-- receipts on behalf of another user. A read receipt is inherently first-person.
-- Fix (fail closed): require p_user_id = auth.uid().
-- Reverse: drop the guard block below.
CREATE OR REPLACE FUNCTION public.mark_broadcast_viewed(p_broadcast_id uuid, p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Fail closed: a user may only mark their own view.
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized broadcast view request';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'broadcast_views') THEN
    INSERT INTO broadcast_views (broadcast_id, user_id, viewed_at)
    VALUES (p_broadcast_id, p_user_id, NOW())
    ON CONFLICT (broadcast_id, user_id) DO NOTHING;
  END IF;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.mark_broadcast_viewed(uuid, uuid) FROM anon;

-- ---------------------------------------------------------------------------
-- 4. get_visible_profile_fields  (MEDIUM — PII disclosure)
-- ---------------------------------------------------------------------------
-- Trusted requesting_user_id when deciding whether to reveal a profile's email
-- and phone: the predicate `p.user_id = requesting_user_id` meant a caller could
-- pass requesting_user_id = the profile owner's id and unmask that user's private
-- email/phone regardless of their show_email / show_phone settings.
--
-- Fix (fail closed): decide visibility against the real authenticated actor.
-- v_requester = COALESCE(auth.uid(), requesting_user_id): an authenticated caller
-- can never spoof (auth.uid() wins); service_role (auth.uid() IS NULL) retains
-- the trusted parameter. anon EXECUTE is revoked so the fallback can't be abused.
-- Reverse: restore the prior body (predicate on requesting_user_id) and re-grant.
CREATE OR REPLACE FUNCTION public.get_visible_profile_fields(profile_user_id uuid, requesting_user_id uuid)
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, bio text, email text, phone text, first_name text, last_name text, show_email boolean, show_phone boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_requester uuid := COALESCE(auth.uid(), requesting_user_id);
BEGIN
  RETURN QUERY
  SELECT
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.bio,
    CASE WHEN p.show_email = true OR p.user_id = v_requester THEN p.email ELSE NULL END,
    CASE WHEN p.show_phone = true OR p.user_id = v_requester THEN p.phone ELSE NULL END,
    p.first_name,
    p.last_name,
    p.show_email,
    p.show_phone
  FROM profiles p
  WHERE p.user_id = profile_user_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_visible_profile_fields(uuid, uuid) FROM anon;

-- ---------------------------------------------------------------------------
-- 5. increment_sms_counter / check_sms_rate_limit  (MEDIUM)
-- ---------------------------------------------------------------------------
-- Both trust p_user_id and mutate that user's notification_preferences row
-- (SMS counter / daily reset) with no auth check. They are internal
-- rate-limiting primitives meant to run under the service role during SMS
-- dispatch; no client code calls them (verified across src/ and
-- supabase/functions/). Granting them to anon/authenticated let any caller
-- inflate or reset another user's SMS rate-limit state (griefing / DoS).
--
-- Fix (fail closed): remove the client-facing grants. service_role and the
-- owner keep EXECUTE, so the intended dispatch path is unaffected.
-- Reverse: GRANT EXECUTE ... TO authenticated (and anon if ever needed).
REVOKE EXECUTE ON FUNCTION public.increment_sms_counter(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_sms_rate_limit(uuid, integer) FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. log_org_admin_action  (LOW — audit-log integrity)
-- ---------------------------------------------------------------------------
-- Writes admin_audit_logs rows. It correctly stamps admin_id = auth.uid() (not
-- spoofable), but being granted to anon/authenticated let any caller inject
-- arbitrary audit entries (forged action/target/state) attributed to themselves.
-- It is an internal helper invoked only by the SECURITY DEFINER org RPCs
-- (assign_org_seat, transfer_org_seat, ...), which run as the owner and are
-- unaffected by revoking the client grant.
-- Fix (fail closed): remove client-facing EXECUTE.
-- Reverse: GRANT EXECUTE ... TO authenticated.
REVOKE EXECUTE ON FUNCTION public.log_org_admin_action(text, uuid, uuid, jsonb, jsonb)
  FROM anon, authenticated;
