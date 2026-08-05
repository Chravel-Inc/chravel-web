-- Scale hardening 3/3: give the append-only operational tables a retention policy.
--
-- THE PROBLEM
-- The database had exactly four scheduled jobs, and none of them pruned anything. Every operational
-- table grows forever:
--
--     rate_limits        269 rows   -- the rate limiter's own table, expired rows never removed
--     webhook_events     662 rows   -- Stripe/RevenueCat idempotency guard
--     security_audit_log 477 rows
--     notifications      167 rows
--     ai_queries         110 rows
--
-- `cleanup_rate_limits()` already existed as a function and was scheduled nowhere, so rows with a
-- past `expires_at` accumulated indefinitely. Unbounded tables do not fail loudly; they quietly
-- inflate every sequential scan, every autovacuum cycle and every backup until something times out.
--
-- WHAT IS *NOT* PRUNED, DELIBERATELY
--   security_audit_log, admin_audit_logs, payment_audit_log, entitlement_audit_log
-- These are compliance records. admin_audit_logs is hash-chained and both it and security_audit_log
-- carry triggers that reject UPDATE/DELETE/TRUNCATE outright, so a retention job would fail against
-- them by design. If they ever need trimming it must be an explicit, reviewed archival process —
-- never an automated delete. They are listed here so the omission reads as a decision, not an
-- oversight.
--
-- WHY webhook_events IS KEPT FOR 400 DAYS
-- It is not telemetry — it is the idempotency guard for Stripe and RevenueCat, so its retention
-- window IS its replay-protection window. Deleting a row means a webhook carrying that event_id
-- would be treated as new and processed a second time. Provider auto-retries last only days, but
-- an operator can replay a historical event from the Stripe dashboard at any point, and event ids
-- live forever. The rows are ~100 bytes; trading double-charge protection for that space would be
-- a bad bargain, so this window is set by payment correctness rather than by storage.
--
-- Windows are deliberately generous; the goal is bounding growth, not reclaiming bytes.
--
-- Regression scope: deletes rows from operational/telemetry tables only, all far outside any live
-- read path. `notifications` is the one user-facing table touched and is handled conservatively —
-- an unread, uncleared notification is NEVER deleted regardless of age. No policy, trip fetch or
-- auth path is affected, and no payment record or payment-idempotency guarantee is weakened.

CREATE OR REPLACE FUNCTION public.run_data_retention()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  -- Retention windows, in days.
  c_webhook_events      CONSTANT int := 400;  -- idempotency guard; see header. NOT a storage decision.
  c_ai_queries          CONSTANT int := 180;
  c_notification_logs   CONSTANT int := 90;   -- delivery telemetry
  c_notifications       CONSTANT int := 180;  -- only ones the user has already dealt with
  c_concierge_usage     CONSTANT int := 400;  -- 13 months, so monthly budgets keep a full year of history

  v_webhook   int := 0;
  v_ai        int := 0;
  v_notif_log int := 0;
  v_notif     int := 0;
  v_usage     int := 0;
BEGIN
  DELETE FROM public.webhook_events
   WHERE created_at < now() - make_interval(days => c_webhook_events);
  GET DIAGNOSTICS v_webhook = ROW_COUNT;

  DELETE FROM public.ai_queries
   WHERE created_at < now() - make_interval(days => c_ai_queries);
  GET DIAGNOSTICS v_ai = ROW_COUNT;

  DELETE FROM public.notification_logs
   WHERE created_at < now() - make_interval(days => c_notification_logs);
  GET DIAGNOSTICS v_notif_log = ROW_COUNT;

  -- Conservative: an unread, still-visible, uncleared notification is never removed, however old.
  DELETE FROM public.notifications
   WHERE created_at < now() - make_interval(days => c_notifications)
     AND (coalesce(is_read, false) = true
          OR coalesce(is_visible, true) = false
          OR cleared_at IS NOT NULL);
  GET DIAGNOSTICS v_notif = ROW_COUNT;

  DELETE FROM public.concierge_usage
   WHERE created_at < now() - make_interval(days => c_concierge_usage);
  GET DIAGNOSTICS v_usage = ROW_COUNT;

  RETURN jsonb_build_object(
    'ran_at',             now(),
    'webhook_events',     v_webhook,
    'ai_queries',         v_ai,
    'notification_logs',  v_notif_log,
    'notifications',      v_notif,
    'concierge_usage',    v_usage
  );
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.run_data_retention() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.run_data_retention() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_data_retention() TO service_role;

-- cleanup_rate_limits() already existed but was never scheduled. rate_limits is high-churn with a
-- short TTL, so it gets its own hourly job rather than riding the daily sweep.
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limits() TO service_role;

DO $cron$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE NOTICE 'pg_cron not installed; retention jobs not scheduled.';
    RETURN;
  END IF;

  -- Idempotent: unschedule by name first so re-running does not stack duplicate jobs.
  PERFORM cron.unschedule('chravel-rate-limit-cleanup')
   WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'chravel-rate-limit-cleanup');
  PERFORM cron.schedule(
    'chravel-rate-limit-cleanup',
    '23 * * * *',
    $job$SELECT public.cleanup_rate_limits();$job$
  );

  PERFORM cron.unschedule('chravel-data-retention')
   WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'chravel-data-retention');
  PERFORM cron.schedule(
    'chravel-data-retention',
    '41 4 * * *',
    $job$SELECT public.run_data_retention();$job$
  );
END;
$cron$;

COMMENT ON FUNCTION public.run_data_retention() IS
  'Daily retention sweep for operational/telemetry tables. Deliberately excludes the compliance '
  'audit logs (security_audit_log, admin_audit_logs, payment_audit_log, entitlement_audit_log), '
  'which are append-only and trigger-protected. Scheduled as chravel-data-retention.';
