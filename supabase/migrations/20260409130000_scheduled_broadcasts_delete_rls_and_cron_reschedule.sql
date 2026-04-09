-- Allow creators to cancel scheduled (unsent) broadcasts via client DELETE.
-- Aligns with broadcastService.cancelScheduledBroadcast.

DROP POLICY IF EXISTS "Creators can delete own unsent scheduled broadcasts" ON public.broadcasts;
CREATE POLICY "Creators can delete own unsent scheduled broadcasts"
ON public.broadcasts
FOR DELETE
USING (
  auth.uid() = created_by
  AND is_sent = false
  AND scheduled_for IS NOT NULL
  AND public.can_manage_trip_content(auth.uid(), trip_id)
);

-- Reschedule pg_cron job if secret was missing on first migration apply.
DO $$
DECLARE
  v_project_ref TEXT := COALESCE(
    current_setting('app.settings.supabase_project_ref', true),
    'jmjiyekmxwsxkfnqwyaa'
  );
  v_cron_secret TEXT := NULLIF(trim(COALESCE(current_setting('app.settings.cron_secret', true), '')), '');
  v_has_cron BOOLEAN;
  v_has_http_post BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'cron' AND p.proname = 'schedule'
  ) INTO v_has_cron;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'net' AND p.proname = 'http_post'
  ) INTO v_has_http_post;

  IF v_has_cron AND v_has_http_post AND v_cron_secret IS NOT NULL THEN
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
  ELSIF v_has_cron AND v_has_http_post AND v_cron_secret IS NULL THEN
    RAISE NOTICE 'app.settings.cron_secret still not set — chravel-send-scheduled-broadcasts not scheduled';
  END IF;
END $$;
