DROP POLICY IF EXISTS "Trip members can update files" ON public.trip_files;
DROP POLICY IF EXISTS "Trip members can delete files" ON public.trip_files;
DROP POLICY IF EXISTS "trip_files_update" ON public.trip_files;
DROP POLICY IF EXISTS "trip_files_delete" ON public.trip_files;

CREATE POLICY "trip_files_update"
ON public.trip_files
FOR UPDATE
TO authenticated
USING (
  auth.uid() = uploaded_by
  OR public.is_trip_admin(auth.uid(), trip_id)
)
WITH CHECK (
  auth.uid() = uploaded_by
  OR public.is_trip_admin(auth.uid(), trip_id)
);

CREATE POLICY "trip_files_delete"
ON public.trip_files
FOR DELETE
TO authenticated
USING (
  auth.uid() = uploaded_by
  OR public.is_trip_admin(auth.uid(), trip_id)
);

DROP POLICY IF EXISTS "trip_media_index_update" ON public.trip_media_index;
CREATE POLICY "trip_media_index_update"
ON public.trip_media_index
FOR UPDATE
TO authenticated
USING (public.is_trip_member(auth.uid(), trip_id))
WITH CHECK (public.is_trip_member(auth.uid(), trip_id));