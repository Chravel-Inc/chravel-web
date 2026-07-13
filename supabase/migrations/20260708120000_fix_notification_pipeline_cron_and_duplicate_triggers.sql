-- Fix notification-pipeline reliability bugs (diagnosed on live prod).
--
-- Three independent, idempotent fixes bundled here because they all belong to
-- the same broken pipeline:
--
--   1. Harden the two service_role-authenticated pg_cron jobs so a missing
--      `app.settings.service_role_key` GUC fails LOUDLY instead of silently
--      emitting malformed JSON every run.
--   2. Drop the duplicate AFTER INSERT notify trigger on trip_chat_messages
--      (double-notify on every chat message).
--   3. Drop the duplicate AFTER INSERT notification-prefs trigger on profiles
--      (double-seed of default notification preferences on signup).
--
-- No secret value is embedded here: current_setting(...) is evaluated at
-- cron-run time, never at migration time.

-- ---------------------------------------------------------------------------
-- 1) Harden the cron jobs (jobid 4 + jobid 5)
-- ---------------------------------------------------------------------------
--
-- ROOT CAUSE: both jobs built the Authorization header by string-concatenating
-- current_setting('app.settings.service_role_key', true) into a JSON string
-- literal that was then cast to jsonb. When the GUC is unset, missing_ok=true
-- makes current_setting() return NULL, the concat collapses to
-- '{"Content-Type":"application/json","Authorization":"Bearer "}' with a NULL
-- splice that yields malformed JSON ('... Token ""}" is invalid'), and the
-- ::jsonb cast raises BEFORE net.http_post ever fires. Result: the dispatch
-- job (every minute) and the account-deletion job (daily) have never run.
--
-- FIX: build the header with jsonb_build_object() (never produces malformed
-- JSON) and read the GUC with missing_ok=FALSE so an unset GUC raises a clear
-- "unrecognized configuration parameter" error that surfaces in cron.job_run_details
-- instead of failing silently on a JSON cast.
--
-- OPS PREREQUISITE: for these jobs to succeed, the database GUC
-- `app.settings.service_role_key` MUST be set to the project's service_role key
-- (e.g. `ALTER DATABASE postgres SET app.settings.service_role_key = '<key>';`).
-- That is a manual ops step and is intentionally NOT performed in this migration.
--
-- URL, schedule, jobname, and body are preserved exactly per job; only the
-- header construction changes.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
    RAISE NOTICE 'cron schema not available; skipping cron hardening.';
    RETURN;
  END IF;

  -- jobid 4: chravel-dispatch-notification-deliveries (every minute)
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'chravel-dispatch-notification-deliveries') THEN
    PERFORM cron.unschedule('chravel-dispatch-notification-deliveries');
  END IF;

  PERFORM cron.schedule(
    'chravel-dispatch-notification-deliveries',
    '* * * * *',
    $cron$
    SELECT net.http_post(
      url := 'https://jmjiyekmxwsxkfnqwyaa.supabase.co/functions/v1/dispatch-notification-deliveries',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', false)
      ),
      body := '{}'::jsonb
    );
    $cron$
  );

  -- jobid 5: chravel-process-account-deletions (daily at 03:00 UTC)
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'chravel-process-account-deletions') THEN
    PERFORM cron.unschedule('chravel-process-account-deletions');
  END IF;

  PERFORM cron.schedule(
    'chravel-process-account-deletions',
    '0 3 * * *',
    $cron$
    SELECT net.http_post(
      url := 'https://jmjiyekmxwsxkfnqwyaa.supabase.co/functions/v1/process-account-deletions',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', false)
      ),
      body := '{}'::jsonb
    );
    $cron$
  );
END $$;

-- ---------------------------------------------------------------------------
-- 2) Remove the duplicate chat-notify trigger on trip_chat_messages
-- ---------------------------------------------------------------------------
--
-- trip_chat_messages had TWO AFTER INSERT triggers that BOTH execute the same
-- function notify_on_chat_message(): trigger_notify_chat_message (canonical,
-- (re)created by supabase/migrations/20260512160000_canonical_trip_notification_fanout.sql
-- and earlier) and trigger_notify_on_chat_message (present only in prod, not
-- created by any migration). Identical function => every chat message fanned
-- out notifications twice. Keep the canonical one; drop the prod-only duplicate.
-- (trg_broadcast_chat_message is a separate realtime-broadcast concern and is
-- intentionally left untouched.)
DROP TRIGGER IF EXISTS trigger_notify_on_chat_message ON public.trip_chat_messages;

-- ---------------------------------------------------------------------------
-- 3) Remove the duplicate notification-prefs trigger on profiles
-- ---------------------------------------------------------------------------
--
-- profiles had TWO AFTER INSERT triggers that BOTH execute
-- handle_new_user_notification_preferences(): on_profile_created_notification_prefs
-- (canonical, created by supabase/migrations/20260108021006_*.sql) and
-- trigger_new_user_notification_prefs (present only in prod, not created by any
-- migration). Identical function => default notification preferences were seeded
-- twice on signup. Keep the canonical one; drop the prod-only duplicate.
DROP TRIGGER IF EXISTS trigger_new_user_notification_prefs ON public.profiles;
