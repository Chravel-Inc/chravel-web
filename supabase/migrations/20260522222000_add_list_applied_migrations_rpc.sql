-- BACKFILL of a live-applied migration (applied to prod jmjiyekmxwsxkfnqwyaa as version 20260522222000, name 'add_list_applied_migrations_rpc').
-- Captured verbatim from supabase_migrations.schema_migrations.statements on 2026-08-04
-- so the repo can reproduce the live schema. Already recorded in the live migration
-- history — deploy-migrations.yml will skip it (version/name already present).

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
