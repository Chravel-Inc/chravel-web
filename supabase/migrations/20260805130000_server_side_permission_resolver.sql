-- Restore the server-side permission resolver — and ONLY the resolver.
--
-- WHAT WAS BROKEN
-- src/hooks/useMutationPermissions.ts documents itself as:
--     Primary source: server resolver RPC `get_trip_mutation_permissions`.
--     Fallback: client-side matrix resolution when RPC is unavailable (pre-migration).
-- The RPC has never existed in production, so the fallback was the only path that ever ran and
-- every mutation affordance in the UI was decided client-side. RLS is still the real gate at the
-- database, so this was missing defense-in-depth rather than an open door — but it also meant the
-- `permissionMatrix.generated.ts` drift check was guarding a server path that never executed.
--
-- WHY THIS IS A NEW MIGRATION RATHER THAN APPLYING 20260626140000
-- That migration does two very different things in one file:
--     (a) lines ~9-305  — create the resolver functions. Purely additive; nothing else changes.
--     (b) lines ~407-500 — DROP and REPLACE the RLS policies on trip_tasks, trip_polls,
--                          trip_events and trip_links with "Resolver-gated" equivalents.
--
-- (b) swaps the live enforcement model on the four most-used mutation tables in the product. It is
-- the single highest-blast-radius change available in this schema, it is not what was reported
-- broken, and it would need a full permission test matrix plus a permissionMatrix.generated.ts
-- parity pass before anyone should trust it. Applying it days before launch to fix a
-- defense-in-depth gap would be trading a large risk for a small one.
--
-- So this migration takes (a) only. The live policies — "Task creators can update their tasks",
-- "Coordinators can update trip tasks", and their poll/event/link counterparts — are untouched.
-- 20260626140000 remains in the repo, unapplied, as the record of the fuller intent.
--
-- CONSISTENCY NOTE: the resolver evaluates the same matrix the client already falls back to
-- (config/permission-matrix.json -> permissionMatrix.generated.ts), but resolves the caller's ROLE
-- authoritatively from trips/trip_admins/user_trip_roles instead of inferring it client-side. The
-- UI should therefore agree with, or be strictly more accurate than, what it shows today.
--
-- Regression scope: adds read-only STABLE functions. No policy, table, trip fetch, auth hydration
-- or payment surface is touched. Nothing is dropped. Fully idempotent.

-- ---------------------------------------------------------------------------
-- Generated matrix evaluator (regenerate via: npm run permissions:generate)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.permission_matrix_allows(
  p_role TEXT,
  p_resource TEXT,
  p_action TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  CASE p_role
    WHEN 'demo' THEN
      CASE p_resource
        WHEN 'tasks' THEN RETURN p_action IN ('read', 'write', 'delete', 'admin');
        WHEN 'polls' THEN RETURN p_action IN ('read', 'write', 'delete', 'admin');
        WHEN 'calendar' THEN RETURN p_action IN ('read', 'write', 'delete', 'admin');
        WHEN 'basecamp' THEN RETURN p_action IN ('read', 'write', 'delete', 'admin');
        WHEN 'links' THEN RETURN p_action IN ('read', 'write', 'delete', 'admin');
        ELSE RETURN FALSE;
      END CASE;
    WHEN 'super_admin' THEN
      CASE p_resource
        WHEN 'tasks' THEN RETURN p_action IN ('read', 'write', 'delete', 'admin');
        WHEN 'polls' THEN RETURN p_action IN ('read', 'write', 'delete', 'admin');
        WHEN 'calendar' THEN RETURN p_action IN ('read', 'write', 'delete', 'admin');
        WHEN 'basecamp' THEN RETURN p_action IN ('read', 'write', 'delete', 'admin');
        WHEN 'links' THEN RETURN p_action IN ('read', 'write', 'delete', 'admin');
        ELSE RETURN FALSE;
      END CASE;
    WHEN 'consumer_member' THEN
      CASE p_resource
        WHEN 'tasks' THEN RETURN p_action IN ('read', 'write', 'delete');
        WHEN 'polls' THEN RETURN p_action IN ('read', 'write', 'delete');
        WHEN 'calendar' THEN RETURN p_action IN ('read', 'write', 'delete');
        WHEN 'basecamp' THEN RETURN p_action IN ('read', 'write', 'delete');
        WHEN 'links' THEN RETURN p_action IN ('read', 'write', 'delete');
        ELSE RETURN FALSE;
      END CASE;
    WHEN 'consumer_guest' THEN
      CASE p_resource
        WHEN 'tasks' THEN RETURN FALSE;
        WHEN 'polls' THEN RETURN FALSE;
        WHEN 'calendar' THEN RETURN FALSE;
        WHEN 'basecamp' THEN RETURN FALSE;
        WHEN 'links' THEN RETURN FALSE;
        ELSE RETURN FALSE;
      END CASE;
    WHEN 'pro_admin' THEN
      CASE p_resource
        WHEN 'tasks' THEN RETURN p_action IN ('read', 'write', 'delete', 'admin');
        WHEN 'polls' THEN RETURN p_action IN ('read', 'write', 'delete', 'admin');
        WHEN 'calendar' THEN RETURN p_action IN ('read', 'write', 'delete', 'admin');
        WHEN 'basecamp' THEN RETURN p_action IN ('read', 'write', 'delete', 'admin');
        WHEN 'links' THEN RETURN p_action IN ('read', 'write', 'delete', 'admin');
        ELSE RETURN FALSE;
      END CASE;
    WHEN 'pro_editor' THEN
      CASE p_resource
        WHEN 'tasks' THEN RETURN p_action IN ('read', 'write', 'delete');
        WHEN 'polls' THEN RETURN p_action IN ('read', 'write');
        WHEN 'calendar' THEN RETURN p_action IN ('read', 'write', 'delete');
        WHEN 'basecamp' THEN RETURN p_action IN ('read');
        WHEN 'links' THEN RETURN p_action IN ('read', 'write');
        ELSE RETURN FALSE;
      END CASE;
    WHEN 'pro_viewer' THEN
      CASE p_resource
        WHEN 'tasks' THEN RETURN p_action IN ('read');
        WHEN 'polls' THEN RETURN p_action IN ('read', 'write');
        WHEN 'calendar' THEN RETURN p_action IN ('read');
        WHEN 'basecamp' THEN RETURN p_action IN ('read');
        WHEN 'links' THEN RETURN p_action IN ('read', 'write');
        ELSE RETURN FALSE;
      END CASE;
    WHEN 'pro_coordinator' THEN
      CASE p_resource
        WHEN 'tasks' THEN RETURN p_action IN ('read', 'write', 'delete');
        WHEN 'polls' THEN RETURN p_action IN ('read', 'write');
        WHEN 'calendar' THEN RETURN p_action IN ('read', 'write', 'delete');
        WHEN 'basecamp' THEN RETURN p_action IN ('read');
        WHEN 'links' THEN RETURN p_action IN ('read', 'write', 'delete');
        ELSE RETURN FALSE;
      END CASE;
    WHEN 'event_organizer' THEN
      CASE p_resource
        WHEN 'tasks' THEN RETURN p_action IN ('read', 'write', 'delete', 'admin');
        WHEN 'polls' THEN RETURN p_action IN ('read', 'write', 'delete', 'admin');
        WHEN 'calendar' THEN RETURN p_action IN ('read', 'write', 'delete', 'admin');
        WHEN 'basecamp' THEN RETURN p_action IN ('read', 'write', 'delete', 'admin');
        WHEN 'links' THEN RETURN p_action IN ('read', 'write', 'delete', 'admin');
        ELSE RETURN FALSE;
      END CASE;
    WHEN 'event_attendee' THEN
      CASE p_resource
        WHEN 'tasks' THEN RETURN p_action IN ('read');
        WHEN 'polls' THEN RETURN p_action IN ('read');
        WHEN 'calendar' THEN RETURN p_action IN ('read');
        WHEN 'basecamp' THEN RETURN p_action IN ('read');
        WHEN 'links' THEN RETURN p_action IN ('read');
        ELSE RETURN FALSE;
      END CASE;
    ELSE RETURN FALSE;
  END CASE;
END;
$$;

-- ---------------------------------------------------------------------------
-- Resolve the matrix role for an actor on a trip
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_trip_permission_role(
  p_user_id UUID,
  p_trip_id TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip_type TEXT;
  v_permission_level public.permission_level;
  v_has_admin_row BOOLEAN;
  v_is_creator BOOLEAN;
  v_has_organizer_role BOOLEAN;
BEGIN
  IF p_user_id IS NULL OR p_trip_id IS NULL THEN
    RETURN 'consumer_guest';
  END IF;

  IF public.is_super_admin() AND p_user_id = auth.uid() THEN
    RETURN 'super_admin';
  END IF;

  IF NOT public.is_active_trip_member(p_user_id, p_trip_id) THEN
    RETURN 'consumer_guest';
  END IF;

  SELECT COALESCE(trip_type, 'consumer') INTO v_trip_type
  FROM public.trips
  WHERE id = p_trip_id;

  IF v_trip_type IS NULL OR v_trip_type = 'consumer' THEN
    RETURN 'consumer_member';
  END IF;

  IF v_trip_type = 'event' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = p_trip_id AND t.created_by = p_user_id
    ) INTO v_is_creator;

    SELECT EXISTS (
      SELECT 1 FROM public.trip_admins ta
      WHERE ta.trip_id = p_trip_id AND ta.user_id = p_user_id
    ) INTO v_has_admin_row;

    SELECT EXISTS (
      SELECT 1
      FROM public.user_trip_roles utr
      JOIN public.trip_roles tr ON tr.id = utr.role_id
      WHERE utr.trip_id = p_trip_id
        AND utr.user_id = p_user_id
        AND (
          lower(tr.role_name) IN ('organizer', 'admin')
          OR tr.permission_level = 'admin'::public.permission_level
        )
    ) INTO v_has_organizer_role;

    IF v_is_creator OR v_has_admin_row OR v_has_organizer_role THEN
      RETURN 'event_organizer';
    END IF;

    RETURN 'event_attendee';
  END IF;

  -- Pro trips
  SELECT EXISTS (
    SELECT 1 FROM public.trip_admins ta
    WHERE ta.trip_id = p_trip_id AND ta.user_id = p_user_id
  ) INTO v_has_admin_row;

  SELECT tr.permission_level INTO v_permission_level
  FROM public.user_trip_roles utr
  JOIN public.trip_roles tr ON tr.id = utr.role_id
  WHERE utr.trip_id = p_trip_id
    AND utr.user_id = p_user_id
    AND utr.is_primary = TRUE
  LIMIT 1;

  IF v_has_admin_row OR v_permission_level = 'admin'::public.permission_level THEN
    RETURN 'pro_admin';
  END IF;

  IF v_permission_level = 'edit'::public.permission_level THEN
    RETURN 'pro_editor';
  END IF;

  IF v_permission_level = 'view'::public.permission_level THEN
    RETURN 'pro_viewer';
  END IF;

  -- Pro member without explicit role assignment defaults to editor (client parity)
  RETURN 'pro_editor';
END;
$$;

CREATE OR REPLACE FUNCTION public.can_trip_actor_for_user(
  p_user_id UUID,
  p_trip_id TEXT,
  p_resource TEXT,
  p_action TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.permission_matrix_allows(
    public.resolve_trip_permission_role(p_user_id, p_trip_id),
    p_resource,
    p_action
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.can_trip_actor(
  p_trip_id TEXT,
  p_resource TEXT,
  p_action TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN public.can_trip_actor_for_user(auth.uid(), p_trip_id, p_resource, p_action);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_trip_mutation_permissions(p_trip_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_trip_type TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN json_build_object(
      'role', 'consumer_guest', 'trip_type', 'consumer',
      'can_create_task', FALSE, 'can_edit_task', FALSE, 'can_delete_task', FALSE,
      'can_create_poll', FALSE, 'can_close_poll', FALSE, 'can_delete_poll', FALSE,
      'can_create_event', FALSE, 'can_edit_event', FALSE, 'can_delete_event', FALSE,
      'can_set_basecamp', FALSE, 'can_save_link', FALSE
    );
  END IF;

  v_role := public.resolve_trip_permission_role(auth.uid(), p_trip_id);

  SELECT COALESCE(trip_type, 'consumer') INTO v_trip_type
  FROM public.trips
  WHERE id = p_trip_id;

  RETURN json_build_object(
    'role', v_role,
    'trip_type', COALESCE(v_trip_type, 'consumer'),
    'can_create_task',  public.permission_matrix_allows(v_role, 'tasks', 'write'),
    'can_edit_task',    public.permission_matrix_allows(v_role, 'tasks', 'write'),
    'can_delete_task',  public.permission_matrix_allows(v_role, 'tasks', 'delete'),
    'can_create_poll',  public.permission_matrix_allows(v_role, 'polls', 'write'),
    'can_close_poll',   public.permission_matrix_allows(v_role, 'polls', 'admin'),
    'can_delete_poll',  public.permission_matrix_allows(v_role, 'polls', 'delete'),
    'can_create_event', public.permission_matrix_allows(v_role, 'calendar', 'write'),
    'can_edit_event',   public.permission_matrix_allows(v_role, 'calendar', 'write'),
    'can_delete_event', public.permission_matrix_allows(v_role, 'calendar', 'delete'),
    'can_set_basecamp', public.permission_matrix_allows(v_role, 'basecamp', 'admin'),
    'can_save_link',    public.permission_matrix_allows(v_role, 'links', 'write')
  );
END;
$$;

-- Grants. Revoke the implicit PUBLIC grant and the explicit anon one Supabase's default privileges
-- add, then grant only what each caller needs. can_trip_actor_for_user also goes to service_role
-- because edge functions call it with an explicit actor id.
REVOKE EXECUTE ON FUNCTION public.permission_matrix_allows(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.resolve_trip_permission_role(UUID, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_trip_actor_for_user(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_trip_actor(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_trip_mutation_permissions(TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.permission_matrix_allows(TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.resolve_trip_permission_role(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_trip_actor_for_user(UUID, TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_trip_actor(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trip_mutation_permissions(TEXT) TO authenticated;

COMMENT ON FUNCTION public.get_trip_mutation_permissions IS
  'Server-side mutation-permission resolver for useMutationPermissions. Advisory only — RLS remains '
  'the enforcement boundary. The policy-rebinding half of 20260626140000 is deliberately NOT '
  'applied; see that file and 20260805130000 for the reasoning.';
