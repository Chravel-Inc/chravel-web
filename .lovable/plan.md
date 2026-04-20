

## Edit/Delete failing in Stream — root cause + fix

### Symptoms (from screenshots + console)
- Console only shows unrelated errors (`get_trip_pdf_export_usage` PGRST202, concierge health). No Stream HTTP error in the captured snapshot, but the toast `Failed to edit message` / `Failed to delete message` is firing — meaning `client.updateMessage()` / `client.deleteMessage()` is rejecting with an error we currently swallow into a generic toast.
- Both the edit and delete paths share the same code shape (`src/features/chat/components/TripChat.tsx` lines 213–256) and both fail, so this is a **permissions/identity** failure, not a code bug.

### Two compounding root causes

**Cause 1 — Generic error swallowing hides the real Stream code.**
`handleMessageEdit` / `handleMessageDelete` in `TripChat.tsx` (and the same pattern in `ChannelChatView.tsx` + `updateStreamMessage.ts`) catch every error and show `Failed to edit message` regardless of whether the failure is `403 not_allowed` (permissions), `4` (not found), `16` (no membership), `40` (auth/token expired), or network. We can't fix Stream until we can see its error code.

**Cause 2 — Stream's `update-message-owner` / `delete-message-owner` grants depend on `message.user.id === connectedUser.id`, AND on the app-level `user` role having those base permissions.**
Our `stream-setup-permissions` setup configures **channel-type** grants only. Stream's authorization is the **intersection** of channel-type grants AND the app-level role grants for the `user` role. A fresh Stream app's default `user` role doesn't include `update-own-message` / `delete-own-message` in some configurations — the channel-type grant alone is insufficient.

Additionally, if the message was sent under one Stream user id (e.g., before a re-auth) and the current connection is a different id, Stream rejects the owner-scoped operation as 403.

### Fix — three surgical changes

**Change A — Surface Stream's actual error so we stop guessing.**
In `TripChat.tsx`, `ChannelChatView.tsx`, and `updateStreamMessage.ts`, log the structured Stream error fields (`error.code`, `error.StatusCode`, `error.response?.data`) always (not just DEV) for these two operations, and include the Stream error code in the toast (`Failed to edit message (code 17)`). Stream error code → meaning is documented; this immediately tells us if it's permissions (17), not-found (4), auth (40), or no-membership (16).

**Change B — Extend the `chravel-trip` and `chravel-channel` channel-type grants to also support `update-message-owner`/`delete-message-owner` for the connected `user` role explicitly, and add `update-own-message` / `delete-own-message` to the app-level `user` role.**
- In `supabase/functions/stream-setup-permissions/setup.ts`, after `updateChannelType` calls, add a `serverClient.updateAppSettings({ ... })` block — or use the role-permissions API — to ensure the app-level `user` role has: `update-own-message`, `delete-own-message`, `update-message-owner`, `delete-message-owner` (Stream uses both naming conventions across versions; granting both is safe and idempotent).
- Re-run the setup function once after deploy via the existing `X-Admin-Secret` POST.

**Change C — Defensive owner check before calling Stream.**
In `handleMessageEdit` / `handleMessageDelete`, compare `message.user?.id` to `streamClient.userID` and short-circuit with a clearer toast (`You can only edit your own messages`) if they don't match. This eliminates the ambiguity case where a stale Stream identity is connected (rare, but real after token refresh edge cases).

### Files changed

| File | Change |
|---|---|
| `src/features/chat/components/TripChat.tsx` | Log structured Stream error; include error code in toast; pre-check owner id |
| `src/components/pro/channels/ChannelChatView.tsx` | Same three changes |
| `src/features/chat/utils/updateStreamMessage.ts` | Same three changes; return error code to caller |
| `supabase/functions/stream-setup-permissions/setup.ts` | Add app-level `user` role grants for `update-own-message` / `delete-own-message` (+ `update-message-owner` / `delete-message-owner` aliases) |
| `supabase/functions/stream-setup-permissions/__tests__/setup.test.ts` | Assert role-permissions call is made |

### Verification

1. After deploying setup change, POST to `/stream-setup-permissions` with `X-Admin-Secret`. Expect `{ success: true }` with new role-grant entry in `results`.
2. Send a new message → click ⋯ → Edit → save. Should persist with no toast.
3. Same for Delete. Tombstone appears in chat.
4. Try editing **another user's** message (if member only): toast should now read `You can only edit your own messages` (Change C).
5. If A still fails, the toast now contains the Stream error code → file the next ticket against the exact code.
6. Existing tests pass: `npm run test:run` (TripChat.deleteMessage.test, updateStreamMessage.test, ChannelChatView.stream.test, setup tests).

### Risk

**LOW–MEDIUM.** Change A is pure logging/observability. Change C is a guard that can only **prevent** a failed call. Change B mutates Stream app-level role permissions — it grants only `*-own-message` (additive, scoped to ownership), so worst case existing flows are unaffected. Rollback = revert setup change and re-run `/stream-setup-permissions`.

