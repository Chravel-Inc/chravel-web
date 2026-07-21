-- Security advisor hardening (Supabase security linter, 2026-07-21)
--
-- Closes low-risk-but-real findings from `get_advisors(security)` that the
-- July-17 hardening pass (20260717180000) did not cover. Every change here is
-- non-breaking and reversible; reversal steps are documented inline.

-- 1. function_search_path_mutable ---------------------------------------------
-- Six trigger functions have no pinned search_path. Their bodies reference only
-- now()/NEW/TG_OP (verified via pg_get_functiondef on 2026-07-21) — no public or
-- cross-schema objects — so pinning search_path to '' cannot alter behavior.
-- Reverse: RESET the setting with `ALTER FUNCTION <fn>() RESET search_path;`.
ALTER FUNCTION public.handle_updated_at() SET search_path = '';
ALTER FUNCTION public.prevent_admin_audit_mutation() SET search_path = '';
ALTER FUNCTION public.prevent_security_audit_mutation() SET search_path = '';
ALTER FUNCTION public.set_poll_comments_updated_at() SET search_path = '';
ALTER FUNCTION public.update_notification_deliveries_updated_at() SET search_path = '';
ALTER FUNCTION public.update_recommendation_items_updated_at() SET search_path = '';

-- 2. anon EXECUTE on membership-gated SECURITY DEFINER RPCs --------------------
-- toggle_task_status and vote_on_poll require an authenticated trip member; an
-- anonymous caller has no legitimate use. Authenticated access is unchanged.
-- Reverse: GRANT EXECUTE ... TO anon.
REVOKE EXECUTE ON FUNCTION public.toggle_task_status(uuid, uuid, boolean, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.vote_on_poll(uuid, text, uuid, integer) FROM anon;

-- 3. public_bucket_allows_listing ---------------------------------------------
-- These four buckets are public: objects load via /storage/v1/object/public/...
-- which does NOT consult RLS, so display is unaffected. The broad SELECT policies
-- additionally let anyone LIST/enumerate every object (e.g. harvest all avatars).
-- The app only ever calls upload()/getPublicUrl()/remove() on these buckets
-- (never list()/download()), and the sole server-side lister (delete-account)
-- uses the service role, which bypasses RLS. Dropping the listing policies closes
-- enumeration with zero display or upload impact.
-- Reverse: recreate each with
--   CREATE POLICY "<name>" ON storage.objects FOR SELECT USING (bucket_id = '<bucket>');
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view trip covers" ON storage.objects;
DROP POLICY IF EXISTS "Public can view event agendas" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view advertiser assets" ON storage.objects;
DROP POLICY IF EXISTS "Advertiser assets are publicly accessible" ON storage.objects;

-- 4. pg_graphql tables exposed to client roles --------------------------------
-- The app is PostgREST-only (CLAUDE.md: "No GraphQL"). pg_graphql reflected every
-- table to anon/authenticated, producing 231 advisor warnings and an entire
-- unaudited query surface. Disable the GraphQL API for the two client roles;
-- service_role/postgres (dashboard, tooling) are unaffected.
-- Reverse: GRANT USAGE ON SCHEMA graphql, graphql_public TO anon, authenticated;
REVOKE USAGE ON SCHEMA graphql FROM anon, authenticated;
REVOKE USAGE ON SCHEMA graphql_public FROM anon, authenticated;
