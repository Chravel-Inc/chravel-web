-- Require ACTIVE admin membership in dismiss_join_request (2026-07-23)
--
-- dismiss_join_request authorized the caller via `trip_members ... role='admin'` with no
-- status filter, so a departed admin (status='left') retained the ability to dismiss a
-- pending join request — the same former-member class as the H1 hardening. Very low impact
-- (dismissing a pending request), but closed for consistency. The trip-creator branch and
-- the rest of the body are unchanged.
--
-- Only tightens authorization; no read/loading/payment path affected.
-- REVERSAL: CREATE OR REPLACE without the `(status IS NULL OR status='active')` clause.

CREATE OR REPLACE FUNCTION public.dismiss_join_request(_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_trip_id uuid;
  v_requester_id uuid;
  v_user_exists boolean;
BEGIN
  -- Get request details
  SELECT trip_id, user_id INTO v_trip_id, v_requester_id
  FROM public.trip_join_requests
  WHERE id = _request_id AND status = 'pending';

  IF v_trip_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Request not found or already processed');
  END IF;

  -- Verify caller is creator or an ACTIVE admin of the trip.
  IF NOT EXISTS (
    SELECT 1 FROM trips WHERE id = v_trip_id AND created_by = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_id = v_trip_id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND (status IS NULL OR status = 'active')
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Only trip admins can dismiss requests');
  END IF;

  -- Check if user still exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = v_requester_id) INTO v_user_exists;

  -- Delete the request (dismiss = permanently remove without approve/reject)
  DELETE FROM public.trip_join_requests WHERE id = _request_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', CASE WHEN v_user_exists THEN 'Request dismissed' ELSE 'Orphaned request removed' END,
    'cleaned_up', NOT v_user_exists
  );
END;
$function$;
