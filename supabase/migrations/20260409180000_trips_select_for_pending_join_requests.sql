-- Allow users with a pending trip_join_requests row to SELECT the corresponding trip row.
--
-- Root cause: trips SELECT policy (post leave-trip hardening) only allowed is_active_trip_member.
-- Invite / join flows create trip_join_requests before membership; the nested `trips (...)` embed
-- on dashboard join-request queries then returned null for trip fields, so "Outgoing" requests
-- looked empty or lost trip_type scoping on the home dashboard.

CREATE OR REPLACE FUNCTION public.can_view_trip_for_pending_join_request(_user_id uuid, _trip_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.trip_join_requests j
    WHERE j.trip_id = _trip_id
      AND j.user_id = _user_id
      AND j.status = 'pending'
  );
$$;

COMMENT ON FUNCTION public.can_view_trip_for_pending_join_request(uuid, text) IS
  'True when the user has a pending join request for the trip; used by trips RLS so requesters can read trip metadata for dashboard embeds.';

DROP POLICY IF EXISTS "Users can view their trips" ON public.trips;

CREATE POLICY "Users can view their trips"
ON public.trips FOR SELECT TO authenticated
USING (
  public.is_active_trip_member(auth.uid(), id)
  OR public.can_view_trip_for_pending_join_request(auth.uid(), id)
);

COMMENT ON POLICY "Users can view their trips" ON public.trips IS
  'Active members can view trip rows; users with a pending join request can view that trip for request UI/metadata.';
