-- Smart Import free taste: 5 total per account (lifetime), not 1 per trip/month.
-- Client presentation gate (useSmartImportTaste) and server RPC stay aligned.
-- Paid plans still skip this RPC via the edge helper when limit is null.
--
-- Safety: SECURITY DEFINER RPC is service_role-only (grants revoked from
-- anon/authenticated in 20260717180000 / 20260723120000). Advisory lock
-- prevents concurrent over-grant. No auth/RLS/trip-membership surface changes.

CREATE OR REPLACE FUNCTION public.check_and_increment_smart_import_usage(
  p_user_id UUID,
  p_trip_id TEXT,
  p_limit INTEGER
)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, used INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month DATE := date_trunc('month', now())::date;
  v_total INTEGER;
  v_count INTEGER;
BEGIN
  IF p_limit IS NULL OR p_limit <= 0 THEN
    RETURN QUERY SELECT TRUE, NULL::INTEGER, 0;
    RETURN;
  END IF;

  -- Serialize account-wide checks for this user to avoid race over-grants.
  PERFORM pg_advisory_xact_lock(hashtext('smart_import_usage:' || p_user_id::text));

  SELECT COALESCE(SUM(usage_count), 0)::INTEGER
    INTO v_total
    FROM public.smart_import_usage
   WHERE user_id = p_user_id;

  IF v_total >= p_limit THEN
    RETURN QUERY SELECT FALSE, 0, p_limit;
    RETURN;
  END IF;

  INSERT INTO public.smart_import_usage (user_id, trip_id, usage_month, usage_count)
  VALUES (p_user_id, p_trip_id, v_month, 1)
  ON CONFLICT (user_id, trip_id, usage_month)
  DO UPDATE SET
    usage_count = public.smart_import_usage.usage_count + 1,
    updated_at = now()
  RETURNING usage_count INTO v_count;

  v_total := v_total + 1;

  RETURN QUERY SELECT TRUE, GREATEST(p_limit - v_total, 0), v_total;
END;
$$;

COMMENT ON FUNCTION public.check_and_increment_smart_import_usage(UUID, TEXT, INTEGER) IS
  'Account-wide Smart Import quota: counts all trips/months for the user against p_limit.';
