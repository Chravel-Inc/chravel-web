-- App Store launch: disable bidirectional realtime voice as the Concierge default.
-- Waveform button now triggers Web Speech text dictation instead.
-- Realtime / Vercel AI Gateway code remains in the repo; re-enable this flag
-- only for experimental/internal testing after realtime voice is stable.
--
-- Regression check: feature_flags row only — no trips/auth/RLS/payments touched.
UPDATE public.feature_flags
SET enabled = false,
    description = 'EXPERIMENTAL — Bidirectional realtime voice (OpenAI Realtime via Vercel AI Gateway). App Store path uses waveform dictation; keep disabled unless deliberately testing realtime.',
    updated_at = now()
WHERE key = 'concierge_realtime_voice';

INSERT INTO public.feature_flags (key, enabled, description)
SELECT
  'concierge_realtime_voice',
  false,
  'EXPERIMENTAL — Bidirectional realtime voice (OpenAI Realtime via Vercel AI Gateway). App Store path uses waveform dictation; keep disabled unless deliberately testing realtime.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.feature_flags WHERE key = 'concierge_realtime_voice'
);
