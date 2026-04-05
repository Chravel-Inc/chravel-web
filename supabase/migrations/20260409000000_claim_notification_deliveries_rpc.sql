-- ============================================================================
-- Atomic batch claim for notification delivery dispatch
-- Prevents duplicate SMS/email/push when concurrent cron invocations overlap.
-- ============================================================================

-- 1) Add 'processing' transitional state to the delivery status enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'public.notification_delivery_status'::regtype
      AND enumlabel = 'processing'
  ) THEN
    ALTER TYPE public.notification_delivery_status ADD VALUE IF NOT EXISTS 'processing' BEFORE 'sent';
  END IF;
END $$;

-- 2) Atomic claim RPC: SELECT FOR UPDATE SKIP LOCKED + immediate status transition
CREATE OR REPLACE FUNCTION public.claim_notification_deliveries(
  p_limit INTEGER DEFAULT 100,
  p_channels TEXT[] DEFAULT NULL,
  p_delivery_ids UUID[] DEFAULT NULL,
  p_notification_ids UUID[] DEFAULT NULL
)
RETURNS SETOF public.notification_deliveries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.notification_deliveries nd
  SET status = 'processing'::public.notification_delivery_status,
      updated_at = NOW()
  FROM (
    SELECT nd2.id
    FROM public.notification_deliveries nd2
    WHERE nd2.status = 'queued'::public.notification_delivery_status
      AND nd2.next_attempt_at <= NOW()
      AND (p_channels IS NULL OR nd2.channel::TEXT = ANY(p_channels))
      AND (p_delivery_ids IS NULL OR nd2.id = ANY(p_delivery_ids))
      AND (p_notification_ids IS NULL OR nd2.notification_id = ANY(p_notification_ids))
    ORDER BY nd2.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT p_limit
  ) claimed
  WHERE nd.id = claimed.id
  RETURNING nd.*;
END;
$$;
