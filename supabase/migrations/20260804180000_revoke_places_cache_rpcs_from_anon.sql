-- BACKFILL of a live-applied migration (applied to prod jmjiyekmxwsxkfnqwyaa as version 20260804165702, name '20260804180000_revoke_places_cache_rpcs_from_anon').
-- Captured verbatim from supabase_migrations.schema_migrations.statements on 2026-08-04
-- so the repo can reproduce the live schema. Already recorded in the live migration
-- history — deploy-migrations.yml will skip it (version/name already present).

REVOKE EXECUTE ON FUNCTION public.get_places_cache(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_places_cache(TEXT, TEXT, TEXT, JSONB, TEXT, DECIMAL, DECIMAL) FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_api_usage(TEXT, UUID, DECIMAL) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_hourly_usage(TEXT, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_daily_usage(TEXT, UUID, INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_places_cache() FROM anon, authenticated;
