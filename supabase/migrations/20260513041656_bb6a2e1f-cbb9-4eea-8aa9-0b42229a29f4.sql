CREATE POLICY "Trip members can read chat broadcast messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'chat_broadcast:%'
  AND public.is_trip_member(
    auth.uid(),
    split_part(realtime.topic(), ':', 2)
  )
);