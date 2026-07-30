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
