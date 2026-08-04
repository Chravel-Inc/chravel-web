-- BACKFILL of a live-applied migration (applied to prod jmjiyekmxwsxkfnqwyaa as version 20260603162910, name 'fix_trips_rls_infinite_recursion_conditional').
-- Captured verbatim from supabase_migrations.schema_migrations.statements on 2026-08-04
-- so the repo can reproduce the live schema. Already recorded in the live migration
-- history — deploy-migrations.yml will skip it (version/name already present).

CREATE OR REPLACE FUNCTION public.is_trip_creator(_user_id uuid, _trip_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.trips
    WHERE id = _trip_id AND created_by = _user_id
  )
$function$;

DROP POLICY IF EXISTS "Trip members can update cover image" ON public.trips;

DO $$
DECLARE
  member_exists_sql text;
  trip_auth_sql text;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'trip_members'
      AND column_name = 'status'
  ) THEN
    member_exists_sql := '
      EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = trips.id
          AND tm.user_id = auth.uid()
          AND (tm.status IS NULL OR tm.status = ''active'')
      )';
  ELSE
    member_exists_sql := '
      EXISTS (
        SELECT 1
        FROM public.trip_members tm
        WHERE tm.trip_id = trips.id
          AND tm.user_id = auth.uid()
      )';
  END IF;

  trip_auth_sql := format('
    auth.uid() IS NOT NULL
    AND (
      trips.created_by = auth.uid()
      OR public.is_trip_admin(auth.uid(), trips.id)
      OR (
        trips.trip_type IN (''consumer'', ''pro'')
        AND %s
      )
    )', member_exists_sql);

  EXECUTE format('
    CREATE POLICY "Trip members can update cover image"
    ON public.trips
    FOR UPDATE
    TO authenticated
    USING (%s)
    WITH CHECK (%s)
  ', trip_auth_sql, trip_auth_sql);
END $$;

DROP POLICY IF EXISTS "Trip admins manage admins" ON public.trip_admins;

CREATE POLICY "Trip admins manage admins"
ON public.trip_admins
FOR ALL
TO authenticated
USING (
  public.is_trip_admin((SELECT auth.uid()), trip_id)
  OR public.is_trip_creator((SELECT auth.uid()), trip_id)
);
