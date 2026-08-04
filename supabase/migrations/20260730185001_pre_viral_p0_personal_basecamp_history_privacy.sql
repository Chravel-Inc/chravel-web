-- BACKFILL of a live-applied migration (applied to prod jmjiyekmxwsxkfnqwyaa as version 20260730185001, name 'pre_viral_p0_personal_basecamp_history_privacy').
-- Captured verbatim from supabase_migrations.schema_migrations.statements on 2026-08-04
-- so the repo can reproduce the live schema. Already recorded in the live migration
-- history — deploy-migrations.yml will skip it (version/name already present).

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
