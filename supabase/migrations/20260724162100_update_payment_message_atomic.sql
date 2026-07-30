CREATE OR REPLACE FUNCTION public.update_payment_message_atomic(
  p_payment_id uuid,
  p_expected_version integer,
  p_amount numeric DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_uid uuid := auth.uid();
  v_payment public.trip_payment_messages;
  v_new_amount numeric;
  v_split_ids uuid[] := ARRAY[]::uuid[];
  v_split_count integer := 0;
  v_total_cents integer := 0;
  v_base_cents integer := 0;
  v_remainder_cents integer := 0;
  v_index integer := 0;
  v_split_id uuid;
  v_split record;
BEGIN
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_amount IS NOT NULL THEN
    FOR v_split IN
      SELECT id
      FROM public.payment_splits
      WHERE payment_message_id = p_payment_id
        AND is_settled = false
      ORDER BY created_at ASC, id ASC
      FOR UPDATE
    LOOP
      v_split_ids := array_append(v_split_ids, v_split.id);
      v_split_count := v_split_count + 1;
    END LOOP;
  END IF;

  SELECT *
  INTO v_payment
  FROM public.trip_payment_messages
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'NOT_FOUND');
  END IF;

  IF v_payment.created_by <> v_auth_uid THEN
    RAISE EXCEPTION 'Only the creator can update this payment';
  END IF;

  IF COALESCE(v_payment.version, 1) <> p_expected_version THEN
    RETURN jsonb_build_object('success', false, 'reason', 'VERSION_CONFLICT');
  END IF;

  v_new_amount := COALESCE(p_amount, v_payment.amount);

  UPDATE public.trip_payment_messages
  SET amount = v_new_amount,
      description = COALESCE(p_description, description),
      updated_at = now(),
      version = COALESCE(version, 1) + 1
  WHERE id = p_payment_id;

  IF p_amount IS NOT NULL AND v_split_count > 0 THEN
    v_total_cents := round(v_new_amount * 100)::integer;
    v_base_cents := v_total_cents / v_split_count;
    v_remainder_cents := v_total_cents - (v_base_cents * v_split_count);
    v_index := 0;

    FOREACH v_split_id IN ARRAY v_split_ids
    LOOP
      UPDATE public.payment_splits
      SET amount_owed = (
        v_base_cents + CASE WHEN v_index < v_remainder_cents THEN 1 ELSE 0 END
      )::numeric / 100
      WHERE id = v_split_id;

      v_index := v_index + 1;
    END LOOP;
  END IF;

  INSERT INTO public.payment_audit_log (
    payment_message_id,
    action,
    actor_user_id,
    metadata
  ) VALUES (
    p_payment_id,
    'updated',
    v_auth_uid,
    jsonb_build_object(
      'amount', v_new_amount,
      'description', COALESCE(p_description, v_payment.description),
      'had_amount_change', p_amount IS NOT NULL,
      'had_description_change', p_description IS NOT NULL
    )
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_payment_message_atomic(uuid, integer, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_payment_message_atomic(uuid, integer, numeric, text) TO authenticated, service_role;
