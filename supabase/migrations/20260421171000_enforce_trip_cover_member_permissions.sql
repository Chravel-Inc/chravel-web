-- Production-parity hardening for trip cover uploads.
--
-- Why:
-- Some environments have drift between legacy trip-media/trip-covers policies and the
-- dedicated trip-covers bucket model. This migration enforces one canonical policy model:
--   - bucket: trip-covers
--   - path: <tripId>/<filename>
--   - auth: active trip members can insert/update/delete
--   - trips cover write: active trip members can update trips.cover_image_url

-- Ensure canonical bucket exists and is public (required for OG/social previews)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trip-covers',
  'trip-covers',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Remove legacy/duplicate policy names from prior migrations.
DROP POLICY IF EXISTS "trip-covers: members can insert" ON storage.objects;
DROP POLICY IF EXISTS "trip-covers: members can update" ON storage.objects;
DROP POLICY IF EXISTS "trip-covers: members can delete" ON storage.objects;
DROP POLICY IF EXISTS "Trip members can upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Trip members can update covers" ON storage.objects;
DROP POLICY IF EXISTS "Trip members can delete covers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view trip covers" ON storage.objects;
DROP POLICY IF EXISTS "Trip members can upload trip covers" ON storage.objects;

DO $$
DECLARE
  active_member_clause TEXT;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'trip_members'
      AND column_name = 'status'
  ) THEN
    active_member_clause :=
      'EXISTS (SELECT 1 FROM public.trip_members tm WHERE tm.trip_id::text = (storage.foldername(name))[1] AND tm.user_id = auth.uid() AND (tm.status IS NULL OR tm.status = ''active''))';
  ELSE
    active_member_clause :=
      'EXISTS (SELECT 1 FROM public.trip_members tm WHERE tm.trip_id::text = (storage.foldername(name))[1] AND tm.user_id = auth.uid())';
  END IF;

  EXECUTE '
    CREATE POLICY "Anyone can view trip covers"
    ON storage.objects FOR SELECT
    USING (bucket_id = ''trip-covers'')
  ';

  EXECUTE format('
    CREATE POLICY "Trip members can upload covers"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = ''trip-covers'' AND %s)
  ', active_member_clause);

  EXECUTE format('
    CREATE POLICY "Trip members can update covers"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = ''trip-covers'' AND %s)
  ', active_member_clause);

  EXECUTE format('
    CREATE POLICY "Trip members can delete covers"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = ''trip-covers'' AND %s)
  ', active_member_clause);
END $$;

DROP POLICY IF EXISTS "Trip members can update cover image" ON public.trips;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'trip_members'
      AND column_name = 'status'
  ) THEN
    EXECUTE '
      CREATE POLICY "Trip members can update cover image"
      ON public.trips FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.trip_members tm
          WHERE tm.trip_id = trips.id
            AND tm.user_id = auth.uid()
            AND (tm.status IS NULL OR tm.status = ''active'')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.trip_members tm
          WHERE tm.trip_id = trips.id
            AND tm.user_id = auth.uid()
            AND (tm.status IS NULL OR tm.status = ''active'')
        )
      )
    ';
  ELSE
    EXECUTE '
      CREATE POLICY "Trip members can update cover image"
      ON public.trips FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.trip_members tm
          WHERE tm.trip_id = trips.id
            AND tm.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.trip_members tm
          WHERE tm.trip_id = trips.id
            AND tm.user_id = auth.uid()
        )
      )
    ';
  END IF;
END $$;
