-- Org governance hardening: canonical org domain model, transactional seat lifecycle,
-- server-side admin auth boundaries, and immutable audit trails.

CREATE TABLE IF NOT EXISTS public.organization_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);

CREATE TABLE IF NOT EXISTS public.organization_team_members (
  team_id uuid NOT NULL REFERENCES public.organization_teams(id) ON DELETE CASCADE,
  organization_member_id uuid NOT NULL REFERENCES public.organization_members(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, organization_member_id)
);

CREATE TABLE IF NOT EXISTS public.organization_seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  seat_key text NOT NULL,
  seat_status text NOT NULL DEFAULT 'available' CHECK (seat_status IN ('available','assigned','suspended')),
  assigned_member_id uuid NULL REFERENCES public.organization_members(id) ON DELETE SET NULL,
  assigned_at timestamptz NULL,
  suspended_at timestamptz NULL,
  revoked_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, seat_key),
  UNIQUE (organization_id, assigned_member_id)
);

CREATE TABLE IF NOT EXISTS public.organization_role_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role public.org_member_role NOT NULL,
  policy jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, role)
);

CREATE TABLE IF NOT EXISTS public.organization_subscription_links (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  billing_record_id uuid NULL REFERENCES public.organization_billing(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'stripe',
  provider_subscription_id text,
  external_customer_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organization_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_role_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_subscription_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read teams"
ON public.organization_teams FOR SELECT
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins manage teams"
ON public.organization_teams FOR ALL
USING (public.is_org_admin(auth.uid(), organization_id))
WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org members can read team members"
ON public.organization_team_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_teams ot
    WHERE ot.id = team_id
      AND public.is_org_member(auth.uid(), ot.organization_id)
  )
);

CREATE POLICY "Org admins manage team members"
ON public.organization_team_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_teams ot
    WHERE ot.id = team_id
      AND public.is_org_admin(auth.uid(), ot.organization_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_teams ot
    WHERE ot.id = team_id
      AND public.is_org_admin(auth.uid(), ot.organization_id)
  )
);

CREATE POLICY "Org members can read seats"
ON public.organization_seats FOR SELECT
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins manage seats"
ON public.organization_seats FOR ALL
USING (public.is_org_admin(auth.uid(), organization_id))
WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org members can read role policies"
ON public.organization_role_policies FOR SELECT
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins manage role policies"
ON public.organization_role_policies FOR ALL
USING (public.is_org_admin(auth.uid(), organization_id))
WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins read subscription links"
ON public.organization_subscription_links FOR SELECT
USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins manage subscription links"
ON public.organization_subscription_links FOR ALL
USING (public.is_org_admin(auth.uid(), organization_id))
WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE OR REPLACE FUNCTION public.log_org_admin_action(
  _action text,
  _org_id uuid,
  _target_user_id uuid,
  _old_state jsonb,
  _new_state jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_audit_logs (admin_id, action, trip_id, target_user_id, old_state, new_state)
  VALUES (auth.uid(), _action, NULL, _target_user_id, _old_state || jsonb_build_object('organization_id', _org_id), _new_state || jsonb_build_object('organization_id', _org_id));
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_org_seat(_org_id uuid, _member_id uuid, _seat_key text)
RETURNS public.organization_seats
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seat public.organization_seats;
  v_member public.organization_members;
BEGIN
  IF NOT public.is_org_admin(auth.uid(), _org_id) THEN
    RAISE EXCEPTION 'Unauthorized org admin action';
  END IF;

  SELECT * INTO v_member
  FROM public.organization_members
  WHERE id = _member_id AND organization_id = _org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member does not belong to organization';
  END IF;

  INSERT INTO public.organization_seats (organization_id, seat_key, seat_status, assigned_member_id, assigned_at)
  VALUES (_org_id, _seat_key, 'assigned', _member_id, now())
  ON CONFLICT (organization_id, seat_key)
  DO UPDATE SET seat_status='assigned', assigned_member_id=_member_id, assigned_at=now(), suspended_at=NULL, revoked_at=NULL, updated_at=now()
  RETURNING * INTO v_seat;

  UPDATE public.organization_members
  SET seat_id = _seat_key, status = 'active', updated_at = now()
  WHERE id = _member_id;

  PERFORM public.log_org_admin_action('org.seat.assign', _org_id, v_member.user_id, jsonb_build_object('seat_id', v_member.seat_id), jsonb_build_object('seat_id', _seat_key));
  RETURN v_seat;
END;
$$;

CREATE OR REPLACE FUNCTION public.reclaim_org_seat(_org_id uuid, _seat_key text)
RETURNS public.organization_seats
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_seat public.organization_seats;
DECLARE v_target public.organization_members;
BEGIN
  IF NOT public.is_org_admin(auth.uid(), _org_id) THEN
    RAISE EXCEPTION 'Unauthorized org admin action';
  END IF;

  SELECT * INTO v_seat FROM public.organization_seats WHERE organization_id=_org_id AND seat_key=_seat_key FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Seat not found'; END IF;

  IF v_seat.assigned_member_id IS NOT NULL THEN
    SELECT * INTO v_target FROM public.organization_members WHERE id = v_seat.assigned_member_id FOR UPDATE;
    UPDATE public.organization_members SET seat_id = concat('unassigned-', id::text), status='pending', updated_at=now() WHERE id = v_target.id;
  END IF;

  UPDATE public.organization_seats
  SET seat_status='available', assigned_member_id=NULL, assigned_at=NULL, revoked_at=now(), updated_at=now()
  WHERE id = v_seat.id
  RETURNING * INTO v_seat;

  PERFORM public.log_org_admin_action('org.seat.reclaim', _org_id, COALESCE(v_target.user_id, NULL), jsonb_build_object('seat_key', _seat_key), jsonb_build_object('seat_status', 'available'));
  RETURN v_seat;
END; $$;

CREATE OR REPLACE FUNCTION public.suspend_org_seat(_org_id uuid, _seat_key text)
RETURNS public.organization_seats
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_seat public.organization_seats;
BEGIN
  IF NOT public.is_org_admin(auth.uid(), _org_id) THEN
    RAISE EXCEPTION 'Unauthorized org admin action';
  END IF;

  UPDATE public.organization_seats
  SET seat_status='suspended', suspended_at=now(), updated_at=now()
  WHERE organization_id=_org_id AND seat_key=_seat_key
  RETURNING * INTO v_seat;

  IF NOT FOUND THEN RAISE EXCEPTION 'Seat not found'; END IF;
  PERFORM public.log_org_admin_action('org.seat.suspend', _org_id, NULL, jsonb_build_object('seat_key', _seat_key), jsonb_build_object('seat_status', 'suspended'));
  RETURN v_seat;
END; $$;

CREATE OR REPLACE FUNCTION public.transfer_org_seat(_org_id uuid, _from_member_id uuid, _to_member_id uuid)
RETURNS public.organization_seats
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_seat public.organization_seats;
DECLARE v_from public.organization_members;
DECLARE v_to public.organization_members;
BEGIN
  IF NOT public.is_org_admin(auth.uid(), _org_id) THEN
    RAISE EXCEPTION 'Unauthorized org admin action';
  END IF;

  SELECT * INTO v_from FROM public.organization_members WHERE id=_from_member_id AND organization_id=_org_id FOR UPDATE;
  SELECT * INTO v_to FROM public.organization_members WHERE id=_to_member_id AND organization_id=_org_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transfer members must belong to organization'; END IF;

  SELECT * INTO v_seat FROM public.organization_seats WHERE organization_id=_org_id AND assigned_member_id=_from_member_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Source member has no assigned seat'; END IF;

  UPDATE public.organization_seats SET assigned_member_id=_to_member_id, assigned_at=now(), seat_status='assigned', suspended_at=NULL, revoked_at=NULL, updated_at=now() WHERE id=v_seat.id RETURNING * INTO v_seat;
  UPDATE public.organization_members SET seat_id=concat('unassigned-', id::text), status='pending', updated_at=now() WHERE id=v_from.id;
  UPDATE public.organization_members SET seat_id=v_seat.seat_key, status='active', updated_at=now() WHERE id=v_to.id;

  PERFORM public.log_org_admin_action('org.seat.transfer', _org_id, v_to.user_id, jsonb_build_object('from_member_id', _from_member_id, 'to_member_id', _to_member_id), jsonb_build_object('seat_key', v_seat.seat_key));
  RETURN v_seat;
END; $$;

CREATE OR REPLACE FUNCTION public.prevent_admin_audit_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'admin_audit_logs is immutable';
END; $$;

DROP TRIGGER IF EXISTS admin_audit_logs_no_update ON public.admin_audit_logs;
CREATE TRIGGER admin_audit_logs_no_update BEFORE UPDATE ON public.admin_audit_logs FOR EACH ROW EXECUTE FUNCTION public.prevent_admin_audit_mutation();
DROP TRIGGER IF EXISTS admin_audit_logs_no_delete ON public.admin_audit_logs;
CREATE TRIGGER admin_audit_logs_no_delete BEFORE DELETE ON public.admin_audit_logs FOR EACH ROW EXECUTE FUNCTION public.prevent_admin_audit_mutation();
