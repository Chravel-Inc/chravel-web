-- Pre-viral P0: payment settle/confirm hybrid + co-member wallet SELECT +
-- personal basecamp history privacy.
--
-- No-regressions justification:
-- - Does NOT touch trips SELECT, trip_members auth gates, or auth hydration.
-- - Tightens payment RLS (stops debtor self-credit) — reduces payment-state drift.
-- - Wallet SELECT requires is_trip_co_member (active both sides) — existence != access.
-- - Personal basecamp history becomes owner-only — closes address RLS leak to co-members.

-- ---------------------------------------------------------------------------
-- 1) Co-member wallet SELECT (active trip members only)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Trip members can view others payment methods"
  ON public.user_payment_methods;
DROP POLICY IF EXISTS "Active trip co-members can view payment methods"
  ON public.user_payment_methods;

CREATE POLICY "Active trip co-members can view payment methods"
  ON public.user_payment_methods
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_trip_co_member(auth.uid(), user_id)
  );

-- ---------------------------------------------------------------------------
-- 2) Debtor UPDATE: pending handshake only — never credit is_settled
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Debtors can mark their own split settled"
  ON public.payment_splits;
DROP POLICY IF EXISTS "Debtors can mark their own split pending"
  ON public.payment_splits;

CREATE POLICY "Debtors can mark their own split pending"
  ON public.payment_splits
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = debtor_user_id)
  WITH CHECK (
    auth.uid() = debtor_user_id
    AND amount_owed IS NOT DISTINCT FROM (
      SELECT ps.amount_owed FROM public.payment_splits ps WHERE ps.id = payment_splits.id
    )
    AND is_settled IS NOT DISTINCT FROM (
      SELECT ps.is_settled FROM public.payment_splits ps WHERE ps.id = payment_splits.id
    )
    AND settled_at IS NOT DISTINCT FROM (
      SELECT ps.settled_at FROM public.payment_splits ps WHERE ps.id = payment_splits.id
    )
    AND confirmed_by IS NOT DISTINCT FROM (
      SELECT ps.confirmed_by FROM public.payment_splits ps WHERE ps.id = payment_splits.id
    )
    AND confirmed_at IS NOT DISTINCT FROM (
      SELECT ps.confirmed_at FROM public.payment_splits ps WHERE ps.id = payment_splits.id
    )
    AND debtor_user_id IS NOT DISTINCT FROM (
      SELECT ps.debtor_user_id FROM public.payment_splits ps WHERE ps.id = payment_splits.id
    )
    AND payment_message_id IS NOT DISTINCT FROM (
      SELECT ps.payment_message_id FROM public.payment_splits ps WHERE ps.id = payment_splits.id
    )
    AND (
      confirmation_status IS NOT DISTINCT FROM (
        SELECT ps.confirmation_status FROM public.payment_splits ps WHERE ps.id = payment_splits.id
      )
      OR (
        confirmation_status = 'pending'
        AND COALESCE(
          (SELECT ps.confirmation_status FROM public.payment_splits ps WHERE ps.id = payment_splits.id),
          'none'
        ) IN ('none', 'pending')
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 3) Creator UPDATE: pin is_settled — credit only via RPCs
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Payment creators can update splits for their payments"
  ON public.payment_splits;

CREATE POLICY "Payment creators can update splits for their payments"
  ON public.payment_splits
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_payment_messages tpm
      WHERE tpm.id = payment_splits.payment_message_id
        AND tpm.created_by = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_payment_messages tpm
      WHERE tpm.id = payment_splits.payment_message_id
        AND tpm.created_by = (SELECT auth.uid())
    )
    AND payment_message_id IS NOT DISTINCT FROM (
      SELECT ps.payment_message_id FROM public.payment_splits ps WHERE ps.id = payment_splits.id
    )
    AND debtor_user_id IS NOT DISTINCT FROM (
      SELECT ps.debtor_user_id FROM public.payment_splits ps WHERE ps.id = payment_splits.id
    )
    AND amount_owed IS NOT DISTINCT FROM (
      SELECT ps.amount_owed FROM public.payment_splits ps WHERE ps.id = payment_splits.id
    )
    AND is_settled IS NOT DISTINCT FROM (
      SELECT ps.is_settled FROM public.payment_splits ps WHERE ps.id = payment_splits.id
    )
    AND settled_at IS NOT DISTINCT FROM (
      SELECT ps.settled_at FROM public.payment_splits ps WHERE ps.id = payment_splits.id
    )
    AND confirmation_status IS NOT DISTINCT FROM (
      SELECT ps.confirmation_status FROM public.payment_splits ps WHERE ps.id = payment_splits.id
    )
    AND confirmed_by IS NOT DISTINCT FROM (
      SELECT ps.confirmed_by FROM public.payment_splits ps WHERE ps.id = payment_splits.id
    )
    AND confirmed_at IS NOT DISTINCT FROM (
      SELECT ps.confirmed_at FROM public.payment_splits ps WHERE ps.id = payment_splits.id
    )
  );

-- ---------------------------------------------------------------------------
-- 4) settle_payment_split — creator-only credit + confirmation parity
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 5) unsettle_payment_split — creator-only
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 6) settle_payment_splits_for_debtor — creator-only credit
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 7) mark_payment_splits_pending — debtor "I paid" (non-crediting)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 8) Personal basecamp history: owner-only SELECT (no address leak to co-members)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "basecamp_history_select_trip_members"
  ON public.basecamp_change_history;
DROP POLICY IF EXISTS "basecamp_history_select_scoped"
  ON public.basecamp_change_history;

CREATE POLICY "basecamp_history_select_scoped"
  ON public.basecamp_change_history
  FOR SELECT
  TO authenticated
  USING (
    (
      basecamp_type = 'personal'
      AND user_id = auth.uid()
    )
    OR
    (
      basecamp_type IS DISTINCT FROM 'personal'
      AND (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.trips t
          WHERE t.id = basecamp_change_history.trip_id
            AND t.created_by = auth.uid()
        )
        OR public.is_active_trip_member(auth.uid(), basecamp_change_history.trip_id)
      )
    )
  );
