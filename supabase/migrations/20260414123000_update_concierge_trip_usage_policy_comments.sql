-- Align concierge trip usage documentation with canonical plan limits.
-- Canonical limits (see src/lib/conciergeTripQueryLimits.ts):
--   free: 10 queries/trip
--   explorer: 25 queries/trip
--   frequent_chraveler/pro: unlimited

ALTER TABLE public.concierge_trip_usage
  ALTER COLUMN used_count SET DEFAULT 0,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

COMMENT ON TABLE public.concierge_trip_usage IS
  'Per-user, per-trip AI Concierge query counters. Trip limit thresholds are plan-driven in application policy.';

COMMENT ON COLUMN public.concierge_trip_usage.used_count IS
  'Queries consumed for the (user_id, trip_id) pair. Canonical plan caps: free=10, explorer=25, frequent_chraveler=unlimited.';

COMMENT ON FUNCTION public.increment_concierge_trip_usage(TEXT, INTEGER) IS
  'Atomically increments per-trip concierge usage. p_limit should come from canonical plan map (free=10, explorer=25, frequent_chraveler=NULL).';
