# Chravel GetStream Architecture & Quality Audit Report

## 1. OVERALL GETSTREAM HEALTH SCORE: 65/100

**Status: Fragile & Partially Integrated**

Chravel’s GetStream implementation is currently in an awkward transitional phase. It uses the low-level `stream-chat` JS SDK to transport messages, but goes to great lengths to wrap, mask, and map those messages back into legacy Supabase-shaped objects (`ChrravelChatMessage`, `RoleChannelMessage`). It actively fights the Stream architecture by maintaining custom state for typing indicators, read receipts, and reactions alongside Stream's built-in versions. The architecture is fragmented, with AI Concierge using Stream for history persistence while TripChat heavily relies on `messageMapper.ts` to pretend Stream is just a fast pipe for Supabase.

## 2. EXECUTIVE SUMMARY

**Strongest Areas:**
- **Connection Management:** `streamClient.ts` cleanly manages the singleton connection and authentication via edge functions.
- **Channel Taxonomy:** `streamChannelFactory.ts` provides a clear, scalable naming convention for channels (`chravel-trip`, `chravel-channel`, `chravel-broadcast`, `chravel-concierge`).
- **Realtime Transport:** The WebSocket integration reliably delivers messages faster than Supabase CDC.

**Weakest Areas:**
- **Duplicated State / "Fighting the SDK":** Features like Read Receipts, Typing Indicators, and Reactions have custom Supabase implementations running in parallel or overriding Stream's native capabilities.
- **Over-mapping:** `streamMessageToChravel` strips away the benefits of Stream's rich SDK types, forcing the UI to manage optimistic updates and message state manually instead of using Stream's reactive channel state.
- **Thread Handling:** `ThreadView.tsx` manually manages thread state using basic Stream queries rather than leveraging `stream-chat-react` or robust local state sync.

**Biggest Architecture Risks:**
- **Split Brain Data:** Messages are stored in Stream, but Read Receipts and Reactions are stored in Supabase (`trip_chat_messages`, `message_reactions`). This requires cross-system joins on the client and risks severe data drift.
- **Scalability of Pro Channels:** `useStreamProChannel` fetches channel lists from Supabase but messages from Stream. If permissions drift, users might see channels they can't access in Stream, or vice versa.

**Top Conclusions:**
Chravel needs to decide if Stream is the *source of truth* for chat or just a *dumb transport pipe*. Currently, it's being used as a transport pipe, which wastes 80% of what GetStream offers. To reach production-grade, Chravel must abandon the `messageMapper` pattern, migrate fully to Stream's native data models, and replace custom Supabase reaction/typing/read logic with Stream SDK built-ins.

---

## 3. FEATURE INVENTORY

| Feature | Status | Notes |
| :--- | :--- | :--- |
| Standard Trip Chat | Enabled (via Flag) | Uses `useStreamTripChat`, heavily mapped to legacy types. |
| Pro Trip Channels | Enabled (via Flag) | Uses `useStreamProChannel`, mapped to `RoleChannelMessage`. |
| AI Concierge | Partially Enabled | Stream used for history persistence (`useStreamConciergeHistory`), UI uses custom state. |
| Broadcasts | Enabled (via Flag) | Uses `useStreamBroadcasts`. Realtime only, logic relies on Supabase. |
| Threaded Messages | Partially Enabled | Custom `ThreadView.tsx` fetching from Stream. Not deeply integrated. |
| Reactions | Conflicted | UI uses `toggleReaction` (Stream) OR `toggleMessageReaction` (Supabase). Split brain. |
| Read/Unread State | Custom (Supabase) | Stream's `markRead` is ignored; custom `readReceiptService.ts` used instead. |
| Typing Indicators | Custom (Supabase) | Stream's typing events ignored; custom `TypingIndicatorService` used. |
| Message Rendering | Custom (UI) | Uses `MessageItem.tsx` with mapped legacy data. |
| Message Input | Custom (UI) | `ChatInput.tsx` manually crafts payloads. |
| Channel Creation | Mixed | Stream channels lazy-created on connect; truth lives in Supabase. |
| Media/Attachments | Basic | Passed via Stream `attachments`, but mapped customly. |

---

## 4. STREAM ARCHITECTURE TRACE

1.  **Auth & Init:** App loads -> `useStreamClient` checks flags (`stream-chat-trip`, etc.) -> `streamClient.ts` gets token from `stream-token` edge function -> `StreamChat.connectUser`.
2.  **Channel Resolution:** `streamChannelFactory.ts` maps entity IDs (e.g., `tripId`) to Stream channel IDs (`trip-${tripId}`).
3.  **Data Fetching:**
    *   `useStreamTripChat` queries Stream.
    *   It immediately passes raw `MessageResponse` through `streamMessageToChravel` (`messageMapper.ts`).
    *   React state (`messages`) holds the mapped, legacy-shaped objects.
4.  **Realtime Events:** `channel.on('message.new', ...)` fires -> message is mapped -> React state updated.
5.  **Sending:** `useStreamTripChat` -> `dispatchStreamSend` calls `channel.sendMessage()`. UI is updated optimistically via custom logic, *not* Stream's internal optimistic state.
6.  **Reactions:** `TripChat.tsx` detects if Stream is active. If yes, it calls Stream's `channel.sendReaction()`. However, the UI state mapping for reactions is brittle and often falls back to Supabase `message_reactions`.
7.  **Read Receipts & Typing:** Explicitly bypasses Stream. `TripChat.tsx` uses `TypingIndicatorService` (Supabase Realtime) and `markMessagesAsRead` (Supabase DB).

---

## 5. FEATURE MATRIX

| Feature | Enabled? | Where Used | Native vs Custom | Quality | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Message Transport | Yes | TripChat, ProChannels | Native Stream | 85/100 | **Keep**. Core transport is stable. |
| Message Models | Yes | Everywhere | **Custom Wrapper** | 40/100 | **Remove**. Delete `messageMapper.ts`. Use native Stream types. |
| Reactions | Yes | TripChat | **Mixed** | 50/100 | **Improve**. Rip out Supabase reactions; use Stream `reaction.new` exclusively. |
| Typing Indicators | Yes | TripChat | **Custom** | 30/100 | **Remove**. Delete `TypingIndicatorService`. Use Stream `channel.keystroke()`. |
| Read Receipts | Yes | TripChat | **Custom** | 40/100 | **Remove**. Delete custom Supabase tables. Use Stream `channel.markRead()`. |
| Threads | Yes | ThreadView | Native API, Custom UI | 60/100 | **Improve**. Adopt standard Stream thread querying. |
| AI Concierge Sync | Yes | AIConciergeChat | Native Stream | 75/100 | **Improve**. Good for history, but UI state should leverage Stream directly. |
| Offline Mode | Yes | OfflineSyncService | **Custom** | 50/100 | **Remove/Improve**. Stream has built-in offline support. Custom queueing conflicts with it. |

---

## 6. COMPONENT HEALTH SCORES AND EXPLANATIONS

*   **`streamClient.ts` (95/100):** Clean singleton pattern, proper cleanup on auth state changes. Production ready.
*   **`streamChannelFactory.ts` (90/100):** Good taxonomy. Clear separation of concerns.

### Components Scoring Below 90

*   **`useStreamTripChat.ts` (60/100)**
    *   **How it works:** This hook handles fetching, sending, and subscribing to standard trip chat messages via GetStream. It replaces the legacy Supabase chat hook.
    *   **Why < 90:** It acts merely as a pipe. Instead of passing rich GetStream objects (`MessageResponse`) directly to the UI, it forces every incoming and outgoing message through `streamMessageToChravel`, stripping away native Stream capabilities. It also implements manual optimistic UI state management (deduping by ID) rather than relying on Stream SDK's internal `.watch()` and optimistic updates.
    *   **How to fix:** Remove `streamMessageToChravel`. Update the hook to expose native `MessageResponse` arrays directly. Delete the manual optimistic deduplication array logic.

*   **`TripChat.tsx` (50/100)**
    *   **How it works:** The central UI controller for chat. It manages user input, renders the message list, handles threads, and integrates media sending.
        *   *Sending Messages & Media:* User input goes through `ChatInput.tsx`. If media is attached, it uploads via a custom upload service, then passes the URL to `sendMessage`. Stream receives this as an `attachment` array.
        *   *Channel Integration:* It dynamically switches between `useStreamTripChat` (for the main trip) and `useRoleChannels` (for Pro Channels) based on the current active filter. Pro channels use `useStreamProChannel` for transport but rely on Supabase for the channel list and access control.
        *   *Read Receipts:* It tracks what the user has seen using `IntersectionObserver` concepts (via refs and scrolling) and fires debounced updates to a custom Supabase table (`message_read_receipts`) via `markMessagesAsRead()`.
    *   **Why < 90:** It is massively bloated and suffers from severe "split-brain" architecture. It completely ignores GetStream's built-in typing indicators (`channel.keystroke()`) and read receipts (`channel.markRead()`), opting instead to spin up parallel Supabase realtime connections for these features. This wastes Stream connections, drains battery on mobile, and makes the component deeply fragile.
    *   **How to fix:** Rip out `TypingIndicatorService` and replace with `channel.keystroke()` / `channel.on('typing.start')`. Rip out `subscribeToReadReceipts` and `markMessagesAsRead` from Supabase and replace with `channel.markRead()`.

*   **`messageMapper.ts` (30/100)**
    *   **How it works:** A utility file that takes a rich GetStream `MessageResponse` and flattens it into a legacy `ChrravelChatMessage` object. It manually extracts media URLs, maps reaction arrays into rigid boolean flags, and discards unmapped Stream properties.
    *   **Why < 90:** It is the root cause of the architectural debt. By forcing Stream data into a legacy shape designed for Supabase, it prevents the UI from using advanced Stream features like nested threads, dynamic reaction types, or rich URL previews without writing custom parsing logic for each new feature.
    *   **How to fix:** Delete the file entirely (or deprecate it fully for active chats). Update `MessageItem.tsx` to consume native Stream types.

*   **`offlineSyncService.ts` (50/100 - Context of Chat)**
    *   **How it works:** A global IndexedDB queue that intercepts outgoing requests (messages, tasks, calendar events) when `navigator.onLine` is false. When the connection returns, it processes the queue sequentially.
    *   **Why < 90:** GetStream's JS SDK has *built-in* robust offline support. When you call `channel.sendMessage()` offline, Stream automatically queues it and syncs when online. By intercepting chat messages into the custom `offlineSyncService`, Chravel introduces race conditions and duplicate message possibilities when both the custom queue and Stream's internal queue try to recover simultaneously.
    *   **How to fix:** Add a guard in `offlineSyncService` that completely bypasses the custom queue for `chat_message` entity types whenever the `stream-chat-trip` feature flag is active.

*   **`ThreadView.tsx` (65/100)**
    *   **How it works:** A side-panel UI that opens when replying to a specific message. It fetches replies via `channel.getReplies(parentId)` and subscribes to `message.new` events specifically matching that `parent_id`.
    *   **Why < 90:** It manually manages the local array of thread replies and relies on the legacy `messageMapper` logic (via `formatReply`). It doesn't leverage Stream's native thread pagination or thread-specific typing indicators.
    *   **How to fix:** Migrate to use Stream SDK types directly. Implement Stream's native thread typing events.

---

## 7. PRIORITIZED FIX PLAN (Path to 90+)

### `TripChat.tsx` (Score: 50)
*   **Root Cause:** Supporting too many modes (Demo, Supabase, Stream) + custom implementation of native Stream features (Typing, Read state).
*   **Patch Path:**
    1.  Remove `TypingIndicatorService` and replace with `channel.on('typing.start')`.
    2.  Remove `readReceiptService` and replace with `channel.markRead()`.
    3.  Extract Demo Mode logic into a separate wrapper component to clean up the main render tree.

### `useStreamTripChat.ts` (Score: 60) & `messageMapper.ts` (Score: 30)
*   **Root Cause:** Stripping Stream context to fit legacy types.
*   **Patch Path:**
    1.  Deprecate `ChrravelChatMessage` interface for active chats.
    2.  Update UI components (`MessageItem.tsx`) to accept raw `MessageResponse` from Stream.
    3.  Rely on Stream's `.watch()` state for optimistic updates instead of manually filtering/appending to arrays.

### Offline Queue / `offlineSyncService.ts` (Score: 50)
*   **Root Cause:** Custom queueing logic for chat messages overlaps with Stream SDK's built-in offline persistence.
*   **Patch Path:** Disable custom `offlineSyncService` for chat messages when `stream-chat-trip` is active. Rely on Stream's offline promise queue.

---

## 8. UNDERUSED STREAM FEATURES WORTH EVALUATING

1.  **Stream UI Components (`stream-chat-react`):** While the app explicitly avoids them currently to maintain custom UI, cherry-picking context providers could drastically simplify state management.
2.  **Native Typing Indicators:** Stream provides `keystroke()` and `stopTyping()`. Using these removes the need for custom Supabase realtime channels.
3.  **Native Read State:** `channel.markRead()` and the `message.read` event eliminate the need for complex custom debouncing and DB triggers.
4.  **Message Search:** Stream has robust search capabilities that could replace or enhance `ChatSearchOverlay`.

---

## 9. TECHNICAL DEBT / DEAD CODE / WRAPPER COMPLEXITY

*   **Massive Debt:** `streamMessageToChravel` in `messageMapper.ts`. This single function ensures the UI can never fully utilize Stream's rich features (like easy threading, nested reactions, enriched URLs) because it flattens everything into a legacy shape.
*   **Dead Code Risk:** `useTripChat.ts` (the Supabase version) is marked as legacy but is still heavily referenced. If Stream is the future, the Supabase CDC logic needs to be fully decommissioned.
*   **Wrapper Complexity:** The dual-path logic in `TripChat.tsx` (checking flags, injecting fake IDs for optimistic updates) is highly error-prone.

---

## 10. TOP 5 HIGHEST-ROI IMPROVEMENTS

1.  **Eliminate `messageMapper.ts`**: Refactor `MessageItem.tsx` to consume native Stream `MessageResponse` types directly.
2.  **Migrate Typing Indicators**: Delete `TypingIndicatorService` and use Stream `channel.keystroke()`.
3.  **Migrate Read Receipts**: Delete `subscribeToReadReceipts` and use Stream `channel.markRead()`.
4.  **Unify Reactions**: Remove `toggleMessageReaction` (Supabase RPC) and exclusively use Stream `channel.sendReaction()`.
5.  **Remove Custom Offline Chat Queue**: Let Stream SDK handle offline message queueing to prevent duplicate message errors and race conditions.

---

## 11. TESTS THAT SHOULD EXIST BUT DON'T

1.  **Mapping Fidelity Tests:** Ensure `streamMessageToChravel` accurately maps attachments, mentions, and custom metadata without data loss (until it is deprecated).
2.  **Optimistic UI Sync Tests:** Verify that when a Stream message is sent, the temporary ID is properly replaced by the server ID without UI flicker.
3.  **Split-Brain Conflict Tests:** Tests verifying what happens when a Stream reaction occurs but the Supabase reaction API fails.
4.  **Channel Permissions Sync:** Verify that `useRoleChannels` and `useStreamProChannel` correctly deny access if a user's role changes.

---

## 12. PRIORITIZED ROADMAP

**Phase 1: Stop the Bleeding (Immediate)**
*   Fix reaction split-brain: force all reactions through Stream when the flag is active.
*   Disable custom offline queueing for chat messages if Stream is connected.

**Phase 2: Remove Custom State (Weeks 1-2)**
*   Rip out `TypingIndicatorService`; implement Stream typing events.
*   Rip out custom Read Receipts; implement Stream `markRead`.

**Phase 3: The Great Type Migration (Weeks 3-4)**
*   Deprecate `messageMapper.ts`.
*   Refactor `MessageItem`, `ThreadView`, and `ChatInput` to use native Stream SDK types.

**Phase 4: Cleanup (Week 5)**
*   Remove legacy `useTripChat` (Supabase CDC) entirely.
*   Drop unused Supabase tables (`message_reactions`, `trip_chat_messages` if fully migrated).

---

## 13. FILES / HOOKS / PROVIDERS / COMPONENTS AUDITED

**Core Stream Services:**
*   `src/services/stream/streamClient.ts`
*   `src/services/stream/streamChannelFactory.ts`
*   `src/services/stream/streamTokenService.ts`

**Hooks:**
*   `src/hooks/stream/useStreamClient.ts`
*   `src/hooks/stream/useStreamTripChat.ts`
*   `src/hooks/stream/useStreamProChannel.ts`
*   `src/hooks/stream/useStreamBroadcasts.ts`
*   `src/hooks/stream/useStreamConciergeHistory.ts`
*   `src/hooks/useRoleChannels.ts`
*   `src/features/chat/hooks/useTripChat.ts`

**UI Components:**
*   `src/features/chat/components/TripChat.tsx`
*   `src/features/chat/components/ThreadView.tsx`
*   `src/features/chat/components/MessageItem.tsx`
*   `src/features/chat/components/ChatInput.tsx`
*   `src/components/AIConciergeChat.tsx`

**Adapters/Mappers:**
*   `src/services/stream/adapters/mappers/messageMapper.ts`
*   `src/services/stream/adapters/conciergeAdapter.ts`

**Other Services:**
*   `src/services/chatService.ts`
*   `src/services/typingIndicatorService.ts`
*   `src/services/readReceiptService.ts`
