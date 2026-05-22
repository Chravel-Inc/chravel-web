-- Read-only RPC that surfaces applied migration versions to the CI drift
-- gate. supabase_migrations is not exposed via PostgREST by default; this
-- SECURITY DEFINER function is the narrow window that lets a service-role
-- script verify every local migration file has been applied. Returns only
-- version strings (timestamps), no SQL bodies or secrets.

CREATE OR REPLACE FUNCTION public.list_applied_migrations()
RETURNS TABLE(version text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = supabase_migrations, public
AS $$
  SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;
$$;

REVOKE EXECUTE ON FUNCTION public.list_applied_migrations() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.list_applied_migrations() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_applied_migrations() TO service_role;
