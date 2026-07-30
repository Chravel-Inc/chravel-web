# Chravel GetStream Architecture & Quality Audit

**Date:** 2026-07-27  
**Branch inspected:** `cursor/chravel-getstream-audit-4f75` @ `3c09a88b7` (aligned with `main`)  
**Scope:** Code-evidence audit only — no production refactors in this pass  
**SDK:** `stream-chat` ^9.47.1 (JS client only; **no** `stream-chat-react`)  
**Supersedes:** `docs/GETSTREAM_AUDIT_REPORT.md` (claimed 92/100 — **incorrect**; references deleted `ThreadView.tsx` and non-existent Concierge Stream history)

---

## 1. OVERALL GETSTREAM HEALTH SCORE (0-100)

**66 / 100**

Consumer trip messaging is production-usable and Stream-native for core send/receive/reactions/reconnect. The subsystem is **not** production-strong end-to-end: Pro channel transport is a thin, lossy fork of trip chat; threads are architecturally incoherent (parent_id used while ThreadView was deleted); client-side membership sync fights Stream permissions and swallows failures; seeded Stream feature flags are dead; and maintainability is dragged down by dual mappers, stale comments, and a 1.2k–1.5k LOC god-hook/UI pair.

This is **workable but structurally shaky** — not the “92 / production-ready & cleanly integrated” picture painted by the prior internal report.

---

## 2. EXECUTIVE SUMMARY

### Strongest areas
- **Trip chat transport spine** (`useStreamTripChat`): `channel.watch()`, native `sendMessage` / reactions / pin via `partialUpdateMessage`, reconnect + visibility backfill, membership self-heal via edge functions, soft-delete filtering, retention caps.
- **Channel taxonomy** (`streamChannelFactory`): clear `chravel-trip` / `chravel-channel` / `chravel-broadcast` ID conventions.
- **Auth tokening** (`stream-token` + token provider): identity tokens server-minted; secrets stay server-side; 20h cache / 24h token.
- **Concierge boundary (runtime):** Concierge is correctly **off Stream** (SSE + `ai_queries`) per `docs/CONCIERGE_TRANSPORT_BOUNDARY.md`.
- **Pro unread rail** (`useChannelUnreadCounts`): thoughtful `queryChannels` + notification ledger without double-`watch()`.
- **Unit test density** around trip-chat send/reconnect/reactions/pin/threads-filter.

### Weakest areas
- **Threaded replies:** comments claim `ThreadView` + `getReplies`; **no `ThreadView` file exists**; main state + view-model **drop** `parent_id` messages; UI invents inline “threads” from `replyTo` that Stream thread replies never reach.
- **Pro Trip channels:** `useStreamProChannel` (~218 LOC) is a degraded clone — silent empty on error, no reconnect backfill, no `reaction.updated`, raw `channel.state.messages` snapshots.
- **Membership projection:** `streamMembershipSync` still calls client `addMembers`/`removeMembers` and **swallows** errors; contradicts server comment that users lack `AddOwnChannelMembership`.
- **Architecture hygiene:** TripChat ~1514 LOC; stale mapper claims in hook header; dead DB flags `stream-chat-*`; legacy typing/read fallbacks still wired.
- **Misleading prior audit** inflated confidence and documented deleted components as healthy.

### Biggest architecture risks
1. **Supabase ↔ Stream membership drift** with a broken primary sync path + overlapping heal functions (`stream-join-channel` vs `stream-ensure-membership`) + possibly dormant cron reconciler.
2. **Pro scale gap:** catalog/roles in Supabase, messages in Stream, thinner reliability — OK for small teams, fragile for large touring/sports orgs.
3. **Thread contract split-brain:** sending `parent_id` without a consumer path = silent message loss for “thread replies.”
4. **Moderation IDOR-class gap:** `stream-moderation-action` authorizes trip moderator then applies Stream APIs to arbitrary `messageId`/`targetUserId` without channel/trip binding proof.
5. **Kill-switch mismatch:** repo policy wants `feature_flags` table; Stream actually gated by `VITE_STREAM_CHAT_DISABLED` (redeploy) while seeded `stream-chat-*` keys are **unreferenced**.

### Top conclusions
1. Chravel uses Stream **correctly as message SoT** for trip/pro/broadcast — not as a Postgres mirror. Custom UI is intentional and fine; **custom duplicated state and failed membership mutation are not**.
2. Do **not** put Concierge on Stream realtime; clean up stale Concierge Stream flags/setup docs instead.
3. Highest ROI is **membership truthfulness**, **Pro hook parity**, and **thread contract decision** (real Stream threads XOR quoted/inline replies — not both half-built).
4. Prior 92/100 report should be treated as **non-authoritative**.

---

## 3. FEATURE INVENTORY

| Feature / surface | Primary locations |
|---|---|
| Stream client singleton | `src/services/stream/streamClient.ts`, `useStreamClient.ts`, `AppInitializer.tsx` |
| Token mint | `streamTokenService.ts`, `supabase/functions/stream-token/` |
| Channel factory / IDs | `streamChannelFactory.ts` |
| Trip chat hook | `useStreamTripChat.ts` ← `useTripChat.ts` |
| Pro channel hook | `useStreamProChannel.ts`, `ChannelChatView.tsx` |
| Payload builder | `streamMessagePayload.ts`, `tripMessageTransport.ts` |
| Search / pinned / broadcast history | `streamMessageSearch.ts`, `useBroadcastHistory.ts`, `ChatSearchOverlay` |
| View-model adapter | `streamMessageViewModel.ts`, `messageMapper.ts` (legacy-shaped), `proChannelMessageAdapter.ts` |
| Membership sync (client) | `streamMembershipSync.ts`, `streamMembershipCoordinator.ts` |
| Membership heal (edge) | `stream-join-channel`, `stream-ensure-membership`, `stream-reconcile-membership` |
| Permissions setup | `stream-setup-permissions/` (includes unused `chravel-concierge` grants) |
| Webhook / mentions notify | `stream-webhook/` (+ `mentionNotifications.ts`, `eventRouting.ts`) |
| Moderation | `stream-moderation-action/` |
| Canary | `streamCanary.ts`, `stream-canary-guard/` |
| Transport guards / offline | `streamTransportGuards.ts`, `offlineSyncService.ts`, `canonicalTripMessageTransport.ts` |
| Trip UI | `TripChat.tsx`, `ChatInput`, `MessageBubble`, `MessageActions`, `VirtualizedMessageContainer`, `MessageReactionBar`, `MentionPicker`, `InlineReplyComponent` |
| Read / typing / reactions hooks | `useChatReadReceipts`, `useChatTypingIndicators`, `useChatReactions`, `readStateSelectors`, `useUnreadCounts`, `useChannelUnreadCounts` |
| Concierge (NOT Stream) | `AIConciergeChat.tsx`, `useConciergeStreaming`, `conciergeGateway`, `useConciergeHistory` / `ai_queries` |
| Feature flags (seeded, unused) | migration `20260410050000_seed_stream_chat_feature_flags.sql` |
| Scripts | `migrate-chat-to-stream.ts`, `backfill-stream-membership.ts`, `check-stream-config-parity.cjs` |
| E2E / QA | `e2e/chat.spec.ts`, `qa/journeys/chat-production-readiness.json` |

---

## 4. STREAM ARCHITECTURE TRACE

### How the Stream client is initialized
1. `AppInitializer` mounts `useStreamClient`.
2. On Supabase auth user, `connectStreamClient()` lazy-imports `stream-chat`, resolves API key from `VITE_STREAM_API_KEY` or token response, then `StreamChat.getInstance(key).connectUser({ id }, tokenProvider)`.
3. Connection status fans out via `onStreamClientConnected` / `onStreamClientConnectionStatusChange`.
4. Sign-out disconnects and clears token cache.
5. Failures after retries are **swallowed** (returns existing/`null` client) so the SPA boots without chat rather than crashing.

### Auth / tokening
- Edge `stream-token` validates Supabase JWT, upserts Stream user, returns ~24h token.
- Token is **identity-only** (not trip-scoped) — correct Stream model.
- Frontend caches ~20h. Refresh goes through tokenProvider on reconnect/expiry.

### Channels mapped to trips / Pro Trips
| Chravel concept | Stream type | Channel id |
|---|---|---|
| Standard trip chat | `chravel-trip` | `trip-{tripId}` |
| Pro role/private channel | `chravel-channel` | `channel-{supabaseChannelId}` |
| Broadcasts | `chravel-broadcast` | `broadcast-{tripId}` |
| Concierge | *(unsupported at runtime)* | stale `chravel-concierge` only in setup/flags |

- Pro **catalog** (list, roles, access) = Supabase `trip_channels` / `channel_members` / role grants.
- Pro **messages** = Stream only (`useStreamProChannel`).
- Role create → auto channel (DB trigger) → Stream membership projection (edge) — see `docs/PRO_TRIPS_ARCHITECTURE.md`.

### Message state → UI
1. Hook watches channel → holds `MessageResponse[]` in React state.
2. Trip path: event handlers upsert/cap/sort; maps through `buildStreamMessageViewModels` / TripChat formatting.
3. Pro path: often replaces entire list from `channel.state.messages`.
4. Custom UI (`MessageBubble` et al.) — **not** Stream React components. Fine for design system; costly for dual adapters.

### Reactions / threads / read
- **Reactions:** native `sendReaction` / `deleteReaction`; trip hook listens `reaction.new|updated|deleted`. Pro misses `reaction.updated` and keeps local optimistic overlay.
- **Threads:** `parent_id` set on send; realtime **filters out** thread replies; view-model **filters out** `parent_id`; **no `getReplies` / ThreadView**. UI “threads” are custom grouping on `replyTo` that never sees Stream thread children. **Broken contract.**
- **Read:** `channel.markRead()` from `useChatReadReceipts` + ChannelChatView flush-on-switch; projections via `channel.state.read` / selectors. Legacy `markMessagesAsRead` still exists as fallback.

### AI Concierge intersection
- **Transport:** SSE to `lovable-concierge` (`useConciergeStreaming` / `conciergeGateway`).
- **History:** Supabase `ai_queries`.
- **TTS “stream”:** audio SSE (`streamConciergeTts.ts`) — naming collision only.
- **UI borrow:** `ChatMessages` / `MessageRenderer` / `AiChatInput` from features/chat — visual coupling, not Stream transport coupling.
- Stale: DB flag `stream-chat-concierge`, setup grants for `chravel-concierge`, old audit claims of Stream Concierge history, TEST_GAPS refs to deleted hooks.

### Custom wrappers / state layers
- Intentional custom UI wrapping native SDK state (good).
- Harmful: client membership mutation wrapper; dual message mappers; Pro optimistic reaction overlay; failed-message local overlay in TripChat; legacy typing service still constructible; unused feature_flags vs env kill switch.

---

## 5. FEATURE MATRIX

| Feature | Status | Where | Native vs custom | Quality | Action |
|---|---|---|---|---|---|
| Basic messaging | Enabled | TripChat, Pro ChannelChatView | Native `sendMessage` + custom UI | Strong trip / weak Pro | **Keep** / harden Pro |
| Channel modeling | Enabled | streamChannelFactory + edge duplicates | Native channel types + custom IDs | Good taxonomy, duplicated constants | **Improve** — single shared contract |
| Multiple channels / trip | Enabled (Pro) | trip_channels → chravel-channel | Hybrid Supabase catalog + Stream msgs | Scalable catalog; thin transport | **Improve** Pro hook |
| Pro Trip segmentation | Enabled | roles → channels | Custom role model + Stream projection | Product-fit; membership drift risk | **Improve** projection reliability |
| Threaded replies | Partially enabled / **broken** | parent_id send; no ThreadView | Native field + abandoned UI | Critical gap | **Decide**: full Stream threads **or** quoted-only |
| Reactions | Enabled | trip + Pro | Native (+ Pro optimistic custom) | Decent | **Improve** — share one path |
| Read / unread | Partially enabled | markRead, useUnreadCounts, useChannelUnreadCounts | Native + custom projection + legacy fallback | Trip OK; render staleness risk | **Improve** |
| Typing indicators | Enabled (Stream path) | useChatTypingIndicators | Native keystroke + legacy Supabase service | OK with legacy residue | **Improve** — delete legacy when Stream-only |
| Message edit / delete | Enabled (trip) | useStreamTripChat / MessageActions | Native update/delete | Decent trip | **Improve** Pro parity |
| Message actions | Enabled | MessageActions (pin, thread, mod, copy…) | Custom UI → Stream/edge | Uneven | **Improve** |
| Attachments / media | Partially enabled | ChatInput + Supabase Storage → Stream attachments | Hybrid | Trip mosaic/voice OK; Pro upload→trip risk | **Improve** |
| Mentions | Enabled | MentionPicker, mentioned_users, webhook fanout | Native field + custom picker + edge notify | Good; CreateMention degrade path exists | **Keep** / polish |
| Quoted replies | Partially enabled | `quoted_reference` custom field | Custom (not Stream quoted_message) | Works if UI reads it | **Improve** — align with Stream quote model or document custom |
| Pinned messages | Enabled | partialUpdateMessage + getPinnedMessages history | Native pin + custom tab merge | Recently hardened | **Keep** |
| Permissions / membership | Partially enabled | Supabase SoT + edge + broken client sync | Hybrid | Highest systemic risk | **Improve** urgently |
| Realtime subscriptions | Enabled | channel.on message/reaction | Native | Trip solid; Pro crude | **Improve** Pro |
| Reconnect resilience | Partially enabled | trip backfill + visibility; Pro re-watch only | Native query + custom | Trip strong; Pro weak | **Improve** |
| Search | Enabled | streamMessageSearch / ChatSearchOverlay | Native channel.search + local | Decent | **Keep** |
| Moderation / admin | Partially enabled | stream-moderation-action + MessageActions | Native Stream APIs + custom gate | Authority gap on targets | **Improve** security |
| Concierge on Stream | Disabled (runtime) | boundary doc | N/A | Correctly separate; stale config | **Remove** stale flags/setup |
| Presence | Disabled / unused for chat | — | — | — | **Skip** for now |
| Offline queue | Enabled (defer to SDK) | offlineSyncService skips chat when Stream active | Native SDK queue | Good | **Keep** |
| Feature-flag kill switches | Unclear / **dead DB flags** | migration seeds; code uses env | Env only | Violates flag policy | **Add** real `useFeatureFlag` wiring or delete seeds |

---

## 6. COMPONENT HEALTH SCORES (0-100)

### Stream client init / auth — **78**
- **Why:** Token provider, singleton, retry, key mismatch detection are solid.
- **Not 90+:** Swallowed connect failures; `useStreamClient` under-reports live status; session error ignored in token fetch.
- **To 90+:** Propagate terminal connect failure to chat surfaces; subscribe status in `useStreamClient`; fail closed on session errors; user-keyed token cache.

### Channel modeling — **72**
- **Why:** Clear three-type taxonomy; factory used by main hooks.
- **Not 90+:** Constants duplicated in edge/webhook/sync; `chravel-concierge` still in setup; hardcodes in membershipSync.
- **To 90+:** Generated shared contract (or single JSON schema) consumed by FE + Deno; delete concierge channel type from setup.

### Standard trip chat — **78**
- **Why:** Mature hook: watch timeouts, join/ensure heal, backfill, reactions, pin, async send, telemetry/canary.
- **Not 90+:** 1277-line hook; stale “messageMapper” header; thread filter without consumer; TripChat god-component.
- **To 90+:** Split hook (watch / send / reactions / membership); fix thread contract; shrink TripChat orchestration.

### Pro Trip channels — **58**
- **Why:** Watch + send + basic events + membership heal exist; unread rail is thoughtful.
- **Not 90+:** Silent empty on failure; no backfill; no reaction.updated; no soft-delete/sort/cap parity; attachment composer likely trip-scoped; recent channel-switch markRead fragility (documented in ChannelChatView).
- **To 90+:** Extract shared `useStreamChannelCore` used by trip+Pro; surface errors; port backfill/retention/event reducer; channel-aware uploads.

### AI Concierge integration approach — **82**
- **Why:** Runtime boundary is correct and documented; no active Stream Concierge transport.
- **Not 90+:** Stale flags/docs/setup/`GETSTREAM_AUDIT_REPORT`; UI shared under `features/chat` implies Stream kinship; `Stream*` naming on SSE types.
- **To 90+:** Delete/disable `stream-chat-concierge` + setup path; fix docs/TEST_GAPS; split Concierge message chrome into `features/concierge`; rename SSE types.

### Message rendering pipeline — **66**
- **Why:** Virtualized list; view-model for attachments/pins/receipts; many UI tests.
- **Not 90+:** Dual/triple mapping paths (view-model, messageMapper, Pro adapter, TripChat inline format); thread fields computed then parents filtered out.
- **To 90+:** One Stream→UI adapter; delete or quarantine `messageMapper` if unused by live path; stop computing dead thread preview fields until threads exist.

### Message input pipeline — **62**
- **Why:** Mentions, attachments metadata, fire-and-forget send (avoids forever-spinner) are thoughtful.
- **Not 90+:** Composer/local draft complexity; Pro attachment path tied to `useShareAsset(tripId)`; parse-twice smells.
- **To 90+:** Channel-scoped share transport; single parse path; explicit quoted vs thread reply modes in UI.

### Threaded messages — **35**
- **Why:** parent_id plumbing + filter tests exist — but **consumer UI deleted**.
- **Not 90+:** ThreadView gone (`TripChat.renderPath.test.tsx`: “ThreadView removed”); getReplies never called; replies dropped from state → **silent loss**.
- **To 90+ (pick one):**  
  **A)** Restore Stream Thread drawer: `getReplies`, subscribe, pagination, deep links.  
  **B)** Stop setting `parent_id`; use `quoted_reference` / Stream quoted_message only; strip thread filters/metadata.  
  Do not leave the hybrid.

### Reactions — **74**
- **Why:** Trip uses native reactions + event sync; unit tests cover toggle.
- **Not 90+:** Pro optimistic overlay + missing `reaction.updated`; `useChatReactions` still holds unused local map shape.
- **To 90+:** One shared reaction controller; Pro listens full reaction event set; drop dead local reaction state.

### Read / unread state — **60**
- **Why:** markRead on trip + Pro; channel unread ledger avoids double watch; cross-device notification.mark_read handled in unread hook.
- **Not 90+:** Read projection may not re-render on `message.read`; legacy receipts fallback; ChannelChatView switch flush was recently fragile.
- **To 90+:** Subscribe to read events to bump React state; remove legacy path when Stream-only; integration test channel switch flush.

### Typing indicators — **70**
- **Why:** Stream `typing.start/stop` + keystroke path when channel present.
- **Not 90+:** Legacy TypingIndicatorService still constructed in non-Stream mode; no expiry timeout if stop lost; connection.changed clears but stale users possible.
- **To 90+:** Client-side typing TTL; delete legacy service once env kill switch is rare; tests for stop-loss.

### Attachments / media — **63**
- **Why:** Stream attachments array + mosaic/voice metadata mapping; storage via Supabase.
- **Not 90+:** Pro composer uses trip share path; enrichment/link previews custom and gated.
- **To 90+:** Pro channel upload→`chravel-channel` send; contract tests for multi-attachment round-trip on both surfaces.

### Permissions / membership — **58**
- **Why:** Server ensure/join/reconcile + permission setup are directionally right; Supabase SoT is correct.
- **Not 90+:** Client sync fights grants and swallows errors; coordinator retries “successful” no-ops; ensure vs join inconsistency (`create()` missing on ensure); reconciler cron may 401 without GUC; moderation target unbound.
- **To 90+:** Delete client addMembers path; all mutations via edge; unify join/ensure; verify reconciler schedule; bind moderation targets to trip channels.

### Realtime event handling — **68**
- **Why:** Trip has proper per-event upserts including reaction.updated.
- **Not 90+:** Pro snapshot replace; thread replies discarded; webhook pro tripId null → mention notify without trip context.
- **To 90+:** Shared event reducer; fix webhook `chravel-channel` → trip_id resolution via channel custom data / DB lookup.

### Reconnect / background / foreground — **70**
- **Why:** Trip: connection status + visibility backfill with dedupe window; watch/connect timeouts.
- **Not 90+:** Pro only toggles ready/re-watches; backfill failure = canary report only; AppState (Capacitor) not clearly mirrored beyond visibilitychange.
- **To 90+:** Shared backfill helper for Pro; Capacitor app-state hook parity; retry/backoff on backfill failure.

### Performance / render efficiency — **55**
- **Why:** Virtualizer exists; TripChat memoized.
- **Not 90+:** Huge TripChat memo chains; per-message preview/reaction/read work; Pro full-list copies on every event; 250 retained messages still expensive on low-end mobile.
- **To 90+:** Split presentational containers; stabilize callbacks; Pro incremental upserts; profile list on 250-msg fixtures.

### Maintainability / architecture hygiene — **45**
- **Why:** Feature module exists; guards and canary show intent.
- **Not 90+:** God files; dead ThreadView docs; unused flags; dual membership systems; stale TEST_GAPS hooks (`useStreamBroadcasts`, `useStreamConciergeHistory` **do not exist**); prior audit wrong.
- **To 90+:** Delete/archive dead paths; one membership writer; doc truthfulness CI check for referenced files; shrink surfaces.

### Tests / observability — **72**
- **Why:** Strong unit coverage for trip hook behaviors; ChannelChatView hardening tests; webhook unit tests; telemetry events for reliability.
- **Not 90+:** Authenticated Stream E2E often skipped without service role; Pro reconnect/backfill untested; no thread end-to-end; membership sync “success after swallow” untested as failure; canary/search swallow opacity.
- **To 90+:** Staging E2E gate for CHAT-001+; Pro reconnect integration; membership edge contract tests; assert no silent empty on watch failure.

---

## 7. BELOW-90 COMPONENTS

| Component | Score | Root causes | Files | Issue type | Smallest safe patch | Ideal longer-term | Risk |
|---|---:|---|---|---|---|---|---|
| Client init/auth | 78 | Silent connect fail; stale hook status | `streamClient.ts`, `useStreamClient.ts`, `streamTokenService.ts` | Implementation | Surface `connectionError` to TripChat banner | Connection state machine + Sentry | Low |
| Channel modeling | 72 | Duplicated IDs; stale concierge type | `streamChannelFactory.ts`, edge fns, `eventRouting.ts` | Architectural | Import-shared constants into Deno via copy codegen | Single package `stream-contracts` | Med |
| Standard trip chat | 78 | Size + stale contracts | `useStreamTripChat.ts`, `TripChat.tsx` | Maintainability | Fix header comments; extract send/reaction modules | Hook split + thinner TripChat | Med |
| Pro Trip channels | 58 | Thin hook; silent errors; no backfill | `useStreamProChannel.ts`, `ChannelChatView.tsx` | Architectural + impl | Port backfill + error state from trip hook | Shared channel core | Med-High |
| Concierge approach | 82 | Stale Stream remnants | flags migration, setup.ts, old audit, TEST_GAPS | Scope / docs | Disable flag + doc fix | Remove setup type; split UI | Low |
| Message rendering | 66 | Multiple adapters | `streamMessageViewModel.ts`, `messageMapper.ts`, Pro adapter, TripChat | Architectural | Grep-delete dead mapper exports | One adapter module | Med |
| Message input | 62 | Pro upload mis-scope | `ChatInput.tsx`, `useShareAsset.ts`, ChannelChatView | Implementation | Pass channel send into ChatInput for Pro | Unified composer transports | Med |
| Threads | 35 | UI deleted; parent_id still written | useStreamTripChat, view-model, TripChat, InlineReply | Architectural | **Stop writing parent_id** OR restore getReplies UI | Full Stream threads product | High if wrong choice |
| Reactions | 74 | Pro divergence | ChannelChatView, useChatReactions, trip hook | Implementation | Listen reaction.updated; remove overlay if SDK optimistic enough | Shared hook | Low |
| Read/unread | 60 | Stale projections; legacy | useChatReadReceipts, selectors, readReceiptService | Implementation | Force state bump on message.read | Query-driven read model | Med |
| Typing | 70 | Legacy residue; TTL | useChatTypingIndicators, typingIndicatorService | Implementation | Add 6s TTL purge | Delete legacy service | Low |
| Attachments | 63 | Pro→trip send | useShareAsset, ChatInput | Implementation / UX | ChannelId-aware share | Media index per channel | Med |
| Permissions/membership | 58 | Client sync lies; dual heal | streamMembershipSync, coordinator, join/ensure/reconcile, moderation-action | Architectural + security | Make sync throw or call edge only; bind moderation targets | Server-only projection + cron proof | High |
| Realtime | 68 | Pro snapshots; webhook trip null | useStreamProChannel, stream-webhook | Implementation | Pro upsert reducer; resolve pro trip_id | Unified realtime layer | Med |
| Reconnect | 70 | Pro gap | useStreamProChannel vs trip backfill | Implementation | Reuse backfillMissedMessages | AppState-aware session | Med |
| Performance | 55 | Monoliths + full list copy | TripChat, MessageBubble, Pro hook | Performance | Incremental Pro updates; memo boundaries | Windowing strategy review | Med |
| Maintainability | 45 | Debt + false docs | many | Architectural | Delete dead refs; supersede bad audit | Module boundaries | — |
| Tests/observability | 72 | E2E skip; Pro gaps | e2e, TEST_GAPS | Scope | Unskip staging chat E2E in CI schedule | Continuous chat canary UX | Med |

---

## 8. UNDERUSED STREAM FEATURES WORTH EVALUATING

| Feature | Fits Chravel? | Where | Upside | Difficulty | When |
|---|---|---|---|---|---|
| **Real threads** | Yes for Pro/touring decision threads | Trip + Pro chat | Nested ops discussion without main-channel spam | High (rebuild UI) | **Later** — only after contract decision |
| Mentions | Already in use | Chat + webhook | Keep; enrich deep links | Low | **Keep / polish now** |
| Quoted replies | Yes | Composer | Clearer than fake threads | Low-Med | **Do now** if abandoning threads |
| Pinned | Already in use | Pinned tab | Keep | — | **Keep** |
| Richer role permissions | Partially via Supabase | Pro channels | Stream grants already set up; don’t duplicate role matrix in Stream | Med | **Later** — keep Supabase SoT |
| Better channel types | Maybe | Multi-org | Only if new product surfaces (DM, vendor) | High | **Skip** until product asks |
| Message search | In use | ChatSearchOverlay | Already Stream search | — | **Keep** |
| Moderation tools | Yes for Events/Pro | MessageActions | Safety | Med + **fix authz bug first** | **Do now** (security) then expand |
| Link enrichment | Nice-to-have | bubbles | Preview quality | Med | **Later** (custom previews exist) |
| Better read/unread | Yes | All chat | Trust (“seen”) | Med | **Do now** |
| Presence | Weak fit | — | Online dots low value for async trip chat | Med | **Skip** |
| Stronger typing | Mild | Composer | Polish | Low | **Later** |
| System messages | Partial custom | payment/activity | Prefer explicit Chravel system type (already) | Low | **Keep custom** |
| Push hooks | Via webhook→notifications | stream-webhook | Reliability of mention/push | Med | **Improve now** (pro trip_id) |
| `stream-chat-react` | Poor fit | — | Would fight design system | High | **Skip** |
| Concierge on Stream | **No** | — | Duplicate transport / tool side-effects | Very high | **Skip** |

---

## 9. TECHNICAL DEBT / DEAD CODE / WRAPPER COMPLEXITY

### Dead / phantom
- `ThreadView.tsx` — referenced in comments/docs/FEATURE_STATUS_MATRIX; **file absent**.
- `useStreamBroadcasts.ts`, `useStreamConciergeHistory.ts` — listed in TEST_GAPS; **absent**.
- DB flags `stream-chat-trip|channels|broadcasts|concierge` — **no code references**.
- `docs/GETSTREAM_AUDIT_REPORT.md` — factually wrong (92/100, ThreadView, Concierge Stream history).

### Duplicated / drifting state
- React `messages[]` mirrors `channel.state.messages` (necessary with custom UI) — trip upserts carefully; Pro replaces wholesale.
- Pro reaction optimistic overlay vs Stream `own_reactions`.
- TripChat local `failedMessages` overlay.
- Read: Stream `state.read` + optional legacy `message_read_receipts`.
- Typing: Stream events + legacy presence service.

### Fragile wrappers
- `streamMembershipSync` — **harmful custom state/mutation** pretending to sync.
- `streamMembershipCoordinator` retries non-throwing sync → false confidence.
- Dual edge heal: join (creates channels) vs ensure (no create).

### Partial migrations
- Legacy chat mutations fail-closed when Stream configured — good — but services/types remain.
- `messageMapper.ts` + `ChrravelChatMessage` typo still present beside newer view-model.
- Hook header still claims mapper transformation; returns native `MessageResponse[]`.

### Concierge entanglement
- **Not dangerously entangled on transport.**
- **Document/config entanglement** is real (flags, setup, bad audit).
- **UI entanglement** is moderate (shared ChatMessages richness).

### Custom UI vs custom state
- Custom UI: **keep**.
- Custom membership mutation, dual reaction stores, fake threads without getReplies: **harmful**.

### Recent fragility
- Pro Slack-style rail + channel switching required careful markRead-by-identity fixes (DEBUG_PATTERNS / ChannelChatView comments) — sign that Pro UX outpaced Pro transport reliability.

---

## 10. TOP 5 HIGHEST-ROI IMPROVEMENTS

1. **Make membership projection truthful (server-only)**  
   User impact: fixes “can’t open chat / empty channel” after join/role assign.  
   Effort: medium. Leverage: foundational. Launch: high.

2. **Fix thread contract (quoted-only XOR real threads)**  
   User impact: stops silent reply loss.  
   Effort: medium (quoted) or high (full threads). Leverage: unblocks Pro ops chat. Launch: high.

3. **Bring `useStreamProChannel` to trip-hook reliability parity**  
   User impact: Pro/touring teams.  
   Effort: medium (extract shared core). Leverage: scales Pro. Launch: high for Pro GTM.

4. **Close `stream-moderation-action` target binding + webhook pro `trip_id`**  
   User impact: safety + mention notify correctness.  
   Effort: low-medium. Leverage: security. Launch: high.

5. **Wire real kill switches / delete dead flags; supersede false audits**  
   User impact: operable rollback without redeploy.  
   Effort: low. Leverage: ops. Launch: medium-high.

---

## 11. TESTS THAT SHOULD EXIST BUT DON’T

| Area | Missing tests |
|---|---|
| Reactions | Pro `reaction.updated` reconciliation; cross-device own_reactions sync |
| Threads | End-to-end: send parent_id → visible in UI (today would fail); OR assert parent_id never sent if quoted-only |
| Reconnect | Pro channel missed-message backfill after socket drop; Capacitor background resume |
| Channel permissions | Client addMembers **must fail** and edge path succeeds; ensure creates missing channel |
| Pro segmentation | Role grant → Stream member → watch succeeds; revoke → stopWatching + unread eviction |
| Message rendering | Single adapter golden fixtures shared by Trip + Pro (attachments mosaic, pin, soft-delete) |
| Concierge boundary | Assert no factory/hook routes `chravel-concierge`; flag unused |
| Membership coordinator | Swallow-vs-throw contract; retry only on real failure |
| Moderation | Reject messageId not in trip’s channels |
| Webhook | `chravel-channel` mention inserts with non-null trip_id |
| E2E | Authenticated CHAT-001/002/003 in scheduled CI (currently skip without service role) |
| Feature flags | `stream-chat-*` either gated in code or absent from DB |

---

## 12. PRIORITIZED ROADMAP

### Quick wins
- Supersede/delete incorrect `GETSTREAM_AUDIT_REPORT.md` claims (this doc).
- Remove or disable `stream-chat-concierge`; fix TEST_GAPS phantom hooks.
- Fix useStreamTripChat header comment (no ThreadView / mapper lie).
- Add typing TTL; listen `reaction.updated` on Pro.
- Resolve pro trip_id in webhook routing.
- Bind moderation targets to trip/channel.
- Make `streamMembershipSync` call edge functions (or throw) — stop swallow-success.

### Medium-lift
- Shared `useStreamChannelCore` (watch, events, backfill, retention, errors).
- Channel-aware media send for Pro.
- Read-state React subscription for live “seen”.
- Unify join/ensure (always create-if-missing).
- Prove reconciler cron credentials + alerting.
- Wire `useFeatureFlag('stream-chat-trip')` (and siblings) **or** delete seeds; prefer table flags per CLAUDE.md.
- Split TripChat container vs list vs composer.

### Major architectural upgrades
- Full Stream threads product **or** permanent quoted-reply model (migrate historical parent_id).
- Generated cross-runtime stream contracts package.
- Optional: multi-party DM / vendor channels (only with product demand).
- Do **not**: move Concierge onto Stream; do **not**: adopt `stream-chat-react` wholesale.

---

## 13. FILES / HOOKS / PROVIDERS / COMPONENTS AUDITED

### Frontend services
- `src/services/stream/streamClient.ts`
- `src/services/stream/streamTokenService.ts`
- `src/services/stream/streamChannelFactory.ts`
- `src/services/stream/streamMembershipSync.ts`
- `src/services/stream/streamMembershipCoordinator.ts`
- `src/services/stream/streamCanary.ts`
- `src/services/stream/streamTransportGuards.ts`
- `src/services/stream/streamMessagePayload.ts`
- `src/services/stream/streamMessageSearch.ts`
- `src/services/stream/tripMessageTransport.ts`
- `src/services/stream/canonicalTripMessageTransport.ts`
- `src/services/stream/adapters/mappers/messageMapper.ts`
- `src/services/stream/adapters/mappers/proChannelMessageAdapter.ts`
- `src/services/offlineSyncService.ts`
- `src/services/chatService.ts`
- `src/services/typingIndicatorService.ts`

### Hooks
- `src/hooks/stream/useStreamClient.ts`
- `src/hooks/stream/useStreamTripChat.ts`
- `src/hooks/stream/useStreamProChannel.ts`
- `src/hooks/stream/streamChatUtils.ts`
- `src/hooks/stream/messageEventModel.ts`
- `src/features/chat/hooks/useTripChat.ts`
- `src/features/chat/hooks/useChatReactions.ts`
- `src/features/chat/hooks/useChatReadReceipts.ts`
- `src/features/chat/hooks/useChatTypingIndicators.ts`
- `src/features/chat/hooks/useChannelUnreadCounts.ts`
- `src/features/chat/hooks/useBroadcastHistory.ts`
- `src/hooks/useUnreadCounts.ts`
- `src/hooks/useTripChatMode.ts`

### UI
- `src/features/chat/components/TripChat.tsx`
- `src/features/chat/components/ChatInput.tsx`
- `src/features/chat/components/MessageBubble.tsx`
- `src/features/chat/components/MessageActions.tsx`
- `src/features/chat/components/MessageRenderer.tsx`
- `src/features/chat/components/VirtualizedMessageContainer.tsx`
- `src/features/chat/components/InlineReplyComponent.tsx`
- `src/features/chat/components/MentionPicker.tsx`
- `src/features/chat/adapters/streamMessageViewModel.ts`
- `src/components/pro/channels/ChannelChatView.tsx`
- `src/components/AIConciergeChat.tsx`
- `src/components/app/AppInitializer.tsx`

### Concierge
- `src/features/concierge/hooks/useConciergeStreaming.ts`
- `src/features/concierge/lib/streamConciergeTts.ts`
- `docs/CONCIERGE_TRANSPORT_BOUNDARY.md`

### Edge
- `supabase/functions/stream-token/`
- `supabase/functions/stream-ensure-membership/`
- `supabase/functions/stream-join-channel/`
- `supabase/functions/stream-reconcile-membership/`
- `supabase/functions/stream-setup-permissions/` (+ `setup.ts`)
- `supabase/functions/stream-moderation-action/`
- `supabase/functions/stream-canary-guard/`
- `supabase/functions/stream-webhook/` (+ `eventRouting.ts`, `mentionNotifications.ts`)

### Docs / migrations / tests sampled
- `docs/GETSTREAM_AUDIT_REPORT.md` (superseded)
- `docs/audits/chat-stream-coherence-audit-2026-04-13.md`
- `docs/PRO_TRIPS_ARCHITECTURE.md`
- `supabase/migrations/20260410050000_seed_stream_chat_feature_flags.sql`
- `supabase/migrations/20260710171000_schedule_stream_membership_reconciler.sql`
- Hook/UI/service `__tests__` under `src/hooks/stream`, `src/features/chat`, `src/services/stream`, `ChannelChatView.*.test.tsx`
- `TEST_GAPS.md`, `DEBUG_PATTERNS.md`, `LESSONS.md` (Stream sections)
- `package.json` (`stream-chat` dependency)

---

## Appendix A — Scoring method notes

Scores penalize **silent failure**, **contract lies** (comments/docs vs code), and **security gaps** harder than missing polish. “Feature exists” ≠ “feature is strong.” Trip messaging can feel fine in demo while Pro + threads + membership remain launch risks.

## Appendix B — Healthy enough: do not churn

Mark **healthy / leave alone unless touching adjacent code**:
- Offline sync skipping Stream chat entities
- `streamMessageSearch` pinned/broadcast history fetch pattern
- Concierge SSE transport boundary (runtime)
- Canary guard server trust checks (conceptually)
- `useChannelUnreadCounts` no-double-watch design
