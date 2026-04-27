# Chravel GetStream Architecture and Quality Audit — 2026-04-27

Branch audited: `cursor/getstream-architecture-audit-ed97`
Base branch: `main`
Audit type: recurring code-evidence health report. No runtime code changed.

## 1. OVERALL GETSTREAM HEALTH SCORE (0-100)

**78 / 100**

GetStream is now a real production subsystem for standard trip chat, not a thin experiment. The healthiest path is the standard `TripChat` surface: Stream tokening, trip channel watch/query, send, reactions, read state, typing, threads, pins, mentions, search, membership recovery, reconnect backfill, and telemetry all exist with focused tests. The score is held below 90 because the architecture is uneven: Pro Trip channels are Stream-backed but materially less complete, Stream feature flags are seeded but not wired as runtime kill switches, the client still has a hardcoded Stream API-key fallback, and several custom state wrappers duplicate SDK channel state in ways that require constant guardrail tests.

## 2. EXECUTIVE SUMMARY

### Strongest areas

- **Standard trip chat is the strongest Stream integration.** `src/hooks/stream/useStreamTripChat.ts` owns channel watch/query, send, reaction toggles, membership recovery, reconnect/visibility backfill, and telemetry. `src/features/chat/components/TripChat.tsx` projects that raw Stream state through dedicated adapters/selectors instead of doing all mapping inline.
- **Server-side tokening and membership repair are materially better than early migration code.** `supabase/functions/stream-token/index.ts`, `stream-join-channel`, `stream-ensure-membership`, and `stream-reconcile-membership` form a real authorization and recovery story for trip/broadcast channels.
- **The Concierge boundary is correctly separated.** `docs/CONCIERGE_TRANSPORT_BOUNDARY.md` explicitly says AI Concierge remains SSE + DB, not Stream-backed. `src/components/AIConciergeChat.tsx` imports concierge hooks, not Stream hooks.
- **Tests exist for the highest-risk trip-chat primitives.** There are direct tests for trip send/reactions/errors, message view-model projection, typing, read receipts, thread view, message actions, Stream client auth, Stream search, and production-readiness gate behavior.

### Weakest areas

- **Pro Trip channels are transport-complete but product-incomplete.** `src/hooks/stream/useStreamProChannel.ts` and `src/components/pro/channels/ChannelChatView.tsx` support basic messages, pagination, replies-as-`parent_id`, edit/delete, and reactions, but not Stream typing, read receipts, a real thread view, pins, mentions payloads, channel search, moderation controls, or reconnect backfill parity.
- **Runtime rollout flags are confused.** `supabase/migrations/20260410050000_seed_stream_chat_feature_flags.sql` seeds `stream-chat-trip`, `stream-chat-channels`, `stream-chat-broadcasts`, and stale `stream-chat-concierge`, but the app checks env-driven `isStreamConfigured()` and separate `stream_changes_canary`. No frontend `useFeatureFlag('stream-chat-*')` path was found.
- **The SDK is partly fought by custom state mirrors.** Stream channel state is mirrored into React arrays in `useStreamTripChat`, `useStreamProChannel`, `ThreadView`, and Pro reaction overlays. This is workable, but every mirror must stay perfectly synchronized with `channel.state.messages`, WebSocket events, optimistic sends, pagination, and reconnect backfill.
- **Some docs/config are stale.** `docs/GETSTREAM_AUDIT_REPORT.md` conflicts with current code around Concierge and mapper deletion. `stream-setup-permissions` still configures a `chravel-concierge` channel type and service user even though the current boundary says Concierge is not Stream-backed.

### Biggest architecture risks

1. **Pro channel drift:** Supabase owns channel discovery/roles while Stream owns message transport. The validator in `src/services/stream/roleGrantMembershipContract.ts` helps, but the server reconciler only covers `chravel-trip` and `chravel-broadcast`, not `chravel-channel`.
2. **Config/flag drift:** env, seeded DB flags, canary flags, Stream dashboard channel grants, webhook secrets, and client API key must all align. Today that is only partially automated.
3. **Custom UI plus custom state:** Custom UI is appropriate for Chravel's brand. Custom state duplication is the costly part. Trip chat has enough tests to justify it; Pro channels do not yet.
4. **Silent degradation paths:** `connectStreamClient()` swallows connection errors, `useStreamProChannel` catches watch/send/pagination failures without structured telemetry, and some production paths only log in development.

### Top conclusions

- Chravel should **keep custom Stream UI**; adopting `stream-chat-react` wholesale would likely fight the product/design system.
- Chravel should **reduce custom state divergence**, especially by extracting shared Stream lifecycle/pagination/reconnect helpers for trip and Pro channels.
- Standard trip chat is close to production-strong. Pro channel chat and rollout/ops controls are the main blockers to a 90+ subsystem.
- AI Concierge should **not** share Stream transport. The current SSE/DB separation is correct; remove stale Concierge Stream configuration/docs rather than re-entangling it.

## 3. FEATURE INVENTORY

Meaningful GetStream-related features found:

- **Stream client singleton/auth:** `src/services/stream/streamClient.ts`, `src/hooks/stream/useStreamClient.ts`, `src/services/stream/streamTokenService.ts`, `supabase/functions/stream-token/index.ts`.
- **Channel taxonomy:** `src/services/stream/streamChannelFactory.ts` defines `chravel-trip`, `chravel-channel`, `chravel-broadcast`; IDs are `trip-{tripId}`, `channel-{channelId}`, `broadcast-{tripId}`.
- **Standard trip chat:** `src/features/chat/hooks/useTripChat.ts` re-exports `useStreamTripChat`; `src/hooks/stream/useStreamTripChat.ts`; `src/features/chat/components/TripChat.tsx`.
- **Pro Trip channels:** `src/hooks/useRoleChannels.ts` loads channel catalog from Supabase/demo; `src/hooks/stream/useStreamProChannel.ts` handles Stream message transport; `src/components/pro/channels/ChannelChatView.tsx` renders Pro channel messages.
- **Broadcast Stream path:** `src/hooks/stream/useStreamBroadcasts.ts`; `src/features/broadcasts/components/Broadcasts.tsx`; `chravel-broadcast` channel type.
- **Message rendering:** `src/features/chat/adapters/streamMessageViewModel.ts`, `src/services/stream/adapters/mappers/proChannelMessageAdapter.ts`, `MessageItem`, `MessageBubble`, `VirtualizedMessageContainer`, `MessageRenderer`.
- **Message input/composer:** `src/features/chat/components/ChatInput.tsx`, `useChatComposer`, `streamMessagePayload.ts`.
- **Threads:** `src/features/chat/components/ThreadView.tsx`; parent/thread metadata projection in `streamMessageViewModel.ts`; Pro sends `parent_id` but lacks `ThreadView` parity.
- **Reactions:** `useStreamTripChat.toggleReaction`, `useChatReactions`, `MessageReactionBar`, Pro `ChannelChatView` pending reaction overlay, `proChannelMessageAdapter.ts`.
- **Read/unread:** `useChatReadReceipts.ts`, `readStateSelectors.ts`, `useUnreadCounts.ts`, `ReadReceipts.tsx`; Pro channel path not integrated.
- **Typing indicators:** `useChatTypingIndicators.ts`; standard trip chat integrated; Pro channel path not integrated.
- **Edit/delete:** `TripChat.handleMessageEdit/Delete`, `ChannelChatView.handleMessageEdit/Delete`, `MessageActions.tsx`, `utils/updateStreamMessage.ts`.
- **Pins:** `TripChat.handleMessagePinToggle`, `derivePinnedMessages`, `MessageActions` pin menu; Pro not wired.
- **Mentions:** `ChatInput` mention picker; `streamMessagePayload.ts` builds `mentioned_users`; `useStreamTripChat` has capability/fallback handling; webhook mention notifications in `supabase/functions/stream-webhook`.
- **Quoted replies:** `streamMessagePayload.ts` `quoted_reference`; `extractQuotedReferenceFromStreamMessage`; Trip/Pro both render compact quote metadata.
- **Attachments/media/files:** `ChatInput` uploads through `useShareAsset`; `streamMessagePayload.ts` maps attachments/media/link previews to Stream attachments; `streamMessageViewModel.ts` and `MessageBubble` render image/video/file/link preview.
- **Permissions/membership:** `stream-setup-permissions`, `stream-join-channel`, `stream-ensure-membership`, `stream-reconcile-membership`, `streamMembershipSync`, `streamMembershipCoordinator`, `roleGrantMembershipContract`.
- **Moderation/admin controls:** `MessageActions` moderation entries; `src/services/moderationService.ts`; `supabase/functions/stream-moderation-action/index.ts`.
- **Search:** `src/services/stream/streamMessageSearch.ts`, `src/services/chatSearchService.ts`, `ChatSearchOverlay`; Pro-channel-specific search absent.
- **Webhooks/notifications:** `supabase/functions/stream-webhook/index.ts`, `mentionNotifications.ts`, dedupe migration `20260419120000_notifications_stream_dedupe.sql`.
- **Reconnect/resilience:** `useStreamTripChat` connection changed + visibility backfill; `ThreadView` reconnect backfill; `streamCanary.ts` and `stream-canary-guard`; Pro path has connection ready state but not backfill parity.
- **Operational scripts/QA:** `scripts/check-stream-config-parity.cjs`, `scripts/qa/run-chat-production-readiness-gate.cjs`, `qa/journeys/chat-production-readiness.json`, `scripts/backfill-stream-membership.ts`, `scripts/migrate-chat-to-stream.ts`.
- **AI Concierge boundary:** `docs/CONCIERGE_TRANSPORT_BOUNDARY.md`, `src/components/AIConciergeChat.tsx`; no active Stream Concierge hook/factory found.

## 4. STREAM ARCHITECTURE TRACE

### How the Stream client is initialized

`src/services/stream/streamClient.ts` creates one low-level `StreamChat` singleton. `connectStreamClient()` fetches a token, checks the returned API key against the frontend API key, attaches `connection.changed`, calls `connectUser`, and notifies local subscribers. `useStreamClient()` mounts that lifecycle from React when a user exists.

Risk evidence: `STREAM_API_KEY` falls back to a baked key (`import.meta.env.VITE_STREAM_API_KEY || 'k2dbmuesv2a9'`) while `streamTransportGuards.ts` says configuration should be blank-env-driven. Connection failures are swallowed in `connectStreamClient()` by design, which keeps the app usable but can hide production misconfiguration.

### How auth/tokening works

`src/services/stream/streamTokenService.ts` reads the current Supabase session, calls `SUPABASE_PROJECT_URL/functions/v1/stream-token`, caches the token for 20 hours, and clears cache on logout. `supabase/functions/stream-token/index.ts` validates required Stream secrets, validates the Supabase JWT via `supabase.auth.getUser`, upserts the Stream user, and returns a 24-hour Stream token.

Assessment: strong trust boundary. The server owns token creation; the client never sees the Stream secret.

### How channels are created and mapped to trips / Pro Trips

`streamChannelFactory.ts` maps:

- standard trip chat -> `chravel-trip:trip-{tripId}`
- Pro channel -> `chravel-channel:channel-{channelId}`
- broadcasts -> `chravel-broadcast:broadcast-{tripId}`

Trip chat watches the trip channel directly in `useStreamTripChat`. Pro channels load the channel catalog and role access from Supabase (`useRoleChannels`, `channelService`, `roleChannelService`) and then watch the matching Stream channel in `useStreamProChannel`.

Assessment: naming is clear and scalable enough for current needs. The weak point is drift: Pro channel discovery/authorization lives in Supabase while Stream membership/grants must be kept in sync separately.

### How message state flows into UI

Standard trip flow:

1. `TripChat` calls `useTripChat`, which is currently Stream-only via `useStreamTripChat`.
2. `useStreamTripChat` watches the channel, stores raw `MessageResponse[]`, subscribes to `message.*` and `reaction.*`, and exposes the active Stream channel.
3. `TripChat` maps raw messages through `buildStreamMessageViewModels`.
4. `VirtualizedMessageContainer` renders `MessageItem` / `MessageBubble`.

Pro channel flow:

1. `useRoleChannels` returns accessible channel catalog from Supabase/demo.
2. `ChannelChatView` calls `useStreamProChannel(channel.id)` for non-demo transport.
3. `useStreamProChannel` watches/query/paginates raw Stream messages.
4. `ChannelChatView` maps raw messages into legacy `ChannelMessage`/chat-bubble shapes and overlays local pending reaction intents.

Assessment: Trip flow is reasonably decomposed. Pro flow still has too much adapter/render/mutation logic inside `ChannelChatView`.

### How reactions / threads / read state are handled

- **Reactions:** Trip chat uses Stream `sendReaction`/`deleteReaction` and projects `reaction_counts`, `own_reactions`, and `latest_reactions`. Pro channels use Stream reactions plus a local pending-intent overlay.
- **Threads:** Trip chat uses real Stream `parent_id`, `getReplies`, thread event subscriptions, pagination, and reconnect backfill in `ThreadView`. Pro channels send `parent_id` and render reply metadata, but do not offer a dedicated thread panel.
- **Read state:** Trip chat calls `activeChannel.markRead()` and projects `activeChannel.state.read` into UI read statuses and unread counts. Pro channels do not wire read receipts/unread state into `ChannelChatView`.

### How AI Concierge intersects with or diverges from Stream

AI Concierge diverges from Stream. `AIConciergeChat.tsx` uses concierge hooks (`useConciergeMessages`, `useConciergeStreaming`, `useConciergeVoice`, etc.) and `docs/CONCIERGE_TRANSPORT_BOUNDARY.md` states Concierge is SSE + DB, not Stream-backed. This is the right separation because Concierge has token streaming and tool execution semantics that do not match group-chat message transport.

Fragility: `stream-setup-permissions/setup.ts` still configures `chravel-concierge`, seeds an `ai-concierge-bot`, and `20260410050000_seed_stream_chat_feature_flags.sql` still seeds `stream-chat-concierge`, which conflicts with the current boundary and can confuse future work.

### Where custom wrappers or state layers exist

- `streamClient.ts` singleton and subscriber model around SDK connection.
- `streamTokenService.ts` token cache.
- `useStreamTripChat.ts` mirrors `channel.state.messages` into React state and owns recovery/telemetry.
- `useStreamProChannel.ts` mirrors Pro channel messages with less recovery/telemetry.
- `streamMessagePayload.ts` maps Chravel message semantics to Stream payloads.
- `streamMessageViewModel.ts` and `proChannelMessageAdapter.ts` map Stream messages back to app view models.
- `useChatReadReceipts`, `useChatTypingIndicators`, `useChatReactions` bridge Stream primitives to custom UI.
- `ThreadView` independently queries and mirrors thread replies.
- `ChannelChatView` overlays pending reactions and maps Stream messages into legacy channel shapes.

Custom UI is justified. Custom state duplication is the source of most fragility.

## 5. FEATURE MATRIX

| Feature | Status | Where used | Native Stream vs custom | Quality assessment | Keep / improve / remove / add |
|---|---|---|---|---|---|
| Basic messaging | Enabled | TripChat, Pro ChannelChatView, broadcasts | Native `sendMessage`, `watch`, `query`; custom UI/state | Strong in trip, decent in Pro | Keep, improve Pro telemetry/backfill |
| Channel modeling | Enabled | `streamChannelFactory.ts` | Custom taxonomy over Stream channel types | Clear and stable | Keep, add flag/config alignment |
| Multiple channels per trip | Partially enabled | Pro Trip channels | Supabase catalog + Stream channel transport | Scales for current role channels, drift risk | Improve reconciler and validation |
| Pro Trip segmentation | Partially enabled | `useRoleChannels`, `roleGrantMembershipContract`, `useStreamProChannel` | Supabase roles + Stream membership | Workable but underpowered for future role evolution | Improve |
| Threaded replies | Enabled for trip; partial for Pro | `ThreadView`, `ChannelChatView` parent metadata | Native `parent_id`/`getReplies`; custom UI | Trip good, Pro partial | Improve Pro parity |
| Reactions | Enabled | Trip and Pro | Native reactions; custom bars/overlays | Trip good, Pro decent with pending overlay | Keep, add more Pro tests/error telemetry |
| Read/unread | Enabled for trip; disabled/unclear for Pro | `useChatReadReceipts`, `useUnreadCounts` | Native `markRead`, `state.read`, `countUnread`; custom selectors | Trip decent; Pro missing | Improve |
| Typing indicators | Enabled for trip; disabled for Pro | `useChatTypingIndicators` | Native typing events; custom hook | Trip decent; Pro missing | Improve |
| Message edit/delete | Enabled | TripChat, ChannelChatView, MessageActions | Native `updateMessage`/`deleteMessage`; custom permission gating | Good in trip; Pro less capability-aware | Improve Pro |
| Message actions | Enabled | `MessageActions.tsx` | Custom UI, Stream callbacks in stream mode | Healthy after transport-mode hardening | Keep |
| Attachments/media/files | Partially enabled | ChatInput, stream payload, MessageBubble | Stream attachments; custom upload/render | Works for simple media/file/link preview, not full Stream attachment lifecycle | Improve |
| Mentions | Enabled for trip; partial/unclear for Pro | ChatInput, `useStreamTripChat`, webhook | Native `mentioned_users`; custom picker/fallback/notifications | Trip good; Pro payload missing | Improve |
| Quoted replies | Enabled | Trip and Pro | Custom `quoted_reference` metadata plus Stream parent IDs | Useful and lightweight | Keep |
| Pinned messages | Enabled for trip; disabled for Pro | TripChat, MessageActions, pinnedMessages | Native `pinned` via `updateMessage`; custom panel | Trip good; Pro missing | Improve |
| Permissions/membership | Partially enabled | Edge functions, setup permissions, role contract | Stream grants + Supabase source of truth | Strong trip gate; Pro sync drift | Improve |
| Realtime subscriptions | Enabled | Trip, Pro, ThreadView, broadcasts | Native channel events; custom subscriptions | Trip strong; Pro basic | Improve Pro |
| Reconnect resilience | Partially enabled | Trip and ThreadView | SDK events + custom query backfill | Good in trip/thread, weak in Pro | Improve |
| Search | Partially enabled | Trip search and multi-trip search | Native `channel.search`/`queryChannels`; custom overlay | Good for trip, missing Pro channel search | Improve |
| Moderation/admin controls | Partially enabled | MessageActions, moderation edge function | Stream server APIs; custom authz/audit UI | Good foundation, not auto-mod | Improve tests/coverage |
| Link enrichment | Partially enabled | Link previews via attachment/custom fetch | Stream link attachments + custom previews | Good enough, not fully native link enrichment | Keep/improve later |
| Presence | Disabled/unclear | Not meaningfully surfaced | Stream presence mostly unused | Not needed yet | Later/skip |
| Push notification hooks | Partially enabled | Stream webhook mentions only | Stream webhook + Supabase notifications | Mention-only is intentional; broader push not wired | Later |

## 6. COMPONENT HEALTH SCORES (0-100)

### Stream client init/auth — **84**

- **Why:** Server tokening is strong; client singleton is simple; auth logout clears token/cache.
- **What keeps it from 90+:** hardcoded API key fallback in `streamClient.ts`; connection errors swallowed; feature flags not wired to client init.
- **Exact changes for 90+:** require `VITE_STREAM_API_KEY` for Stream mode, remove baked fallback, surface structured connection failure telemetry, and gate init through the same DB/env rollout source.

### Channel modeling — **82**

- **Why:** Clear channel types and deterministic IDs.
- **What keeps it from 90+:** Pro channel ACL/catalog split across Supabase + Stream; stale `chravel-concierge` config; DB flags not wired.
- **Exact changes for 90+:** remove stale Concierge Stream config/docs or mark explicitly legacy, add server-side Pro channel reconciler, and document channel lifecycle ownership.

### Standard trip chat — **86**

- **Why:** Full Stream transport, memberships, reactions, threads, read/typing, pins, search, reconnect backfill, tests.
- **What keeps it from 90+:** `useStreamTripChat` is large and owns too many concerns; duplicate send paths (`sendMessage` and `sendMessageAsync`); custom state mirrors require extensive regression tests.
- **Exact changes for 90+:** extract shared channel lifecycle/backfill/membership helpers, unify send semantics around one awaited mutation contract plus non-blocking UI affordance, add one end-to-end reconnect test.

### Pro Trip channels — **68**

- **Why:** Basic Stream-backed channel messaging exists.
- **What keeps it from 90+:** missing read receipts, typing, thread view, pins, Pro channel search, mention payloads, reconnect backfill, structured telemetry, and server reconciler coverage.
- **Exact changes for 90+:** make Pro channels consume shared Stream lifecycle/read/typing/thread utilities; add Pro membership reconciler; add parity tests for role segmentation, read/typing/reactions/threads.

### AI Concierge integration approach — **88**

- **Why:** Correctly separated from Stream; SSE/DB boundary documented.
- **What keeps it from 90+:** stale Stream Concierge permission setup/flag/docs remain.
- **Exact changes for 90+:** delete or quarantine `chravel-concierge` setup and `stream-chat-concierge` flag, update stale audit docs.

### Message rendering pipeline — **84**

- **Why:** Dedicated Stream view-model adapter, virtualized container, custom bubble supports reactions/read/media/replies.
- **What keeps it from 90+:** Trip and Pro mapping diverge; Pro maps back into legacy `ChannelMessage`; `MessageBubble` has a large prop surface.
- **Exact changes for 90+:** introduce a shared `ChatMessageViewModel` for trip/pro, keep transport-specific mapping at adapter layer, split large bubble sub-renderers only where tested.

### Message input pipeline — **79**

- **Why:** Composer supports mentions, files, payments, broadcast mode, typing, and draft restoration.
- **What keeps it from 90+:** `ChatInput` is transport-agnostic but payload capabilities vary; Pro mentions are UI-only unless IDs are sent; attachment upload/render lifecycle is custom and not strongly typed; `any` remains in key props.
- **Exact changes for 90+:** type attachment/payment/link-preview inputs, pass mention IDs through Pro sends, add capability-based UI disabling for unsupported actions.

### Threaded messages — **82**

- **Why:** Trip `ThreadView` is real Stream thread support with pagination, realtime updates, and reconnect backfill.
- **What keeps it from 90+:** Pro channel threads are only reply metadata; thread unread logic is projected custom-side; no shared thread service/hook.
- **Exact changes for 90+:** extract `useStreamThreadReplies(channel, parentId)`, reuse it in Trip and Pro, add thread unread/read-marker tests per channel type.

### Reactions — **84**

- **Why:** Uses native Stream reactions; trip has rapid-toggle intent tracking; Pro has pending overlay.
- **What keeps it from 90+:** two separate reaction implementations; Pro error handling lacks user-facing policy guidance and telemetry parity.
- **Exact changes for 90+:** share reaction toggle/intent overlay logic, add Pro reaction policy failure handling and tests.

### Read/unread state — **78**

- **Why:** Trip path uses `markRead`, `state.read`, `countUnread`, and selectors.
- **What keeps it from 90+:** Pro missing; read status depends on custom projection and may not cover thread-specific read state fully.
- **Exact changes for 90+:** wire `useChatReadReceipts` and selectors to Pro active channel, add unread count per Pro channel, add tests for thread reply unread behavior.

### Typing indicators — **80**

- **Why:** Trip path uses Stream `keystroke`/`stopTyping`, throttles, and clears on disconnect/channel switch.
- **What keeps it from 90+:** Pro does not use Stream typing; `ChatInput.isTyping` in Pro is just send state.
- **Exact changes for 90+:** pass Pro `activeChannel` through `useChatTypingIndicators`, render `TypingIndicator` in `ChannelChatView`, add tests.

### Attachments/media — **75**

- **Why:** Stream payload supports attachments/media/link previews and UI renders common media.
- **What keeps it from 90+:** upload lifecycle is custom; only first attachment drives some view-model fields; file metadata is thin; Pro attachment path is not clearly wired through `ChannelChatView`.
- **Exact changes for 90+:** define typed attachment model, support multiple attachments consistently, verify Pro send/render path, add upload failure/retry tests.

### Permissions/membership — **80**

- **Why:** Server tokening and trip membership recovery are solid; setup permissions grant key actions; moderation executes server-side.
- **What keeps it from 90+:** client-side membership sync still calls `addMembers`/`removeMembers` and logs mostly in dev; Pro not covered by server reconciler; channel grants and client UI capabilities can drift.
- **Exact changes for 90+:** move routine membership mutations server-side or add server verification, extend reconciler to Pro channels, make role-grant contract failures observable.

### Realtime event handling — **82**

- **Why:** Trip and thread subscriptions are explicit and cleaned up; Pro listens to message/reaction events.
- **What keeps it from 90+:** Pro event handling just clones `channel.state.messages`; no telemetry or backfill; event handling logic duplicated.
- **Exact changes for 90+:** shared event subscription helper, standard reconnect/backfill metrics, Pro event tests.

### Reconnect/background/foreground resilience — **76**

- **Why:** Trip has socket reconnect and visibility backfill; ThreadView backfills after reconnect.
- **What keeps it from 90+:** Pro path has no equivalent; canary is trusted-cohort only; no robust browser/AppState abstraction beyond `document.visibilitychange`.
- **Exact changes for 90+:** add Pro backfill; centralize visibility/AppState handling; add deterministic reconnect test harness.

### Performance/render efficiency — **79**

- **Why:** Message list is virtualized; adapters use memoization; recent render-path tests prevent duplicate list instances.
- **What keeps it from 90+:** large `TripChat`, `ChannelChatView`, and `MessageBubble` components still recompute/marshal many props; channel state mirrors can cause broad rerenders on every reaction event.
- **Exact changes for 90+:** shared view models, narrower memoized message row props, subscription selectors that update affected message IDs only where feasible.

### Maintainability / architecture hygiene — **74**

- **Why:** There are clear modules and adapters.
- **What keeps it from 90+:** duplicated trip/pro transport logic, stale docs, legacy/demo/pro branching inside UI components, `any` in important surfaces, and mixed flag semantics.
- **Exact changes for 90+:** extract shared Stream hooks, retire stale docs/config, enforce typed payloads, wire one rollout/kill-switch model.

### Tests / observability — **78**

- **Why:** Strong unit/regression coverage exists for trip chat and Stream services; QA readiness gate exists.
- **What keeps it from 90+:** Pro channel parity tests are thin; edge functions such as reconciler/moderation/canary lack dedicated tests; no full reconnect E2E; production observability is uneven.
- **Exact changes for 90+:** add missing edge tests, Pro feature parity tests, reconnect simulation tests, and dashboards tied to Stream reliability events.

## 7. BELOW-90 COMPONENTS

Every scored component is below 90 today. The highest-confidence patches are listed below.

### Stream client init/auth

- **Root causes:** baked API key fallback, swallowed connection errors, env-driven guard disagrees with fallback client key.
- **Files:** `src/services/stream/streamClient.ts`, `src/services/stream/streamTransportGuards.ts`, `src/hooks/stream/useStreamClient.ts`, `src/services/stream/streamTokenService.ts`.
- **Issue type:** architecture / ops.
- **Smallest safe patch path:** remove fallback from `streamClient.ts`; if no env key, return null and set a structured unavailable reason; add tests.
- **Ideal path:** one `streamRuntimeConfig` module combining env + DB rollout flag + token API-key parity.
- **Risk / complexity:** medium; must preserve local/test behavior.

### Channel modeling / Pro segmentation

- **Root causes:** Supabase channel catalog and Stream memberships can drift; Pro not covered by server reconciler; stale Concierge channel type still configured.
- **Files:** `streamChannelFactory.ts`, `useRoleChannels.ts`, `useStreamProChannel.ts`, `roleGrantMembershipContract.ts`, `stream-reconcile-membership`, `stream-setup-permissions/setup.ts`.
- **Issue type:** architecture / implementation.
- **Smallest safe patch path:** add Pro channel reconciliation endpoint mode and tests; remove or explicitly mark `chravel-concierge` as legacy unsupported.
- **Ideal path:** channel creation/role assignment edge function owns Supabase write + Stream membership/grant projection atomically.
- **Risk / complexity:** medium-high because it touches role-channel authorization.

### Standard trip chat

- **Root causes:** `useStreamTripChat` mixes connection, membership, send, reactions, pagination, backfill, canary, and telemetry.
- **Files:** `useStreamTripChat.ts`, `TripChat.tsx`, `streamMessagePayload.ts`, `streamMessageViewModel.ts`.
- **Issue type:** maintainability / performance.
- **Smallest safe patch path:** extract pure helpers for membership recovery and backfill query/merge without changing behavior.
- **Ideal path:** shared Stream channel lifecycle hook consumed by trip/pro/broadcast surfaces.
- **Risk / complexity:** medium; good tests reduce risk.

### Pro Trip channels

- **Root causes:** Pro path is a minimal transport migration, not a full chat parity surface.
- **Files:** `useStreamProChannel.ts`, `ChannelChatView.tsx`, `useRoleChannels.ts`, `proChannelMessageAdapter.ts`.
- **Issue type:** scope / UX / implementation.
- **Smallest safe patch path:** wire typing/read receipts first, then shared `ThreadView` support, then pins/search/mentions.
- **Ideal path:** Pro channel view consumes the same chat view-model and Stream lifecycle hooks as TripChat.
- **Risk / complexity:** medium; user-facing changes but additive.

### AI Concierge boundary

- **Root causes:** stale Stream Concierge config/docs survive after boundary decision.
- **Files:** `docs/CONCIERGE_TRANSPORT_BOUNDARY.md`, `docs/GETSTREAM_AUDIT_REPORT.md`, `stream-setup-permissions/setup.ts`, `20260410050000_seed_stream_chat_feature_flags.sql`.
- **Issue type:** architecture / docs / ops.
- **Smallest safe patch path:** update docs and comment/migration follow-up explaining `stream-chat-concierge` is retired; stop configuring `chravel-concierge` if safe.
- **Ideal path:** remove all unsupported Concierge Stream channel references and add a guard test that `streamChannelFactory` exposes no Concierge channel.
- **Risk / complexity:** low-medium; Stream dashboard compatibility should be checked.

### Message rendering pipeline

- **Root causes:** Trip and Pro mappers diverge; large prop surface crosses transport boundaries.
- **Files:** `streamMessageViewModel.ts`, `proChannelMessageAdapter.ts`, `MessageItem.tsx`, `MessageBubble.tsx`, `ChannelChatView.tsx`.
- **Issue type:** maintainability / UX.
- **Smallest safe patch path:** introduce shared normalized view model for fields already common to Trip and Pro.
- **Ideal path:** one renderer contract with transport-specific adapters.
- **Risk / complexity:** medium.

### Message input pipeline

- **Root causes:** generic composer supports more features than every transport actually persists; `any` payloads; Pro mention IDs not sent.
- **Files:** `ChatInput.tsx`, `TripChat.tsx`, `ChannelChatView.tsx`, `streamMessagePayload.ts`.
- **Issue type:** implementation / type safety.
- **Smallest safe patch path:** type `onSendMessage` payloads and add Pro `mentioned_users` support.
- **Ideal path:** capability-aware composer configuration per channel type.
- **Risk / complexity:** medium.

### Threads

- **Root causes:** Trip has a full thread view; Pro only stores parent metadata.
- **Files:** `ThreadView.tsx`, `TripChat.tsx`, `ChannelChatView.tsx`, `streamMessageViewModel.ts`.
- **Issue type:** UX / implementation.
- **Smallest safe patch path:** parameterize `ThreadView` by channel type/id and use it from Pro.
- **Ideal path:** shared `useStreamThreadReplies`.
- **Risk / complexity:** medium.

### Reactions

- **Root causes:** trip and Pro reaction paths are separate; Pro has less error/telemetry handling.
- **Files:** `useStreamTripChat.ts`, `ChannelChatView.tsx`, `proChannelMessageAdapter.ts`, `MessageReactionBar.tsx`.
- **Issue type:** implementation.
- **Smallest safe patch path:** extract reaction-intent helper and apply policy-error toast to Pro.
- **Ideal path:** shared reaction hook per active Stream channel.
- **Risk / complexity:** low-medium.

### Read/unread state

- **Root causes:** Pro channels do not consume read receipt hook/selectors.
- **Files:** `useChatReadReceipts.ts`, `readStateSelectors.ts`, `useUnreadCounts.ts`, `ChannelChatView.tsx`.
- **Issue type:** UX / implementation.
- **Smallest safe patch path:** call `useChatReadReceipts` in `ChannelChatView` with `streamProChannel.activeChannel`.
- **Ideal path:** unread summaries per Pro channel in channel list.
- **Risk / complexity:** low-medium.

### Typing indicators

- **Root causes:** Pro `isTyping` means sending, not Stream typing.
- **Files:** `useChatTypingIndicators.ts`, `ChannelChatView.tsx`, `ChatInput.tsx`, `TypingIndicator.tsx`.
- **Issue type:** UX.
- **Smallest safe patch path:** wire Pro active channel into `useChatTypingIndicators`.
- **Ideal path:** shared typed composer state (`isSending` vs `isTyping`) to avoid semantic confusion.
- **Risk / complexity:** low.

### Attachments/media

- **Root causes:** typed attachment model is thin; Pro send does not clearly include composer file uploads; custom storage and Stream attachment metadata are loosely connected.
- **Files:** `ChatInput.tsx`, `useShareAsset`, `streamMessagePayload.ts`, `streamMessageViewModel.ts`, `MessageBubble.tsx`, `ChannelChatView.tsx`.
- **Issue type:** implementation / UX.
- **Smallest safe patch path:** define and use typed Stream attachment input; add Pro attachment regression test.
- **Ideal path:** shared upload/send state machine with retry.
- **Risk / complexity:** medium.

### Permissions/membership

- **Root causes:** multiple sync paths; client SDK membership mutations; Pro reconciliation gap.
- **Files:** `streamMembershipSync.ts`, `streamMembershipCoordinator.ts`, `stream-join-channel`, `stream-ensure-membership`, `stream-reconcile-membership`, `roleGrantMembershipContract.ts`.
- **Issue type:** architecture / security-adjacent.
- **Smallest safe patch path:** add production telemetry on coordinator failures and extend reconciler coverage to Pro.
- **Ideal path:** server-owned membership projection for every mutation.
- **Risk / complexity:** high for role changes.

### Realtime/reconnect/performance/maintainability/tests

- **Root causes:** duplicated channel event subscription and message merge logic; Pro missing resilience tests; stale docs and flags.
- **Files:** `useStreamTripChat.ts`, `useStreamProChannel.ts`, `ThreadView.tsx`, `streamCanary.ts`, `stream-canary-guard`, test directories.
- **Issue type:** architecture / performance / tests.
- **Smallest safe patch path:** add Pro reconnect backfill and tests before broader refactor.
- **Ideal path:** shared lifecycle package for Stream channels plus E2E reconnect harness.
- **Risk / complexity:** medium-high.

## 8. UNDERUSED STREAM FEATURES WORTH EVALUATING

| Feature | Why it fits Chravel | Where it fits | Product upside | Difficulty | Do now / later / skip |
|---|---|---|---|---|---|
| Threads expansion | Trip operations and Pro roles need side conversations without timeline spam | Pro channels first | More organized Pro coordination | Medium | Do now for Pro parity |
| Mentions expansion | Already tied to notifications; critical for group coordination | Pro channels, broadcasts | Direct attention routing | Medium | Do now for Pro payload parity |
| Pinned messages | Useful for itinerary decisions, meeting points, urgent info | Pro channels and broadcasts | Reduces repeated questions | Low-medium | Do now |
| Better read/unread | Coordination apps need "who saw this" and unread triage | Pro channel list and thread replies | Reliability and accountability | Medium | Do now |
| Stronger typing indicators | Active coordination UX | Pro channels | Better perceived realtime quality | Low | Do now |
| Richer permissions / role-based access | Chravel Pro depends on roles | `chravel-channel` grants and Supabase role sync | Safer operational channels | High | Later, after reconciler |
| Message search | Users need to recover trip decisions | Pro channels and universal search | High utility | Medium | Later |
| Moderation tools | Events/pro communities need abuse controls | Admin/mod menus | Trust and safety | Medium | Later; current foundation is enough |
| System messages | Role/channel membership changes and itinerary updates should be visible | Trip and Pro channels | Better auditability | Medium | Later |
| Link enrichment | Links are a core collaboration artifact | Trip and Pro messages | Better content scanning | Medium | Later |
| Presence | Nice-to-have but not central | Pro operations only | Live coordination feel | Medium | Later/skip unless requested |
| Push notification hooks | Mentions exist; broader push may be useful | Webhook pipeline | Re-engagement | High because prefs/noise | Later |
| Stream auto-moderation | Could help at event scale | Public/event chats | Safety automation | High/ops-heavy | Skip for now |

## 9. TECHNICAL DEBT / DEAD CODE / WRAPPER COMPLEXITY

- **Stale audit doc:** `docs/GETSTREAM_AUDIT_REPORT.md` no longer reflects current code around Concierge and mapper state.
- **Stale Concierge Stream config:** `stream-setup-permissions/setup.ts` still updates `chravel-concierge`; migration seeds `stream-chat-concierge`; current boundary says Concierge is not Stream-backed.
- **Duplicated chat state:** `useStreamTripChat`, `useStreamProChannel`, `ThreadView`, and `ChannelChatView` all mirror subsets of Stream channel/message state.
- **Duplicated reaction logic:** Trip rapid-toggle tracking and Pro pending overlay are separate solutions to the same SDK echo problem.
- **Partial migration:** `useRoleChannels.sendMessage()` intentionally returns `false` for authenticated non-demo path. That is acceptable only because `ChannelChatView` owns Pro Stream sends; any future caller will break.
- **Client membership sync fragility:** `streamMembershipSync.ts` uses client SDK `addMembers`/`removeMembers`, catches failures as non-fatal, and mostly logs in dev; coordinator retries help but comments and operational guarantees are inconsistent.
- **Feature flag drift:** seeded `stream-chat-*` flags are not used as runtime kill switches; `stream_changes_canary` is separate.
- **Custom UI is fine; custom state is where harm accumulates.** The custom brand/UI layer should stay. The message/channel state duplication should be reduced through shared lifecycle/adapters.
- **No dangerous AI Concierge entanglement in active UI.** The danger is stale config/docs inviting future entanglement, not active runtime coupling.

## 10. TOP 5 HIGHEST-ROI IMPROVEMENTS

1. **Bring Pro channel chat to core Stream parity.** Add typing, read/unread, thread view, pins, mentions payloads, search, reconnect backfill, and tests. Highest user impact for Pro launch relevance.
2. **Unify Stream runtime config and kill switches.** Remove hardcoded API key fallback, wire seeded DB flags or delete them, and make canary/rollback semantics single-source.
3. **Extract shared Stream channel lifecycle primitives.** Move watch/query/pagination/event subscription/reconnect merge logic out of `useStreamTripChat` and `useStreamProChannel`.
4. **Extend server reconciliation and observability to Pro channels.** Cover `chravel-channel`, surface coordinator failures in production telemetry, and test role/membership drift.
5. **Clean stale Concierge Stream artifacts.** Remove or quarantine `chravel-concierge` setup/flags/docs to protect the correct SSE/DB boundary.

## 11. TESTS THAT SHOULD EXIST BUT DON’T

- **Reactions:** Pro reaction policy failure test; shared rapid-toggle echo consistency across trip and Pro.
- **Threads:** Pro channel thread view open/send/reconnect test; thread unread marker projection test.
- **Reconnect behavior:** Pro `useStreamProChannel` reconnect/visibility backfill; browser background/foreground integration test for trip and Pro.
- **Channel permissions:** Pro role assign/revoke end-to-end test that confirms Supabase accessible channel list and Stream membership/grants converge.
- **Pro Trip segmentation:** tests for multiple roles, overlapping channel access, role removal, archived/private channels, and channel member count source.
- **Message rendering consistency:** one snapshot/behavior suite using the same Stream message fixtures for TripChat and ChannelChatView.
- **AI Concierge boundary:** guard test that no active `chravel-concierge` factory/hook/export exists and `AIConciergeChat` has no Stream dependency.
- **Edge functions:** dedicated tests for `stream-reconcile-membership`, `stream-moderation-action`, and `stream-canary-guard`.
- **Attachments:** trip/pro media and file send/render tests, including multiple attachments and failed upload recovery.
- **Feature flags/config:** tests proving Stream mode is disabled when configured flag/env is absent and that seeded kill switches are honored.

## 12. PRIORITIZED ROADMAP

### Quick wins

- Remove or document stale `stream-chat-concierge` flag and `chravel-concierge` setup.
- Remove hardcoded Stream API-key fallback or make it test-only.
- Wire Pro typing indicators through `useChatTypingIndicators`.
- Wire Pro read receipts via `useChatReadReceipts`.
- Add Pro reaction policy error toast/test.
- Update stale `docs/GETSTREAM_AUDIT_REPORT.md` to point to this report and `CONCIERGE_TRANSPORT_BOUNDARY.md`.

### Medium-lift improvements

- Parameterize `ThreadView` for Pro channels.
- Add Pro channel pins using the existing `MessageActions` and `updateMessage({ pinned })` pattern.
- Add Pro mention payload support and webhook notification test.
- Add Pro channel search using `channel.search`.
- Add shared Stream event/pagination/backfill helper.
- Add server tests for moderation, canary guard, and membership reconciler.

### Major architectural upgrades

- Move all routine Stream membership projection to authenticated/server-side functions with reconciliation and audit logs.
- Build one normalized chat message view model for trip, Pro, and broadcast surfaces.
- Create a full Stream runtime config service that unifies env, DB feature flags, canary rollout, parity checks, and telemetry.
- Add an automated reconnect/background E2E harness that can simulate dropped Stream connections.
- Revisit Stream permission modeling for Pro Enterprise roles once role/channel workflows stabilize.

## 13. FILES / HOOKS / PROVIDERS / COMPONENTS AUDITED

### Frontend Stream services and hooks

- `src/services/stream/streamClient.ts`
- `src/hooks/stream/useStreamClient.ts`
- `src/services/stream/streamTokenService.ts`
- `src/services/stream/streamTransportGuards.ts`
- `src/services/stream/streamChannelFactory.ts`
- `src/services/stream/streamMessagePayload.ts`
- `src/services/stream/tripMessageTransport.ts`
- `src/services/stream/streamMessageSearch.ts`
- `src/services/stream/streamMembershipSync.ts`
- `src/services/stream/streamMembershipCoordinator.ts`
- `src/services/stream/streamUserSync.ts`
- `src/services/stream/streamCanary.ts`
- `src/services/stream/roleGrantMembershipContract.ts`
- `src/hooks/stream/useStreamTripChat.ts`
- `src/hooks/stream/useStreamProChannel.ts`
- `src/hooks/stream/useStreamBroadcasts.ts`
- `src/hooks/useRoleChannels.ts`

### Chat UI, adapters, selectors, and utilities

- `src/features/chat/hooks/useTripChat.ts`
- `src/features/chat/components/TripChat.tsx`
- `src/components/pro/channels/ChannelChatView.tsx`
- `src/features/chat/components/ThreadView.tsx`
- `src/features/chat/components/ChatInput.tsx`
- `src/features/chat/components/MessageActions.tsx`
- `src/features/chat/components/MessageBubble.tsx`
- `src/features/chat/components/MessageItem.tsx`
- `src/features/chat/components/MessageReactionBar.tsx`
- `src/features/chat/components/ReadReceipts.tsx`
- `src/features/chat/components/TypingIndicator.tsx`
- `src/features/chat/components/VirtualizedMessageContainer.tsx`
- `src/features/chat/components/ChatSearchOverlay.tsx`
- `src/features/chat/hooks/useChatTypingIndicators.ts`
- `src/features/chat/hooks/useChatReadReceipts.ts`
- `src/features/chat/hooks/useChatReactions.ts`
- `src/features/chat/adapters/streamMessageViewModel.ts`
- `src/features/chat/selectors/readStateSelectors.ts`
- `src/features/chat/utils/pinnedMessages.ts`
- `src/features/chat/utils/updateStreamMessage.ts`
- `src/services/stream/adapters/mappers/proChannelMessageAdapter.ts`
- `src/services/stream/adapters/mappers/messageMapper.ts`
- `src/services/stream/adapters/mappers/channelMapper.ts`

### AI Concierge boundary

- `src/components/AIConciergeChat.tsx`
- `docs/CONCIERGE_TRANSPORT_BOUNDARY.md`
- `docs/GETSTREAM_AUDIT_REPORT.md`

### Backend / Supabase / permissions / webhooks

- `supabase/functions/stream-token/index.ts`
- `supabase/functions/stream-join-channel/index.ts`
- `supabase/functions/stream-ensure-membership/index.ts`
- `supabase/functions/stream-reconcile-membership/index.ts`
- `supabase/functions/stream-setup-permissions/index.ts`
- `supabase/functions/stream-setup-permissions/setup.ts`
- `supabase/functions/stream-webhook/index.ts`
- `supabase/functions/stream-webhook/mentionNotifications.ts`
- `supabase/functions/stream-webhook/eventRouting.ts`
- `supabase/functions/stream-moderation-action/index.ts`
- `supabase/functions/stream-canary-guard/index.ts`
- `supabase/migrations/20260410050000_seed_stream_chat_feature_flags.sql`
- `supabase/migrations/20260419120000_notifications_stream_dedupe.sql`

### Scripts, QA gates, docs, and representative tests

- `scripts/check-stream-config-parity.cjs`
- `scripts/backfill-stream-membership.ts`
- `scripts/migrate-chat-to-stream.ts`
- `scripts/qa/run-chat-production-readiness-gate.cjs`
- `qa/journeys/chat-production-readiness.json`
- `docs/ops/chat-reliability-triage-first-7-days.md`
- `docs/audits/chat-stream-coherence-audit-2026-04-13.md`
- `docs/audits/chat-stream-responsibility-matrix-2026-04-13.md`
- `src/hooks/stream/__tests__/useStreamTripChat.send.test.tsx`
- `src/hooks/stream/__tests__/useStreamTripChat.reactions.test.tsx`
- `src/hooks/stream/__tests__/useStreamTripChat.errors.test.ts`
- `src/hooks/stream/__tests__/useStreamProChannel.test.tsx`
- `src/hooks/stream/__tests__/useStreamClient.test.tsx`
- `src/services/stream/__tests__/streamClient.auth.test.ts`
- `src/services/stream/__tests__/streamMessageSearch.test.ts`
- `src/services/stream/__tests__/streamMessagePayload.test.ts`
- `src/services/stream/__tests__/streamMembershipCoordinator.test.ts`
- `src/services/stream/__tests__/streamCanary.test.ts`
- `src/services/stream/__tests__/roleGrantMembershipContract.test.ts`
- `src/features/chat/adapters/__tests__/streamMessageViewModel.test.ts`
- `src/features/chat/components/__tests__/ThreadView.test.tsx`
- `src/features/chat/components/__tests__/TripChat.renderPath.test.tsx`
- `src/features/chat/components/__tests__/TripChat.deleteMessage.test.tsx`
- `src/features/chat/components/__tests__/MessageActions.streamCallbacks.test.tsx`
- `src/features/chat/hooks/__tests__/useChatTypingIndicators.test.tsx`
- `src/features/chat/hooks/__tests__/useChatReadReceipts.test.tsx`
- `src/components/pro/channels/__tests__/ChannelChatView.stream.test.tsx`
- `supabase/functions/stream-webhook/__tests__/eventRouting.test.ts`
- `supabase/functions/stream-webhook/__tests__/mentionNotifications.test.ts`
- `supabase/functions/stream-setup-permissions/__tests__/setupStreamPermissions.test.ts`
