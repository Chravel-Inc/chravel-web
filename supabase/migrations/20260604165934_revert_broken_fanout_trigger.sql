-- BACKFILL of a live-applied migration (applied to prod jmjiyekmxwsxkfnqwyaa as version 20260604165934, name 'revert_broken_fanout_trigger').
-- Captured verbatim from supabase_migrations.schema_migrations.statements on 2026-08-04
-- so the repo can reproduce the live schema. Already recorded in the live migration
-- history — deploy-migrations.yml will skip it (version/name already present).

-- The fan-out trigger added in ensure_notification_delivery_fanout referenced a
-- column (recipient_user_id) that does not exist in this environment's
-- notification_deliveries schema, which would break every notification insert.
-- Revert to the prior state (no trigger on notifications) immediately.
DROP TRIGGER IF EXISTS trigger_queue_notification_deliveries ON public.notifications;
DROP FUNCTION IF EXISTS public.queue_notification_deliveries();
