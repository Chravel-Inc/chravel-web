

# Fix Stream Permission Grant Names

## Problem
The `stream-setup-permissions` edge function uses invalid Stream Chat permission grant names. Stream's API uses `ReadChannel`, `CreateMessage`, etc. (PascalCase) — not `read-channel`, `create-message` (kebab-case). Two specific permissions (`search-messages`, `read-events`) don't exist at all in Stream's API.

## Valid Stream Permission Names
Stream Chat uses these exact PascalCase grant strings:
- `ReadChannel`, `CreateChannel`, `DeleteChannel`, `UpdateChannel`
- `SendMessage` (not `create-message`), `UpdateMessage`, `DeleteMessage`, `UpdateOwnMessage` (not `update-message-owner`), `DeleteOwnMessage`
- `UploadAttachment`
- `PinMessage`, `FlagMessage`
- `SendReaction` (not `create-reaction`), `DeleteReaction`, `DeleteOwnReaction`
- `SendTypingEvent` (not `typing-events`)
- `CreateThread` (not `create-thread` — actually this may need verification)

**Removed entirely** (no Stream equivalent):
- `search-messages` → Stream search is an API-level feature, not a per-channel grant
- `read-events` → Events are controlled at the channel type config level, not via grants

## Changes

### 1. `supabase/functions/stream-setup-permissions/setup.ts`

Replace all permission grant arrays with valid Stream PascalCase names:

**chravel-trip channel_member:**
```
ReadChannel, SendMessage, UpdateOwnMessage, DeleteOwnMessage,
UploadAttachment, FlagMessage, PinMessage, SendReaction,
DeleteOwnReaction, SendTypingEvent
```

**chravel-trip channel_moderator:**
```
ReadChannel, SendMessage, UpdateMessage, DeleteMessage,
UploadAttachment, FlagMessage, PinMessage, SendReaction,
DeleteReaction, SendTypingEvent
```

**chravel-broadcast channel_member:**
```
ReadChannel, SendReaction, DeleteOwnReaction
```

**chravel-broadcast channel_moderator:**
```
ReadChannel, SendMessage, UpdateMessage, DeleteMessage,
SendReaction, DeleteReaction, PinMessage
```

**chravel-channel channel_member:**
```
ReadChannel, SendMessage, UpdateOwnMessage, DeleteOwnMessage,
SendTypingEvent, SendReaction, DeleteOwnReaction
```

**chravel-channel channel_moderator:**
```
ReadChannel, SendMessage, UpdateMessage, DeleteMessage,
SendTypingEvent, SendReaction, DeleteReaction, PinMessage
```

**chravel-concierge channel_member:**
```
ReadChannel, SendMessage, SendTypingEvent
```

### 2. `supabase/functions/stream-setup-permissions/__tests__/setupStreamPermissions.test.ts`

No structural changes needed — test validates call counts and channel type order, not the grant values themselves.

### 3. Deploy and re-invoke

After deploying, re-invoke the function with the same curl call to apply permissions to all four channel types.

## Risk
**Low.** This is the setup function for Stream permissions — it has never successfully run. Fixing the grant names is required to unblock chat functionality. The bot upsert (ai-concierge-bot) already succeeds and won't be affected.

