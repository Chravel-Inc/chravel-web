-- Migration: Complete atomic payment settlement RPC family
-- Context: PLATFORM_AUDIT_CONSTITUTION L51-52/L153 — settlement double-credit race.
-- Crediting transitions (is_settled flips) must run inside row-locked, status-guarded
-- RPCs. This migration:
--   1. Hardens settle_payment_split with a party authorization check (the prior
--      SECURITY DEFINER body let ANY authenticated user settle any split by id).
--   2. Adds unsettle_payment_split (replaces the client read-then-write path).
--   3. Adds settle_payment_splits_for_debtor (batch settle used by the
--      Confirm/Settle payment dialogs, replacing unguarded direct updates).
-- The unsettled -> settled status guard under FOR UPDATE is the idempotency
-- mechanism: concurrent duplicates and retries observe the final state and
-- report ALREADY_SETTLED / already_settled_count instead of double-crediting.

-- 1) Harden settle_payment_split: only the split's debtor or the parent
--    payment's creator may settle. Payload contract preserved:
--    { success, all_settled } | { success:false, error: NOT_AUTHENTICATED |
--    SPLIT_NOT_FOUND | ALREADY_SETTLED | NOT_AUTHORIZED }
CREATE OR REPLACE FUNCTION settle_payment_split(
  p_split_id UUID,
  p_user_id UUID,  -- kept for backwards-compat; ignored in favor of auth.uid()
  p_method TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_split RECORD;
  v_creator UUID;
  v_all_settled BOOLEAN;
  v_caller UUID;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  -- Row-level lock prevents concurrent settlement of the same split
  SELECT id, is_settled, payment_message_id, debtor_user_id
    INTO v_split
    FROM payment_splits
   WHERE id = p_split_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'SPLIT_NOT_FOUND');
  END IF;

  SELECT created_by INTO v_creator
    FROM trip_payment_messages
   WHERE id = v_split.payment_message_id;

  IF v_caller IS DISTINCT FROM v_split.debtor_user_id
     AND v_caller IS DISTINCT FROM v_creator THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHORIZED');
  END IF;

  IF v_split.is_settled THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_SETTLED');
  END IF;

  UPDATE payment_splits
     SET is_settled = true,
         settled_at = now(),
         settlement_method = COALESCE(p_method, settlement_method)
   WHERE id = p_split_id;

  INSERT INTO payment_audit_log (payment_message_id, action, actor_user_id, metadata)
  VALUES (
    v_split.payment_message_id,
    'settled',
    v_caller,
    jsonb_build_object('split_id', p_split_id, 'method', p_method)
  );

  SELECT NOT EXISTS (
    SELECT 1 FROM payment_splits
     WHERE payment_message_id = v_split.payment_message_id
       AND is_settled = false
  ) INTO v_all_settled;

  UPDATE trip_payment_messages
     SET is_settled = v_all_settled
   WHERE id = v_split.payment_message_id;

  RETURN jsonb_build_object('success', true, 'all_settled', v_all_settled);
END;
$$;

-- 2) Atomic unsettle. Idempotent: unsettling an already-unsettled split is a
--    reported no-op. Payload: { success, already_unsettled } | errors as above.
CREATE OR REPLACE FUNCTION unsettle_payment_split(
  p_split_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_split RECORD;
  v_creator UUID;
  v_caller UUID;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  SELECT id, is_settled, payment_message_id, debtor_user_id
    INTO v_split
    FROM payment_splits
   WHERE id = p_split_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'SPLIT_NOT_FOUND');
  END IF;

  SELECT created_by INTO v_creator
    FROM trip_payment_messages
   WHERE id = v_split.payment_message_id;

  IF v_caller IS DISTINCT FROM v_split.debtor_user_id
     AND v_caller IS DISTINCT FROM v_creator THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHORIZED');
  END IF;

  IF NOT v_split.is_settled THEN
    RETURN jsonb_build_object('success', true, 'already_unsettled', true);
  END IF;

  UPDATE payment_splits
     SET is_settled = false,
         settled_at = NULL,
         settlement_method = NULL
   WHERE id = p_split_id;

  INSERT INTO payment_audit_log (payment_message_id, action, actor_user_id, metadata)
  VALUES (
    v_split.payment_message_id,
    'unsettled',
    v_caller,
    jsonb_build_object('split_id', p_split_id)
  );

  -- A split just became unsettled, so the parent cannot be fully settled
  UPDATE trip_payment_messages
     SET is_settled = false
   WHERE id = v_split.payment_message_id;

  RETURN jsonb_build_object('success', true, 'already_unsettled', false);
END;
$$;

-- 3) Batch settle for the settlement dialogs: settle every unsettled split the
--    given debtor owes on the listed payment messages, in one locked
--    transaction. Caller must be the debtor themself or the creator of EVERY
--    listed payment. Payload: { success, settled_count, already_settled_count }
--    | { success:false, error: NOT_AUTHENTICATED | INVALID_ARGUMENTS |
--    NOT_AUTHORIZED }
CREATE OR REPLACE FUNCTION settle_payment_splits_for_debtor(
  p_payment_message_ids UUID[],
  p_debtor_user_id UUID,
  p_method TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID;
  v_target_count INTEGER;
  v_settled_ids UUID[];
  v_settled_count INTEGER;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  IF p_payment_message_ids IS NULL
     OR array_length(p_payment_message_ids, 1) IS NULL
     OR p_debtor_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_ARGUMENTS');
  END IF;

  -- Caller must be the debtor, or the creator of every listed payment
  IF v_caller IS DISTINCT FROM p_debtor_user_id THEN
    IF EXISTS (
      SELECT 1 FROM trip_payment_messages
       WHERE id = ANY(p_payment_message_ids)
         AND created_by IS DISTINCT FROM v_caller
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHORIZED');
    END IF;
  END IF;

  -- Lock parent payment rows in stable order to serialize concurrent settles
  PERFORM 1
     FROM trip_payment_messages
    WHERE id = ANY(p_payment_message_ids)
    ORDER BY id
      FOR UPDATE;

  -- Total splits this debtor has on the listed payments (settled or not)
  SELECT count(*) INTO v_target_count
    FROM payment_splits
   WHERE payment_message_id = ANY(p_payment_message_ids)
     AND debtor_user_id = p_debtor_user_id;

  -- Status-guarded crediting transition
  WITH updated AS (
    UPDATE payment_splits
       SET is_settled = true,
           settled_at = now(),
           confirmation_status = 'confirmed',
           confirmed_by = v_caller,
           confirmed_at = now(),
           settlement_method = COALESCE(p_method, settlement_method)
     WHERE payment_message_id = ANY(p_payment_message_ids)
       AND debtor_user_id = p_debtor_user_id
       AND is_settled = false
     RETURNING payment_message_id
  )
  SELECT array_agg(payment_message_id) INTO v_settled_ids FROM updated;

  v_settled_count := COALESCE(array_length(v_settled_ids, 1), 0);

  IF v_settled_count > 0 THEN
    INSERT INTO payment_audit_log (payment_message_id, action, actor_user_id, metadata)
    SELECT DISTINCT pm_id,
           'settled',
           v_caller,
           jsonb_build_object('debtor_user_id', p_debtor_user_id, 'method', p_method, 'batch', true)
      FROM unnest(v_settled_ids) AS pm_id;
  END IF;

  -- Roll up parent settled flags for every listed payment
  UPDATE trip_payment_messages tpm
     SET is_settled = NOT EXISTS (
           SELECT 1 FROM payment_splits ps
            WHERE ps.payment_message_id = tpm.id
              AND ps.is_settled = false
         )
   WHERE tpm.id = ANY(p_payment_message_ids);

  RETURN jsonb_build_object(
    'success', true,
    'settled_count', v_settled_count,
    'already_settled_count', GREATEST(v_target_count - v_settled_count, 0)
  );
END;
$$;
