# Chravel GetStream Architecture & Quality Audit

**Date:** 2026-08-03  
**Branch:** `cursor/chravel-getstream-audit-7579`  
**Method:** Code-evidence inventory of live `src/`, `supabase/functions/stream-*`, and Stream scripts. No guesses.  
**Supersedes:** `docs/GETSTREAM_AUDIT_REPORT.md` (Apr 2026 stub claiming **92/100** — factually wrong: invents `ThreadView`, `useStreamBroadcasts`, `useStreamConciergeHistory`, and Concierge-on-Stream).  
**Prior automation baseline (2026-07-27 memory):** **66/100**. This run re-verified every open finding.

---

## 1. OVERALL GETSTREAM HEALTH SCORE (0-100)

# **68 / 100**

**Verdict:** Workable production transport for standard trip chat, with serious contract debt in threads, membership projection, Pro parity, and webhook trip resolution. Feature presence must not be confused with production strength.

Delta vs 2026-07-27 memory (**66**): **+2**. Gains from moderation trip-scoping and Pro one-shot `stream-ensure-membership` self-heal. Core fragility (client `addMembers` swallow, broken thread contract, `chravel-channel` webhook trip_id null, unused DB kill-switch flags) is unchanged.

---

## 2. EXECUTIVE SUMMARY

### Strongest areas
- **Trip message transport** (`useStreamTripChat` + `streamClient` + token edge): native Stream watch/send/events with bounded waits, membership recovery, reconnect/visibility backfill, canary incident hooks, soft-delete filtering, and strong unit tests.
- **AI Concierge boundary**: correctly **not** Stream. SSE + `ai_queries` per `docs/CONCIERGE_TRANSPORT_BOUNDARY.md`. Do not “fix” this into Stream.
- **Reactions / read / typing (trip)**: native Stream APIs behind thin custom UI wrappers; Stream is source of truth.
- **Channel taxonomy**: clear `chravel-trip` / `chravel-channel` / `chravel-broadcast` IDs with `trip_id` custom data on create.
- **Server membership projection exists**: `stream-join-channel`, `stream-ensure-membership`, `stream-reconcile-membership` — better than the client sync comments admit.

### Weakest areas
- **Threads**: send uses Stream `parent_id`, then trip hook + view-model **filter replies out**; comments still claim `ThreadView`/`getReplies`; no `ThreadView.tsx` exists. Replies are effectively write-and-lose for trip chat.
- **Client membership sync**: `streamMembershipSync` still `addMembers`/`removeMembers` and **swallows errors**; coordinator retries are mostly illusory.
- **Pro channel hook**: ~218 LOC, silent empty/error states, no reconnect/visibility backfill, no typing/mentions/pins parity.
- **Webhook trip resolution**: `resolveTripIdFromChannel` returns `null` for `chravel-channel` even though factory stores `trip_id` on the channel — Pro mention notifications lose trip context.
- **Docs / flags / ghosts**: seeded `stream-chat-*` flags unused; runtime kill switch is `VITE_STREAM_CHAT_DISABLED`; stale audit stub and TEST_GAPS name deleted hooks.

### Biggest architecture risks
1. **Dual membership paths** (client fire-and-forget vs server ensure/reconcile) with silent client failure → intermittent “can’t chat / empty channel” that looks like product bugs.
2. **Thread contract lie** → users can “Reply”, Stream stores children, UI never shows them in trip chat.
3. **Pro underpowered vs trip** while Pro is the operational surface that needs reliability most.
4. **Webhook Pro trip_id null** → broken or trip-less notifications for channel mentions.
5. **Mega-files** (`useStreamTripChat` ~1279 LOC, `TripChat` ~1554 LOC) concentrate regression risk.

### Top conclusions
1. Chravel uses **`stream-chat` JS only** (no `stream-chat-react`) with custom UI — correct product choice.
2. Stream is the **message SoT** for trip / pro / broadcast channels; Supabase remains SoT for membership, roles, and Pro channel catalog.
3. Concierge must stay **off Stream** for interactive transport; only promoted-broadcast bridging is appropriate.
4. Getting every meaningful component to **90+** is mostly contract cleanup + Pro parity + deleting the client membership fight — **not** adopting Stream UI kit or putting Concierge on Stream.
5. The Apr 2026 “92/100 production-ready” report is **harmful fiction**; treat this file as the current scorecard.

---

## 3. FEATURE INVENTORY

| Feature | Primary locations | Status |
|---|---|---|
| Stream client singleton + connect/disconnect | `src/services/stream/streamClient.ts`, `src/hooks/stream/useStreamClient.ts`, `AppInitializer` | Enabled |
| Token mint / cache | `supabase/functions/stream-token`, `streamTokenService.ts` | Enabled |
| Transport kill switch | `streamTransportGuards.ts` (`VITE_STREAM_CHAT_DISABLED`) | Enabled (env only) |
| DB flags `stream-chat-*` | migration `20260410050000_seed_stream_chat_feature_flags.sql` | Seeded, **unreferenced** in runtime |
| Trip channel create/watch | `streamChannelFactory.getOrCreateTripChannel`, `useStreamTripChat` | Enabled |
| Pro channel create/watch | `getOrCreateProChannel`, `useStreamProChannel`, `ChannelChatView` | Enabled (messages) |
| Broadcast channel | factory + membership sync/join/ensure/reconcile + webhook fanout | Partially enabled (hybrid Stream + DB) |
| Basic messaging | `useStreamTripChat`, `useStreamProChannel`, `tripMessageTransport` | Enabled |
| Reactions | trip hook + `ChannelChatView` + `useChatReactions` | Enabled |
| Read/unread | `useChatReadReceipts`, unread hooks, Pro markRead flush | Enabled |
| Typing | `useChatTypingIndicators` (trip only) | Trip enabled / Pro disabled |
| Mentions | `ChatInput` + payload `mentioned_users` + CreateMention fallback | Trip enabled / Pro disabled |
| Quoted reply / parent_id | `streamMessagePayload`, TripChat, ChannelChatView | Partially enabled (send yes, trip view broken) |
| Threads UI / getReplies | comments only; no `ThreadView.tsx` | Broken / absent |
| Pins | trip `partialUpdateMessage` + `getPinnedMessages` | Trip enabled / Pro disabled |
| Search | `streamMessageSearch` + `ChatSearchOverlay` | Trip enabled / Pro absent |
| Attachments/media | `useShareAsset` + Stream attachments + MessageBubble | Enabled |
| Edit/delete | TripChat Stream client paths + capabilities | Trip enabled |
| Message actions | `MessageActions.tsx` transportMode branching | Enabled |
| Moderation | `stream-moderation-action`, ReportDialog | Partially enabled (trip-scoped; ban only `chravel-trip`) |
| Membership sync (client) | `streamMembershipSync`, `streamMembershipCoordinator` | Fragile / fighting grants |
| Membership ensure/join/reconcile (server) | edge functions + scheduled reconciler migration | Enabled |
| Role↔channel contract checks | `roleGrantMembershipContract.ts` | Enabled (diagnostic) |
| Canary | `streamCanary.ts`, `stream-canary-guard` | Enabled |
| Permissions setup | `stream-setup-permissions` | Enabled (ops) |
| Webhook | `stream-webhook` (+ eventRouting, mentions, broadcastFanout) | Partial (Pro trip_id gap) |
| Offline queue deferral | `offlineSyncService` skips `chat_message` when Stream active | Enabled |
| AI Concierge chat | `AIConciergeChat`, `useConciergeStreaming`, SSE gateway | **Not Stream** (healthy separation) |
| Concierge→Stream bridge | promoted broadcasts mirrored into trip chat | Narrow bridge only |
| Virtualization | `VirtualizedMessageContainer` | Enabled |
| E2E authenticated Stream delivery | `e2e/specs/chat/messaging.spec.ts` | Present but often skipped without staging secrets |

---

## 4. STREAM ARCHITECTURE TRACE

### How the Stream client is initialized
1. App shell mounts `useStreamClient` (via `AppInitializer`).
2. On authenticated session, `connectStreamClient()`:
   - fetches token via `streamTokenService.getStreamToken()` → edge `stream-token`
   - lazy-imports `stream-chat`
   - `StreamChat.getInstance(apiKey)`
   - connects with **token provider** (not a static token)
   - attaches `connection.changed` listeners
   - retries connect with backoff / cache clear
3. On logout / no auth: `disconnectStreamClient()`. Supabase auth sign-out also disconnects.

### Auth / tokening
- Edge validates Supabase JWT, upserts Stream user profile, mints ~24h token, returns `{ token, userId, apiKey }`.
- Client caches token ~20h.
- Token is **identity-only**; channel access is membership-enforced (commented correctly in `stream-token`).
- Runtime API key may come from token response (Lovable `VITE_` secret constraint) — guards document this.

### Channels mapped to trips / Pro Trips
| Stream type | Channel id | Custom data | Catalog SoT |
|---|---|---|---|
| `chravel-trip` | `trip-{tripId}` | `trip_id`, name | 1:1 with trip |
| `chravel-broadcast` | `broadcast-{tripId}` | `trip_id`, name | 1:1 with trip announcements |
| `chravel-channel` | `channel-{channelId}` | `trip_id`, `chravel_channel_id`, name | Supabase `trip_channels` + role grants |

Factory methods call `channel.watch()` client-side. Members are supposed to be projected by server join/ensure/reconcile — but client `streamMembershipSync` still also tries `addMembers`.

### Message state → UI
**Trip:** `useTripChat` → `useStreamTripChat` (Stream `MessageResponse[]`) → `streamMessageViewModel` → `TripChat` / `VirtualizedMessageContainer` / `MessageItem` / `MessageBubble`.

**Pro:** Supabase channel list → `useStreamProChannel` → mapper/adapter → `ChannelChatView` → shared bubble/actions/virtualization.

**Broadcasts:** hybrid — Stream broadcast channel + DB history/ack paths (`useBroadcastHistory`, webhook dual-write). Recent commits healed Stream/table split-brain; still not a single pure Stream UI surface.

### Reactions / threads / read state
- **Reactions:** native `sendReaction` / `deleteReaction`; trip updates via events; Pro adds pending overlay + rollback.
- **Threads:** send sets `parent_id` + custom `quoted_reference`. Trip realtime handler **drops** `parent_id` messages; adapter filters them again. UI “open thread” scrolls/highlights parent. **No getReplies / ThreadView.**
- **Read:** shared `useChatReadReceipts` → `activeChannel.markRead()`; view-model derives receipts from `channel.state.read`. Pro flushes markRead on channel identity change (known debounce bug hardened).

### AI Concierge intersection
- Interactive Concierge: **SSE** to `lovable-concierge`, history in **`ai_queries`**, composers `AiChatInput` / `AIConciergeChat`.
- Boundary doc forbids `chravel-concierge` Stream channels.
- Only selected tool outcomes (e.g. promoted broadcasts) bridge into Stream trip chat.
- **Healthy separation. Do not entangle.**

### Custom wrappers / state layers
- Intentional: view-model adapters, virtualization, ChatInput/AiChatInput, ShareAsset upload→Stream attachments, Pro reaction overlay, failed-message local list, composer draft.
- Harmful: client membership sync swallowing errors; thread filter vs reply UX contradiction; Pro silent catch → empty chat; stale comments/docs inventing deleted modules.

---

## 5. FEATURE MATRIX

| Feature | Status | Where | Native vs custom | Quality | Action |
|---|---|---|---|---|---|
| Basic messaging | Enabled | Trip + Pro | Native send/watch + custom UI | Strong trip / weaker Pro | **Keep**; raise Pro errors |
| Channel modeling | Enabled | factory + edge | Native types + custom IDs/metadata | Good taxonomy | **Improve** comments + watch-before-membership |
| Multiple channels per trip | Enabled (Pro) | `chravel-channel` catalog | Hybrid Supabase catalog + Stream msgs | Workable | **Keep**; scale via roles not N Stream types |
| Pro Trip segmentation | Partial | role grants → channel members | Custom RBAC + Stream membership | Fragile projection | **Improve** server-only projection |
| Threaded replies | Partial / broken (trip) | parent_id send; view filtered | Native parent_id + missing UI | Poor | **Improve** (decide XOR contract) |
| Reactions | Enabled | Trip + Pro | Native | Strong | **Keep** |
| Read/unread | Enabled | Trip + Pro | Native markRead + custom badges | Strong | **Keep** |
| Typing indicators | Trip enabled / Pro disabled | `useChatTypingIndicators` | Native keystroke | Trip good | **Add** to Pro or document skip |
| Message edit/delete | Trip enabled | TripChat | Native + capability checks | Decent | **Keep**; Pro parity later |
| Message actions | Enabled | MessageActions | Custom UI over Stream/legacy | Decent | **Keep** |
| Attachments/media/files | Enabled | ShareAsset + bubbles | Custom upload + native attachments | Strong after channel-scope fixes | **Keep** |
| Mentions | Trip partial-full / Pro off | ChatInput + webhook | Custom picker + native mentioned_users | Trip OK | **Improve** Pro + webhook trip_id |
| Quoted replies | Partial | payload + Pro parent-in-window | Hybrid parent_id + quoted_reference | Fragile | **Improve** with thread decision |
| Pinned messages | Trip enabled / Pro off | partialUpdate + getPinnedMessages | Native-ish | Trip good | **Later** for Pro |
| Permissions/membership | Dual path | client sync + server ensure/reconcile | Fighting SDK grants | Fragile | **Remove** client addMembers path |
| Realtime subscriptions | Enabled | channel.on events | Native | Trip strong / Pro crude | **Improve** Pro |
| Reconnect resilience | Partial | trip visibility + connection | Custom backfill on Stream reconnect | Trip good / Pro missing / no AppState | **Improve** |
| Search | Trip enabled | streamMessageSearch + overlay | Native channel.search + custom UI | Good | **Keep** |
| Moderation/admin | Partial | stream-moderation-action | Edge + Stream hide/mute/ban | Improved; ban scope narrow | **Improve** |
| Presence | Unclear / unused product UI | — | — | N/A | **Skip** for now |
| Concierge on Stream | Disabled (by design) | boundary doc | SSE+DB | Correct | **Keep separated** |

---

## 6. COMPONENT HEALTH SCORES (0-100)

Scoring rule: **90+ only if production-strong, scalable, maintainable, low fragility.** Feature exists ≠ strong.

### Stream client init/auth — **86**
- **Why:** Lazy SDK load, token provider, retries, sign-out disconnect, runtime API key support, unit tests (`streamClient.auth.test.ts`).
- **Blocks 90+:** Connect failure returns `null` and can leave chat silently degraded unless every caller surfaces error; no Capacitor AppState reconnect orchestration at client layer.
- **To 90+:** Propagate structured connect failure to a single app-level Stream health banner; add foreground reconnect kick for native shell; never leave TripChat looking “empty” on auth/connect failure.

### Channel modeling — **78**
- **Why:** Clear three-type taxonomy; `trip_id` on create; ID builders centralized.
- **Blocks 90+:** Factory `watch()` before membership repair; comments still point at client `streamMembershipSync` as primary; Pro channel id is UUID-based so webhook cannot parse trip from id alone (must use custom data — and doesn’t).
- **To 90+:** Document server projection as SoT; make factory create-without-watch for server paths; resolve Pro trip via `channel.data.trip_id` everywhere (webhook included).

### Standard trip chat — **82**
- **Why:** Mature hook: timeouts, join preflight, ensure-membership recovery, backfill, pins, reactions, search, soft-delete, message caps, extensive tests.
- **Blocks 90+:** Thread contract broken; ~1279 LOC god-hook; offline header claims Stream offline persistence while hook reports `is_offline_queued: false`.
- **To 90+:** Fix thread XOR; split hook into watch/send/reactions/pins modules; align offline claims with reality (or wire SDK offline queue explicitly).

### Pro Trip channels — **62**
- **Why:** Stream transport works; one-shot membership self-heal; read flush on switch; reaction rollback tests; channel catalog RPC avoids N+1 member counts.
- **Blocks 90+:** Silent catch → empty state; no error return; no reconnect/visibility backfill; no typing/mentions/pins; `attachments?: any[]`; sets `messages` to full `channel.state.messages` on every event; comment “mirrors” trip recovery overstates parity.
- **To 90+:** Port trip backfill/error/canary patterns; wire typing + mentions; surface errors; typed payloads; bounded upsert instead of full array replace.

### AI Concierge integration approach — **93** ✅ HEALTHY
- **Why:** Explicit boundary doc; SSE gateway; `ai_queries` history; no concierge Stream factory; only narrow broadcast bridge.
- **Blocks 90+:** Minor — shared visual chat primitives can confuse future agents into “putting Concierge on Stream.”
- **To 90+:** Keep boundary; add a lint/test guard that fails if new `chravel-concierge` channel type appears. **Do not move Concierge onto Stream.**

### Message rendering pipeline — **84**
- **Why:** Dedicated view-model adapter; virtualization; mosaic/voice/file/link coverage; many component tests.
- **Blocks 90+:** Filters `parent_id` out while TripChat still has inline reply grouping code that can never see Stream children; Pro parent lookup only within loaded window.
- **To 90+:** Align filter with chosen thread model; remove dead grouping or implement real reply fetch.

### Message input pipeline — **85**
- **Why:** ChatInput covers mentions, broadcast mode, attachments, dictation, typing callback; AiChatInput correctly separate for Concierge.
- **Blocks 90+:** Pro passes `tripMembers={[]}` and no `onTypingChange`; composer optimistic local message + heuristic failed-message reconcile.
- **To 90+:** Wire Pro members/typing; prefer Stream pending message id reconciliation over text+5s heuristic.

### Threaded messages — **38**
- **Why score is low:** Send path creates Stream threads; trip state **drops** them; comments claim `ThreadView`/`getReplies`; file absent; tests encode the filter-out behavior; search “open thread” only scrolls parent.
- **Blocks 90+:** Product contract undefined — quoted XOR real threads.
- **To 90+ (smallest):** Stop sending `parent_id` for trip replies; use quote-only (`quoted_reference` / quoted_message_id) and inline quote UI. **Or** (ideal): keep `parent_id`, implement `getReplies` panel, stop filtering without a viewer. Pick one and delete the other path.

### Reactions — **88**
- **Why:** Native Stream; policy error surfacing on trip; Pro optimistic overlay with rollback; dedicated tests.
- **Blocks 90+:** Pro overlay is a second state layer (acceptable but must stay thin); no shared reaction controller between trip/Pro.
- **To 90+:** Extract one `useStreamReactions(channel)` used by both surfaces; keep Stream as SoT.

### Read/unread state — **86**
- **Why:** Native markRead; Stream read projection; Pro channel-switch flush hardened; unread count hooks.
- **Blocks 90+:** Cross-surface unread aggregation complexity; Pro still depends on careful identity comparison.
- **To 90+:** Centralize unread selectors + integration test for multi-channel Pro switch + trip badge.

### Typing indicators — **72**
- **Why:** Trip uses native keystroke/stopTyping with connection.changed; capped at 50 members; unit tests.
- **Blocks 90+:** Pro not wired at all; product gap on operational channels.
- **To 90+:** Wire `useChatTypingIndicators` into `ChannelChatView` with same member-count guard.

### Attachments/media — **84**
- **Why:** Canonical transport prevents Pro attachments falling into trip chat; payload normalization; signed URL mosaic fixes in recent history; Bubble coverage.
- **Blocks 90+:** Dual indexing (storage + Stream attachments + media tables) can drift; Pro text send path doesn’t pass attachments (uploads go ShareAsset — OK but split).
- **To 90+:** Single attachment send helper for trip/Pro; contract tests for channel-scoped index rows.

### Permissions/membership — **52**
- **Why score is low:** Client sync still primary in comments and call sites; errors swallowed; coordinator can’t see failures; server ensure/reconcile exist but dual-write continues; grants setup is ops-secret based.
- **Blocks 90+:** Fighting Stream’s server-side membership model.
- **To 90+:** Delete client `addMembers`/`removeMembers` from product paths; all mutations go join/ensure/reconcile; make coordinator call edge functions and fail loudly; keep roleGrant contract tests in CI.

### Realtime event handling — **80**
- **Why:** Trip upserts per event with soft-delete awareness; Pro subscribes to the right event names.
- **Blocks 90+:** Pro full-state clone on each event; webhook ignores non-`message.new` for side effects (updated/deleted handled in set but limited fanout).
- **To 90+:** Pro upsert/delete like trip; expand webhook side effects only where product needs them.

### Reconnect / background / foreground resilience — **74**
- **Why:** Trip backfills on Stream reconnect + `visibilitychange`; connection status subscriptions exist.
- **Blocks 90+:** No Capacitor `AppState` handling in Stream layer; Pro has status subscription but **no** missed-message backfill; iOS background WS drops are the hard case.
- **To 90+:** Shared `useStreamChannelResilience({ channel, onBackfill })` used by trip+Pro; wire Capacitor App foreground.

### Performance / render efficiency — **82**
- **Why:** TanStack virtual list, overscan, sticky dates, message retention caps on trip, pagination.
- **Blocks 90+:** Mega TripChat re-renders; Pro replaces message array wholesale; nested replies (if fixed) will stress estimated heights.
- **To 90+:** Stabilize row measurement for quote/reply rows; memoize bubble props; Pro incremental updates.

### Maintainability / architecture hygiene — **58**
- **Why score is low:** God files; stale comments (`ThreadView`, “PRIMARY and ONLY” membership, “no reconciler yet”); wrong public audit stub; unused feature flags; ghost TEST_GAPS hooks; typo export `ChrravelChatMessage`.
- **Blocks 90+:** Documentation and code contracts disagree — agents will “fix” the wrong thing.
- **To 90+:** Delete/redirect bad docs; fix comments; wire or drop flags; split hooks; kill client sync.

### Tests / observability — **72**
- **Why:** Strong Vitest coverage on trip send/reconnect/reactions/pins/threads-filter, Pro hardening, payload/search/canary; canary auto-disable path.
- **Blocks 90+:** Authenticated Stream E2E often skipped; membership swallow has no prod signal; Pro reconnect untested; thread *display* untested because absent; silent empty Pro chat.
- **To 90+:** Staging E2E gate for CHAT-001..; membership failure metrics; Pro backfill tests; thread contract tests matching chosen model.

---

## 7. BELOW-90 COMPONENTS

### 1) Threaded messages (38) — CRITICAL
- **Root causes:** Product/UX migrated to “inline reply = scroll parent” while transport still creates Stream thread children; filter removes children; ThreadView deleted; comments not updated.
- **Files:** `useStreamTripChat.ts` (~866–878), `streamMessageViewModel.ts` (~317–322), `streamMessagePayload.ts`, `TripChat.tsx` (reply/open-thread), `MessageActions.tsx`, tests asserting filter-out.
- **Type:** Architectural + implementation + UX contract.
- **Smallest safe patch:** Quote-only replies (stop setting `parent_id` on trip send); render `quoted_reference`; delete ThreadView comments; update tests.
- **Ideal path:** Real Stream threads with `getReplies` side panel + pagination.
- **Risk / complexity:** Medium (quote-only) / High (real threads).

### 2) Permissions/membership (52) — CRITICAL
- **Root causes:** Client `addMembers` fights Stream grants; swallow hides failures; stale “PRIMARY and ONLY / no reconciler” comments despite ensure/reconcile/cron.
- **Files:** `streamMembershipSync.ts`, `streamMembershipCoordinator.ts`, callers in join/role flows, edge `stream-join-channel` / `stream-ensure-membership` / `stream-reconcile-membership`.
- **Type:** Architectural.
- **Smallest safe patch:** Make sync functions rethrow or return `Result`; coordinator only succeeds on real success; report failures to canary/Sentry.
- **Ideal path:** Remove client membership mutation entirely; server-only projection.
- **Risk / complexity:** Medium-High (touch join/leave/role paths).

### 3) Pro Trip channels (62) — HIGH
- **Root causes:** Incomplete port from trip hook; silent failures preferred over error UX.
- **Files:** `useStreamProChannel.ts`, `ChannelChatView.tsx`, adapters, Pro tests.
- **Type:** Implementation + reliability.
- **Smallest safe patch:** Return `error`; reconnect/visibility backfill; wire typing.
- **Ideal path:** Shared channel-runtime core for trip/Pro/broadcast.
- **Risk / complexity:** Medium.

### 4) Maintainability / hygiene (58) — HIGH
- **Root causes:** Stale docs, unused flags, god components, comment lies.
- **Files:** `docs/GETSTREAM_AUDIT_REPORT.md`, feature flag migration, `useStreamTripChat.ts`, `TripChat.tsx`, `TEST_GAPS.md` ghost refs, `messageMapper.ts` typo.
- **Type:** Scope/hygiene (causes wrong future work).
- **Smallest safe patch:** Supersede stub; delete or wire `stream-chat-*` flags; fix ThreadView comments.
- **Ideal path:** Split chat runtime modules under `src/features/chat/` + `src/services/stream/`.
- **Risk / complexity:** Low for docs/flags; High for split.

### 5) Webhook Pro trip resolution (affects mentions/notifications) — HIGH
- **Root causes:** `resolveTripIdFromChannel` ignores `chravel-channel` and ignores channel custom `trip_id`.
- **Files:** `supabase/functions/stream-webhook/eventRouting.ts`, webhook index notification path, factory (already sets `trip_id`).
- **Type:** Implementation bug with product impact.
- **Smallest safe patch:** Resolve via webhook channel custom fields / DB lookup by `chravel_channel_id`.
- **Ideal path:** Single resolver used by webhook + any notification fanout.
- **Risk / complexity:** Low-Medium.

### 6) Reconnect resilience (74)
- **Root causes:** Trip-only backfill; no AppState.
- **Files:** `useStreamTripChat.ts`, `useStreamProChannel.ts`, missing native AppState bridge.
- **Type:** Implementation / mobile reliability.
- **Smallest safe patch:** Copy trip backfill into Pro; add App foreground listener in Stream client hook.
- **Risk / complexity:** Medium.

### 7) Typing (72), channel modeling (78), trip chat (82), rendering (84), input (85), attachments (84), read (86), client auth (86), reactions (88), realtime (80), perf (82), tests (72)
- See §6 for exact 90+ change lists. None require a full rewrite.

### Explicitly healthy (do not “improve” into Stream)
- **AI Concierge integration approach (93)** — keep SSE + DB.

---

## 8. UNDERUSED STREAM FEATURES WORTH EVALUATING

| Feature | Fit | Where | Upside | Difficulty | When |
|---|---|---|---|---|---|
| **Quoted replies (native)** | High | Trip + Pro | Fixes broken thread UX without ThreadView cost | Low-Med | **Do now** |
| **Real threads** | Medium | Trip chat debate / long planning threads | Structured side conversations | High (UI+state) | **Later** (only if quote-only insufficient) |
| **Mentions on Pro channels** | High | Ops channels | @role/@person coordination | Med (members list + webhook trip_id) | **Do now** |
| **Better read/unread** | Medium | Multi-channel Pro + trip badges | Trustworthy badges | Med | **Do now** (polish existing) |
| **Stronger typing on Pro** | Medium | ChannelChatView | Ops awareness | Low | **Do now** |
| **Pinned messages on Pro** | Medium | Leadership channels | Sticky ops info | Med | **Later** |
| **Richer role permissions** | High | Pro RBAC already in Supabase | Align Stream grants with roles | Med-High | **Do now** (server projection) |
| **Better channel types** | Low | Already 3 types | Extra types add ops cost | — | **Skip** unless new product surface |
| **Message search (expand)** | Medium | Trip search exists | Pro/global search | Med | **Later** for Pro |
| **Moderation tools** | High | Pro/events | Safety | Med | **Do now** (finish trip binding + ban all channel types) |
| **Link enrichment** | Low-Med | Bubbles already custom link cards | Less custom preview code | Med | **Later** |
| **Presence** | Low | Not core coordination UX | Novelty | Med | **Skip** |
| **System messages** | Medium | Already custom system bubbles | Native consistency | Med | **Later** |
| **Push hooks** | Medium | webhook → notifications | Reliability | Med | **Do now** for Pro trip_id fix |
| **stream-chat-react UI kit** | Low | Would fight design system | Speed vs brand control | High rewrite | **Skip** |
| **Concierge Stream channels** | None | Boundary forbids | Complexity, dual SoT | High | **Skip** |

---

## 9. TECHNICAL DEBT / DEAD CODE / WRAPPER COMPLEXITY

### Dead / ghost / stale
- **No** `ThreadView.tsx`, **no** `useStreamBroadcasts.ts`, **no** `useStreamConciergeHistory.ts` — yet comments/docs/TEST_GAPS still reference them.
- `docs/GETSTREAM_AUDIT_REPORT.md` claims 92/100 and deleted architecture — **poison for agents**.
- Seeded flags `stream-chat-trip|channels|broadcasts|concierge` unused; Concierge flag description contradicts boundary decision.
- `streamMembershipSync` header claims no reconciler — reconciler + cron exist.

### Duplicated chat state
- Trip failed-message list + heuristic reconcile.
- Composer local message before Stream ack.
- Pro pending reaction overlay (contained — OK).
- Pro local demo `messages` vs Stream `transportMessages`.
- Pinned history merge with live window (mostly safe).

### Custom wrappers that add fragility
- Client membership sync (harmful).
- Thread filter without viewer (harmful).
- Pro silent `catch {}` (harmful).
- Custom UI over Stream state (fine) — keep; don’t add custom SoT.

### Partial migrations
- Broadcasts still hybrid Stream + DB dual-write.
- Legacy mutation branches remain in `MessageActions` / `legacyMessageMutations`.
- Offline service still knows `chat_message` entity type but defers when Stream active.

### Concierge ↔ Stream entanglement
- **Not dangerously entangled** for interactive chat.
- Only promoted-broadcast bridge — acceptable if kept narrow and tested.
- Risk is **future agents** following the bad Apr audit into Concierge-on-Stream. Guard with boundary tests.

### Custom UI fine / custom state harmful
- Fine: bubbles, virtualization, mention picker, ShareAsset upload, view-models.
- Harmful: membership projection on client; filtering Stream thread children while offering Reply; inventing second unread/reaction SoT.

### Recent fragility note
- Recent hardening (moderation scope, Pro read flush, channel-scoped attachments, broadcast split-brain, canary trust) **improved** trip/Pro edges.
- Fragility increase is mainly from **accumulating dual paths** (client sync + server ensure) without deleting the old one, and from **thread UX removal without transport cleanup**.

---

## 10. TOP 5 HIGHEST-ROI IMPROVEMENTS

| Rank | Improvement | Why |
|---:|---|---|
| 1 | **Resolve thread contract (quote-only XOR real threads)** | Stops silent message loss; unblocks honest UX; low-medium effort for quote-only |
| 2 | **Server-only membership projection; delete client addMembers swallow** | Fixes intermittent empty/unauthorized chat; architectural leverage across trip/Pro/broadcast |
| 3 | **Pro hook parity: errors + reconnect/visibility backfill + typing** | Pro is ops-critical; gap vs trip is unjustified |
| 4 | **Webhook `chravel-channel` trip_id resolution** | Unblocks Pro mention notifications; small edge change; uses existing channel custom data |
| 5 | **Wire or delete `stream-chat-*` flags; kill stale audit/docs/comments** | Stops wrong kill-switch ops and agent mis-navigation; cheap |

---

## 11. TESTS THAT SHOULD EXIST BUT DON’T

| Area | Missing test |
|---|---|
| Threads | Contract test: either replies visible via getReplies **or** send path never sets `parent_id`. Current tests lock in “filter out” without a viewer. |
| Reactions | Shared controller trip+Pro; Stream policy denial UX on Pro |
| Reconnect | Pro missed-message backfill after `connection.changed` / visibility; Capacitor App foreground |
| Channel permissions | Client membership failure must surface / retry via edge (today swallow makes “green” coordinator tests misleading) |
| Pro segmentation | Role grant → Stream member projection e2e; revoke removes Stream access |
| Message rendering | Stream child reply visibility once contract chosen; quote fallback when parent not in window |
| Concierge boundary | Fail if factory/API introduces `chravel-concierge`; assert AIConciergeChat never calls `useStreamTripChat` |
| Webhook | `chravel-channel` message.new resolves non-null trip_id for mentions |
| Moderation | Ban/hide across broadcast + pro channel CIDs |
| E2E | Authenticated CHAT-001.. Stream delivery must run in staging CI (currently skip-prone) |
| Flags | Runtime `useFeatureFlag('stream-chat-trip')` **or** migration deleting unused keys |

---

## 12. PRIORITIZED ROADMAP

### Quick wins
1. Fix `resolveTripIdFromChannel` / webhook for Pro `trip_id` (custom data or DB lookup).
2. Replace ThreadView/getReplies comments; implement quote-only send (or flag real threads).
3. Supersede `docs/GETSTREAM_AUDIT_REPORT.md`; clean TEST_GAPS ghost hooks.
4. Wire Pro typing via existing `useChatTypingIndicators`.
5. Surface Pro watch/send errors to UI (banner), stop empty-state lie.
6. Make `streamMembershipSync` return/throw real errors (stop swallow).

### Medium-lift improvements
1. Remove client `addMembers` from join/leave/role paths; route through ensure/join only.
2. Port trip reconnect/visibility backfill into Pro; shared resilience hook.
3. Pro mentions with channel member list + webhook verification.
4. Expand moderation ban/hide to all channel types for a trip.
5. Wire DB feature flags to transport guards **or** delete unused seeds + update ops docs.
6. Split `useStreamTripChat` into focused modules without behavior change.

### Major architectural upgrades
1. Shared Stream channel runtime (watch, events, backfill, reactions, read) for trip/Pro/broadcast.
2. Real Stream threads UI **only if** quote-only is product-insufficient.
3. Broadcast pure-Stream read path (eliminate remaining dual-write once notifications proven).
4. Native AppState/foreground orchestration for Capacitor chat reliability.
5. Staging E2E release gate for authenticated Stream messaging.

---

## 13. FILES / HOOKS / PROVIDERS / COMPONENTS AUDITED

### Client services
- `src/services/stream/streamClient.ts`
- `src/services/stream/streamTokenService.ts`
- `src/services/stream/streamTransportGuards.ts`
- `src/services/stream/streamChannelFactory.ts`
- `src/services/stream/streamMembershipSync.ts`
- `src/services/stream/streamMembershipCoordinator.ts`
- `src/services/stream/roleGrantMembershipContract.ts`
- `src/services/stream/streamCanary.ts`
- `src/services/stream/streamMessagePayload.ts`
- `src/services/stream/streamMessageSearch.ts`
- `src/services/stream/tripMessageTransport.ts`
- `src/services/stream/canonicalTripMessageTransport.ts`
- `src/services/stream/noopRealtimeChannel.ts`
- `src/services/stream/adapters/mappers/messageMapper.ts`
- `src/services/stream/adapters/mappers/proChannelMessageAdapter.ts`
- `src/services/offlineSyncService.ts` (Stream deferral paths)

### Hooks
- `src/hooks/stream/useStreamClient.ts`
- `src/hooks/stream/useStreamTripChat.ts`
- `src/hooks/stream/useStreamProChannel.ts`
- `src/hooks/stream/streamChatUtils.ts`
- `src/hooks/stream/messageEventModel.ts`
- `src/features/chat/hooks/useTripChat.ts`
- `src/features/chat/hooks/useChatReadReceipts.ts`
- `src/features/chat/hooks/useChatTypingIndicators.ts`
- `src/features/chat/hooks/useChatReactions.ts`
- `src/features/chat/hooks/useChatComposer.ts`
- `src/features/chat/hooks/useChannelUnreadCounts.ts`
- `src/features/chat/hooks/useBroadcastHistory.ts`
- `src/hooks/useUnreadCounts.ts`
- `src/hooks/useShareAsset.ts` (attachment transport)
- Concierge: `useConciergeStreaming`, `useConciergeMessages`, `useConciergeHistory`

### UI
- `src/features/chat/components/TripChat.tsx`
- `src/features/chat/components/ChatInput.tsx`
- `src/features/chat/components/AiChatInput.tsx`
- `src/features/chat/components/MessageBubble.tsx`
- `src/features/chat/components/MessageItem.tsx`
- `src/features/chat/components/MessageActions.tsx`
- `src/features/chat/components/MessageReactionBar.tsx`
- `src/features/chat/components/TypingIndicator.tsx`
- `src/features/chat/components/ReadReceipts.tsx`
- `src/features/chat/components/VirtualizedMessageContainer.tsx`
- `src/features/chat/components/ChatSearchOverlay.tsx`
- `src/features/chat/adapters/streamMessageViewModel.ts`
- `src/components/pro/channels/ChannelChatView.tsx`
- `src/components/AIConciergeChat.tsx`

### Edge functions
- `stream-token`
- `stream-join-channel`
- `stream-ensure-membership`
- `stream-reconcile-membership`
- `stream-moderation-action`
- `stream-webhook` (+ `eventRouting`, `mentionNotifications`, `broadcastFanout`)
- `stream-setup-permissions`
- `stream-canary-guard`

### Scripts / config / docs
- `scripts/migrate-chat-to-stream.ts`
- `scripts/backfill-stream-membership.ts`
- `scripts/check-stream-config-parity.cjs`
- `supabase/migrations/20260410050000_seed_stream_chat_feature_flags.sql`
- `supabase/migrations/20260710171000_schedule_stream_membership_reconciler.sql`
- `docs/CONCIERGE_TRANSPORT_BOUNDARY.md`
- `docs/GETSTREAM_AUDIT_REPORT.md` (superseded)
- `docs/audits/chat-stream-*.md`, `stream-migration-forensic-plan-2026-03-30.md`
- `TEST_GAPS.md`, `DEBUG_PATTERNS.md`, `LESSONS.md` (Stream-related entries)

### Prior finding re-verification (this run)

| Finding | Status |
|---|---|
| A. Client `addMembers` + swallow | **CONFIRMED** |
| B. ThreadView absent; comments claim getReplies | **CONFIRMED** |
| C. `stream-chat-*` flags unused; env kill switch | **CONFIRMED** |
| D. Pro lacks trip backfill/error parity | **PARTIALLY IMPROVED** (self-heal only) |
| E. Moderation unbound to trip channels | **FIXED/CHANGED** (trip-scoped; ban still trip-channel-only) |
| F. Webhook null trip_id for `chravel-channel` | **CONFIRMED** |

---

## Appendix A — Scorecard snapshot

| Component | Score | 90+? |
|---|---:|---|
| Stream client init/auth | 86 | No |
| Channel modeling | 78 | No |
| Standard trip chat | 82 | No |
| Pro Trip channels | 62 | No |
| AI Concierge integration | **93** | **Yes — healthy** |
| Message rendering | 84 | No |
| Message input | 85 | No |
| Threaded messages | 38 | No |
| Reactions | 88 | No |
| Read/unread | 86 | No |
| Typing indicators | 72 | No |
| Attachments/media | 84 | No |
| Permissions/membership | 52 | No |
| Realtime events | 80 | No |
| Reconnect/foreground | 74 | No |
| Performance | 82 | No |
| Maintainability | 58 | No |
| Tests/observability | 72 | No |
| **OVERALL** | **68** | No |

---

*End of audit. Code evidence only. Next automation run should re-inventory files first and re-check the six findings in Appendix verification table before rescoring.*
