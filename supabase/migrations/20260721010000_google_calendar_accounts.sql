-- Google Calendar OAuth connection storage (Scope A: connection foundation).
--
-- Mirrors the hardened gmail_accounts pattern exactly:
--   * access_token / refresh_token hold AES-GCM ciphertext ('enc:v1:...') written
--     only by the calendar-auth edge function via _shared/gmailTokenCrypto.ts,
--     keyed by CALENDAR_TOKEN_ENCRYPTION_KEY. Plaintext is never stored.
--   * The frontend never reads token columns — it queries the token-free,
--     RLS-scoped google_calendar_accounts_safe view.
--   * INSERT/UPDATE of tokens is service-role only (no anon/authenticated write
--     policy exists); users may only SELECT and DELETE their own rows.
--
-- Feature-flagged off (google_calendar_sync) until Google OAuth verification for
-- the Calendar scope is complete. This stores refreshable encrypted credentials
-- and does not yet sync events.

CREATE TABLE IF NOT EXISTS public.google_calendar_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  -- Encrypted at rest (enc:v1: AES-GCM). Never exposed to clients.
  access_token TEXT,
  refresh_token TEXT,
  scopes TEXT[],
  token_expires_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, google_user_id)
);

ALTER TABLE public.google_calendar_accounts ENABLE ROW LEVEL SECURITY;

-- Users may read and delete their own rows. Token-bearing INSERT/UPDATE is
-- service-role only (the calendar-auth edge function) — there is deliberately no
-- anon/authenticated write policy, so clients can never write token values.
DROP POLICY IF EXISTS "google_calendar_accounts_select_own" ON public.google_calendar_accounts;
CREATE POLICY "google_calendar_accounts_select_own"
  ON public.google_calendar_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "google_calendar_accounts_delete_own" ON public.google_calendar_accounts;
CREATE POLICY "google_calendar_accounts_delete_own"
  ON public.google_calendar_accounts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Token-free view for frontend reads. security_invoker=true so the caller's RLS
-- context applies (an owner-privileged view could otherwise leak cross-user rows).
CREATE OR REPLACE VIEW public.google_calendar_accounts_safe
WITH (security_invoker = true) AS
  SELECT
    id,
    user_id,
    email,
    google_user_id,
    scopes,
    last_synced_at,
    token_expires_at,
    created_at,
    updated_at,
    is_active
  FROM public.google_calendar_accounts;

REVOKE ALL ON public.google_calendar_accounts_safe FROM anon;
GRANT SELECT ON public.google_calendar_accounts_safe TO authenticated;

-- Kill switch — off until Google OAuth verification for the Calendar scope lands
-- and test users are added in Google Cloud Console. Flip on via feature_flags.
INSERT INTO public.feature_flags (key, enabled, rollout_percentage, description)
VALUES (
  'google_calendar_sync',
  false,
  0,
  'Google Calendar OAuth connection. Disabled until Google OAuth verification for the Calendar scope is complete and test users are added in Google Cloud Console.'
)
ON CONFLICT (key) DO NOTHING;
