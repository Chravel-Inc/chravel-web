-- Allow requesters to cancel their own pending join requests from dashboard Requests tab.
-- Keeps existing DELETE RLS strict for admins while exposing a narrow SECURITY DEFINER RPC.

CREATE OR REPLACE FUNCTION public.cancel_own_join_request(_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Authentication required');
  END IF;

  SELECT id, user_id, status
  INTO req
  FROM public.trip_join_requests
  WHERE id = _request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Join request not found');
  END IF;

  IF req.user_id <> auth.uid() THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'You can only cancel your own request');
  END IF;

  IF req.status <> 'pending' THEN
    RETURN jsonb_build_object(
      'success',
      FALSE,
      'message',
      'Only pending requests can be canceled'
    );
  END IF;

  DELETE FROM public.trip_join_requests
  WHERE id = _request_id
    AND user_id = auth.uid()
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Request could not be canceled');
  END IF;

  RETURN jsonb_build_object('success', TRUE, 'message', 'Join request canceled');
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_own_join_request(uuid) TO authenticated;
