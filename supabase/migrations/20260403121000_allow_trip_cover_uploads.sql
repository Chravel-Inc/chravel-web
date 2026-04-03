-- Allow authenticated trip members to upload cover images into trip-media/trip-covers/<tripId>/...
CREATE POLICY "Trip members can upload trip covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trip-media'
  AND (storage.foldername(name))[1] = 'trip-covers'
  AND can_upload_media_to_trip(auth.uid(), (storage.foldername(name))[2])
  AND EXISTS (
    SELECT 1 FROM public.trip_members tm
    WHERE tm.trip_id::text = (storage.foldername(name))[2]
      AND tm.user_id = auth.uid()
  )
);
