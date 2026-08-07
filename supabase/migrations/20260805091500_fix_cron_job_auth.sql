-- Repair the broken cron-job auth wiring discovered while scheduling
-- event-reminders (cron.job_run_details, 48h window):
--
--   * daily-embedding-refresh  — failed every run: "cross-database references
--     are not implemented: extensions.net.http_post" (wrong schema
--     qualification), AND it sends the public anon key to generate-embeddings,
--     which requires a real user JWT — a cron can never satisfy it.
--     trip_embeddings has 0 rows in prod: this refresh has never produced
--     data. UNSCHEDULED as dead.
--
--   * chravel-dispatch-notification-deliveries — failed EVERY MINUTE (2,880
--     failures in 48h): its header string concatenates
--     current_setting('app.settings.service_role_key') which is not
--     configured, and string-concatenation with NULL/garbage makes the
--     ::jsonb cast throw before the request is even queued.
--
--   * chravel-process-account-deletions — same pattern; the SQL "succeeds"
--     (request queued) but the function receives no usable Authorization and
--     rejects it, so scheduled account-deletion processing never ran.
--
-- All three (plus chravel-event-reminders from 20260805090000) are rewritten
-- NULL-safe with jsonb_build_object, so a missing key can no longer produce
-- SQL errors — the request reaches the function and the failure is visible in
-- edge-function logs instead of silently dying inside cron.
--
-- ⚠️ OWNER ACTION REQUIRED (one line, Supabase Dashboard > SQL editor) to make
-- the three remaining jobs authenticate:
--
--   ALTER DATABASE postgres SET app.settings.service_role_key = '<service_role key from Settings → API>';
--
-- Until that is run, the jobs fire but the functions return 401 (fail-closed,
-- by design — see _shared/cronGuard.ts).

DO $$
DECLARE
  v_job RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
    RAISE NOTICE 'cron schema not available; skipping cron auth repair.';
    RETURN;
  END IF;

  -- 1) Dead job: embedding refresh (never worked, target requires a user JWT).
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-embedding-refresh') THEN
    PERFORM cron.unschedule('daily-embedding-refresh');
  END IF;

  -- 2) NULL-safe rewrites of the service-role Bearer jobs.
  FOR v_job IN
    SELECT * FROM (VALUES
      ('chravel-dispatch-notification-deliveries', '* * * * *',
       'https://jmjiyekmxwsxkfnqwyaa.supabase.co/functions/v1/dispatch-notification-deliveries'),
      ('chravel-process-account-deletions', '0 3 * * *',
       'https://jmjiyekmxwsxkfnqwyaa.supabase.co/functions/v1/process-account-deletions'),
      ('chravel-event-reminders', '*/5 * * * *',
       'https://jmjiyekmxwsxkfnqwyaa.supabase.co/functions/v1/event-reminders')
    ) AS t(jobname, schedule, url)
  LOOP
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = v_job.jobname) THEN
      PERFORM cron.unschedule(v_job.jobname);
    END IF;

    PERFORM cron.schedule(
      v_job.jobname,
      v_job.schedule,
      format(
        $cron$
        SELECT net.http_post(
          url := %L,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || coalesce(current_setting('app.settings.service_role_key', true), '')
          ),
          body := '{}'::jsonb
        );
        $cron$,
        v_job.url
      )
    );
  END LOOP;
END $$;
