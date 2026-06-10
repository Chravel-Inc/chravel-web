-- Trip Chaos Diagnostic — onboarding survey responses
--
-- A per-user, user-owned table capturing the short diagnostic survey shown before
-- the product tour. First-party activation data: one row per completed survey.
-- RLS mirrors the user-owned pattern in 001_audio_summaries.sql (auth.uid() = user_id).

CREATE TABLE IF NOT EXISTS public.onboarding_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  frustration_level text,
  scattered_apps text[] NOT NULL DEFAULT '{}',
  scroll_pain text,
  biggest_chaos text,
  desired_solution text,
  chaos_score integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;

-- Users can only insert rows owned by themselves (user_id defaults to auth.uid()).
DROP POLICY IF EXISTS "Users insert own onboarding responses" ON public.onboarding_responses;
CREATE POLICY "Users insert own onboarding responses"
  ON public.onboarding_responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only read their own responses.
DROP POLICY IF EXISTS "Users view own onboarding responses" ON public.onboarding_responses;
CREATE POLICY "Users view own onboarding responses"
  ON public.onboarding_responses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_responses_user
  ON public.onboarding_responses (user_id);

-- Kill switch: disable the diagnostic survey in <60s without a redeploy.
-- When off (or unreachable), new users go straight to the tour from screen 0.
INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('onboarding_survey', true, 'Trip Chaos Diagnostic survey shown before the onboarding tour')
ON CONFLICT (key) DO NOTHING;
