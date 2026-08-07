-- Atomic cost reservations for paid, user-triggered operations.
-- A reservation is written before a provider call so concurrent requests cannot
-- overshoot the same daily/monthly allowance.

CREATE TABLE IF NOT EXISTS public.cost_usage_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature text NOT NULL CHECK (feature IN ('voice_tts', 'voice_stt', 'voice_realtime')),
  provider text NOT NULL,
  units bigint NOT NULL CHECK (units > 0),
  actual_units bigint CHECK (actual_units >= 0),
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'committed', 'released')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  finalized_at timestamptz
);

CREATE INDEX IF NOT EXISTS cost_usage_ledger_user_feature_created_idx
  ON public.cost_usage_ledger (user_id, feature, created_at DESC)
  WHERE status IN ('reserved', 'committed');

ALTER TABLE public.cost_usage_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cost usage"
  ON public.cost_usage_ledger FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.reserve_cost_units(
  p_user_id uuid,
  p_feature text,
  p_provider text,
  p_units bigint,
  p_daily_limit bigint,
  p_monthly_limit bigint,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  allowed boolean,
  reservation_id uuid,
  reason text,
  daily_used bigint,
  monthly_used bigint,
  daily_reset_at timestamptz,
  monthly_reset_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
  v_daily bigint;
  v_monthly bigint;
  v_day_start timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  v_month_start timestamptz := date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  IF p_feature NOT IN ('voice_tts', 'voice_stt', 'voice_realtime')
     OR p_units <= 0 OR p_daily_limit <= 0 OR p_monthly_limit <= 0 THEN
    RAISE EXCEPTION 'Invalid cost reservation';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_feature, 0));

  SELECT COALESCE(sum(COALESCE(actual_units, units)), 0)::bigint INTO v_daily
  FROM public.cost_usage_ledger
  WHERE user_id = p_user_id AND feature = p_feature
    AND status IN ('reserved', 'committed') AND created_at >= v_day_start;

  SELECT COALESCE(sum(COALESCE(actual_units, units)), 0)::bigint INTO v_monthly
  FROM public.cost_usage_ledger
  WHERE user_id = p_user_id AND feature = p_feature
    AND status IN ('reserved', 'committed') AND created_at >= v_month_start;

  IF v_daily + p_units > p_daily_limit THEN
    RETURN QUERY SELECT false, NULL::uuid, 'daily_budget_exhausted', v_daily, v_monthly,
      v_day_start + interval '1 day', v_month_start + interval '1 month';
    RETURN;
  END IF;
  IF v_monthly + p_units > p_monthly_limit THEN
    RETURN QUERY SELECT false, NULL::uuid, 'monthly_budget_exhausted', v_daily, v_monthly,
      v_day_start + interval '1 day', v_month_start + interval '1 month';
    RETURN;
  END IF;

  INSERT INTO public.cost_usage_ledger (user_id, feature, provider, units, metadata)
  VALUES (p_user_id, p_feature, p_provider, p_units, COALESCE(p_metadata, '{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN QUERY SELECT true, v_id, NULL::text, v_daily + p_units, v_monthly + p_units,
    v_day_start + interval '1 day', v_month_start + interval '1 month';
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_cost_units(
  p_reservation_id uuid,
  p_user_id uuid,
  p_actual_units bigint DEFAULT NULL,
  p_release boolean DEFAULT false
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_updated integer;
BEGIN
  UPDATE public.cost_usage_ledger
  SET status = CASE WHEN p_release THEN 'released' ELSE 'committed' END,
      actual_units = CASE WHEN p_release THEN 0 ELSE COALESCE(p_actual_units, units) END,
      finalized_at = now()
  WHERE id = p_reservation_id AND user_id = p_user_id AND status = 'reserved'
    AND auth.role() = 'service_role'
    AND (p_actual_units IS NULL OR p_actual_units >= 0);
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_cost_units(uuid, text, text, bigint, bigint, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finalize_cost_units(uuid, uuid, bigint, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_cost_units(uuid, text, text, bigint, bigint, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_cost_units(uuid, uuid, bigint, boolean) TO service_role;

INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('cost_voice_tts', true, 'Cost kill switch for Concierge read-aloud TTS'),
  ('cost_voice_stt', true, 'Cost kill switch for Concierge speech-to-text'),
  ('cost_voice_realtime', false, 'Cost kill switch for experimental realtime voice')
ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description;
