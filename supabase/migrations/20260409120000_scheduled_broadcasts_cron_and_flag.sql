-- Scheduled Broadcasts: cron job + feature flag
-- Adds pg_cron job to trigger send-scheduled-broadcasts every minute,
-- and seeds a feature flag for runtime kill switch.

-- 1. Seed feature flag for scheduled broadcasts
INSERT INTO public.feature_flags (name, enabled, description)
VALUES (
  'scheduled_broadcasts',
  true,
  'Enable scheduled broadcast message functionality (subscription-gated)'
)
ON CONFLICT (name) DO NOTHING;

-- 2. Schedule cron job to process scheduled broadcasts every minute
DO $$
DECLARE
  v_project_ref TEXT := COALESCE(
    current_setting('app.settings.supabase_project_ref', true),
    'jmjiyekmxwsxkfnqwyaa'
  );
  v_cron_secret TEXT := COALESCE(current_setting('app.settings.cron_secret', true), '');
  v_has_cron BOOLEAN;
  v_has_http_post BOOLEAN;
BEGIN
  -- Check if pg_cron is available
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'cron' AND p.proname = 'schedule'
  ) INTO v_has_cron;

  -- Check if pg_net (http_post) is available
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'net' AND p.proname = 'http_post'
  ) INTO v_has_http_post;

  IF v_has_cron AND v_has_http_post THEN
    -- Remove existing job if present
    BEGIN
      PERFORM cron.unschedule('chravel-send-scheduled-broadcasts');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    PERFORM cron.schedule(
      'chravel-send-scheduled-broadcasts',
      '* * * * *',
      format($job$
      SELECT net.http_post(
        url := 'https://%s.supabase.co/functions/v1/send-scheduled-broadcasts',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', %L
        ),
        body := '{}'::jsonb
      );
      $job$, v_project_ref, v_cron_secret)
    );

    RAISE NOTICE 'Scheduled cron job: chravel-send-scheduled-broadcasts (every minute)';
  ELSE
    RAISE NOTICE 'pg_cron or pg_net not available — skipping cron job for send-scheduled-broadcasts';
  END IF;
END $$;
