-- Google Maps API Cache and Quota Tracking
-- Created: 2025-02-01
-- Purpose: Server-side caching for Google Places API responses (30-day TTL)
--          and quota/usage tracking to prevent unexpected costs
--
-- REWRITTEN 2026-08-04. This migration had never been applied to production (verified: neither
-- table existed), and as originally written it would not have worked if it had been. It backs a
-- LIVE code path — src/services/googlePlacesCache.ts, called by googlePlacesNew.ts on every
-- autocomplete / text-search / nearby-search / place-details / geocode, reached from
-- LocationSearchBar → TripGrid — so with it missing every Places lookup bypasses the cache and hits
-- Google's paid API. All four call sites fail open, which is why nothing ever errored.
--
-- Four defects fixed versus the original:
--
--   1. AUTHORIZATION (the fatal one). The functions were SECURITY INVOKER, but both tables have RLS
--      with policies for `service_role` only. The browser calls these as `authenticated`, so every
--      cache read returned NULL and every write was rejected — a 0% hit rate, permanently. The
--      cache RPCs are now SECURITY DEFINER with `SET search_path = public`, and the tables are
--      deny-all to clients (RLS on, no client policies, grants revoked) so the definer functions
--      are the only door. This mirrors the poll_vote_ledger pattern.
--
--   2. CLIENT-SUPPLIED user_id. record_api_usage / get_hourly_usage / get_daily_usage took
--      p_user_id from the caller. Combined with SECURITY DEFINER that would let any user write
--      usage as — and read usage of — anyone else. The parameter is retained for call-site
--      compatibility but IGNORED; identity always comes from auth.uid().
--
--   3. `p_days || 7` in get_daily_usage is string CONCATENATION, not a null-guard: p_days = 7
--      produced '77' → 77 days. Replaced with COALESCE(p_days, 7).
--
--   4. UNIQUE (user_id, api_endpoint, date_hour) with a NULL user_id never conflicts, because NULLs
--      are distinct in a unique constraint. recordApiUsage() is called without a user id, so
--      `ON CONFLICT ... DO UPDATE` would never have matched and every single Places request would
--      have inserted a new row instead of incrementing one. Now NULLS NOT DISTINCT (PG 15+;
--      production is 17.6), and user_id is resolved from auth.uid() anyway.
--
-- Also: schema-qualified throughout, and the expiry cleanup is actually scheduled (it defined a
-- cleanup function that nothing ever called, so the cache would have grown without bound).
--
-- Regression scope: two new tables plus their RPCs, reachable only through this service. No
-- existing policy, trip fetch, auth hydration, or payment surface is touched. Cached rows hold
-- public Google Places responses keyed by a hash of the query — no PII, no trip data.

CREATE TABLE IF NOT EXISTS public.google_places_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  place_id TEXT,
  query_text TEXT NOT NULL,
  origin_lat DECIMAL(10, 8),
  origin_lng DECIMAL(11, 8),
  api_endpoint TEXT NOT NULL,
  response_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_google_places_cache_key
  ON public.google_places_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_google_places_cache_expires
  ON public.google_places_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_google_places_cache_place_id
  ON public.google_places_cache(place_id) WHERE place_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.google_maps_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  api_endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  date_hour TIMESTAMPTZ NOT NULL,
  date_day DATE NOT NULL,
  estimated_cost_usd DECIMAL(10, 6) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NULLS NOT DISTINCT so anonymous (user_id IS NULL) usage aggregates into one row per
-- endpoint/hour instead of inserting a fresh row per request.
ALTER TABLE public.google_maps_api_usage
  DROP CONSTRAINT IF EXISTS google_maps_api_usage_unique;
ALTER TABLE public.google_maps_api_usage
  ADD CONSTRAINT google_maps_api_usage_unique
  UNIQUE NULLS NOT DISTINCT (user_id, api_endpoint, date_hour);

CREATE INDEX IF NOT EXISTS idx_google_maps_api_usage_hour
  ON public.google_maps_api_usage(date_hour, api_endpoint);
CREATE INDEX IF NOT EXISTS idx_google_maps_api_usage_day
  ON public.google_maps_api_usage(date_day, api_endpoint);
CREATE INDEX IF NOT EXISTS idx_google_maps_api_usage_user
  ON public.google_maps_api_usage(user_id, date_day) WHERE user_id IS NOT NULL;

-- Deny-all to clients: RLS on with no client policies, and grants revoked. Only the SECURITY
-- DEFINER functions below (which run as owner) touch these tables.
ALTER TABLE public.google_places_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_maps_api_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.google_places_cache FROM anon, authenticated;
REVOKE ALL ON public.google_maps_api_usage FROM anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Cache read/write
-- ---------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_places_cache(p_cache_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cached_data JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT response_data INTO cached_data
  FROM public.google_places_cache
  WHERE cache_key = p_cache_key
    AND expires_at > NOW()
  LIMIT 1;

  RETURN cached_data;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_places_cache(
  p_cache_key TEXT,
  p_query_text TEXT,
  p_api_endpoint TEXT,
  p_response_data JSONB,
  p_place_id TEXT DEFAULT NULL,
  p_origin_lat DECIMAL DEFAULT NULL,
  p_origin_lng DECIMAL DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cache_id UUID;
BEGIN
  -- Authenticated callers only. The cache is shared, so an anonymous writer could poison entries
  -- other users read; requiring auth bounds that to identifiable accounts. Callers treat caching as
  -- best-effort, so returning NULL here degrades to "no cache", never an error.
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  IF p_cache_key IS NULL OR btrim(p_cache_key) = '' THEN
    RETURN NULL;
  END IF;

  IF p_api_endpoint NOT IN ('autocomplete', 'text-search', 'place-details', 'nearby-search') THEN
    RETURN NULL;
  END IF;

  -- Bound the row so the cache cannot be used as free general-purpose storage.
  IF pg_column_size(p_response_data) > 262144 THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.google_places_cache (
    cache_key, query_text, api_endpoint, response_data,
    place_id, origin_lat, origin_lng, expires_at
  ) VALUES (
    p_cache_key, left(COALESCE(p_query_text, ''), 500), p_api_endpoint, p_response_data,
    p_place_id, p_origin_lat, p_origin_lng, NOW() + INTERVAL '30 days'
  )
  ON CONFLICT (cache_key) DO UPDATE SET
    response_data = EXCLUDED.response_data,
    expires_at = NOW() + INTERVAL '30 days',
    created_at = NOW()
  RETURNING id INTO cache_id;

  RETURN cache_id;
END;
$$;

-- ---------------------------------------------------------------------------------------------
-- Usage / quota tracking. p_user_id is accepted for call-site compatibility but IGNORED —
-- identity is always auth.uid(), never client-supplied.
-- ---------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.record_api_usage(
  p_api_endpoint TEXT,
  p_user_id UUID DEFAULT NULL,
  p_estimated_cost_usd DECIMAL DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date_hour TIMESTAMPTZ := date_trunc('hour', NOW());
  v_uid UUID := auth.uid();
BEGIN
  IF p_api_endpoint IS NULL
     OR p_api_endpoint NOT IN ('autocomplete', 'text-search', 'place-details', 'nearby-search', 'geocode')
  THEN
    RETURN;
  END IF;

  INSERT INTO public.google_maps_api_usage (
    user_id, api_endpoint, request_count, date_hour, date_day, estimated_cost_usd
  ) VALUES (
    v_uid, p_api_endpoint, 1, v_date_hour, CURRENT_DATE, GREATEST(COALESCE(p_estimated_cost_usd, 0), 0)
  )
  ON CONFLICT (user_id, api_endpoint, date_hour) DO UPDATE SET
    request_count = public.google_maps_api_usage.request_count + 1,
    estimated_cost_usd = public.google_maps_api_usage.estimated_cost_usd
                         + GREATEST(COALESCE(p_estimated_cost_usd, 0), 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_hourly_usage(
  p_api_endpoint TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  request_count BIGINT,
  estimated_cost_usd DECIMAL,
  date_hour TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT SUM(u.request_count)::BIGINT, SUM(u.estimated_cost_usd), u.date_hour
  FROM public.google_maps_api_usage u
  WHERE u.api_endpoint = p_api_endpoint
    AND u.user_id = v_uid
    AND u.date_hour >= date_trunc('hour', NOW() - INTERVAL '24 hours')
  GROUP BY u.date_hour
  ORDER BY u.date_hour DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_daily_usage(
  p_api_endpoint TEXT,
  p_user_id UUID DEFAULT NULL,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  request_count BIGINT,
  estimated_cost_usd DECIMAL,
  date_day DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_days INTEGER := LEAST(GREATEST(COALESCE(p_days, 7), 1), 365);
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT SUM(u.request_count)::BIGINT, SUM(u.estimated_cost_usd), u.date_day
  FROM public.google_maps_api_usage u
  WHERE u.api_endpoint = p_api_endpoint
    AND u.user_id = v_uid
    -- was `CURRENT_DATE - (p_days || 7)::INTEGER` — `||` concatenates, so 7 became 77.
    AND u.date_day >= CURRENT_DATE - v_days
  GROUP BY u.date_day
  ORDER BY u.date_day DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_places_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.google_places_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Grants: clients reach these only through the definer functions above.
--
-- Revoking from PUBLIC alone is NOT enough. Supabase ships ALTER DEFAULT PRIVILEGES granting
-- EXECUTE on new functions to anon/authenticated/service_role, so `anon` holds an EXPLICIT grant in
-- addition to the implicit PUBLIC one — verified after the first apply of this migration
-- (has_function_privilege('anon', 'set_places_cache…') was still true post-REVOKE FROM PUBLIC).
-- Both have to go. (This is the mirror image of the check_invite_code_exists bug, where the grant
-- was on PUBLIC and `REVOKE … FROM anon` was the no-op.)
REVOKE EXECUTE ON FUNCTION public.get_places_cache(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_places_cache(TEXT, TEXT, TEXT, JSONB, TEXT, DECIMAL, DECIMAL) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_api_usage(TEXT, UUID, DECIMAL) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_hourly_usage(TEXT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_daily_usage(TEXT, UUID, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_places_cache() FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.get_places_cache(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_places_cache(TEXT, TEXT, TEXT, JSONB, TEXT, DECIMAL, DECIMAL) FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_api_usage(TEXT, UUID, DECIMAL) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_hourly_usage(TEXT, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_daily_usage(TEXT, UUID, INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_places_cache() FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_places_cache(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_places_cache(TEXT, TEXT, TEXT, JSONB, TEXT, DECIMAL, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_api_usage(TEXT, UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_hourly_usage(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_usage(TEXT, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_places_cache() TO service_role;

-- The original defined a cleanup function and never called it, so the cache would have grown
-- without bound. Schedule it daily (idempotent: unschedule-then-schedule).
DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('cleanup-expired-places-cache')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-expired-places-cache');

    PERFORM cron.schedule(
      'cleanup-expired-places-cache',
      '17 4 * * *',
      $job$SELECT public.cleanup_expired_places_cache();$job$
    );
  END IF;
END;
$cron$;

COMMENT ON TABLE public.google_places_cache IS 'Caches Google Places API responses for 30 days to cut API calls and cost. Key is a hash of query + origin + endpoint. Client access only via get_places_cache/set_places_cache.';
COMMENT ON TABLE public.google_maps_api_usage IS 'Google Maps API usage per user/endpoint/hour for quota and cost monitoring. Client access only via record_api_usage/get_hourly_usage/get_daily_usage.';
