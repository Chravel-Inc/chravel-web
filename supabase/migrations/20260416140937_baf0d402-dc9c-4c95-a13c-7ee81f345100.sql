CREATE TABLE IF NOT EXISTS public.smart_import_usage (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id TEXT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  usage_month DATE NOT NULL DEFAULT date_trunc('month', now())::date,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS smart_import_usage_user_trip_month_key
  ON public.smart_import_usage (user_id, trip_id, usage_month) NULLS NOT DISTINCT;

ALTER TABLE public.smart_import_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own smart import usage"
  ON public.smart_import_usage FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own smart import usage"
  ON public.smart_import_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own smart import usage"
  ON public.smart_import_usage FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

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
  v_count INTEGER;
BEGIN
  IF p_limit <= 0 THEN
    RETURN QUERY SELECT TRUE, NULL::INTEGER, 0;
    RETURN;
  END IF;

  INSERT INTO public.smart_import_usage (user_id, trip_id, usage_month, usage_count)
  VALUES (p_user_id, p_trip_id, v_month, 1)
  ON CONFLICT (user_id, trip_id, usage_month)
  DO UPDATE SET
    usage_count = public.smart_import_usage.usage_count + 1,
    updated_at = now()
  RETURNING usage_count INTO v_count;

  IF v_count > p_limit THEN
    UPDATE public.smart_import_usage
       SET usage_count = GREATEST(usage_count - 1, 0),
           updated_at = now()
     WHERE user_id = p_user_id
       AND trip_id IS NOT DISTINCT FROM p_trip_id
       AND usage_month = v_month;

    RETURN QUERY SELECT FALSE, 0, p_limit;
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, GREATEST(p_limit - v_count, 0), v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_and_increment_smart_import_usage(UUID, TEXT, INTEGER)
  TO authenticated, service_role;