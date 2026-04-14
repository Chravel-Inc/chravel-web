-- 1. Enable RLS on notification_deliveries (internal delivery queue - service role only)
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

-- No public policies needed - this table is only accessed by edge functions using service_role key.
-- Service role bypasses RLS automatically.

-- 2. Enable RLS on feature_flags (public read, service-role-only write)
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read feature flags (needed for runtime kill switches)
CREATE POLICY "Anyone can read feature flags"
ON public.feature_flags
FOR SELECT
TO authenticated
USING (true);

-- Allow anonymous users to read feature flags too (for pre-auth feature checks)
CREATE POLICY "Anon can read feature flags"
ON public.feature_flags
FOR SELECT
TO anon
USING (true);

-- No INSERT/UPDATE/DELETE policies - only service_role (which bypasses RLS) can modify flags.

-- 3. Fix trip-media bucket: replace permissive SELECT with membership check
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Trip members can view trip media" ON storage.objects;

-- Create a proper membership-scoped policy (folder structure: {trip_id}/...)
-- But preserve public access for trip-covers subfolder (used for social sharing OG images)
CREATE POLICY "Trip members can view trip media"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'trip-media'
  AND (
    -- Public access to trip cover images (for social sharing/OG previews)
    (storage.foldername(name))[1] = 'trip-covers'
    OR
    -- Trip members can view their trip's media
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id = (storage.foldername(name))[1]
        AND trip_members.user_id = auth.uid()
    )
  )
);