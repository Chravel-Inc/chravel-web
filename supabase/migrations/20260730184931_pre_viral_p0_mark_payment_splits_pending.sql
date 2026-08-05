-- BACKFILL of a live-applied migration (applied to prod jmjiyekmxwsxkfnqwyaa as version 20260730184931, name 'pre_viral_p0_mark_payment_splits_pending').
-- Captured verbatim from supabase_migrations.schema_migrations.statements on 2026-08-04
-- so the repo can reproduce the live schema. Already recorded in the live migration
-- history — deploy-migrations.yml will skip it (version/name already present).

CREATE OR REPLACE FUNCTION public.mark_payment_splits_pending(
  p_payment_message_ids UUID[],
  p_method TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID;
  v_updated INTEGER;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  IF p_payment_message_ids IS NULL
     OR array_length(p_payment_message_ids, 1) IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_ARGUMENTS');
  END IF;

  UPDATE payment_splits
     SET confirmation_status = 'pending',
         settlement_method = COALESCE(p_method, settlement_method)
   WHERE payment_message_id = ANY(p_payment_message_ids)
     AND debtor_user_id = v_caller
     AND is_settled = false
     AND COALESCE(confirmation_status, 'none') IN ('none', 'pending');

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'updated_count', v_updated);
END;
$$;

REVOKE ALL ON FUNCTION public.mark_payment_splits_pending(UUID[], TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_payment_splits_pending(UUID[], TEXT) TO authenticated;
