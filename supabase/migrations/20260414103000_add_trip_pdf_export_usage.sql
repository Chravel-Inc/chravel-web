-- =====================================================
-- Per-user, per-trip PDF export usage counters
-- Limits:
--   free: 1 export/trip
--   explorer/frequent/pro: unlimited
--   super_admin: unlimited bypass
-- =====================================================

CREATE TABLE IF NOT EXISTS public.trip_pdf_export_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id TEXT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  export_count INTEGER NOT NULL DEFAULT 0 CHECK (export_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, trip_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_pdf_export_usage_user_id
  ON public.trip_pdf_export_usage(user_id);

CREATE INDEX IF NOT EXISTS idx_trip_pdf_export_usage_trip_id
  ON public.trip_pdf_export_usage(trip_id);

ALTER TABLE public.trip_pdf_export_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own pdf export usage" ON public.trip_pdf_export_usage;
CREATE POLICY "Users can view their own pdf export usage"
  ON public.trip_pdf_export_usage
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage pdf export usage" ON public.trip_pdf_export_usage;
CREATE POLICY "Service role can manage pdf export usage"
  ON public.trip_pdf_export_usage
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.resolve_trip_pdf_export_limit()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_has_active_paid_entitlement BOOLEAN := FALSE;
  v_profile RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF public.is_super_admin() THEN
    RETURN NULL;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.user_entitlements ue
    WHERE ue.user_id = v_user_id
      AND ue.status IN ('active', 'trialing')
      AND (ue.current_period_end IS NULL OR ue.current_period_end > NOW())
      AND ue.plan IN (
        'explorer',
        'frequent-chraveler',
        'pro-starter',
        'pro-growth',
        'pro-enterprise',
        'enterprise'
      )
  ) INTO v_has_active_paid_entitlement;

  IF v_has_active_paid_entitlement THEN
    RETURN NULL;
  END IF;

  SELECT
    p.app_role,
    p.subscription_status,
    p.subscription_product_id
  INTO v_profile
  FROM public.profiles p
  WHERE p.id = v_user_id
  LIMIT 1;

  IF v_profile.subscription_status IN ('active', 'trialing')
    AND COALESCE(v_profile.subscription_product_id, '') <> ''
    AND (
      v_profile.subscription_product_id ILIKE '%explorer%'
      OR v_profile.subscription_product_id ILIKE '%frequent%'
      OR v_profile.subscription_product_id ILIKE '%pro%'
      OR v_profile.subscription_product_id ILIKE '%enterprise%'
      OR v_profile.subscription_product_id IN ('prod_Tc0SWNhLkoCDIi', 'prod_Tx0AZIWAubAWD3')
    )
  THEN
    RETURN NULL;
  END IF;

  IF v_profile.app_role IN ('plus', 'explorer', 'frequent-chraveler', 'pro', 'enterprise', 'enterprise_admin', 'super_admin') THEN
    RETURN NULL;
  END IF;

  RETURN 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_trip_pdf_export_usage(p_trip_id TEXT)
RETURNS TABLE (
  export_count INTEGER,
  limit_count INTEGER,
  remaining INTEGER,
  can_export BOOLEAN,
  is_unlimited BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_limit INTEGER;
  v_count INTEGER := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_trip_id IS NULL OR btrim(p_trip_id) = '' THEN
    RAISE EXCEPTION 'Trip ID is required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.trip_members tm
    WHERE tm.trip_id = p_trip_id
      AND tm.user_id = v_user_id
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.trips t
    WHERE t.id = p_trip_id
      AND t.creator_id = v_user_id
  ) AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied for trip %', p_trip_id;
  END IF;

  v_limit := public.resolve_trip_pdf_export_limit();

  IF v_limit IS NOT NULL THEN
    INSERT INTO public.trip_pdf_export_usage (user_id, trip_id, export_count)
    VALUES (v_user_id, p_trip_id, 0)
    ON CONFLICT (user_id, trip_id) DO NOTHING;

    SELECT u.export_count
    INTO v_count
    FROM public.trip_pdf_export_usage u
    WHERE u.user_id = v_user_id
      AND u.trip_id = p_trip_id;
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(v_count, 0) AS export_count,
    v_limit AS limit_count,
    CASE
      WHEN v_limit IS NULL THEN NULL
      ELSE GREATEST(v_limit - COALESCE(v_count, 0), 0)
    END AS remaining,
    CASE
      WHEN v_limit IS NULL THEN TRUE
      ELSE COALESCE(v_count, 0) < v_limit
    END AS can_export,
    v_limit IS NULL AS is_unlimited;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_trip_pdf_export_usage(
  p_trip_id TEXT,
  p_limit INTEGER DEFAULT NULL
)
RETURNS TABLE (
  used_count INTEGER,
  remaining INTEGER,
  incremented BOOLEAN,
  limit_count INTEGER,
  can_export BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_limit INTEGER;
  v_next_count INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_trip_id IS NULL OR btrim(p_trip_id) = '' THEN
    RAISE EXCEPTION 'Trip ID is required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.trip_members tm
    WHERE tm.trip_id = p_trip_id
      AND tm.user_id = v_user_id
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.trips t
    WHERE t.id = p_trip_id
      AND t.creator_id = v_user_id
  ) AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied for trip %', p_trip_id;
  END IF;

  v_limit := COALESCE(p_limit, public.resolve_trip_pdf_export_limit());

  IF v_limit IS NULL OR v_limit <= 0 THEN
    SELECT COALESCE(u.export_count, 0)
    INTO v_next_count
    FROM public.trip_pdf_export_usage u
    WHERE u.user_id = v_user_id
      AND u.trip_id = p_trip_id;

    RETURN QUERY
    SELECT
      COALESCE(v_next_count, 0) AS used_count,
      NULL::INTEGER AS remaining,
      TRUE AS incremented,
      NULL::INTEGER AS limit_count,
      TRUE AS can_export;
    RETURN;
  END IF;

  INSERT INTO public.trip_pdf_export_usage (user_id, trip_id, export_count)
  VALUES (v_user_id, p_trip_id, 0)
  ON CONFLICT (user_id, trip_id) DO NOTHING;

  UPDATE public.trip_pdf_export_usage u
  SET export_count = u.export_count + 1,
      updated_at = NOW()
  WHERE u.user_id = v_user_id
    AND u.trip_id = p_trip_id
    AND u.export_count < v_limit
  RETURNING u.export_count INTO v_next_count;

  IF FOUND THEN
    RETURN QUERY
    SELECT
      v_next_count AS used_count,
      GREATEST(v_limit - v_next_count, 0) AS remaining,
      TRUE AS incremented,
      v_limit AS limit_count,
      v_next_count < v_limit AS can_export;
    RETURN;
  END IF;

  SELECT u.export_count
  INTO v_next_count
  FROM public.trip_pdf_export_usage u
  WHERE u.user_id = v_user_id
    AND u.trip_id = p_trip_id;

  RETURN QUERY
  SELECT
    COALESCE(v_next_count, 0) AS used_count,
    GREATEST(v_limit - COALESCE(v_next_count, 0), 0) AS remaining,
    FALSE AS incremented,
    v_limit AS limit_count,
    COALESCE(v_next_count, 0) < v_limit AS can_export;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_trip_pdf_export_limit() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trip_pdf_export_usage(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_trip_pdf_export_usage(TEXT, INTEGER) TO authenticated;
