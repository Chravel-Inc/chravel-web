-- Fix: Trip cover photo upload blocked by media_upload_mode restriction
--
-- The existing "Trip members can upload trip covers" policy (20260403121000)
-- requires can_upload_media_to_trip(), which checks trips.media_upload_mode.
-- For event trips (media_upload_mode = 'admin_only'), regular members cannot
-- upload cover photos even though they CAN update trip details via
-- "Trip members can update trip details" RLS policy on the trips table.
--
-- Cover photos are an administrative trip-level action, not user-generated
-- media. The media_upload_mode control is meant for gallery/chat media, not
-- cover photos. Any trip member who can edit the trip should also be able to
-- upload a cover photo.
--
-- This migration removes the can_upload_media_to_trip() check from the cover
-- upload policy while keeping the trip_members membership check.

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
