-- Calendar P2/P3 fixes for update_event_with_version.
--
-- 1) Authorization contradicted the trip_events UPDATE RLS policy. The RPC allowed only the event
--    creator or a trip_members row with role='admin', while RLS allows
--    can_manage_trip_calendar(...) OR created_by = auth.uid(). Consequence: on a consumer trip any
--    active member may edit a co-member's event via a direct UPDATE, but the same edit through the
--    versioned RPC failed with 42501; pro/event coordinators holding the shared-calendar capability
--    were likewise rejected. Behavior depended on which code path the client happened to take.
--    Replace the inline check with the same predicate RLS uses — this aligns the RPC with the
--    policy and never grants access beyond it.
--
-- 2) The membership check had no active-status filter, so a member who left the trip still passed.
--    can_manage_trip_calendar() calls is_active_trip_member() internally, which closes that too.
--
-- 3) v_trip_id was declared UUID, but trip_events.trip_id (and trips.id / trip_members.trip_id) are
--    TEXT. Any non-UUID trip id raised 'invalid input syntax for type uuid', and even UUID-shaped
--    ids relied on implicit casts. Declare it TEXT to match the column.
--
-- Only the DECLARE block and the authorization block change; the version guard and UPDATE are
-- preserved verbatim. No trip-loading, auth-hydration, or payment surface is touched.

CREATE OR REPLACE FUNCTION public.update_event_with_version(
  p_event_id uuid,
  p_current_version integer,
  p_title text DEFAULT NULL::text,
  p_description text DEFAULT NULL::text,
  p_start_time timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_end_time timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_location text DEFAULT NULL::text,
  p_event_category text DEFAULT NULL::text,
  p_include_in_itinerary boolean DEFAULT NULL::boolean,
  p_is_all_day boolean DEFAULT NULL::boolean,
  p_source_data jsonb DEFAULT NULL::jsonb
)
RETURNS SETOF trip_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_actual_version INTEGER;
  v_trip_id TEXT;
  v_created_by UUID;
BEGIN
  SELECT version, trip_id, created_by
  INTO v_actual_version, v_trip_id, v_created_by
  FROM trip_events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found' USING ERRCODE = 'P0002';
  END IF;

  -- Mirror the trip_events UPDATE policy exactly: trip-type-aware calendar management
  -- (consumer = any active member; pro/event = creator/admin/coordinator) OR own event.
  IF NOT (
    public.can_manage_trip_calendar(auth.uid(), v_trip_id)
    OR v_created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: cannot manage this trip calendar' USING ERRCODE = '42501';
  END IF;

  IF COALESCE(v_actual_version, 1) != COALESCE(p_current_version, 1) THEN
    RAISE EXCEPTION 'Event has been modified by another user (expected version %, found %)',
      p_current_version, v_actual_version
      USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
  UPDATE trip_events
  SET
    title = CASE WHEN p_title IS NULL THEN title ELSE NULLIF(p_title, '') END,
    description = CASE WHEN p_description IS NULL THEN description ELSE NULLIF(p_description, '') END,
    start_time = COALESCE(p_start_time, start_time),
    end_time = CASE WHEN p_end_time IS NULL THEN end_time ELSE p_end_time END,
    location = CASE WHEN p_location IS NULL THEN location ELSE NULLIF(p_location, '') END,
    event_category = COALESCE(p_event_category, event_category),
    include_in_itinerary = COALESCE(p_include_in_itinerary, include_in_itinerary),
    is_all_day = COALESCE(p_is_all_day, is_all_day),
    source_data = COALESCE(p_source_data, source_data),
    version = COALESCE(v_actual_version, 1) + 1,
    updated_at = NOW()
  WHERE id = p_event_id
  RETURNING *;
END;
$function$;
