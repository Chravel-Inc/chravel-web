
-- Document intentional service-role-only access for apple_auth_tokens
COMMENT ON TABLE public.apple_auth_tokens IS 'Stores Apple OAuth refresh tokens. Access is restricted to service_role only (no user-facing policies). All reads/writes must go through edge functions using the service role. RLS is enabled and fail-closed by design.';

-- Add write policies for trip_preferences so trip members can manage shared preferences
CREATE POLICY "Members can insert trip_preferences"
ON public.trip_preferences
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trip_members m
    WHERE m.trip_id = trip_preferences.trip_id
      AND m.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Members can update trip_preferences"
ON public.trip_preferences
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.trip_members m
    WHERE m.trip_id = trip_preferences.trip_id
      AND m.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trip_members m
    WHERE m.trip_id = trip_preferences.trip_id
      AND m.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Members can delete trip_preferences"
ON public.trip_preferences
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.trip_members m
    WHERE m.trip_id = trip_preferences.trip_id
      AND m.user_id = (SELECT auth.uid())
  )
);
