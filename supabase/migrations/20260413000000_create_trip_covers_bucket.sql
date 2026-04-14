-- Fix: Trip cover photos not displaying — trip-media bucket is private (public: false)
--
-- getPublicUrl() generates /object/public/trip-media/... URLs, but the /object/public/
-- endpoint returns HTTP 400 for private buckets regardless of RLS SELECT policies.
-- The "Public can view trip covers" SELECT policy only affects the authenticated API path.
--
-- Solution: Create a dedicated public bucket for trip cover photos. Trip covers must be
-- publicly accessible for hero display, social sharing, and OG previews. Other media
-- (chat attachments, gallery) remains in the private trip-media bucket.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trip-covers',
  'trip-covers',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop old policies on trip-media that targeted the trip-covers folder (superseded by new bucket)
DROP POLICY IF EXISTS "Trip members can upload trip covers" ON storage.objects;

-- Path structure in new bucket: <tripId>/<filename>
-- INSERT: any trip member may upload a cover for their trip
CREATE POLICY "trip-covers: members can insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trip-covers'
  AND EXISTS (
    SELECT 1 FROM public.trip_members tm
    WHERE tm.trip_id::text = (storage.foldername(name))[1]
      AND tm.user_id = auth.uid()
  )
);

-- UPDATE: any trip member may replace a cover (upsert)
CREATE POLICY "trip-covers: members can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'trip-covers'
  AND EXISTS (
    SELECT 1 FROM public.trip_members tm
    WHERE tm.trip_id::text = (storage.foldername(name))[1]
      AND tm.user_id = auth.uid()
  )
);

-- DELETE: any trip member may remove a cover
CREATE POLICY "trip-covers: members can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'trip-covers'
  AND EXISTS (
    SELECT 1 FROM public.trip_members tm
    WHERE tm.trip_id::text = (storage.foldername(name))[1]
      AND tm.user_id = auth.uid()
  )
);
