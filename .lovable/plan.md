## Add RLS policy for `realtime.messages` (chat broadcast topic)

### Context
- `realtime.messages` has RLS enabled but **zero policies** → all access denied.
- The DB trigger `broadcast_chat_message` (SECURITY DEFINER) writes successfully because it bypasses RLS.
- The client subscribes via `chatBroadcastService.subscribeToBroadcast` using a **private** channel `chat_broadcast:{tripId}`. Private channels enforce RLS on `realtime.messages` for the authenticated user — without a policy, broadcasts silently never arrive on the client.
- This is the only `private: true` realtime channel in the codebase (verified via search). Other `supabase.channel(...)` calls use postgres_changes or non-private broadcasts and are unaffected.

### Topic-pattern strategy
- Convention: `chat_broadcast:<trip_id>` (defined in `broadcastChannelName` and the trigger).
- Authorize a user to read messages on that topic iff they are a member of the trip parsed from the topic.
- Use `realtime.topic()` (current channel topic in policy context) and `split_part(..., ':', 2)` to extract the trip id, then defer to existing SECURITY DEFINER helper `public.is_trip_member(uuid, text)` to avoid RLS recursion / leaks.

### Migration

```sql
-- Allow authenticated users to receive broadcast messages for trips they belong to.
-- Topic format produced by broadcast_chat_message(): 'chat_broadcast:<trip_id>'
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
```

No INSERT/UPDATE/DELETE policy is added — the server-side trigger writes via SECURITY DEFINER, and clients must never publish to this topic (defense in depth: the existing service only subscribes).

### Why this is safe
- **Membership-scoped**: only trip members of the exact `trip_id` embedded in the topic can subscribe.
- **Pattern-locked**: the `LIKE 'chat_broadcast:%'` clause prevents this policy from inadvertently authorizing other future private topics (presence, typing, etc.) — those would need their own explicit policies.
- **No recursion**: `is_trip_member` is SECURITY DEFINER with `search_path = public` (already used widely).
- **No write path opened**: clients still cannot broadcast; only the DB trigger (bypassing RLS) emits messages.

### Verification
1. Apply migration; confirm policy exists on `realtime.messages`.
2. As authenticated trip member: subscribe to `chat_broadcast:<tripId>`, send a chat message, observe `new_message` event arrives in <100ms.
3. As authenticated non-member: subscribe to same topic → no events received.
4. Existing Postgres Changes fallback in `TripChat` continues to work (unchanged).
5. Mark security finding `realtime_messages_rls` as fixed; update security memory to remove "deferred" note for this item.

### Files changed
- New: `supabase/migrations/<timestamp>_realtime_messages_chat_broadcast_rls.sql`
- Memory update: remove the "realtime messages RLS deferred" accepted-risk entry.
