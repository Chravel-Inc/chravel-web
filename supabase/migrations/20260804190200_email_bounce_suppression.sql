-- Provision the email bounce-suppression contract used by send-email-with-retry.
--
-- WHY: send-email-with-retry (active — invoked from src via notification flows)
-- calls rpc('should_suppress_email') before sending and upserts into
-- email_bounces on hard/soft bounces. Neither object exists in production, so
-- bounce suppression silently no-ops (every send proceeds and bounce history is
-- lost). The defining migration (20251026_address_known_issues.sql) is an old
-- multi-purpose file that never applied and is unsafe to replay wholesale; this
-- forward migration carries only the email-suppression objects, hardened:
--  - RLS fail-closed (no policies; service_role only), matching
--    notification_deliveries / webhook_events.
--  - should_suppress_email is revoked from PUBLIC/anon/authenticated so it
--    cannot be used as a bounce-history oracle for arbitrary addresses.
--
-- Idempotent: IF NOT EXISTS / CREATE OR REPLACE / re-runnable grants.

CREATE TABLE IF NOT EXISTS public.email_bounces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  bounce_type TEXT NOT NULL CHECK (bounce_type IN ('hard', 'soft', 'complaint')),
  bounce_count INTEGER DEFAULT 1,
  last_bounce_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  suppressed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(email, bounce_type)
);

-- Fail-closed by design: RLS on with no policies, so only the service role can
-- reach it. This table maps email addresses to bounce/complaint history.
ALTER TABLE public.email_bounces ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.email_bounces IS
  'Email bounce/complaint suppression list. Contains recipient addresses. Intentionally '
  'fail-closed: RLS enabled with no policies, so only service_role may access. Do NOT add a '
  'user-facing SELECT policy.';

CREATE INDEX IF NOT EXISTS email_bounces_email_idx ON public.email_bounces (email);
CREATE INDEX IF NOT EXISTS email_bounces_suppressed_idx ON public.email_bounces (suppressed) WHERE suppressed = true;

CREATE OR REPLACE FUNCTION public.should_suppress_email(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_hard_bounces INTEGER;
  v_soft_bounces INTEGER;
BEGIN
  SELECT COALESCE(bounce_count, 0) INTO v_hard_bounces
  FROM public.email_bounces
  WHERE email = p_email AND bounce_type = 'hard' AND suppressed = true;

  IF v_hard_bounces > 0 THEN
    RETURN TRUE;
  END IF;

  SELECT COUNT(*) INTO v_soft_bounces
  FROM public.email_bounces
  WHERE email = p_email
    AND bounce_type = 'soft'
    AND last_bounce_at > now() - INTERVAL '30 days';

  IF v_soft_bounces > 5 THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- Callable only by the service role (edge functions). Not SECURITY DEFINER, so
-- even if grants drift, RLS on email_bounces still blocks non-service callers.
REVOKE ALL ON FUNCTION public.should_suppress_email(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.should_suppress_email(TEXT) TO service_role;
