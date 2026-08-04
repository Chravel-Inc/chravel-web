-- Follow-up to 20260802130000: the invite-code existence oracle was still anon-executable.
--
-- 20260725143000 and 20260729234527 both tried to close this, and 20260802130000 re-asserted it,
-- all with `REVOKE EXECUTE ... FROM anon`. That is a no-op here. Postgres grants EXECUTE on new
-- functions to PUBLIC by default, and `anon` inherits it — revoking from a role that never held a
-- direct grant changes nothing. Verified against production after 20260802130000 applied:
--
--   proacl = {=X/postgres,postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}
--            ^^^^^^^^^^^ the PUBLIC grant that anon actually rides on
--   has_function_privilege('anon', 'public.check_invite_code_exists(text)', 'EXECUTE') = true
--
-- Revoke from PUBLIC (the real source), then re-assert the explicit grants the app depends on so
-- the legitimate caller cannot be locked out. The only in-app caller is checkCodeExists() in
-- src/hooks/useInviteLink.ts, reached exclusively from generateUniqueCode() while an authenticated
-- trip member is creating an invite link — `anon` has no legitimate need for it.
--
-- Regression scope: EXECUTE privilege on one boolean helper. No RLS policy, trip fetch, auth
-- hydration, or payment surface is touched. Idempotent: REVOKE/GRANT are declarative.

REVOKE EXECUTE ON FUNCTION public.check_invite_code_exists(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_invite_code_exists(text) FROM anon;

GRANT EXECUTE ON FUNCTION public.check_invite_code_exists(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_invite_code_exists(text) TO service_role;
