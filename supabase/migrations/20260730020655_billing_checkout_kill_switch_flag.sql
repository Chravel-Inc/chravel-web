-- BACKFILL of a live-applied migration (applied to prod jmjiyekmxwsxkfnqwyaa as version 20260730020655, name 'billing_checkout_kill_switch_flag').
-- Captured verbatim from supabase_migrations.schema_migrations.statements on 2026-08-04
-- so the repo can reproduce the live schema. Already recorded in the live migration
-- history — deploy-migrations.yml will skip it (version/name already present).

INSERT INTO public.feature_flags (key, enabled, rollout_percentage, description)
VALUES (
  'billing-checkout-enabled',
  true,
  100,
  'Kill switch for Stripe checkout / paywall entry (create-checkout edge function)'
)
ON CONFLICT (key) DO NOTHING;
