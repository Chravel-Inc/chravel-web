-- BACKFILL of a live-applied migration (applied to prod jmjiyekmxwsxkfnqwyaa as version 20260730184432, name 'pre_viral_p0_payment_and_basecamp').
-- Captured verbatim from supabase_migrations.schema_migrations.statements on 2026-08-04
-- so the repo can reproduce the live schema. Already recorded in the live migration
-- history — deploy-migrations.yml will skip it (version/name already present).

-- Pre-viral P0: payment settle/confirm hybrid + co-member wallet SELECT +
-- personal basecamp history privacy.

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
