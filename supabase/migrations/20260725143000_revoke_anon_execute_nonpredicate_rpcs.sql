-- Close the anon-executable SECURITY DEFINER surface missed by 20260723200000 (2026-07-25)
--
-- 20260723200000 revoked PUBLIC+anon EXECUTE on *mutating action* RPCs and explicitly scoped
-- itself out of `is_*/has_*/can_*/get_*`, on the grounds that those are RLS predicates evaluated
-- for the anon role inside policy bodies and must keep EXECUTE.
--
-- That reasoning is correct for the predicates, but a set of functions matching the same name
-- prefixes are NOT predicates — they are maintenance routines, counters, and row-returning
-- helpers. They inherited the Supabase default PUBLIC EXECUTE grant and stayed callable by anon
-- over /rest/v1/rpc/ with the publishable key that ships in the browser bundle. Because they are
-- SECURITY DEFINER, RLS provides no protection: the 116/116 tables with RLS enabled are bypassed.
--
-- Verified against the live catalog before writing this migration (project jmjiyekmxwsxkfnqwyaa):
-- every function below returns 0 references across all pg_policies.qual / with_check bodies, and
-- has_function_privilege('anon', ..., 'EXECUTE') was true for all 13.
--
-- Representative pre-fix exposure:
--   cleanup_rate_limits()            -> anon truncates public.rate_limits, disabling rate limiting
--   increment_rate_limit(key,...)    -> anon forges another user's bucket key to lock them out
--   get_events_in_user_tz(trip,user) -> anon reads event rows for an arbitrary trip, RLS bypassed
--   check_invite_code_exists(code)   -> unauthenticated invite-code brute-force oracle
--   increment_campaign_stat(id,type) -> unauthenticated advertiser stat inflation
--
-- PAIRED CODE CHANGE (same PR, must land together): supabase/functions/demo-concierge/index.ts
-- built its rate-limit client with SUPABASE_ANON_KEY and no user JWT, so it called
-- increment_rate_limit as `anon`. checkRateLimit is fail-closed, so revoking anon without that fix
-- would 429 every request to the public demo. It now uses the service-role key.
--
-- Only tightens authorization. No RLS policy, table grant, or function body is modified — no
-- Trip-Not-Found, auth desync, RLS read leak, or payment-state drift.
-- REVERSAL: GRANT EXECUTE ON FUNCTION <sig> TO PUBLIC;

-- Group 1 — keep `authenticated` (each has a real first-party caller), drop PUBLIC + anon.
--   increment_rate_limit        _shared/security.ts checkRateLimit, called by lovable-concierge,
--                               execute-concierge-tool, realtime-voice-session, google-maps-proxy
--                               (anon key + user JWT => `authenticated`) and by mint-realtime-token
--                               (user JWT). Service-role callers are unaffected by any grant.
--   check_invite_code_exists    src/hooks/useInviteLink.ts:69 (invite creation, authenticated)
--   increment_campaign_stat     src/services/advertiserService.ts:357
--   get_trip_admin_permissions  src/hooks/useProTripAdmin.ts:80
DO $$
DECLARE
  r record;
  keep_authenticated text[] := ARRAY[
    'increment_rate_limit',
    'check_invite_code_exists',
    'increment_campaign_stat',
    'get_trip_admin_permissions'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = ANY (keep_authenticated)
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', r.sig);
  END LOOP;
END $$;

-- Group 2 — server-internal: no client or edge-function caller exists for any of these
-- (grepped across src/ and supabase/functions/). Cron and SECURITY DEFINER callers run as the
-- function owner or service_role, neither of which is affected by revoking anon/authenticated.
-- enforce_profile_self_update_scope is a trigger function; trigger execution does not consult the
-- invoking role's EXECUTE privilege.
DO $$
DECLARE
  r record;
  service_role_only text[] := ARRAY[
    'cleanup_rate_limits',
    'queue_notification_deliveries',
    'deactivate_expired_invites',
    'verify_admin_audit_chain',
    'get_events_in_user_tz',
    'get_account_deletion_status',
    'should_send_notification',
    'get_broadcast_read_count',
    'enforce_profile_self_update_scope'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = ANY (service_role_only)
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;

COMMENT ON FUNCTION public.cleanup_rate_limits() IS
  'Maintenance routine. service_role only — an anon-callable version let any caller clear '
  'public.rate_limits and disable rate limiting globally (fixed 2026-07-25).';

COMMENT ON FUNCTION public.increment_rate_limit(text, integer, integer) IS
  'Fixed-window rate limiter backing _shared/security.ts checkRateLimit. EXECUTE revoked from '
  'anon 2026-07-25: anon could forge an arbitrary rate_key and exhaust another user''s bucket. '
  'Unauthenticated callers (demo-concierge) must invoke this with the service-role key.';
