-- Harden apple_auth_tokens: fail-closed, backend-only access
REVOKE ALL ON public.apple_auth_tokens FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.apple_auth_tokens TO service_role;

COMMENT ON TABLE public.apple_auth_tokens IS
  'Apple OAuth refresh tokens. Access is strictly backend-only: RLS is enabled with NO policies (fail-closed for anon/authenticated). Only service_role (edge functions) may read/write. Tokens should be rotated regularly.';

-- Document ticket_qr_code constraint on event_rsvps
COMMENT ON COLUMN public.event_rsvps.ticket_qr_code IS
  'Opaque, non-sensitive token only (e.g., random UUID or signed ticket id). MUST NOT encode PII, payment info, or any secret data — readable by event admins via RLS.';

COMMENT ON TABLE public.event_rsvps IS
  'Event RSVPs. RLS: RSVP owner can SELECT/UPDATE/DELETE their own row; trip admins can SELECT all RSVPs for their event (needed for attendee management). Regular trip members intentionally cannot view other attendees'' emails/dietary restrictions to prevent cross-event PII leakage.';