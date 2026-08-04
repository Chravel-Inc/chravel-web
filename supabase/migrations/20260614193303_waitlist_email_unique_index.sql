-- BACKFILL of a live-applied migration (applied to prod jmjiyekmxwsxkfnqwyaa as version 20260614193303, name 'waitlist_email_unique_index').
-- Captured verbatim from supabase_migrations.schema_migrations.statements on 2026-08-04
-- so the repo can reproduce the live schema. Already recorded in the live migration
-- history — deploy-migrations.yml will skip it (version/name already present).

drop index if exists public.waitlist_email_key;
create unique index if not exists waitlist_email_key on public.waitlist (email);
