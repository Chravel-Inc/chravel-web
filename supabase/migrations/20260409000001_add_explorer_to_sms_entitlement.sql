-- ============================================================================
-- Add 'explorer' plan to SMS entitlement check
-- Explorer subscribers ($9.99/mo) should receive SMS notifications.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_user_sms_entitled(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan TEXT;
  v_status TEXT;
  v_period_end TIMESTAMPTZ;
  v_profile_status TEXT;
  v_profile_product TEXT;
BEGIN
  -- Super-admin / enterprise admin bypass
  IF EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = p_user_id
      AND role::TEXT IN ('enterprise_admin', 'super_admin')
  ) THEN
    RETURN TRUE;
  END IF;

  -- Primary source: user_entitlements
  SELECT plan, status, current_period_end
  INTO v_plan, v_status, v_period_end
  FROM public.user_entitlements
  WHERE user_id = p_user_id
  ORDER BY updated_at DESC
  LIMIT 1;

  IF FOUND
    AND v_status IN ('active', 'trialing')
    AND v_plan IN ('explorer', 'frequent-chraveler', 'pro-starter', 'pro-growth', 'pro-enterprise')
    AND (v_period_end IS NULL OR v_period_end > NOW()) THEN
    RETURN TRUE;
  END IF;

  -- Backward-compatible fallback from profile fields
  SELECT subscription_status, subscription_product_id
  INTO v_profile_status, v_profile_product
  FROM public.profiles
  WHERE user_id = p_user_id
  LIMIT 1;

  IF FOUND
    AND v_profile_status = 'active'
    AND (
      COALESCE(v_profile_product, '') ILIKE '%explorer%'
      OR COALESCE(v_profile_product, '') ILIKE '%frequent%'
      OR COALESCE(v_profile_product, '') ILIKE '%pro%'
      OR COALESCE(v_profile_product, '') ILIKE '%enterprise%'
    ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;
