
-- Ensure trip-covers bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('trip-covers', 'trip-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to recreate cleanly (idempotent)
DROP POLICY IF EXISTS "Trip members can upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Trip members can update covers" ON storage.objects;
DROP POLICY IF EXISTS "Trip members can delete covers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view trip covers" ON storage.objects;
DROP POLICY IF EXISTS "Trip members can upload trip covers" ON storage.objects;

-- Public read for trip covers (bucket is public)
CREATE POLICY "Anyone can view trip covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'trip-covers');

-- Any trip member can upload covers (folder = tripId)
CREATE POLICY "Trip members can upload covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trip-covers'
  AND public.is_trip_member(auth.uid(), (storage.foldername(name))[1])
);

-- Any trip member can update covers
CREATE POLICY "Trip members can update covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'trip-covers'
  AND public.is_trip_member(auth.uid(), (storage.foldername(name))[1])
);

-- Any trip member can delete covers
CREATE POLICY "Trip members can delete covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'trip-covers'
  AND public.is_trip_member(auth.uid(), (storage.foldername(name))[1])
);

-- Ensure any trip member can update cover_image_url on trips
-- Drop old restrictive policy if it exists, create permissive one
DROP POLICY IF EXISTS "Trip members can update cover image" ON public.trips;
CREATE POLICY "Trip members can update cover image"
ON public.trips FOR UPDATE
TO authenticated
USING (public.is_trip_member(auth.uid(), id))
WITH CHECK (public.is_trip_member(auth.uid(), id));
