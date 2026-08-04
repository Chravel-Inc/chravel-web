-- BACKFILL of a live-applied migration (applied to prod jmjiyekmxwsxkfnqwyaa as version 20260717182925, name 'security_privacy_payment_splits_null_trip_type').
-- Captured verbatim from supabase_migrations.schema_migrations.statements on 2026-08-04
-- so the repo can reproduce the live schema. Already recorded in the live migration
-- history — deploy-migrations.yml will skip it (version/name already present).

DROP POLICY IF EXISTS "Trip members can view payment splits" ON public.payment_splits;
CREATE POLICY "Trip members can view payment splits" ON public.payment_splits FOR SELECT TO authenticated
USING (
  debtor_user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.trip_payment_messages tpm
    JOIN public.trips t ON t.id = tpm.trip_id
    JOIN public.trip_members tm ON tm.trip_id = tpm.trip_id AND tm.user_id = auth.uid()
      AND (tm.status IS NULL OR tm.status = 'active')
    WHERE tpm.id = public.payment_splits.payment_message_id
      AND (
        COALESCE(t.trip_type, 'consumer') = 'consumer'
        OR (
          COALESCE(t.trip_type, 'consumer') IN ('pro', 'event') AND (
            tpm.created_by = auth.uid()
            OR public.is_payment_debtor(tpm.id, auth.uid())
            OR EXISTS (SELECT 1 FROM public.trip_admins ta WHERE ta.trip_id = t.id AND ta.user_id = auth.uid())
            OR EXISTS (
              SELECT 1 FROM public.user_trip_roles utr
              JOIN public.trip_roles tr ON utr.role_id = tr.id
              WHERE utr.user_id = auth.uid() AND utr.trip_id = tpm.trip_id
                AND (tr.feature_permissions -> 'payments' ->> 'can_view')::boolean = true
            )
          )
        )
      )
  )
);
