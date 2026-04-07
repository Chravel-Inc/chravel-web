-- Fix trip cover uploads for member roles on event/admin_only media trips.
-- Cover image uploads are managed separately from gallery/chat media_upload_mode.
DROP POLICY IF EXISTS "Trip members can upload trip covers" ON storage.objects;

CREATE POLICY "Trip members can upload trip covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trip-media'
  AND (storage.foldername(name))[1] = 'trip-covers'
  AND EXISTS (
    SELECT 1 FROM public.trip_members tm
    WHERE tm.trip_id::text = (storage.foldername(name))[2]
      AND tm.user_id = auth.uid()
  )
);
