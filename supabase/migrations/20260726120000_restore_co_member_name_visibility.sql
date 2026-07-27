-- Restore co-member name visibility and make member names durable.
--
-- ROOT CAUSE
-- `public.profiles` carries exactly one SELECT policy:
--     "Users can view their own profile"  USING (auth.uid() = user_id)
-- and `public.profiles_public` is defined WITH (security_invoker = true), so the
-- view inherits that policy. An authenticated trip member can therefore read only
-- their OWN profile row. Every other member's profile resolves to NULL and the app
-- falls through to its "Former Member" label.
--
-- Verified in production as a real authenticated member of a 7-person trip:
--     members visible in trip_members ... 7
--     profiles resolvable via view  ... 1
--
-- WHY NOT THE OBVIOUS FIXES
--  * A co-member SELECT policy on `profiles` would work, but RLS is row-level, not
--    column-level -- it would also expose email, phone, stripe_customer_id and
--    subscription_status to every co-member.
--  * Flipping the view to security_invoker = false would let any authenticated user
--    enumerate every profile in the system.
--
-- FIX (two independent layers)
--  1. Durable identity snapshots on trip_members, mirroring the existing precedent
--     trip_chat_messages.sender_display_name (20260202100000). trip_members is
--     already co-member readable ("Trip members can view fellow members"), so the
--     roster resolves names with no profile read at all.
--  2. A SECURITY DEFINER lookup exposing ONLY user_id / display name / avatar for
--     users who share a trip with the caller, for the call sites that need names of
--     people outside a single roster (tasks, calendar, payments, join requests).
--
-- INVARIANTS PRESERVED
--  * No existing RLS policy is created, altered or dropped.
--  * get_co_member_profiles is gated on auth.uid() IS NOT NULL AND
--    is_trip_co_member(...), so trip existence still != trip access.
--  * anon is explicitly revoked; only `authenticated` may execute.
--  * No payment, subscription or contact column is exposed anywhere here.
--
-- Erasure: the name snapshot is retained so a person is never relabelled, while the
-- avatar snapshot is scrubbed when their profile row is deleted.

-- ---------------------------------------------------------------------------
-- 1. Identity snapshots on trip_members
-- ---------------------------------------------------------------------------

ALTER TABLE public.trip_members
  ADD COLUMN IF NOT EXISTS display_name_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url_snapshot TEXT;

COMMENT ON COLUMN public.trip_members.display_name_snapshot IS
  'Name captured at join time and refreshed on profile rename. Read by the roster so names stay visible under profiles RLS and survive departure. Never scrubbed.';
COMMENT ON COLUMN public.trip_members.avatar_url_snapshot IS
  'Avatar captured alongside display_name_snapshot. Scrubbed when the profile row is deleted.';

-- Shared name formula, matching profiles_public.resolved_display_name.
CREATE OR REPLACE FUNCTION public.compute_display_name(
  p_display_name TEXT,
  p_real_name TEXT,
  p_name_preference TEXT,
  p_first_name TEXT,
  p_last_name TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(TRIM(COALESCE(
    CASE
      WHEN p_name_preference = 'display' AND NULLIF(TRIM(COALESCE(p_display_name, '')), '') IS NOT NULL
        THEN p_display_name
      WHEN NULLIF(TRIM(COALESCE(p_real_name, '')), '') IS NOT NULL THEN p_real_name
      WHEN NULLIF(TRIM(COALESCE(p_display_name, '')), '') IS NOT NULL THEN p_display_name
      ELSE NULLIF(TRIM(CONCAT_WS(' ', p_first_name, p_last_name)), '')
    END,
    ''
  )), '');
$$;

-- Backfill existing rows. The name is recomputed here rather than read from
-- profiles_public because this migration runs without an auth.uid().
UPDATE public.trip_members tm
SET display_name_snapshot = public.compute_display_name(
      p.display_name, p.real_name, p.name_preference, p.first_name, p.last_name
    ),
    avatar_url_snapshot = COALESCE(p.avatar_url, tm.avatar_url_snapshot)
FROM public.profiles p
WHERE p.user_id = tm.user_id
  AND tm.display_name_snapshot IS NULL;

-- ---------------------------------------------------------------------------
-- 2. Keep snapshots current
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.capture_trip_member_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_avatar TEXT;
BEGIN
  IF NEW.display_name_snapshot IS NULL OR NEW.avatar_url_snapshot IS NULL THEN
    SELECT
      public.compute_display_name(
        p.display_name, p.real_name, p.name_preference, p.first_name, p.last_name
      ),
      p.avatar_url
    INTO v_name, v_avatar
    FROM public.profiles p
    WHERE p.user_id = NEW.user_id;

    NEW.display_name_snapshot := COALESCE(NEW.display_name_snapshot, v_name);
    NEW.avatar_url_snapshot := COALESCE(NEW.avatar_url_snapshot, v_avatar);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_capture_trip_member_identity ON public.trip_members;
CREATE TRIGGER trg_capture_trip_member_identity
  BEFORE INSERT ON public.trip_members
  FOR EACH ROW
  EXECUTE FUNCTION public.capture_trip_member_identity();

-- Refresh every roster snapshot when a user renames themselves or changes avatar.
CREATE OR REPLACE FUNCTION public.sync_trip_member_identity_snapshots()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.trip_members tm
  SET display_name_snapshot = COALESCE(
        public.compute_display_name(
          NEW.display_name, NEW.real_name, NEW.name_preference, NEW.first_name, NEW.last_name
        ),
        tm.display_name_snapshot
      ),
      avatar_url_snapshot = NEW.avatar_url
  WHERE tm.user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_trip_member_identity_snapshots ON public.profiles;
CREATE TRIGGER trg_sync_trip_member_identity_snapshots
  AFTER UPDATE OF display_name, real_name, name_preference, first_name, last_name, avatar_url
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_trip_member_identity_snapshots();

-- ---------------------------------------------------------------------------
-- 3. Safe co-member name lookup
-- ---------------------------------------------------------------------------
-- Returns ONLY non-sensitive identity columns, and only for users who actually
-- share a trip with the caller. No email, phone, billing or subscription columns.

-- Dropped first because RETURNS TABLE signatures cannot be changed by REPLACE alone.
DROP FUNCTION IF EXISTS public.get_co_member_profiles(UUID[]);
CREATE OR REPLACE FUNCTION public.get_co_member_profiles(p_user_ids UUID[])
RETURNS TABLE (
  user_id UUID,
  resolved_display_name TEXT,
  avatar_url TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    p.user_id,
    COALESCE(
      public.compute_display_name(
        p.display_name, p.real_name, p.name_preference, p.first_name, p.last_name
      ),
      'Chravel User'
    ) AS resolved_display_name,
    p.avatar_url
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND p.user_id = ANY(p_user_ids)
    AND public.is_trip_co_member(auth.uid(), p.user_id);
$$;

REVOKE ALL ON FUNCTION public.get_co_member_profiles(UUID[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_co_member_profiles(UUID[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_co_member_profiles(UUID[]) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Erasure: retain the name, scrub the avatar
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.scrub_trip_member_identity_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- display_name_snapshot is deliberately preserved so historical rosters keep
  -- showing who the person was; the avatar is personal data and is removed.
  UPDATE public.trip_members
  SET avatar_url_snapshot = NULL
  WHERE user_id = OLD.user_id;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_scrub_trip_member_identity_on_delete ON public.profiles;
CREATE TRIGGER trg_scrub_trip_member_identity_on_delete
  BEFORE DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.scrub_trip_member_identity_on_delete();
