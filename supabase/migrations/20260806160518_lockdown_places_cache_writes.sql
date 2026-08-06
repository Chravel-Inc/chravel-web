-- Lock down set_places_cache: authenticated clients must not write the shared Places cache.
--
-- 20250201000000 (applied 2026-08-04) correctly made the cache RPCs SECURITY DEFINER so they
-- could bypass deny-all RLS, and revoked anon. It then GRANTed set_places_cache to
-- authenticated so the browser could populate the cache after a client-side Maps JS call.
--
-- That grant turns the shared cache into a cross-user write surface. Cache keys are a
-- deterministic hash of (endpoint, query, origin) — any signed-in attacker who can compute the
-- same key (trivial; generateCacheKey is in the client bundle) can call set_places_cache and
-- OVERWRITE the entry every other user reads for 30 days. Concrete impact: autocomplete /
-- text-search / nearby-search / place-details results for common queries can be replaced with
-- attacker-chosen place_ids and addresses, steering users to wrong or malicious locations.
--
-- The migration that introduced this already noted the poison risk for anonymous writers and
-- "bounded" it to identifiable accounts — that is not a bound. Shared untrusted client writes
-- to a cross-user cache are the bug.
--
-- Fix:
--   1. REVOKE EXECUTE on set_places_cache from PUBLIC / anon / authenticated.
--   2. GRANT EXECUTE to service_role only (future edge/proxy writers).
--   3. TRUNCATE the table so any already-poisoned rows stop being served immediately.
--
-- Client setCachedPlace() becomes a no-op; get_places_cache stays readable so a future
-- service-role writer can re-seed safely. Until then lookups miss cache and hit Google
-- (the pre-2026-08-04 cost profile). Client-side 1-hour memory cache is unaffected.
--
-- Regression scope: one RPC grant + one truncate on an operational cache table. No trip
-- fetch, auth, RLS policy, or payment path is touched.
--
-- No-regression check:
--   - Trip Not Found: untouched (no trips / membership queries).
--   - Auth desync: untouched (no auth hydration / session reads).
--   - RLS leaks: tightens EXECUTE; does not loosen any policy. Existence≠access unchanged.
--   - Payment-state drift: untouched.

REVOKE EXECUTE ON FUNCTION public.set_places_cache(TEXT, TEXT, TEXT, JSONB, TEXT, DECIMAL, DECIMAL)
  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_places_cache(TEXT, TEXT, TEXT, JSONB, TEXT, DECIMAL, DECIMAL)
  FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_places_cache(TEXT, TEXT, TEXT, JSONB, TEXT, DECIMAL, DECIMAL)
  FROM authenticated;

GRANT EXECUTE ON FUNCTION public.set_places_cache(TEXT, TEXT, TEXT, JSONB, TEXT, DECIMAL, DECIMAL)
  TO service_role;

-- Drop any entries that may already have been written by a client (including poisoned ones).
-- The table holds only Google Places response JSON keyed by query hash — no PII, no trip data.
TRUNCATE TABLE public.google_places_cache;

COMMENT ON FUNCTION public.set_places_cache(TEXT, TEXT, TEXT, JSONB, TEXT, DECIMAL, DECIMAL) IS
  'Writes a Places cache entry. service_role only — authenticated clients must not write the '
  'shared cache (cross-user poison vector). See 20260806160518_lockdown_places_cache_writes.';
