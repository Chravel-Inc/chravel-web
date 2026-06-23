-- Make join-request approval/rejection idempotent for stale/duplicate clicks.
--
-- Bug: When an owner/admin accepts a join request, the actionable notification was not
-- durably resolved. A stale client (another tab, device, or a refreshed session) could
-- click Accept again. The previous RPCs returned `success: FALSE` with the message
-- "This request has already been approved" and NO handled flag, so the client threw a
-- scary error toast instead of treating it as a no-op.
--
-- Fix: a click on an already-resolved request returns a handled result with an
-- `already_resolved` flag. The client surfaces it as info (not an error), refreshes
-- state, and clears the actionable notification. Accepting an already-approved request
-- never re-notifies the requester and never inserts a duplicate member; rejecting an
-- already-approved request does NOT revoke membership.
--
-- Preserves the latest behavior of both functions:
--   approve: trip_type in notification metadata + `member_inserted` flag
--   reject:  24h re-request cooldown + admin audit log + 'join_rejected' notification

-- 1. approve_join_request: idempotent on already-resolved requests
CREATE OR REPLACE FUNCTION public.approve_join_request(_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req RECORD;
  trip_data RECORD;
  profile_exists BOOLEAN;
  v_member_insert_rowcount integer;
BEGIN
  SELECT * INTO req
  FROM public.trip_join_requests
  WHERE id = _request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'Join request not found'
    );
  END IF;

  -- Idempotency: a stale/duplicate Accept on an already-resolved request must not throw.
  -- (Returns only the handled flag — the client treats it as an info no-op and refreshes
  -- caches; it does not need trip/user ids here, so this early return stays minimal.)
  IF req.status = 'approved' THEN
    -- Already a member from the original transition; never re-notify or re-insert.
    RETURN jsonb_build_object(
      'success', TRUE,
      'already_resolved', TRUE,
      'message', 'This request was already approved'
    );
  ELSIF req.status <> 'pending' THEN
    -- e.g. rejected/cancelled — do not grant access; report as handled (no scary error).
    RETURN jsonb_build_object(
      'success', FALSE,
      'already_resolved', TRUE,
      'message', 'This request was already ' || req.status
    );
  END IF;

  -- Check if user profile exists (proxy for user existence)
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = req.user_id
  ) INTO profile_exists;

  IF NOT profile_exists THEN
    -- User was deleted - clean up the orphaned request
    DELETE FROM public.trip_join_requests WHERE id = _request_id;
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'This join request is no longer valid (user account was deleted)',
      'cleaned_up', TRUE
    );
  END IF;

  -- Get trip data for authorization check
  SELECT * INTO trip_data FROM public.trips WHERE id = req.trip_id;

  IF NOT FOUND THEN
    -- Trip was deleted - clean up
    DELETE FROM public.trip_join_requests WHERE id = _request_id;
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'This trip no longer exists',
      'cleaned_up', TRUE
    );
  END IF;

  -- Authorization: pro/event trips require creator or admin; consumer trips allow any member.
  IF trip_data.trip_type IN ('pro', 'event') THEN
    IF NOT (
      trip_data.created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.trip_admins
        WHERE trip_id = req.trip_id AND user_id = auth.uid()
      )
    ) THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'message', 'Only trip admins can approve join requests for Pro/Event trips'
      );
    END IF;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_id = req.trip_id AND user_id = auth.uid()
    ) THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'message', 'Only trip members can approve join requests'
      );
    END IF;
  END IF;

  UPDATE public.trip_join_requests
  SET
    status = 'approved',
    resolved_at = now(),
    resolved_by = auth.uid()
  WHERE id = _request_id;

  -- Membership is intentionally NOT date-gated: completed trips can still accept members,
  -- and a newly accepted member sees the full trip history (including prior chat).
  INSERT INTO public.trip_members (trip_id, user_id, role)
  VALUES (req.trip_id, req.user_id, 'member')
  ON CONFLICT (trip_id, user_id) DO NOTHING;

  GET DIAGNOSTICS v_member_insert_rowcount = ROW_COUNT;

  IF req.invite_code IS NOT NULL AND req.invite_code != '' THEN
    UPDATE public.trip_invites
    SET current_uses = current_uses + 1,
        updated_at = now()
    WHERE trip_id = req.trip_id AND code = req.invite_code;
  END IF;

  -- Notify the requester (non-critical). Only the pending -> approved transition reaches
  -- this point, so at most one "approved" notification is ever created per request.
  BEGIN
    PERFORM public.create_notification(
      req.user_id,
      '✅ Join Request Approved',
      'Your request to join "' || trip_data.name || '" has been approved!',
      'success',
      jsonb_build_object(
        'trip_id', req.trip_id,
        'trip_name', trip_data.name,
        'trip_type', trip_data.trip_type,
        'action', 'join_approved'
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Failed to send approval notification: %', SQLERRM;
  END;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'User added to trip successfully',
    'trip_id', req.trip_id,
    'user_id', req.user_id,
    'member_inserted', v_member_insert_rowcount > 0
  );
END;
$$;

COMMENT ON FUNCTION public.approve_join_request(uuid) IS
'Approves a join request, adds user to trip_members (idempotent ON CONFLICT), increments invite usage, notifies the requester. Idempotent: a click on an already-resolved request returns already_resolved without re-notifying or duplicating membership. Returns member_inserted so clients can skip duplicate Stream join lines.';

-- 2. reject_join_request: idempotent on already-resolved requests
CREATE OR REPLACE FUNCTION public.reject_join_request(_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req RECORD;
  trip_data RECORD;
  profile_exists BOOLEAN;
  v_cooldown_until TIMESTAMPTZ;
BEGIN
  SELECT * INTO req FROM public.trip_join_requests WHERE id = _request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Join request not found');
  END IF;

  -- Idempotency: a stale/duplicate Deny on an already-resolved request must not throw.
  IF req.status = 'rejected' THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'already_resolved', TRUE,
      'message', 'This request was already rejected'
    );
  ELSIF req.status <> 'pending' THEN
    -- e.g. already approved — do NOT revoke membership; report as handled.
    RETURN jsonb_build_object(
      'success', FALSE,
      'already_resolved', TRUE,
      'message', 'This request was already ' || req.status
    );
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = req.user_id) INTO profile_exists;

  IF NOT profile_exists THEN
    DELETE FROM public.trip_join_requests WHERE id = _request_id;
    RETURN jsonb_build_object('success', TRUE, 'message', 'Orphaned request removed (user account no longer exists)', 'cleaned_up', TRUE);
  END IF;

  SELECT * INTO trip_data FROM public.trips WHERE id = req.trip_id;

  IF NOT FOUND THEN
    DELETE FROM public.trip_join_requests WHERE id = _request_id;
    RETURN jsonb_build_object('success', TRUE, 'message', 'Orphaned request removed (trip no longer exists)', 'cleaned_up', TRUE);
  END IF;

  IF trip_data.trip_type IN ('pro', 'event') THEN
    IF NOT (
      trip_data.created_by = auth.uid() OR
      EXISTS (SELECT 1 FROM public.trip_admins WHERE trip_id = req.trip_id AND user_id = auth.uid())
    ) THEN
      RETURN jsonb_build_object('success', FALSE, 'message', 'Only trip admins can reject join requests for Pro/Event trips');
    END IF;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM public.trip_members WHERE trip_id = req.trip_id AND user_id = auth.uid()) THEN
      RETURN jsonb_build_object('success', FALSE, 'message', 'Only trip members can reject join requests');
    END IF;
  END IF;

  v_cooldown_until := NOW() + INTERVAL '24 hours';

  -- Update status and set 24-hour re-request cooldown
  UPDATE public.trip_join_requests
  SET
    status = 'rejected',
    resolved_at = NOW(),
    resolved_by = auth.uid(),
    rejection_cooldown_until = v_cooldown_until
  WHERE id = _request_id;

  -- Audit log
  INSERT INTO public.admin_audit_logs (admin_id, action, trip_id, target_user_id, old_state, new_state)
  VALUES (
    auth.uid(),
    'reject_join',
    req.trip_id,
    req.user_id,
    jsonb_build_object('status', 'pending', 'request_id', _request_id),
    jsonb_build_object('status', 'rejected', 'cooldown_until', v_cooldown_until::text)
  );

  -- Notify the requester (non-critical). Only the pending -> rejected transition reaches
  -- this point, so at most one "rejected" notification is created per request.
  BEGIN
    PERFORM public.create_notification(
      req.user_id,
      'Join Request Update',
      'Your request to join "' || trip_data.name || '" was not approved at this time.',
      'info',
      jsonb_build_object(
        'trip_id', req.trip_id,
        'trip_name', trip_data.name,
        'trip_type', trip_data.trip_type,
        'action', 'join_rejected'
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Failed to send rejection notification: %', SQLERRM;
  END;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Join request rejected',
    'trip_id', req.trip_id,
    'cooldown_until', v_cooldown_until::text
  );
END;
$$;

COMMENT ON FUNCTION public.reject_join_request(uuid) IS
'Rejects a join request with 24-hour re-request cooldown, logs to audit, and notifies the requester. Idempotent: a click on an already-resolved request returns already_resolved without re-logging or revoking membership.';
