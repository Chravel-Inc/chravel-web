-- Fix suppression semantics shipped in 20260804190200_email_bounce_suppression.
--
-- Two defects found in semantic review before that migration's first real use:
--  1. should_suppress_email only honored suppressed=true rows with
--     bounce_type='hard' — a spam complaint ((email,'complaint',suppressed=true))
--     did NOT suppress, which is the compliance-relevant case.
--  2. The soft-bounce branch counted rows, but UNIQUE(email, bounce_type)
--     caps the count at 1, and the caller upserted bounce_count=1 forever —
--     so ">5" was unreachable. Suppression must key off the row's
--     bounce_count, and recording must actually increment it.
--
-- Adds record_email_bounce (service-role only) for atomic increment; the
-- send-email-with-retry function now calls it instead of a raw upsert.

CREATE OR REPLACE FUNCTION public.should_suppress_email(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_suppressed INTEGER;
  v_soft_count INTEGER;
BEGIN
  -- Any suppressed row (hard bounce or complaint) blocks sending.
  SELECT COUNT(*) INTO v_suppressed
  FROM public.email_bounces
  WHERE email = p_email AND suppressed = true;

  IF v_suppressed > 0 THEN
    RETURN TRUE;
  END IF;

  -- Repeated soft bounces within 30 days: key off the accumulated counter on
  -- the single (email,'soft') row, not the row count (unique-capped at 1).
  SELECT COALESCE(bounce_count, 0) INTO v_soft_count
  FROM public.email_bounces
  WHERE email = p_email
    AND bounce_type = 'soft'
    AND last_bounce_at > now() - INTERVAL '30 days';

  IF COALESCE(v_soft_count, 0) > 5 THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.should_suppress_email(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.should_suppress_email(TEXT) TO service_role;

-- Atomic bounce recorder: increments the per-(email,type) counter and marks
-- hard bounces / complaints suppressed.
CREATE OR REPLACE FUNCTION public.record_email_bounce(
  p_email TEXT,
  p_bounce_type TEXT
)
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  INSERT INTO public.email_bounces (email, bounce_type, bounce_count, last_bounce_at, suppressed)
  VALUES (
    p_email,
    p_bounce_type,
    1,
    now(),
    p_bounce_type IN ('hard', 'complaint')
  )
  ON CONFLICT (email, bounce_type) DO UPDATE SET
    bounce_count = public.email_bounces.bounce_count + 1,
    last_bounce_at = now(),
    suppressed = public.email_bounces.suppressed OR excluded.suppressed;
$$;

REVOKE ALL ON FUNCTION public.record_email_bounce(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_email_bounce(TEXT, TEXT) TO service_role;
