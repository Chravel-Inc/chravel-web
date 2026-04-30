-- Returns canonical pending request cards for the authenticated requester.
-- Security goals:
-- 1) Keep requester-scoped filtering on auth.uid()
-- 2) Return only safe dashboard card metadata
-- 3) Avoid broadening raw trips table read policies

CREATE OR REPLACE FUNCTION public.get_my_pending_trip_request_cards()
RETURNS TABLE (
  request_id uuid,
  trip_id uuid,
  request_status text,
  requested_at timestamptz,
  trip_type text,
  title text,
  destination text,
  start_date date,
  end_date date,
  cover_image_url text,
  member_count integer,
  places_count integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id AS request_id,
    t.id AS trip_id,
    r.status::text AS request_status,
    r.requested_at AS requested_at,
    t.trip_type::text AS trip_type,
    t.name::text AS title,
    t.destination::text AS destination,
    t.start_date,
    t.end_date,
    t.cover_image_url::text AS cover_image_url,
    GREATEST(
      (
        COUNT(DISTINCT tm.user_id)
        + CASE
            WHEN COALESCE(BOOL_OR(tm.user_id = t.created_by), false) THEN 0
            ELSE 1
          END
      )::integer,
      1
    ) AS member_count,
    COUNT(DISTINCT NULLIF(LOWER(TRIM(te.location)), ''))::integer AS places_count
  FROM public.trip_join_requests r
  JOIN public.trips t
    ON t.id = r.trip_id
  LEFT JOIN public.trip_members tm
    ON tm.trip_id = t.id
  LEFT JOIN public.trip_events te
    ON te.trip_id = t.id
  WHERE r.user_id = auth.uid()
    AND r.status = 'pending'
  GROUP BY
    r.id,
    t.id,
    r.status,
    r.requested_at,
    t.trip_type,
    t.name,
    t.destination,
    t.start_date,
    t.end_date,
    t.cover_image_url,
    t.created_by
  ORDER BY r.requested_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_pending_trip_request_cards() TO authenticated;

COMMENT ON FUNCTION public.get_my_pending_trip_request_cards() IS
'Requester-scoped pending join request cards with safe trip metadata and counts.';

