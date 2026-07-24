-- Close trips UPDATE privilege-escalation hole (2026-07-23)
--
-- Root cause: migration 20260703132320 created
--   "Trip cover editors can update cover image"
-- with USING/WITH CHECK = can_edit_trip_cover(...) and NO column pinning.
-- Later migrations pinned "Trip members can update cover image only", but RLS
-- OR semantics let the unpinned cover-editors policy bypass that guard.
--
-- Concrete trigger: an active consumer member (or a former member still
-- holding a trip_members row — can_edit_trip_cover ignored status) can
--   supabase.from('trips').update({ created_by: <self>, trip_type: 'pro' })
-- and succeed, stealing ownership / escalating trip type.
--
-- Invariants preserved:
-- - Trip existence != access: can_edit_trip_cover now requires active membership
--   on the consumer member path (status IS NULL OR status = 'active').
-- - Cover-only policy for active members is unchanged (still pinned).
-- - EditTripModal / description / hide keep working via allowlisted details policy.
-- - Archive / created_by / trip_type remain unwritable from the client.
-- - No SELECT / membership policies loosened; no Trip Not Found path touched.
--
-- Fix:
-- 1) Harden can_edit_trip_cover (active membership + COALESCE trip_type).
-- 2) Drop the unpinned cover-editors policy.
-- 3) Restore an allowlisted trip-details UPDATE policy for the same editors.
--
-- Reverse:
--   DROP POLICY IF EXISTS "Authorized users can update trip details" ON public.trips;
--   Recreate the unpinned cover-editors policy from 20260703132320 (not recommended).

-- 1. Harden can_edit_trip_cover ------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_edit_trip_cover(_trip_id text, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.trips t
    LEFT JOIN public.trip_members tm
      ON tm.trip_id = t.id
     AND tm.user_id = _user_id
     AND (tm.status IS NULL OR tm.status = 'active')
    LEFT JOIN public.trip_admins ta
      ON ta.trip_id = t.id
     AND ta.user_id = _user_id
    WHERE t.id = _trip_id
      AND (
        (COALESCE(t.trip_type, 'consumer') = 'consumer' AND tm.user_id IS NOT NULL)
        OR (
          COALESCE(t.trip_type, 'consumer') IN ('pro', 'event')
          AND (t.created_by = _user_id OR ta.user_id IS NOT NULL)
        )
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_edit_trip_cover(text, uuid) TO authenticated, service_role;

-- 2. Drop the unpinned escape hatch -------------------------------------------
DROP POLICY IF EXISTS "Trip cover editors can update cover image" ON public.trips;

-- 3. Allowlisted trip-details UPDATE for cover editors ------------------------
-- Editable: name/description/destination/dates, card chrome, categories,
-- organizer label, per-trip hide flag, cover fields, updated_at.
-- Everything else (created_by, trip_type, is_archived, privacy_mode, chat_mode,
-- basecamp_*, capacity, etc.) is pinned to the current row.
DROP POLICY IF EXISTS "Authorized users can update trip details" ON public.trips;

CREATE POLICY "Authorized users can update trip details" ON public.trips
  FOR UPDATE
  TO authenticated
  USING (public.can_edit_trip_cover(id, auth.uid()))
  WITH CHECK (
    public.can_edit_trip_cover(id, auth.uid())
    AND (
      (
        to_jsonb(trips.*)
          - 'name'
          - 'description'
          - 'destination'
          - 'start_date'
          - 'end_date'
          - 'card_color'
          - 'organizer_display_name'
          - 'categories'
          - 'is_hidden'
          - 'cover_image_url'
          - 'cover_display_mode'
          - 'updated_at'
      )
      =
      (
        SELECT (
          to_jsonb(t.*)
            - 'name'
            - 'description'
            - 'destination'
            - 'start_date'
            - 'end_date'
            - 'card_color'
            - 'organizer_display_name'
            - 'categories'
            - 'is_hidden'
            - 'cover_image_url'
            - 'cover_display_mode'
            - 'updated_at'
        )
        FROM public.trips t
        WHERE t.id = trips.id
      )
    )
  );

COMMENT ON POLICY "Authorized users can update trip details" ON public.trips IS
  'Cover editors (consumer active members; pro/event creator or admin) may update trip details and cover fields. Sensitive columns (created_by, trip_type, is_archived, etc.) are jsonb-pinned.';
