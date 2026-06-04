-- ============================================================================
-- Ensure the notification → delivery fan-out is wired in EVERY environment.
--
-- Production audit (2026-06-04) found the root cause that push/email have never
-- delivered: `public.queue_notification_deliveries()` and its AFTER INSERT
-- trigger on `public.notifications` were MISSING (155 notifications had produced
-- 0 `notification_deliveries` rows), and the `notification_deliveries` table was
-- missing the UNIQUE(notification_id, channel) the fan-out relies on for its
-- idempotent ON CONFLICT. `create-notification` only inserts the notification
-- row and relies on this trigger to enqueue per-channel deliveries that the
-- `dispatch-notification-deliveries` cron (running every minute) then sends.
--
-- This migration is idempotent/self-healing: it ensures the unique index, the
-- push + email fan-out function (SMS removed), and the trigger all exist, so the
-- pipeline works regardless of prior drift. Safe to run alongside the SMS
-- removal migration in any order. The table is empty in the affected
-- environment, so adding the unique index cannot conflict with existing rows.
-- ============================================================================

-- 1) Idempotency key the fan-out depends on (supports ON CONFLICT below).
CREATE UNIQUE INDEX IF NOT EXISTS notification_deliveries_notification_id_channel_key
  ON public.notification_deliveries (notification_id, channel);

-- 2) Fan-out function: enqueue push + email deliveries for each new notification.
CREATE OR REPLACE FUNCTION public.queue_notification_deliveries()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_deliveries (
    notification_id,
    recipient_user_id,
    channel,
    status,
    next_attempt_at
  )
  VALUES
    (NEW.id, NEW.user_id, 'push', 'queued', COALESCE(NEW.created_at, NOW())),
    (NEW.id, NEW.user_id, 'email', 'queued', COALESCE(NEW.created_at, NOW()))
  ON CONFLICT (notification_id, channel) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 3) Attach the trigger.
DROP TRIGGER IF EXISTS trigger_queue_notification_deliveries ON public.notifications;
CREATE TRIGGER trigger_queue_notification_deliveries
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_notification_deliveries();
