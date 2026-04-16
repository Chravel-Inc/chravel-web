<final-text>
Objective: restore Stream trip chat so existing members can see migrated history and new sends either appear immediately or fail visibly.

What changed in the diagnosis
- The code visible here still does not contain the co-work send fix. `src/hooks/stream/useStreamTripChat.ts` still uses a fire-and-forget send, returns a fake `pending-*` message, and swallows real send failures.
- `src/features/chat/hooks/useChatComposer.ts` clears the draft before transport success, which is why the text disappears even when nothing lands in chat.
- `src/features/chat/components/TripChat.tsx` does not render the `error` returned by `useStreamTripChat`, so a failed `channel.watch()` looks like an empty chat instead of an actual error.
- The migration script shown here is also still the older version: `scripts/migrate-chat-to-stream.ts` creates/migrates `chravel-trip` messages but does not backfill existing `trip_members` into Stream channel membership. Current membership sync only runs on new joins in `src/pages/JoinTrip.tsx`.
- That combination explains both symptoms on older trips: no hydrated history and no send permission for pre-existing members.

Plan
1. Reconcile the actual code snapshot first
- Verify the Lovable project branch contains the real co-work changes; if not, re-apply them surgically in this branch so we are fixing the code the preview is actually running.
- Do not refactor chat broadly; only land the missing send-path and migration/backfill logic.

2. Fix the send contract in the trip chat hook
- Update `src/hooks/stream/useStreamTripChat.ts` so `sendMessageAsync()` awaits the real `channel.sendMessage()` response and throws on rejection.
- Use the HTTP response to insert/update the sent message immediately instead of waiting only for `message.new`.

3. Stop clearing the composer on false success
- Update `src/features/chat/hooks/useChatComposer.ts` and the `TripChat` send flow so the draft is only cleared after confirmed success, or is restored on failure.
- Keep the existing retry UX, but only trigger it on real transport errors.

4. Make chat failures visible
- Surface `useStreamTripChat.error` in `src/features/chat/components/TripChat.tsx` with a clear error state and retry action.
- This prevents “blank chat” when `watch()` fails because of missing membership or connection issues.

5. Backfill Stream membership for existing trips
- Add a one-time idempotent script to sync all existing `trip_members` into the corresponding Stream `chravel-trip` and `chravel-broadcast` channels.
- Reuse existing channel ID conventions (`trip-${tripId}`, `broadcast-${tripId}`) and membership logic instead of inventing a new path.
- This is the highest-leverage fix for both missing history and failed sends on old trips.

6. Only re-run message migration where needed
- After membership backfill, verify whether historical messages are already present but were simply unreadable.
- Only re-run a targeted message import for genuinely missing trips/messages instead of remigrating everything.

7. Add regression coverage
- Add a test proving rejected `sendMessage()` does not silently resolve and lose the draft.
- Add a test for the membership backfill path / idempotent member-sync behavior.

Technical details
- Primary files:
  - `src/hooks/stream/useStreamTripChat.ts`
  - `src/features/chat/hooks/useChatComposer.ts`
  - `src/features/chat/components/TripChat.tsx`
  - `scripts/migrate-chat-to-stream.ts` or a new dedicated backfill script
  - optionally `src/services/stream/streamMembershipSync.ts`
- No database migration is required from the evidence I found; this looks like Stream client behavior + Stream channel membership drift.
- Secondary cleanup after the main fix: remove or guard remaining `trip_members.status` assumptions in Stream-adjacent flows so future 400s do not mask chat issues again.

Definition of done
- Existing pro trip opens with old messages visible.
- Sending a new message on that same trip shows up immediately and survives refresh.
- A rejected send restores/retains the draft and shows an explicit error.
- Existing members do not need to re-join a trip to regain Stream chat access.
</final-text>