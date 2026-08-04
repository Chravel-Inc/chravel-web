-- BACKFILL of a live-applied migration (applied to prod jmjiyekmxwsxkfnqwyaa as version 20260730184947, name 'pre_viral_p0_unsettle_payment_split_creator_only').
-- Captured verbatim from supabase_migrations.schema_migrations.statements on 2026-08-04
-- so the repo can reproduce the live schema. Already recorded in the live migration
-- history — deploy-migrations.yml will skip it (version/name already present).

CREATE OR REPLACE FUNCTION public.unsettle_payment_split(
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

  IF v_caller IS DISTINCT FROM v_creator THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHORIZED');
  END IF;

  IF NOT v_split.is_settled THEN
    RETURN jsonb_build_object('success', true, 'already_unsettled', true);
  END IF;

  UPDATE payment_splits
     SET is_settled = false,
         settled_at = NULL,
         settlement_method = NULL,
         confirmation_status = 'none',
         confirmed_by = NULL,
         confirmed_at = NULL
   WHERE id = p_split_id;

  INSERT INTO payment_audit_log (payment_message_id, action, actor_user_id, metadata)
  VALUES (
    v_split.payment_message_id,
    'unsettled',
    v_caller,
    jsonb_build_object('split_id', p_split_id)
  );

  UPDATE trip_payment_messages
     SET is_settled = false
   WHERE id = v_split.payment_message_id;

  RETURN jsonb_build_object('success', true, 'already_unsettled', false);
END;
$$;
