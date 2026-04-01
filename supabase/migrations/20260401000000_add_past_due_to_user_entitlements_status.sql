-- Extend user_entitlements.status CHECK constraint to include 'past_due'.
--
-- 'past_due' is used by both the RevenueCat webhook (BILLING_ISSUE events) and the
-- Stripe webhook when a subscription payment fails but RevenueCat/Stripe is still
-- retrying. The TypeScript EntitlementStatus type already includes 'past_due' and
-- isEffectivelyActive() grants access during this grace period. This migration
-- brings the DB constraint in sync with the application layer.
--
-- Two-phase approach required for CHECK on existing column:
--   1. Drop the old constraint by name (Postgres named it automatically).
--   2. Add the new constraint with 'past_due' included.

ALTER TABLE public.user_entitlements
  DROP CONSTRAINT IF EXISTS user_entitlements_status_check;

ALTER TABLE public.user_entitlements
  ADD CONSTRAINT user_entitlements_status_check
  CHECK (status IN ('active', 'trialing', 'past_due', 'expired', 'canceled'));
