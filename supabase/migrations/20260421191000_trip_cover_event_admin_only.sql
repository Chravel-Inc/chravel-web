-- Follow-up parity fix:
-- Trip + Pro: any active member can manage cover photos.
-- Event: only creator or assigned trip_admins can manage cover photos.

-- Recreate cover-storage policies with trip-type-aware authorization.
DROP POLICY IF EXISTS "Trip members can upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Trip members can update covers" ON storage.objects;
DROP POLICY IF EXISTS "Trip members can delete covers" ON storage.objects;

DO $$
DECLARE
  status_filter TEXT;
  auth_clause TEXT;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'trip_members'
      AND column_name = 'status'
  ) THEN
    status_filter := 'AND (tm.status IS NULL OR tm.status = ''active'')';
  ELSE
    status_filter := '';
  END IF;

  auth_clause := format(
    'EXISTS (
      SELECT 1
      FROM public.trips t
      JOIN public.trip_members tm
        ON tm.trip_id = t.id
       AND tm.user_id = auth.uid()
       %s
      LEFT JOIN public.trip_admins ta
        ON ta.trip_id = t.id
       AND ta.user_id = auth.uid()
      WHERE t.id::text = (storage.foldername(name))[1]
        AND (
          t.trip_type IN (''consumer'', ''pro'')
          OR t.created_by = auth.uid()
          OR ta.user_id IS NOT NULL
        )
    )',
    status_filter
  );

  EXECUTE format('
    CREATE POLICY "Trip members can upload covers"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = ''trip-covers'' AND %s)
  ', auth_clause);

  EXECUTE format('
    CREATE POLICY "Trip members can update covers"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = ''trip-covers'' AND %s)
  ', auth_clause);

  EXECUTE format('
    CREATE POLICY "Trip members can delete covers"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = ''trip-covers'' AND %s)
  ', auth_clause);
END $$;

-- Recreate trips cover-image update policy with the same trip-type-aware authorization.
DROP POLICY IF EXISTS "Trip members can update cover image" ON public.trips;

DO $$
DECLARE
  status_filter TEXT;
  auth_clause TEXT;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'trip_members'
      AND column_name = 'status'
  ) THEN
    status_filter := 'AND (tm.status IS NULL OR tm.status = ''active'')';
  ELSE
    status_filter := '';
  END IF;

  auth_clause := format(
    'EXISTS (
      SELECT 1
      FROM public.trip_members tm
      LEFT JOIN public.trip_admins ta
        ON ta.trip_id = trips.id
       AND ta.user_id = auth.uid()
      WHERE tm.trip_id = trips.id
        AND tm.user_id = auth.uid()
        %s
        AND (
          trips.trip_type IN (''consumer'', ''pro'')
          OR trips.created_by = auth.uid()
          OR ta.user_id IS NOT NULL
        )
    )',
    status_filter
  );

  EXECUTE format('
    CREATE POLICY "Trip members can update cover image"
    ON public.trips FOR UPDATE
    TO authenticated
    USING (%s)
    WITH CHECK (%s)
  ', auth_clause, auth_clause);
END $$;
