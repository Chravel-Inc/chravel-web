-- Align trip_payment_messages SELECT with payment_splits need-to-know rules.
--
-- Consumer (incl NULL trip_type): any active trip member.
-- Pro/Event: creator, debtor (via is_payment_debtor), trip admin, or
-- role with payments.can_view.
--
-- Also require active membership on INSERT so left members cannot create.
-- payment_attachments already transitively follow parent message visibility.
--
-- Invariants: does not loosen access; create_payment_with_splits_v2 unchanged;
-- consumer members still see all trip payments; no Trip Not Found path touched.

DROP POLICY IF EXISTS "Trip members can view payment messages" ON public.trip_payment_messages;
CREATE POLICY "Trip members can view payment messages"
ON public.trip_payment_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.trip_members tm
    JOIN public.trips t ON t.id = tm.trip_id
    WHERE tm.trip_id = public.trip_payment_messages.trip_id
      AND tm.user_id = auth.uid()
      AND (tm.status IS NULL OR tm.status = 'active')
      AND (
        COALESCE(t.trip_type, 'consumer') = 'consumer'
        OR (
          COALESCE(t.trip_type, 'consumer') IN ('pro', 'event')
          AND (
            public.trip_payment_messages.created_by = auth.uid()
            OR public.is_payment_debtor(public.trip_payment_messages.id, auth.uid())
            OR EXISTS (
              SELECT 1 FROM public.trip_admins ta
              WHERE ta.trip_id = t.id AND ta.user_id = auth.uid()
            )
            OR EXISTS (
              SELECT 1
              FROM public.user_trip_roles utr
              JOIN public.trip_roles tr ON utr.role_id = tr.id
              WHERE utr.user_id = auth.uid()
                AND utr.trip_id = public.trip_payment_messages.trip_id
                AND (tr.feature_permissions -> 'payments' ->> 'can_view')::boolean = true
            )
          )
        )
      )
  )
);

DROP POLICY IF EXISTS "Trip members can create payment messages" ON public.trip_payment_messages;
CREATE POLICY "Trip members can create payment messages"
ON public.trip_payment_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND public.is_active_trip_member(auth.uid(), trip_id)
);
