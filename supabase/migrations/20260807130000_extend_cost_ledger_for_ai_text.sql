-- Extend the canonical atomic ledger only for paid text Concierge inference.
-- The voice migration remains the source of the table/RPC definitions.

ALTER TABLE public.cost_usage_ledger
  DROP CONSTRAINT IF EXISTS cost_usage_ledger_feature_check;

ALTER TABLE public.cost_usage_ledger
  ADD CONSTRAINT cost_usage_ledger_feature_check
  CHECK (feature IN ('voice_tts', 'voice_stt', 'voice_realtime', 'ai_text'));

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
  IF p_feature NOT IN ('voice_tts', 'voice_stt', 'voice_realtime', 'ai_text')
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

REVOKE ALL ON FUNCTION public.reserve_cost_units(uuid, text, text, bigint, bigint, bigint, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_cost_units(uuid, text, text, bigint, bigint, bigint, jsonb)
  TO service_role;

-- Preserve the current month's already-consumed Free/Explorer/paid allowance as
-- closely as the legacy tracker permits. Older rows sometimes lack prompt tokens,
-- but response tokens still prevent a deployment-day allowance reset.
INSERT INTO public.cost_usage_ledger (
  user_id,
  feature,
  provider,
  units,
  actual_units,
  status,
  metadata,
  created_at,
  finalized_at
)
SELECT
  user_id,
  'ai_text',
  'legacy_concierge_usage',
  greatest(sum(coalesce(prompt_tokens, 0) + coalesce(response_tokens, 0)), 1)::bigint,
  greatest(sum(coalesce(prompt_tokens, 0) + coalesce(response_tokens, 0)), 1)::bigint,
  'committed',
  jsonb_build_object('backfill', true),
  date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC',
  now()
FROM public.concierge_usage
WHERE created_at >= date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
  AND user_id IS NOT NULL
GROUP BY user_id
HAVING sum(coalesce(prompt_tokens, 0) + coalesce(response_tokens, 0)) > 0;

INSERT INTO public.feature_flags (key, enabled, description)
VALUES ('cost_ai_text', true, 'Cost kill switch for paid text Concierge inference')
ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description;
