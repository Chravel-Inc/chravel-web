-- Billing resilience hardening: operational telemetry + reconciliation query surfaces.
-- Keeps entitlement processing state independent from expense-sharing ledger tables.

CREATE TABLE IF NOT EXISTS public.billing_webhook_processing_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('stripe', 'revenuecat')),
  event_id text NOT NULL,
  event_type text NOT NULL,
  failure_stage text NOT NULL,
  error_message text NOT NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  retry_count integer NOT NULL DEFAULT 0,
  resolved_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_webhook_failure_provider_event
  ON public.billing_webhook_processing_failures(provider, event_id);

-- RLS added 2026-07-25. Billing failure telemetry contains provider event ids and raw error
-- messages; without RLS it was readable by any holder of the publishable key. Fail-closed by
-- design: RLS enabled with no policies, so only service_role may access.
-- Enforced by scripts/check-rls-coverage.ts.
ALTER TABLE public.billing_webhook_processing_failures ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.billing_webhook_processing_failures IS
  'Billing webhook processing telemetry. Intentionally fail-closed: RLS enabled with no '
  'policies, so only service_role may access.';

-- security_invoker so the views evaluate under the querying role's RLS rather than the
-- definer's. Without it, billing_entitlement_reconciliation_candidates below would expose
-- user_entitlements joined to profiles.stripe_customer_id / stripe_subscription_id to any
-- caller able to select from the view, bypassing RLS on both base tables. Matches the pattern
-- established in 20251230220000_fix_security_invoker_views.sql.
CREATE OR REPLACE VIEW public.billing_webhook_ops_dashboard
WITH (security_invoker = true) AS
SELECT
  provider,
  COUNT(*) FILTER (WHERE resolved_at IS NULL) AS open_failures,
  COUNT(*) FILTER (WHERE resolved_at IS NOT NULL) AS resolved_failures,
  MAX(last_seen_at) AS latest_failure_at
FROM public.billing_webhook_processing_failures
GROUP BY provider;

CREATE OR REPLACE VIEW public.billing_entitlement_reconciliation_candidates
WITH (security_invoker = true) AS
SELECT
  ue.user_id,
  ue.purchase_type,
  ue.plan,
  ue.status,
  ue.current_period_end,
  p.stripe_customer_id,
  p.stripe_subscription_id
FROM public.user_entitlements ue
LEFT JOIN public.profiles p ON p.user_id = ue.user_id
WHERE ue.source = 'stripe'
  AND ue.purchase_type = 'subscription'
  AND (
    (ue.status IN ('active', 'trialing', 'past_due', 'canceled') AND ue.current_period_end IS NOT NULL AND ue.current_period_end < now())
    OR p.stripe_customer_id IS NULL
  );
