-- Feature Flag Cohort Columns
-- Adds optional cohort-targeting columns to public.feature_flags so a feature can
-- be released to a specific set of internal testers / named beta users regardless
-- of the percentage rollout. Consumed by the generalized gradual-rollout helpers
-- (`useGradualFeature` client-side, `isFeatureEnabledForUser` in edge functions).
--
-- Purely additive and idempotent: safe to be live in production before any feature
-- turns its flag on. Existing rows backfill to empty arrays via the column default.
--
-- SECURITY NOTE: feature_flags is world-readable by design (fast unauthenticated
-- client flag checks — see the "Anyone can read feature flags" RLS policy). These
-- cohort columns inherit that: keep them to non-sensitive values only — company
-- email domains and opaque beta-tester UUIDs. Do NOT store anything private here.
--
-- Targeting semantics (applied by the app, NOT the database):
--   * A user whose email domain is in cohort_domains   -> always in (dogfood cohort).
--   * A user whose id is in cohort_user_ids            -> always in (named beta testers).
--   * Otherwise -> deterministic per-user bucket: hash(key:user_id) % 100 < rollout_percentage.

ALTER TABLE public.feature_flags
  ADD COLUMN IF NOT EXISTS cohort_domains TEXT[] DEFAULT '{}'::text[];

ALTER TABLE public.feature_flags
  ADD COLUMN IF NOT EXISTS cohort_user_ids UUID[] DEFAULT '{}'::uuid[];

COMMENT ON COLUMN public.feature_flags.cohort_domains IS
  'Email domains always granted this feature (internal-tester cohort), regardless of rollout_percentage. World-readable — non-sensitive values only.';
COMMENT ON COLUMN public.feature_flags.cohort_user_ids IS
  'Specific auth.users ids always granted this feature (named beta testers), regardless of rollout_percentage. World-readable — opaque UUIDs only.';
