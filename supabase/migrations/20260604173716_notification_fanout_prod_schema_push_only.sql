-- BACKFILL of a live-applied migration (applied to prod jmjiyekmxwsxkfnqwyaa as version 20260604173716, name 'notification_fanout_prod_schema_push_only').
-- Captured verbatim from supabase_migrations.schema_migrations.statements on 2026-08-04
-- so the repo can reproduce the live schema. Already recorded in the live migration
-- history — deploy-migrations.yml will skip it (version/name already present).

CREATE UNIQUE INDEX IF NOT EXISTS notification_deliveries_notification_id_channel_key
  ON public.notification_deliveries (notification_id, channel);

CREATE OR REPLACE FUNCTION public.queue_notification_deliveries()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_deliveries (
    notification_id,
    channel,
    status,
    next_attempt_at
  )
  VALUES
    (NEW.id, 'push', 'queued'::public.notification_delivery_status, COALESCE(NEW.created_at, NOW()))
  ON CONFLICT (notification_id, channel) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_queue_notification_deliveries ON public.notifications;
CREATE TRIGGER trigger_queue_notification_deliveries
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_notification_deliveries();
