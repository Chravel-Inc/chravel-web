-- Actor validation for the co-member relationship predicates (fail-closed)
--
-- Follow-up to 20260723120000. Two STABLE SECURITY DEFINER predicates trusted a
-- caller-supplied `viewer_id` and were granted to anon/authenticated, so a client
-- could call them directly over PostgREST with an arbitrary viewer and enumerate
-- whether any two users share a trip (a relationship / social-graph info leak):
--   * is_trip_co_member(viewer_id uuid, target_user_id uuid)
--   * users_share_trip(viewer_id uuid, target_id uuid)
--
-- Live-schema reference audit (2026-07-23) found exactly ONE legitimate consumer:
-- the view public.profiles_public calls is_trip_co_member(auth.uid(), user_id)
-- to gate email/phone exposure — i.e. it already passes auth.uid() as the viewer.
-- No RLS policy, no other function, and no application code references either
-- predicate; users_share_trip has no references at all.
--
-- Fix: re-derive the viewer from auth.uid() inside each function so the
-- viewer_id parameter can no longer be spoofed. This is a no-op for the
-- profiles_public view (it passes auth.uid() already) and makes every direct
-- RPC call evaluate the relationship only for the authenticated caller. anon /
-- unauthenticated callers get auth.uid() IS NULL -> false. Signatures are
-- unchanged (no generated-type drift).

-- ---------------------------------------------------------------------------
-- 1. is_trip_co_member  — consumed by the profiles_public view
-- ---------------------------------------------------------------------------
-- The viewer_id parameter is retained for signature / view-binding stability but
-- is no longer trusted; the viewer is always auth.uid(). Grants are left intact
-- because the profiles_public view requires the invoking role to hold EXECUTE.
-- Reverse: restore the prior body (viewer side keyed on viewer_id) from
-- 20260202220351_b047a75d-6e2a-4559-88de-3aeb41229e1d.sql.
CREATE OR REPLACE FUNCTION public.is_trip_co_member(viewer_id uuid, target_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM trip_members tm1
      JOIN trip_members tm2 ON tm1.trip_id = tm2.trip_id
      WHERE tm1.user_id = auth.uid() AND tm2.user_id = target_user_id
        AND (tm1.status IS NULL OR tm1.status = 'active')
        AND (tm2.status IS NULL OR tm2.status = 'active')
    )
    OR EXISTS (
      SELECT 1 FROM trips t JOIN trip_members tm ON tm.trip_id = t.id
      WHERE t.created_by = auth.uid() AND tm.user_id = target_user_id
        AND (tm.status IS NULL OR tm.status = 'active')
    )
    OR EXISTS (
      SELECT 1 FROM trips t JOIN trip_members tm ON tm.trip_id = t.id
      WHERE t.created_by = target_user_id AND tm.user_id = auth.uid()
        AND (tm.status IS NULL OR tm.status = 'active')
    )
  );
$function$;

-- ---------------------------------------------------------------------------
-- 2. users_share_trip  — dead (no view / policy / function / app reference)
-- ---------------------------------------------------------------------------
-- Re-derive the viewer from auth.uid() (defense in depth in case it is ever
-- wired into a policy/view later) AND remove the client-facing EXECUTE grants,
-- since nothing calls it today. This function carries a blanket PUBLIC EXECUTE
-- grant in addition to explicit anon/authenticated grants, so all three must be
-- revoked (revoking anon/authenticated alone leaves PUBLIC in force).
-- service_role / owner keep EXECUTE.
-- Reverse: restore the prior body and GRANT EXECUTE ... TO PUBLIC (or anon,
-- authenticated).
CREATE OR REPLACE FUNCTION public.users_share_trip(viewer_id uuid, target_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM trip_members tm1
    JOIN trip_members tm2 ON tm1.trip_id = tm2.trip_id
    WHERE tm1.user_id = auth.uid()
      AND tm2.user_id = target_id
      AND tm1.user_id != tm2.user_id
  );
$function$;

REVOKE EXECUTE ON FUNCTION public.users_share_trip(uuid, uuid) FROM PUBLIC, anon, authenticated;
