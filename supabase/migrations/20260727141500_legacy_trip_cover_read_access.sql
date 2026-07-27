-- Make legacy trip cover photos reachable again (12 trips affected).
--
-- ROOT CAUSE
-- Older covers were uploaded into the `trip-media` bucket under a `trip-covers/`
-- prefix, and trips.cover_image_url was stored as that bucket's PUBLIC url form:
--     .../storage/v1/object/public/trip-media/trip-covers/<tripId>/<file>.jpg
-- That can never resolve, for two independent reasons:
--   1. `trip-media` is a PRIVATE bucket (storage.buckets.public = false), so the
--      /object/public/ route 404s.
--   2. The bucket's only SELECT policy is
--          is_active_trip_member(auth.uid(), (storage.foldername(name))[1])
--      and for these objects foldername[1] is the literal 'trip-covers' rather than
--      a trip id, so even a signed url is unauthorised.
-- The broken <img> then rendered as its raw alt text ("Katt Williams Tour cover").
--
-- Current uploads are already correct -- generate-trip-cover writes to the PUBLIC
-- `trip-covers` bucket -- so this only concerns the historical objects.
--
-- FIX
-- Authorise the legacy layout so the app can mint signed urls for these objects via
-- the existing resolveTripMediaUrl path. This reads foldername[2] (the trip id)
-- instead of foldername[1], and is otherwise the same membership predicate as the
-- existing policy.
--
-- INVARIANTS PRESERVED
--  * Trip existence != access: the predicate calls is_active_trip_member, so a
--    non-member (and a departed member, whose status is no longer active) is denied.
--  * No existing policy is altered or dropped; this is an additional SELECT policy.
--  * The bucket stays PRIVATE. Scope is limited to names beginning 'trip-covers/',
--    so the documents and video elsewhere in trip-media are untouched.
--  * anon is unaffected -- auth.uid() is NULL for it, so the predicate is false.
--  * No auth, session or payment surface is involved.
--
-- Verified against production (transaction + rollback):
--   viewer who IS a member of the two affected trips ... 25 legacy covers readable
--   viewer who is NOT a member of them .................. 0 readable
--
-- scripts/migrate-legacy-trip-covers.ts remains the permanent fix: it copies these
-- objects into the public `trip-covers` bucket and rewrites cover_image_url, which
-- also restores OG/share unfurling (signed urls expire and cannot serve unfurls).

DROP POLICY IF EXISTS "Trip members can view legacy trip covers" ON storage.objects;

CREATE POLICY "Trip members can view legacy trip covers"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'trip-media'
  AND (storage.foldername(name))[1] = 'trip-covers'
  AND public.is_active_trip_member(auth.uid(), (storage.foldername(name))[2])
);
