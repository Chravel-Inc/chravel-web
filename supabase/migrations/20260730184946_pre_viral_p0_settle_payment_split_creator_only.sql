-- BACKFILL of a live-applied migration (applied to prod jmjiyekmxwsxkfnqwyaa as version 20260730184946, name 'pre_viral_p0_settle_payment_split_creator_only').
-- Captured verbatim from supabase_migrations.schema_migrations.statements on 2026-08-04
-- so the repo can reproduce the live schema. Already recorded in the live migration
-- history — deploy-migrations.yml will skip it (version/name already present).

CREATE OR REPLACE FUNCTION public.settle_payment_split(
  p_split_id UUID,
  p_user_id UUID,
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

  IF v_caller IS DISTINCT FROM v_creator THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHORIZED');
  END IF;

  IF v_split.is_settled THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_SETTLED');
  END IF;

  UPDATE payment_splits
     SET is_settled = true,
         settled_at = now(),
         confirmation_status = 'confirmed',
         confirmed_by = v_caller,
         confirmed_at = now(),
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
