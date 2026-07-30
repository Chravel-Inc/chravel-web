-- archive_trip: SECURITY DEFINER archive from card menu (bypasses trips UPDATE RLS pinning).
--
-- Semantics:
-- - Active member with other members remaining → delegate to leave_trip (soft-leave + admin transfer).
-- - Sole/last active member → leave_trip (archives trip server-side).
-- - Legacy creator without an active membership row → archive trip directly.

CREATE OR REPLACE FUNCTION public.archive_trip(_trip_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'You must be logged in');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.trips WHERE id = _trip_id) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Trip not found');
  END IF;

  IF public.is_active_trip_member(v_user_id, _trip_id) THEN
    RETURN public.leave_trip(_trip_id);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.trips
    WHERE id = _trip_id
      AND created_by = v_user_id
      AND COALESCE(is_archived, false) = false
  ) THEN
    UPDATE public.trips
    SET is_archived = true,
        archived_at = COALESCE(archived_at, now()),
        updated_at = now()
    WHERE id = _trip_id;

    RETURN jsonb_build_object('success', true, 'archived', true);
  END IF;

  RETURN jsonb_build_object('success', false, 'message', 'You are not a member of this trip');
END;
$function$;

GRANT EXECUTE ON FUNCTION public.archive_trip(text) TO authenticated;

COMMENT ON FUNCTION public.archive_trip IS
  'Card-menu archive: active members delegate to leave_trip (leave when others remain, archive when last). Legacy creators without membership rows archive directly.';
