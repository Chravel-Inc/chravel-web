# Stream Migration Forensic Audit + Implementation Plan (2026-03-30)

## 1. Executive Summary

- **Primary root cause of perceived “send lag” is client-side sequencing, not raw transport latency**: `TripChat.handleSendMessage` currently awaits `useChatComposer.sendMessage()`, and that path awaits `useChatMessageParser.parseMessage()` (Edge Function call) **before** calling `sendTripMessage()`. This delays the actual insert call and therefore delays both optimistic insert and realtime echo. On slow parser calls, this can manifest as 10–15s perceived delay. 
- **Secondary contributors**:
  - Dictation path adds unavoidable speech-finalization delay (silence + end event) before send attempt.
  - Channel chat (`ChannelChatView`) has no optimistic insertion (messages appear only after DB insert/realtime callback).
  - Some local subscriptions still rely on broad `postgres_changes` and can add UI churn under load.
- **Mobile/TestFlight impact**: This bug is in shared React/TS logic (web app embedded by Capacitor), so fixing web logic fixes TestFlight behavior; iOS wrapper is not the main latency source.
- **Hard recommendation**: adopt **Option A** — **Stream as primary messaging backend (chat + concierge conversation delivery/persistence), while preserving custom Chravel UI.** Keep Supabase/Postgres as source of truth for trips, memberships, permissions, business entities, AI tool metadata, and analytics.
- **Immediate stop-bleeding patch (pre-migration)**: reorder send lifecycle so parser is async post-send, add deterministic client IDs + pending/sent/failed states for both chat and channel surfaces, unify typed+dictation send pipeline.

## 2. What the Stream Docs Mean for Chravel

Required pages reviewed:
- https://getstream.io/chat/solutions/ai-integration/
- https://getstream.io/chat/
- https://getstream.io/chat/sdk/
- https://getstream.io/chat/sdk/react-native/tutorial/cli/

Chravel-relevant takeaways:

1. **Stream is viable as realtime/chat infra, not only UI kit**
   - Docs position Stream as a chat API/platform with server SDKs, webhooks, moderation, permissions, channel primitives, and message history — i.e., backend-grade infra, not just prebuilt UI.
   - For Chravel this supports a backend/realtime swap while preserving existing UI renderers.

2. **AI integration is first-class, but optional in presentation layer**
   - AI integration page emphasizes chatbot/AI conversation patterns, tool execution support patterns, and migration assistance including bi-directional sync/zero-downtime migration narrative.
   - This aligns with Chravel’s need: keep existing LLM/tool orchestration, use Stream for conversational transport/history.

3. **React Native/Expo compatibility is mature**
   - RN tutorial flow demonstrates CLI + SDK paths for native surfaces.
   - This lowers risk for web + TestFlight parity if we use shared headless service adapters and keep UI custom.

4. **Headless/custom UI approach is feasible**
   - Stream SDK docs and API-first posture support custom rendering with low-level clients/events instead of adopting full prebuilt component kits.
   - Recommendation: do **not** adopt Stream UI kits for core trip chat surfaces initially; use Stream clients + event subscriptions + custom mappers.

5. **Migration/coexistence implications**
   - AI integration page explicitly markets migration support and bi-directional sync for low downtime.
   - This supports a staged dual-write/backfill cutover instead of a big bang.

## 3. Current Messaging + Concierge Architecture

### 3.1 Regular Trip Chat (today)

**UI + hooks path**
- Entry/render surface: `src/features/chat/components/TripChat.tsx`
- Composer: `src/features/chat/components/ChatInput.tsx`
- Chat state + realtime + mutation: `src/features/chat/hooks/useTripChat.ts`
- Pre-send parser gate (critical): `src/features/chat/hooks/useChatComposer.ts` -> `src/features/chat/hooks/useChatMessageParser.ts`
- DB write helper: `src/services/chatService.ts`

**Data + transport**
- Table: `trip_chat_messages`
- Realtime:
  - Fast lane private broadcast subscription `chat_broadcast:{tripId}` via `src/services/chatBroadcastService.ts`
  - Fallback `postgres_changes` subscription in `useTripChat`
- Dedupe: `client_message_id` unique index (`trip_id`, `client_message_id`) introduced by migration `20251219194029_74c0bb1d-...sql`

**Key send flow (typed & dictation ultimately converge here)**
1. User taps send (`ChatInput.handleSend`).
2. `TripChat.handleSendMessage` calls `useChatComposer.sendMessage`.
3. `useChatComposer.sendMessage` awaits `parseMessage(...)` Edge Function call.
4. Only after parser returns, `TripChat` calls `sendTripMessage` (`useTripChat` mutation).
5. `useTripChat.onMutate` inserts optimistic row; DB insert then realtime replaces/dedupes.

### 3.2 AI Concierge (today)

**UI + orchestration**
- Main surface: `src/components/AIConciergeChat.tsx`
- Input: `src/features/chat/components/AiChatInput.tsx`
- Gateway transport (sync + SSE): `src/services/conciergeGateway.ts`
- History hydration: `src/hooks/useConciergeHistory.ts`

**Persistence model**
- Primary conversation history table: `ai_queries` (query_text + response_text + metadata)
- Usage tracking: `concierge_usage` (+ trip usage counters from later migration series)
- Rich card/tool metadata partially persisted in `ai_queries.metadata`

**Behavioral model**
- User message is optimistically added immediately in local state.
- Assistant content is streamed via SSE (`invokeConciergeStream`), progressively hydrated.
- Tool results (cards/actions) patched into streaming message.
- After stream completion, metadata is persisted/updated.

### 3.3 Pro Channels + Broadcasts (today)

**Pro channels**
- UI: `src/components/pro/channels/ChannelChatView.tsx`
- Access/channel list orchestration: `src/hooks/useRoleChannels.ts`
- Services: `src/services/channelService.ts`, `src/services/roleChannelService.ts`
- Tables: `trip_channels`, `channel_messages`, `channel_members`, `channel_role_access`, role tables

**Broadcasts**
- Service: `src/services/broadcastService.ts`
- Tables: `broadcasts`, `broadcast_reactions`
- Read/ack via RPC helpers (`mark_broadcast_viewed`, read count RPC)

### 3.4 Mobile/TestFlight coupling

- Capacitor config indicates web bundle (`dist`) embedded as shell (`capacitor.config.ts`).
- iOS wrapper (`ios/App/App/AppDelegate.swift`) is shell-level polish/SDK init; no alternate chat transport pipeline.
- Therefore, core message send latency originates in shared web codepaths.

## 4. Root Cause Analysis of Current Slowness

### Primary Cause (decisive)

**Pre-send parser call blocks actual send kickoff.**

- `TripChat.handleSendMessage` currently awaits `sendMessage(...)` from composer.
- `useChatComposer.sendMessage` awaits `parseMessage(message.id, inputMessage, tripId)` before returning.
- `parseMessage` invokes Edge Function `message-parser`, which can be slow.
- Only after this returns does `TripChat` call `sendTripMessage(...)` (the actual mutation/insert path).

**Net effect:** even though `useTripChat` has optimistic insertion, that optimistic insertion is delayed by the parser call; perceived “tap send -> nothing happens” can reach parser latency.

### Secondary Causes

1. **Dictation adds extra pre-send delay**
   - Web Speech path finalizes transcript on silence/end; user perceives this as send lag when combined with parser gate.

2. **Channel chat lacks optimistic insertion**
   - `ChannelChatView` appends after DB/realtime, so higher perceived latency there.

3. **Mixed state surfaces increase complexity**
   - Trip chat has robust optimistic/dedupe logic; channels and concierge use different status models and failure handling, increasing inconsistency.

### Not primary bottlenecks (based on repo evidence)

- **Capacitor wrapper**: no distinct send pipeline or artificial network delay logic found.
- **Supabase realtime transport**: trip chat already has a broadcast fast lane + CDC fallback.
- **Backend insert path alone**: does not explain 10–15s “nothing visible” if optimistic insert were triggered immediately.

## 5. Immediate Patch Before Migration

### Objective
Get perceived send latency to <200ms immediately on current stack, with no UI rewrite.

### Surgical changes

1. **Decouple parser from send-critical path**
   - File: `src/features/chat/hooks/useChatComposer.ts`
   - Change: remove `await parseMessage(...)` blocking behavior from `sendMessage`; run parser fire-and-forget post-send in `TripChat` (or enqueue background parse job keyed by persisted message id).

2. **Call `sendTripMessage` immediately after local validation**
   - File: `src/features/chat/components/TripChat.tsx`
   - Ensure send path does not await expensive enrichment before mutation.

3. **Unify typed + dictation send path**
   - Files: `ChatInput.tsx`, `useWebSpeechVoice.ts`, `TripChat.tsx`
   - Ensure dictation final text funnels through exact same send command object + idempotency token.

4. **Add explicit UI states for pending/sent/failed (trip + channel)**
   - Trip chat already has optimistic rows; add consistent status badges in message mapper.
   - Channel chat (`ChannelChatView.tsx`) add optimistic insertion + reconciliation by `client_message_id` equivalent (introduce in `channel_messages` if absent).

5. **Duplicate-send prevention hardening**
   - Keep `sendLockRef` in composer and add time-windowed idempotency (`client_message_id`) for channel paths.

### Client message ID strategy

- UUID v4 generated client-side before mutation (`client_message_id`).
- Use deterministic dedupe lookup on both optimistic cache merge and realtime echo.
- For channels: add `client_message_id` column + unique index `(channel_id, client_message_id)`.

### Reconciliation strategy

- Insert optimistic row immediately with `id = optimistic-{client_message_id}`.
- On server ack or realtime echo, replace by `client_message_id` first, `server id` second.
- Keep stable sorting key: `(created_at, id)` to avoid jitter.

### Acceptance criteria

- Tap send to visible pending bubble: **<200ms p95** on web + TestFlight.
- No duplicate message when double-tapping send.
- Failed sends show retry affordance; retry preserves idempotency.
- Typed and dictation follow identical send lifecycle/state transitions.

### Manual QA checklist

1. Send 20 typed messages rapidly; verify no duplicates and immediate pending render.
2. Dictate long message, then send; verify no 10s blank gap.
3. Simulate parser timeout; verify message still appears immediately and parser result arrives async.
4. Toggle network offline/online; verify queued behavior + reconciliation.
5. Repeat on iOS TestFlight build.

## 6. Recommended Stream Target Architecture

## Recommendation: **A. Stream as full primary messaging backend, keep custom UI**

No hedge.

### What stays in Supabase/Postgres

- Trips, memberships, roles, permissions, org structures.
- AI tool execution logs, structured metadata, domain entities (tasks/polls/calendar/payments/places).
- Demo mode seed framework + demo/content tables.
- Compliance/audit tables and business analytics.

### What moves to Stream

- Real-time chat message transport + persistence for:
  - Trip chat
  - Pro segmented channels
  - Broadcast announcement channels/messages
  - Concierge conversational message stream/history (user-visible conversation layer)
- Read state, typing indicators, message reactions, thread primitives.

### ID mapping

- `trip_id` (Supabase) -> Stream channel namespace key.
- Convention:
  - `trip:{trip_id}:main`
  - `trip:{trip_id}:broadcast`
  - `trip:{trip_id}:role:{role_slug}`
  - `trip:{trip_id}:concierge:{scope}` (e.g., `shared` or `user:{user_id}` depending privacy)

### Role mapping

- Supabase remains source of truth for roles.
- Membership sync service projects allowed members + role grants to Stream channel membership and custom roles.

### Broadcast modeling

- Stream channel type `broadcast` (write restricted to admins/staff).
- High-priority announcements via message custom fields (`priority`, `requires_ack`).

### AI concierge modeling

- Dedicated Stream channels for concierge conversation delivery/history.
- Keep existing LLM/tool orchestration in Supabase Edge Functions.
- Stream stores user-visible convo messages; machine/tool internals remain in Supabase tables.

## 7. Regular Chat Migration Plan

### Phase 0: foundation

- Add packages:
  - `stream-chat`
  - `stream-chat-react` (optional only if reusing lower-level hooks/utilities; avoid UI kit adoption)
  - For native future parity: `stream-chat-react-native` in mobile package boundary if needed.

### Phase 1: backend auth/token minting

- New Edge Function: `stream-token` (Supabase service role)
  - Input: authenticated user
  - Output: short-lived Stream user token
- Secrets/env:
  - `STREAM_API_KEY` (public safe in client as needed)
  - `STREAM_API_SECRET` (server only)
  - Optional `STREAM_APP_ID`, region config

### Phase 2: adapter layer (anti-lock-in)

Create `src/services/messaging/` abstraction:
- `MessagingClient` interface (`connectUser`, `sendMessage`, `watchChannel`, `queryMessages`, etc.)
- `SupabaseMessagingAdapter` (legacy)
- `StreamMessagingAdapter` (new)
- Feature flag: trip/channel-scoped adapter routing

### Phase 3: trip channel lifecycle sync

- On trip creation/member change/role change:
  - project to Stream channels + memberships
  - maintain idempotent upsert jobs
- Source of truth remains Supabase; Stream is projection for messaging runtime.

### Phase 4: UI wiring (preserve existing components)

- Keep:
  - `TripChat.tsx`, `ChatInput.tsx`, `VirtualizedMessageContainer.tsx`, `MessageItem.tsx`
- Refactor data hooks only:
  - `useTripChat` -> read/write via `MessagingClient`
- Preserve styling, tab structure, interaction model.

### Phase 5: read/unread/reactions

- Map existing read receipt/reaction UI to Stream events/APIs.
- Keep current UI but swap underlying query/subscription implementation.

### Acceptance criteria

- No visual regressions in chat UI.
- p95 perceived send latency <200ms.
- Message ordering stable under reconnect.
- No duplicate/lost messages under reconnect + retry.

## 8. AI Concierge Migration Plan

### Hard stance

- **Use Stream for concierge message delivery + conversation persistence.**
- **Keep existing AI orchestration (Gemini/Lovable/tool router) in current backend.**
- **Do not adopt Stream AI UI kit components for core surfaces right now.**

### Model

1. User sends concierge prompt from existing `AIConciergeChat` UI.
2. Message written to Stream concierge channel immediately (pending->sent).
3. Existing Edge Function executes LLM + tools.
4. Assistant streaming chunks/events are emitted to Stream (partial updates or chunk messages).
5. Final assistant message persists in Stream; structured tool metadata persisted in Supabase (`ai_queries` + tool tables).

### Representation

- Stream message custom fields:
  - `role: user|assistant`
  - `content_markdown`
  - `render_type: text|card|tool_summary`
  - `citations`, `links`, `card_payload_ref`, `trip_context_version`
- Heavy/internal tool payloads stay in Supabase with foreign reference IDs in Stream to avoid polluting user-visible message history.

### Channel scoping

- Default: **dedicated private concierge channel per trip per user** (`trip:{trip_id}:concierge:user:{user_id}`) for privacy and cleaner personalization.
- Optional shared concierge channel for team assistants can be added later.

### Dual persistence

- User-visible conversational turns: Stream primary.
- Tool metadata + analytics + governance records: Supabase primary.
- Keep `ai_queries` during coexistence as durability log, then reduce to metadata ledger after stabilization.

## 9. Pro Channels + Broadcasts Plan

### Channel types (Stream)

- `trip_main` — core trip group chat
- `trip_role` — role-segmented channels (staff/admin/security/etc.)
- `trip_broadcast` — announcement-only channel(s)
- `trip_concierge` — AI channels (private scoped)

### Naming conventions

- `trip:{trip_id}:main`
- `trip:{trip_id}:role:{role_slug}`
- `trip:{trip_id}:broadcast:{segment?}`
- `trip:{trip_id}:concierge:user:{user_id}`

### Permissions

- Supabase role engine remains authoritative.
- Sync worker maps:
  - trip admins -> channel moderators/admin grants
  - staff roles -> role channels membership
  - members -> read-only for broadcasts (except permitted posters)

### Broadcast UX

- Urgent announcements: custom field `priority=urgent`, sticky/pin behavior in UI.
- Ack workflow: custom message-level receipt state (Stream read events + Supabase ack mirror for compliance).

## 10. Legacy Message Migration / Coexistence Plan

### Phase 1: schema + mapping

- Create mapping tables in Supabase:
  - `message_migration_map(legacy_message_id, stream_message_id, channel_key, migrated_at)`
  - `channel_migration_map(legacy_channel_id, stream_channel_id, trip_id, type)`

### Phase 2: historical backfill

- Backfill order:
  1. `trip_chat_messages`
  2. `channel_messages`
  3. optional concierge `ai_queries` turns as Stream concierge messages
- Preserve timestamps (`created_at`) and author mapping.
- Preserve attachments/metadata by reference, not blob duplication where possible.

### Phase 3: dual-write window

- During canary, write new messages to both systems through adapter.
- Read priority controlled by feature flags per trip.

### Phase 4: read cutover

- For migrated trips, read Stream first.
- Legacy fallback only for unmigrated ranges/channels until verification complete.

### Integrity validation

- Count parity by channel/day/sender.
- Hash checks on normalized message text + timestamp + sender.
- Spot-check attachments/cards/tool metadata links.

### Rollback

- Feature-flag revert to legacy adapter per trip/channel.
- Because dual-write preserves continuity, rollback does not lose new data.

### Demo data protection

- Do not mutate demo seed content.
- Keep demo mode on mock path during first migration waves.
- If Stream demo projection is needed, generate from seed snapshots without editing source demo tables.

## 11. Risks / Edge Cases

1. Duplicate sends during coexistence — **High/Medium**
   - Mitigation: mandatory client_message_id + dedupe keys in both stores.
2. Stream token failures — **High/Medium**
   - Mitigation: short-lived token refresh endpoint + graceful reconnect retry.
3. Membership drift (Supabase vs Stream) — **High/Medium**
   - Mitigation: idempotent membership sync job + periodic reconciliation audits.
4. Concierge metadata mismatch — **Medium/Medium**
   - Mitigation: keep rich metadata primary in Supabase with message refs.
5. TestFlight wrapper regressions — **Medium/Low**
   - Mitigation: shared adapter tests + native smoke tests.
6. Dictation divergence — **Medium/Medium**
   - Mitigation: single send command pipeline for typed/dictation.
7. Split source of truth confusion — **High/High**
   - Mitigation: explicit contract: Stream = conversation runtime, Supabase = business truth.
8. Legacy history fragmentation — **High/Medium**
   - Mitigation: backfill + dual-read fallback until parity verified.
9. Broadcast permission leaks — **High/Low**
   - Mitigation: enforce write ACLs from Supabase role projection + integration tests.
10. Vendor lock-in — **Medium/Medium**
   - Mitigation: adapter interface + domain DTOs independent of Stream types.
11. Cost growth — **Medium/Medium**
   - Mitigation: retention policy, attachment offload strategy, channel hygiene.
12. SDK bloat/perf impact — **Medium/Low**
   - Mitigation: prefer low-level SDK usage; avoid full UI kit payload.
13. Future customization pain — **Medium/Low**
   - Mitigation: custom UI preserved from day 1.
14. Dead code/spaghetti from hybrid transition — **High/Medium**
   - Mitigation: strict phase gates + delete legacy paths post-cutover.

## 12. 48-Hour Action Plan

1. Ship immediate send-path fix (parser decoupling) in trip chat.
2. Add instrumentation timestamps:
   - `tap_send_ts`
   - `mutation_start_ts`
   - `optimistic_render_ts`
   - `server_ack_ts`
3. Add channel chat optimistic insert + failed/retry states.
4. Create Stream spike branch:
   - token mint Edge Function
   - minimal Stream adapter
   - one internal canary trip on Stream read/write.

## 13. 1-Week Action Plan

1. Implement adapter architecture + feature flags.
2. Stream-enable regular trip chat for internal cohort.
3. Build membership sync worker + reconciliation dashboard.
4. Implement concierge Stream channel write/read while keeping orchestration unchanged.
5. Dual-write + backfill dry run for 2–3 representative trips (consumer, pro, event).
6. Add end-to-end latency SLO alerting for send path.

## 14. Later-Phase Cleanup / Hardening

1. Remove legacy Supabase chat realtime subscriptions per migrated trip.
2. Consolidate message DTOs (trip/channel/concierge) into one typed model hierarchy.
3. Retire duplicate services/hooks and dead legacy adapter branches.
4. Add migration replay tooling + checksum reports for future batch migrations.
5. Complete broadcast ack workflows and compliance exports on unified model.
6. Formalize “one source of truth” contract in architecture docs + CI checks.
