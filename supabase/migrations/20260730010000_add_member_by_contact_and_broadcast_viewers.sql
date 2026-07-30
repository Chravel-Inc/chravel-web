-- Wave: add existing members by email/phone + broadcast viewer roster + payment remind.
-- Regression review (chravel-no-regressions):
-- - Trip Not Found: no changes to trip load/auth hydration paths.
-- - Auth desync: RPCs require auth.uid(); lookup is service_role-only.
-- - RLS leaks: lookup_user_id_by_contact EXECUTE revoked from anon/authenticated;
--   get_broadcast_viewers / remind_trip_balance require is_active_trip_member.
-- - Payment drift: remind only inserts a notification; does not mutate splits.

-- ---------------------------------------------------------------------------
-- 1. Contact lookup (service_role only — reads auth.users)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lookup_user_id_by_contact(
  p_email text DEFAULT NULL,
  p_phone_digits text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_email text := NULLIF(lower(trim(COALESCE(p_email, ''))), '');
  v_phone text := NULLIF(regexp_replace(COALESCE(p_phone_digits, ''), '\D', '', 'g'), '');
  v_last10 text;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF v_email IS NULL AND (v_phone IS NULL OR length(v_phone) < 7) THEN
    RETURN NULL;
  END IF;

  IF v_email IS NOT NULL THEN
    SELECT u.id INTO v_uid
    FROM auth.users u
    WHERE lower(u.email) = v_email
    LIMIT 1;

    IF v_uid IS NOT NULL THEN
      RETURN v_uid;
    END IF;

    SELECT p.user_id INTO v_uid
    FROM public.profiles p
    WHERE p.email IS NOT NULL
      AND lower(p.email) = v_email
    LIMIT 1;

    IF v_uid IS NOT NULL THEN
      RETURN v_uid;
    END IF;
  END IF;

  IF v_phone IS NOT NULL AND length(v_phone) >= 7 THEN
    v_last10 := CASE WHEN length(v_phone) > 10 THEN right(v_phone, 10) ELSE v_phone END;

    SELECT p.user_id INTO v_uid
    FROM public.profiles p
    WHERE p.phone IS NOT NULL
      AND (
        regexp_replace(p.phone, '\D', '', 'g') = v_phone
        OR right(regexp_replace(p.phone, '\D', '', 'g'), 10) = v_last10
      )
    LIMIT 1;

    IF v_uid IS NOT NULL THEN
      RETURN v_uid;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.lookup_user_id_by_contact(text, text) IS
  'Service-role only. Resolves an existing Chravel user by email (auth.users/profiles) or phone digits (profiles.phone).';

REVOKE ALL ON FUNCTION public.lookup_user_id_by_contact(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_user_id_by_contact(text, text) TO service_role;

-- ---------------------------------------------------------------------------
-- 2. Broadcast viewer roster (active trip members only)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_broadcast_viewers(p_broadcast_id uuid)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  viewed_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_uid uuid := auth.uid();
  v_trip_id text;
BEGIN
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT b.trip_id INTO v_trip_id
  FROM public.broadcasts b
  WHERE b.id = p_broadcast_id;

  IF v_trip_id IS NULL THEN
    RAISE EXCEPTION 'Broadcast not found';
  END IF;

  IF NOT public.is_active_trip_member(v_auth_uid, v_trip_id) THEN
    RAISE EXCEPTION 'Not a member of this trip';
  END IF;

  RETURN QUERY
  SELECT
    bv.user_id,
    COALESCE(
      NULLIF(trim(tm.display_name_snapshot), ''),
      pp.resolved_display_name,
      pp.display_name,
      NULLIF(trim(concat_ws(' ', pp.first_name, pp.last_name)), ''),
      'Chravel User'
    ) AS display_name,
    COALESCE(pp.avatar_url, tm.avatar_url_snapshot) AS avatar_url,
    bv.viewed_at
  FROM public.broadcast_views bv
  LEFT JOIN public.trip_members tm
    ON tm.trip_id = v_trip_id AND tm.user_id = bv.user_id
  LEFT JOIN public.profiles_public pp ON pp.user_id = bv.user_id
  WHERE bv.broadcast_id = p_broadcast_id
  ORDER BY bv.viewed_at ASC;
END;
$$;

COMMENT ON FUNCTION public.get_broadcast_viewers(uuid) IS
  'Returns who has viewed a broadcast. Caller must be an active member of the broadcast trip.';

REVOKE ALL ON FUNCTION public.get_broadcast_viewers(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_broadcast_viewers(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Payment balance reminder (creditor → debtor, active members only)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.remind_trip_balance(
  p_trip_id text,
  p_debtor_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_uid uuid := auth.uid();
  v_trip_name text;
  v_amount numeric := 0;
  v_currency text := 'USD';
  v_notification_id uuid;
BEGIN
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_debtor_user_id IS NULL OR p_debtor_user_id = v_auth_uid THEN
    RAISE EXCEPTION 'Invalid debtor';
  END IF;

  IF NOT public.is_active_trip_member(v_auth_uid, p_trip_id)
     OR NOT public.is_active_trip_member(p_debtor_user_id, p_trip_id) THEN
    RAISE EXCEPTION 'Both users must be active trip members';
  END IF;

  SELECT COALESCE(NULLIF(trim(t.name), ''), 'your trip')
  INTO v_trip_name
  FROM public.trips t
  WHERE t.id = p_trip_id;

  IF v_trip_name IS NULL THEN
    RAISE EXCEPTION 'Trip not found';
  END IF;

  SELECT
    COALESCE(SUM(ps.amount_owed), 0),
    COALESCE(MAX(tpm.currency), 'USD')
  INTO v_amount, v_currency
  FROM public.payment_splits ps
  JOIN public.trip_payment_messages tpm ON tpm.id = ps.payment_message_id
  WHERE tpm.trip_id = p_trip_id
    AND tpm.created_by = v_auth_uid
    AND ps.debtor_user_id = p_debtor_user_id
    AND COALESCE(ps.is_settled, false) = false;

  IF COALESCE(v_amount, 0) <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'NO_BALANCE');
  END IF;

  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    trip_id,
    metadata
  ) VALUES (
    p_debtor_user_id,
    'Payment reminder',
    format(
      'You still owe %s %s on %s. Settle up in the Payments tab.',
      to_char(v_amount, 'FM999999990.00'),
      v_currency,
      v_trip_name
    ),
    'payment_reminder',
    p_trip_id::uuid,
    jsonb_build_object(
      'trip_id', p_trip_id,
      'tab', 'payments',
      'amount', v_amount,
      'currency', v_currency,
      'reminded_by', v_auth_uid,
      'fanout_event_key', format(
        'payment_reminder:%s:%s:%s:%s',
        p_trip_id,
        v_auth_uid,
        p_debtor_user_id,
        to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD')
      )
    )
  )
  ON CONFLICT (user_id, type, fanout_event_key)
    WHERE fanout_event_key IS NOT NULL
  DO NOTHING
  RETURNING id INTO v_notification_id;

  RETURN jsonb_build_object(
    'success', true,
    'amount', v_amount,
    'currency', v_currency,
    'notification_id', v_notification_id
  );
END;
$$;

COMMENT ON FUNCTION public.remind_trip_balance(text, uuid) IS
  'Lets a creditor notify a co-member who still owes them unsettled payment splits.';

REVOKE ALL ON FUNCTION public.remind_trip_balance(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remind_trip_balance(text, uuid) TO authenticated, service_role;
