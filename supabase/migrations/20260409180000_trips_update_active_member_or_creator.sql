-- Align trips UPDATE with SELECT access: active members + trip creator.
--
-- The prior "Trip members can update trip details" policy used a raw EXISTS on
-- trip_members without filtering status=left. That could block updates for users
-- who left and rejoined, or diverge from is_active_trip_member() used elsewhere.
-- Trip creators must always be able to update cover_image_url even if membership
-- rows are temporarily inconsistent (trigger race, legacy data).

DROP POLICY IF EXISTS "Trip members can update trip details" ON public.trips;

CREATE POLICY "Trip members can update trip details"
ON public.trips
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR public.is_active_trip_member(auth.uid(), id)
)
WITH CHECK (
  created_by = auth.uid()
  OR public.is_active_trip_member(auth.uid(), id)
);

COMMENT ON POLICY "Trip members can update trip details" ON public.trips IS
  'Trip creator or any active trip member may update trip rows (name, cover_image_url, etc.). Matches active-membership semantics from leave_trip / SELECT policies.';
