-- BACKFILL of a live-applied migration (applied to prod jmjiyekmxwsxkfnqwyaa as version 20260730185002, name 'pre_viral_p0_settle_splits_for_debtor_creator_only').
-- Captured verbatim from supabase_migrations.schema_migrations.statements on 2026-08-04
-- so the repo can reproduce the live schema. Already recorded in the live migration
-- history — deploy-migrations.yml will skip it (version/name already present).

CREATE OR REPLACE FUNCTION public.settle_payment_splits_for_debtor(
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

  IF EXISTS (
    SELECT 1 FROM trip_payment_messages
     WHERE id = ANY(p_payment_message_ids)
       AND created_by IS DISTINCT FROM v_caller
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHORIZED');
  END IF;

  PERFORM 1
     FROM trip_payment_messages
    WHERE id = ANY(p_payment_message_ids)
    ORDER BY id
      FOR UPDATE;

  SELECT count(*) INTO v_target_count
    FROM payment_splits
   WHERE payment_message_id = ANY(p_payment_message_ids)
     AND debtor_user_id = p_debtor_user_id;

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
