# Chat & Broadcasts

## Purpose
Real-time group communication: trip chat, role-based pro channels, trip-wide broadcasts, threads, reactions, read receipts, typing indicators, system messages.

## Transport reality
Two transports operate side-by-side:
1. **Stream Chat (9.40)** owns the actual chat — trip channels, pro channels, broadcasts UI.
2. **Supabase Realtime** owns adjacent state — reactions, read receipts (in some surfaces), system message inserts.

This dual-path arrangement is the source of memory #28 (custom field forwarding) and memory #29 (system message routing via silent+skip_push).

## Entry Points
| Component / Hook | File | Purpose |
|---|---|---|
| `TripChat` | `src/features/chat/components/TripChat.tsx` | Main chat surface |
| `ChatMessages` | `src/features/chat/components/ChatMessages.tsx` | Message list renderer |
| `MessageBubble` | `src/features/chat/components/MessageBubble.tsx` | Single bubble |
| `ChatInput` | `src/features/chat/components/ChatInput.tsx` | Composer |
| `ThreadView` | `src/features/chat/components/ThreadView.tsx` | Threaded replies |
| `Broadcasts` | `src/features/broadcasts/components/Broadcasts.tsx` | Broadcast surface |
| `BroadcastComposer` | `src/features/broadcasts/components/BroadcastComposer.tsx` | Compose UI |
| `useStreamTripChat` | `src/hooks/stream/useStreamTripChat.ts` | Stream trip channel hook |
| `useStreamProChannel` | `src/hooks/stream/useStreamProChannel.ts` | Pro channel hook |
| `useStreamBroadcasts` | `src/hooks/stream/useStreamBroadcasts.ts` | Broadcasts hook |
| `useChatReactions` | `src/features/chat/hooks/useChatReactions.ts` | Reactions |

## Data Flow
1. User sends message in `ChatInput`.
2. `useChatComposer` -> `chatService.sendMessage()` -> Stream `channel.sendMessage()`.
3. Stream persists + echoes via Stream watcher.
4. `useStreamTripChat` listens to `message.new`, updates local state.
5. UI re-renders via `MessageBubble`.

For system messages (poll close, task done):
1. Domain action completes.
2. `systemMessageService.emit(...)` builds the message.
3. Stream `channel.sendMessage({ silent: true, skip_push: true, ...customFields })` (memory #29).
4. `SystemMessageBubble` renders inline.

For broadcasts:
1. Composer -> `broadcastService.createBroadcast` -> `supabase/functions/broadcasts-create` -> DB row in `broadcasts`.
2. Stream channel + push fan-out triggered server-side.
3. `useStreamBroadcasts` listens, renders.

## State Touched
- **TanStack Query keys:**
  - `tripKeys.chat(tripId)` (`['tripChat', tripId]`)
  - `tripKeys.chatMessages(tripId, limit?)` (`['tripChatMessages', tripId, limit?]`)
  - `tripKeys.broadcasts(tripId)` (`['tripBroadcasts', tripId]`)
  - `tripKeys.channels(tripId)` (`['tripChannels', tripId]`)
- **Zustand:** none directly; concierge UI in chat reads `useConciergeSessionStore`.
- **Local:** Stream channel state, typing indicators.

## Tables & RLS
| Table | Read policy | Write policy | Notes |
|---|---|---|---|
| `trip_chat_messages` | trip members only | sender + trip admins | DB mirror of Stream messages where used |
| `channel_messages` | channel members | channel members | Role-gated |
| `role_channel_messages` | role members | role members | Pro role-scoped |
| `trip_channels` | trip members | trip admins | |
| `channel_role_access` | trip admins | trip admins | Role -> channel mapping |
| `broadcasts` | trip members | trip admins | |
| `broadcast_reactions` | trip members | self | |
| `broadcast_views` | trip members | self | Tracks who saw |
| `message_reactions` | trip members | self | |
| `message_read_receipts` | trip members | self | Per-user-per-message |
| `message_read_status` | trip members | self | Aggregate |
| `scheduled_messages` | trip admins | trip admins | Scheduled outbound |
| `trip_payment_messages` | trip members | trip admins | Payments bridge |
| `mock_messages`, `mock_broadcasts` | demo only | never (in code) | Memory #27 |

824 RLS policies overall; chat tables carry the densest per-row gating.

## Edge Functions Used
- `broadcasts-create`, `broadcasts-fetch`, `broadcasts-react`
- `stream-token` (mint Stream JWT)
- `stream-setup-permissions`, `stream-ensure-membership`, `stream-join-channel`, `stream-moderation-action`
- `stream-reconcile-membership` (periodic sync)
- `stream-canary-guard` (parity check)
- `stream-webhook` (Stream -> us, for moderation events)
- `create-default-channels` (seed trip channels)
- `message-scheduler` (scheduled messages)
- `message-parser` (parsed mentions, links)

## Demo vs Authenticated
- Demo mode reads `mock_messages` / `mock_broadcasts` instead of real tables.
- Stream Chat is not active in demo (no Stream token minted) — `useStreamTripChat` short-circuits when `isDemoMode === true`.
- Mock data **must not be mutated**. Demo composer is no-op or local-only.
- See memory #27 — Mock-ID tier gate disables consumer-only chat features for real trips of other tiers.

## Mobile / PWA / Capacitor considerations
- Background -> foreground transition can drop Stream WS; backfill required (memory #13).
- Push notifications fan out via APNS (`send-push`, `push-notifications`, `web-push-send`).
- Read receipts must be throttled on mobile (write amplification regression in `DEBUG_PATTERNS.md`).
- Typing indicators must NOT fire push.

## Known Risks
- Custom Stream fields require **both adapter paths** to forward (memory #28). Any new metadata field added in one adapter without the other silently disappears in some surfaces.
- System messages route via `Stream channel.sendMessage` with `silent + skip_push` (memory #29). Skipping these flags produces duplicate push notifications.
- Read-receipt write amplification (`DEBUG_PATTERNS.md`): N×M upserts per visible message; throttle in `readReceiptService.ts`.
- Reaction refetch storm (`DEBUG_PATTERNS.md`): every new message previously refetched all reactions.
- Pin/unpin mutations should live in shared chat hooks, not UI surfaces (`LESSONS.md`).
- In transport-mixed surfaces, transport mode (Stream vs Supabase) must propagate to the mutation trigger component (`LESSONS.md`).

## Source Refs
- `src/features/chat/` — feature module
- `src/features/broadcasts/` — feature module
- `src/hooks/stream/useStreamTripChat.ts`, `useStreamProChannel.ts`, `useStreamBroadcasts.ts`
- `src/services/chatService.ts`, `chatBroadcastService.ts`, `systemMessageService.ts`, `broadcastService.ts`, `readReceiptService.ts`, `typingIndicatorService.ts`
- `src/services/stream/` — Stream helpers (channel factory, membership sync, message search)
- `supabase/functions/broadcasts-*`, `stream-*`, `create-default-channels`, `message-scheduler`, `message-parser`
- `src/lib/queryKeys.ts:22-26, 51, 55` — query keys
- `agent_memory.jsonl` #13, #28, #29
- Diagram: [`../diagrams/chat-realtime-sequence.mmd`](../diagrams/chat-realtime-sequence.mmd)
