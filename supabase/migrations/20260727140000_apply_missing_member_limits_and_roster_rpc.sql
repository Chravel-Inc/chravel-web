-- Apply the trip-member capacity + roster functions that never reached production,
-- and make the paginated roster snapshot-aware.
--
-- WHY THIS EXISTS
-- supabase/migrations/20260626120000_trip_member_limits_roster_rpc_event_chat.sql is
-- present in the repo but its version is ABSENT from supabase_migrations.schema_migrations,
-- and none of its functions exist in the database:
--     get_trip_member_limit, is_trip_at_member_capacity, list_trip_members,
--     can_post_to_trip_chat   -> all missing
-- Consequences in production today:
--   * join-trip/index.ts calls is_trip_at_member_capacity, logs a warning on the
--     missing-function error and FAILS OPEN -- plan member caps are unenforced.
--   * tripService.listTripMembersPage calls list_trip_members and throws, so the
--     paginated roster (memberCount > PAGINATED_ROSTER_THRESHOLD = 50) is dead.
--
-- This migration re-issues those definitions verbatim from that file, with two
-- deliberate deviations:
--
--  1. approve_join_request is NOT included. It DOES exist in production and has been
--     modified by later migrations (e.g. 20260723190000_dismiss_join_request_active_admin).
--     Replaying the June body would silently revert those fixes.
--
--  2. list_trip_members resolves names from trip_members.display_name_snapshot first.
--     Its original body joined profiles_public, which is security_invoker over a
--     profiles table whose only SELECT policy is (auth.uid() = user_id) -- so every
--     co-member row came back NULL and collapsed to the hardcoded 'Member' label.
--     That is the same defect 20260726120000 fixed for the non-paginated roster; the
--     snapshot columns are now consulted here too, including by the search predicate.


CREATE INDEX IF NOT EXISTS idx_trip_members_trip_id_created_at
  ON public.trip_members (trip_id, created_at ASC);


CREATE OR REPLACE FUNCTION public.get_trip_member_limit(p_trip_id text)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip public.trips%ROWTYPE;
  v_pro_plan text;
  v_consumer_plan text;
BEGIN
  SELECT * INTO v_trip FROM public.trips WHERE id = p_trip_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_trip.trip_type IS NULL OR v_trip.trip_type = 'consumer' THEN
    RETURN NULL;
  END IF;

  SELECT ue.plan
  INTO v_pro_plan
  FROM public.user_entitlements ue
  WHERE ue.user_id = v_trip.created_by
    AND ue.plan IN ('pro-starter', 'pro-growth', 'pro-enterprise')
    AND (
      ue.status IN ('active', 'trialing', 'past_due')
      OR (
        ue.status = 'canceled'
        AND ue.current_period_end IS NOT NULL
        AND ue.current_period_end > now()
      )
    )
  ORDER BY CASE ue.plan
    WHEN 'pro-enterprise' THEN 3
    WHEN 'pro-growth' THEN 2
    WHEN 'pro-starter' THEN 1
    ELSE 0
  END DESC
  LIMIT 1;

  IF v_pro_plan IS NOT NULL THEN
    RETURN CASE v_pro_plan
      WHEN 'pro-starter' THEN 50
      WHEN 'pro-growth' THEN 100
      WHEN 'pro-enterprise' THEN 250
      ELSE NULL
    END;
  END IF;

  IF v_trip.trip_type = 'pro' THEN
    RETURN 50;
  END IF;

  SELECT ue.plan
  INTO v_consumer_plan
  FROM public.user_entitlements ue
  WHERE ue.user_id = v_trip.created_by
    AND ue.plan IN ('frequent-chraveler', 'explorer', 'free')
    AND (
      ue.status IN ('active', 'trialing', 'past_due')
      OR (
        ue.status = 'canceled'
        AND ue.current_period_end IS NOT NULL
        AND ue.current_period_end > now()
      )
    )
  ORDER BY CASE ue.plan
    WHEN 'frequent-chraveler' THEN 3
    WHEN 'explorer' THEN 2
    ELSE 1
  END DESC
  LIMIT 1;

  RETURN CASE COALESCE(v_consumer_plan, 'free')
    WHEN 'frequent-chraveler' THEN 200
    WHEN 'explorer' THEN 100
    ELSE 50
  END;
END;
$$;

COMMENT ON FUNCTION public.get_trip_member_limit(text) IS
'Returns trip member cap from creator plan: Pro Starter 50, Growth 100, Enterprise 250; consumer events 50/100/200; consumer trips unlimited (NULL).';

CREATE OR REPLACE FUNCTION public.is_trip_at_member_capacity(p_trip_id text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit integer;
  v_count integer;
BEGIN
  v_limit := public.get_trip_member_limit(p_trip_id);
  IF v_limit IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT COALESCE(member_count, 0)
  INTO v_count
  FROM public.trips
  WHERE id = p_trip_id;

  RETURN COALESCE(v_count, 0) >= v_limit;
END;
$$;
-- Paginated roster. Snapshot-first: profiles_public cannot resolve co-members under
-- the current profiles RLS, so the pre-existing profiles_public join is kept only as
-- a fallback for rows whose snapshot has not been captured yet.
CREATE OR REPLACE FUNCTION public.list_trip_members(
  p_trip_id text,
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_uid uuid := auth.uid();
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
  v_offset integer := GREATEST(COALESCE(p_offset, 0), 0);
  v_search text := NULLIF(trim(p_search), '');
  v_total integer;
  v_members jsonb;
BEGIN
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.is_active_trip_member(v_auth_uid, p_trip_id) THEN
    RAISE EXCEPTION 'Not a member of this trip';
  END IF;

  WITH filtered AS (
    SELECT
      tm.user_id,
      tm.role,
      tm.created_at,
      COALESCE(
        NULLIF(trim(tm.display_name_snapshot), ''),
        pp.resolved_display_name,
        pp.display_name,
        NULLIF(trim(concat_ws(' ', pp.first_name, pp.last_name)), ''),
        'Chravel User'
      ) AS display_name,
      COALESCE(pp.avatar_url, tm.avatar_url_snapshot) AS avatar_url
    FROM public.trip_members tm
    LEFT JOIN public.profiles_public pp ON pp.user_id = tm.user_id
    WHERE tm.trip_id = p_trip_id
      AND (
        v_search IS NULL
        OR COALESCE(
          NULLIF(trim(tm.display_name_snapshot), ''),
          pp.resolved_display_name,
          pp.display_name,
          pp.first_name,
          pp.last_name,
          ''
        ) ILIKE '%' || v_search || '%'
      )
  ),
  counted AS (
    SELECT COUNT(*)::integer AS total FROM filtered
  )
  SELECT
    (SELECT total FROM counted),
    COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(page) ORDER BY page.created_at ASC, page.user_id ASC)
        FROM (
          SELECT user_id, role, created_at, display_name, avatar_url
          FROM filtered
          ORDER BY created_at ASC, user_id ASC
          LIMIT v_limit OFFSET v_offset
        ) page
      ),
      '[]'::jsonb
    )
  INTO v_total, v_members;

  RETURN jsonb_build_object(
    'members', v_members,
    'total_count', v_total,
    'limit', v_limit,
    'offset', v_offset
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_trip_member_limit(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_trip_at_member_capacity(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_trip_members(text, text, integer, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_post_to_trip_chat(
  _user_id UUID,
  _trip_id TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH trip_ctx AS (
    SELECT
      t.id,
      t.chat_mode,
      t.trip_type,
      tm.role
    FROM public.trips t
    JOIN public.trip_members tm ON tm.trip_id = t.id AND tm.user_id = _user_id
    WHERE t.id = _trip_id
  )
  SELECT EXISTS (
    SELECT 1
    FROM trip_ctx
    WHERE
      trip_type = 'event'
      OR chat_mode = 'everyone'
      OR chat_mode IS NULL
      OR (chat_mode = 'admin_only' AND role IN ('admin', 'organizer', 'owner'))
      OR (chat_mode = 'broadcasts' AND role IN ('admin', 'organizer', 'owner'))
  )
$$;

COMMENT ON FUNCTION public.can_post_to_trip_chat IS
'Checks if a user may post to trip main chat. Events allow all attendees regardless of roster size; restricted modes remain admin-only.';

DROP TRIGGER IF EXISTS enforce_event_chat_mode_size_limit_on_trips ON public.trips;
DROP FUNCTION IF EXISTS public.enforce_event_chat_mode_size_limit();
