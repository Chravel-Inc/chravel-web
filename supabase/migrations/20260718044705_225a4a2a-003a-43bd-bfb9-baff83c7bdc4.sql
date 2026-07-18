
-- Whitelist-style WITH CHECK for the "cover image only" trip-member policy:
-- rather than enumerating every non-cover column (which drifts as the trips
-- table gains columns), pin the entire row-as-jsonb except the intentionally
-- editable fields. This prevents non-admin members from silently changing
-- basecamp_*, member_count, is_hidden, card_color, categories, etc.
DROP POLICY IF EXISTS "Trip members can update cover image only" ON public.trips;

CREATE POLICY "Trip members can update cover image only" ON public.trips
  FOR UPDATE
  USING (public.is_active_trip_member(auth.uid(), id))
  WITH CHECK (
    public.is_active_trip_member(auth.uid(), id)
    AND (
      (to_jsonb(trips.*)
        - 'cover_image_url'
        - 'cover_display_mode'
        - 'updated_at')
      = (
        SELECT (to_jsonb(t.*)
          - 'cover_image_url'
          - 'cover_display_mode'
          - 'updated_at')
        FROM public.trips t
        WHERE t.id = trips.id
      )
    )
  );
