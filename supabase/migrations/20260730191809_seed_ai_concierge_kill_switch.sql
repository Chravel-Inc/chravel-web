-- BACKFILL of a live-applied migration (applied to prod jmjiyekmxwsxkfnqwyaa as version 20260730191809, name 'seed_ai_concierge_kill_switch').
-- Captured verbatim from supabase_migrations.schema_migrations.statements on 2026-08-04
-- so the repo can reproduce the live schema. Already recorded in the live migration
-- history — deploy-migrations.yml will skip it (version/name already present).

-- Ensure the runtime kill switch for AI Concierge exists.
-- Prod was missing this row (client defaulted to enabled); edge + UI both key off it.
-- Data-only seed: no trip/auth/RLS/payment schema changes.
INSERT INTO public.feature_flags (key, enabled, description, rollout_percentage)
VALUES (
  'ai_concierge',
  true,
  'AI Concierge feature — disable to stop all AI queries',
  100
)
ON CONFLICT (key) DO NOTHING;
