-- MVP rollback: disable scheduled broadcast dispatcher cron invocations.
-- Intentionally keeps broadcast scheduling columns/data intact while stopping background sends.
DO $$
DECLARE
  has_cron_schema boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_namespace
    WHERE nspname = 'cron'
  ) INTO has_cron_schema;

  IF NOT has_cron_schema THEN
    RAISE NOTICE 'cron schema not available; skipping send-scheduled-broadcasts unschedule.';
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-scheduled-broadcasts') THEN
    PERFORM cron.unschedule('send-scheduled-broadcasts');
    RAISE NOTICE 'Unscheduled cron job send-scheduled-broadcasts.';
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'chravel-send-scheduled-broadcasts') THEN
    PERFORM cron.unschedule('chravel-send-scheduled-broadcasts');
    RAISE NOTICE 'Unscheduled cron job chravel-send-scheduled-broadcasts.';
  END IF;
END $$;
