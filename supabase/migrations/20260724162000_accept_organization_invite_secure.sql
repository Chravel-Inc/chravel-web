CREATE OR REPLACE FUNCTION public.accept_organization_invite_secure(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_uid uuid := auth.uid();
  v_auth_email text := lower(COALESCE(auth.jwt() ->> 'email', ''));
  v_invite public.organization_invites;
  v_existing_member public.organization_members;
  v_member_id uuid;
  v_org public.organizations;
  v_active_member_count integer := 0;
  v_seat_number integer := 1;
  v_seat_key text;
BEGIN
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_token IS NULL OR btrim(p_token) = '' THEN
    RAISE EXCEPTION 'Invitation token is required';
  END IF;

  SELECT *
  INTO v_invite
  FROM public.organization_invites
  WHERE token = p_token
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  IF v_invite.expires_at < now() THEN
    UPDATE public.organization_invites
    SET status = 'expired'
    WHERE id = v_invite.id;

    RAISE EXCEPTION 'Invitation has expired';
  END IF;

  IF v_auth_email = '' OR v_auth_email <> lower(v_invite.email) THEN
    RAISE EXCEPTION 'This invitation was sent to a different email address';
  END IF;

  SELECT *
  INTO v_existing_member
  FROM public.organization_members
  WHERE organization_id = v_invite.organization_id
    AND user_id = v_auth_uid
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing_member.status = 'active' THEN
      UPDATE public.organization_invites
      SET status = 'accepted'
      WHERE id = v_invite.id;

      INSERT INTO public.user_roles (user_id, role)
      VALUES (v_auth_uid, 'pro')
      ON CONFLICT (user_id, role) DO NOTHING;

      RETURN jsonb_build_object(
        'organization_id', v_invite.organization_id,
        'seat_id', v_existing_member.seat_id,
        'already_member', true
      );
    END IF;
  END IF;

  SELECT *
  INTO v_org
  FROM public.organizations
  WHERE id = v_invite.organization_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  SELECT COUNT(*)
  INTO v_active_member_count
  FROM public.organization_members
  WHERE organization_id = v_invite.organization_id
    AND status = 'active';

  IF v_active_member_count >= v_org.seat_limit THEN
    RAISE EXCEPTION 'Organization has reached its seat limit';
  END IF;

  LOOP
    v_seat_key := 'seat-' || lpad(v_seat_number::text, 3, '0');

    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.organization_members
      WHERE organization_id = v_invite.organization_id
        AND seat_id = v_seat_key
    );

    v_seat_number := v_seat_number + 1;
  END LOOP;

  IF v_existing_member.id IS NOT NULL THEN
    UPDATE public.organization_members
    SET role = v_invite.role,
        invited_by = v_invite.invited_by,
        seat_id = v_seat_key,
        status = 'active',
        updated_at = now()
    WHERE id = v_existing_member.id
    RETURNING id INTO v_member_id;
  ELSE
    INSERT INTO public.organization_members (
      organization_id,
      user_id,
      role,
      invited_by,
      seat_id,
      status
    ) VALUES (
      v_invite.organization_id,
      v_auth_uid,
      v_invite.role,
      v_invite.invited_by,
      v_seat_key,
      'active'
    )
    RETURNING id INTO v_member_id;
  END IF;

  INSERT INTO public.organization_seats (
    organization_id,
    seat_key,
    seat_status,
    assigned_member_id,
    assigned_at
  ) VALUES (
    v_invite.organization_id,
    v_seat_key,
    'assigned',
    v_member_id,
    now()
  )
  ON CONFLICT (organization_id, seat_key)
  DO UPDATE SET
    seat_status = 'assigned',
    assigned_member_id = v_member_id,
    assigned_at = now(),
    suspended_at = NULL,
    revoked_at = NULL,
    updated_at = now();

  UPDATE public.organizations
  SET seats_used = v_active_member_count + 1,
      updated_at = now()
  WHERE id = v_invite.organization_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_auth_uid, 'pro')
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.organization_invites
  SET status = 'accepted'
  WHERE id = v_invite.id;

  RETURN jsonb_build_object(
    'organization_id', v_invite.organization_id,
    'seat_id', v_seat_key,
    'already_member', false
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.accept_organization_invite_secure(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_organization_invite_secure(text) TO authenticated, service_role;
