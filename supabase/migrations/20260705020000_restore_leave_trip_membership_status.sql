-- Restore trip_members.status/left_at and the leave_trip() RPC.
--
-- Root cause: 20260218000000_trip_persistence_after_creator_leaves.sql (and its
-- follow-up 20260218000001_leave_trip_edge_cases.sql) were never applied to this
-- project. Verified directly against the live schema: trip_members has no
-- status/left_at columns, and is_active_trip_member()/leave_trip() do not exist.
-- Meanwhile src/hooks/useTripMembersQuery.ts calls supabase.rpc('leave_trip', ...)
-- unconditionally, so the "leave trip" action has been erroring for every caller.
--
-- This is NOT a replay of the old migration files. Several migrations landed
-- since then (notably 20260509210620 and 20260603120000) that already write
-- conditional SQL branching on whether trip_members.status exists, including a
-- fix for "infinite recursion detected in policy for relation trips" on the
-- trips UPDATE policy. Replaying the old files verbatim would recreate
-- pre-recursion-fix policy logic. This migration only adds the missing
-- schema/function/RPC and makes the single additive change needed for
-- leave_trip to have any effect (trips SELECT policy honors active status),
-- without touching anything the recursion fix or later migrations own.

-- 1. Schema: add status/left_at to trip_members (idempotent).
ALTER TABLE public.trip_members ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.trip_members ADD COLUMN IF NOT EXISTS left_at TIMESTAMPTZ;

-- 2. is_active_trip_member: mirrors is_trip_member but excludes left members.
--    Additive — is_trip_member itself is untouched, so every existing caller
--    (trip_members SELECT policy, notify triggers, etc.) is unaffected.
CREATE OR REPLACE FUNCTION public.is_active_trip_member(_user_id uuid, _trip_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.trip_members
    WHERE user_id = _user_id AND trip_id = _trip_id
      AND (status IS NULL OR status = 'active')
  )
$function$;

-- 3. trips SELECT policy: swap is_trip_member -> is_active_trip_member so a
--    member who leaves actually loses visibility. Creator access is preserved
--    both inline here (unchanged) and via the separate, untouched
--    "Trip creators can view their own trips" policy (permissive policies OR).
DROP POLICY IF EXISTS "Users can view their trips" ON public.trips;
CREATE POLICY "Users can view their trips"
ON public.trips FOR SELECT TO authenticated
USING (
  (SELECT auth.uid()) = created_by
  OR public.is_active_trip_member((SELECT auth.uid()), id)
);

-- 4. leave_trip RPC. SECURITY DEFINER, so it bypasses RLS for its own writes —
--    no new trip_members RLS policy needed (the existing hard-delete
--    "Users can leave trips" DELETE policy is untouched and remains available).
--    Soft-delete only: sets status='left', never removes the row, so history/
--    audit trails and existing FKs onto trip_members stay intact.
CREATE OR REPLACE FUNCTION public.leave_trip(_trip_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_creator_id uuid;
  v_active_count int;
  v_new_admin uuid;
  v_is_creator boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'You must be logged in');
  END IF;

  SELECT created_by INTO v_creator_id FROM public.trips WHERE id = _trip_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Trip not found');
  END IF;

  IF NOT public.is_active_trip_member(v_user_id, _trip_id) THEN
    RETURN jsonb_build_object('success', false, 'message', 'You are not a member of this trip');
  END IF;

  v_is_creator := (v_creator_id = v_user_id);

  -- Active members excluding self, computed before the soft-delete below.
  SELECT COUNT(*) INTO v_active_count
  FROM public.trip_members
  WHERE trip_id = _trip_id AND (status IS NULL OR status = 'active') AND user_id != v_user_id;

  UPDATE public.trip_members
  SET status = 'left', left_at = now()
  WHERE trip_id = _trip_id AND user_id = v_user_id;

  -- Last active member leaving: archive the trip (reuses the existing
  -- is_archived flag already enforced by the trip-cover RLS policies).
  IF v_active_count = 0 THEN
    UPDATE public.trips SET is_archived = true WHERE id = _trip_id;
    RETURN jsonb_build_object('success', true, 'archived', true);
  END IF;

  -- Creator leaving with others remaining: promote the longest-tenured member.
  IF v_is_creator THEN
    SELECT user_id INTO v_new_admin
    FROM public.trip_members
    WHERE trip_id = _trip_id AND (status IS NULL OR status = 'active')
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_new_admin IS NOT NULL THEN
      UPDATE public.trip_members SET role = 'admin' WHERE trip_id = _trip_id AND user_id = v_new_admin;
      INSERT INTO public.trip_admins (trip_id, user_id, granted_by, permissions)
      VALUES (_trip_id, v_new_admin, v_user_id, '{"can_manage_roles":true,"can_manage_channels":true,"can_designate_admins":true}'::jsonb)
      ON CONFLICT (trip_id, user_id) DO UPDATE SET permissions = EXCLUDED.permissions;
    END IF;

    RETURN jsonb_build_object('success', true, 'notify_user_id', v_new_admin);
  END IF;

  RETURN jsonb_build_object('success', true, 'notify_user_id', v_creator_id);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.leave_trip(text) TO authenticated;
