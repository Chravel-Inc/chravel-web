-- Billing ops telemetry: entitlement audit trail + webhook failure tracking.
-- Service-role only (RLS enabled, no user policies — edge functions use service_role).

CREATE TABLE IF NOT EXISTS public.entitlement_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_plan text,
  new_plan text,
  old_status text,
  new_status text,
  source text NOT NULL,
  event_id text,
  event_type text,
  purchase_type text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.entitlement_audit_log ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.entitlement_audit_log IS
  'Append-only entitlement change trail written by stripe-webhook / revenuecat-webhook. RLS fail-closed; service_role only.';

CREATE INDEX IF NOT EXISTS idx_entitlement_audit_user_created
  ON public.entitlement_audit_log (user_id, created_at DESC);

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

ALTER TABLE public.billing_webhook_processing_failures ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.billing_webhook_processing_failures IS
  'Operational telemetry for billing webhook processing failures. RLS fail-closed; service_role only.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_webhook_failure_provider_event
  ON public.billing_webhook_processing_failures (provider, event_id);

CREATE OR REPLACE VIEW public.billing_webhook_ops_dashboard AS
SELECT
  provider,
  COUNT(*) FILTER (WHERE resolved_at IS NULL) AS open_failures,
  COUNT(*) FILTER (WHERE resolved_at IS NOT NULL) AS resolved_failures,
  MAX(last_seen_at) AS latest_failure_at
FROM public.billing_webhook_processing_failures
GROUP BY provider;

-- Billing checkout kill switch (enabled by default; flip to false to disable paywall entry)
INSERT INTO public.feature_flags (key, enabled, rollout_percentage, description)
VALUES (
  'billing-checkout-enabled',
  true,
  100,
  'Kill switch for Stripe checkout / paywall entry (create-checkout edge function)'
)
ON CONFLICT (key) DO NOTHING;
