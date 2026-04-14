# Chat / Messaging / Stream Coherence Audit — 2026-04-13

## 1) Classification
Multi-domain audit: **architecture audit + integration audit + technical debt audit + reliability audit + security/config audit**.

## 2) System Map

### System Overview
Chravel’s chat runtime is now Stream-first for transport in both trip chat and pro channels, but surrounding concerns (channel catalog, role mapping, media indices, notification fanout, and some fallback service paths) still rely heavily on Supabase tables and edge functions. The frontend initializes a singleton Stream client in `AppInitializer` via `useStreamClient`; token bootstrap is delegated to the `stream-token` edge function, which validates Supabase auth and mints 24h Stream user tokens. The trip chat UI (`TripChat`) and pro channel UI (`ChannelChatView`) consume Stream channel state through hooks (`useStreamTripChat`, `useStreamProChannel`) and still carry legacy interoperability layers for read receipts, typing indicators, and older Supabase-path helpers.

The architecture is therefore **not pure Stream** and **not pure Supabase**. It is a hybrid with Stream as message transport, Supabase as identity/trip-membership/notification ledger, and legacy DB-based chat code mostly guarded (not fully deleted). This is workable, but coherence risk remains where env naming, fallback credentials, and mixed assumptions diverge.

### Dependency Graph
- `src/components/app/AppInitializer.tsx`
  - depends on `useStreamClient` for bootstrapping Stream connection
  - depends on Supabase-auth-backed user state
  - failure modes: silent Stream non-connect because `connectStreamClient` swallows errors

- `src/hooks/stream/useStreamClient.ts`
  - depends on `useAuth` and `streamClient.connectStreamClient`
  - sends data to Stream connect lifecycle
  - failure modes: local hook error state may miss underlying causes due to swallowed connect errors

- `src/services/stream/streamClient.ts`
  - reads env `VITE_STREAM_API_KEY`
  - fetches token from `stream-token` edge function via `streamTokenService`
  - depends on Supabase auth session + Stream SDK
  - failure modes: key mismatch, token fetch failure, optional mode leaves app "working" but chat disabled

- `src/services/stream/streamTokenService.ts`
  - depends on `SUPABASE_PROJECT_URL`/`SUPABASE_PUBLIC_ANON_KEY` from frontend Supabase client
  - sends request to `/functions/v1/stream-token`
  - caches token 20h (token valid 24h)
  - failure modes: stale/mismatched Supabase URL/key, auth token absent, runtime env drift

- `supabase/functions/stream-token/index.ts`
  - reads secrets: `STREAM_API_KEY`, `STREAM_API_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`
  - authenticates Supabase JWT, upserts Stream user, returns Stream token + api key
  - failure modes: missing secret, bad auth header, profile query failures

- `src/features/chat/components/TripChat.tsx`
  - depends on `useTripChat` (Stream), `useUnreadCounts`, `useChatReadReceipts`, `useChatTypingIndicators`, `useChatReactions`
  - sends messages through Stream path (`sendTripMessage` from Stream hook)
  - still runs parser side-effects and legacy-compatible formatting branches
  - failure modes: mixed payload assumptions (`any` casts), fallback paths creating split-brain logic

- `src/features/chat/hooks/useTripChat.ts`
  - canonical alias to `useStreamTripChat`
  - explicitly deprecates Supabase path

- `src/hooks/stream/useStreamTripChat.ts`
  - depends on Stream channel `chravel-trip:trip-{tripId}`
  - handles watch/query/pagination/reactions/read events
  - sends via `channel.sendMessage`
  - failure modes: timeout waiting for stream readiness, watch/query failures, optimistic pending object divergence

- `src/components/pro/channels/ChannelChatView.tsx` + `src/hooks/stream/useStreamProChannel.ts`
  - depends on channel catalog from Supabase (`trip_channels`) but message transport from Stream (`chravel-channel:channel-{id}`)
  - failure modes: catalog/member sync mismatch (Supabase says access yes, Stream membership stale)

- `src/hooks/useRoleChannels.ts` + `src/services/roleChannelService.ts`
  - depends on Supabase channel/role tables
  - intentionally returns empty/disabled for legacy message methods when Stream enabled
  - failure modes: dead-ish APIs remain callable; cognitive overhead and drift risk

- `src/services/stream/streamMembershipSync.ts`
  - called from trip join/leave/member removal flows
  - depends on connected Stream client in browser and local execution timing
  - failure modes: fire-and-forget non-fatal sync can drift memberships when client offline/reloads

- `supabase/functions/stream-webhook/index.ts`
  - reads `STREAM_WEBHOOK_SECRET`, `STREAM_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - verifies HMAC signature + optional API key, idempotency logs in `webhook_events`
  - creates `notifications` rows for recipients resolved by channel type
  - failure modes: webhook secret mismatch, missing channel-member mapping, concierge recipient inference edge cases

- Notification path (`stream-webhook` -> `notifications` -> delivery functions)
  - depends on `dispatch-notification-deliveries` + preferences
  - failure modes: notification category mismatch, secret/header mismatch for internal dispatch

- Supabase legacy services still in repo (`chatService`, `readReceiptService`, `typingIndicatorService`, `chatBroadcastService`)
  - guarded by Stream checks in many mutation paths
  - failure modes: partial invocation by older call-sites, duplicated logic, maintenance drag

## 3) Config / Env / Secret Wiring Inventory (chat-adjacent)

| Name | Defined | Consumed | Placement Correct? | Risk | Notes |
|---|---|---|---|---|---|
| `VITE_STREAM_API_KEY` | `.env.example`, `.env.production.example` | `streamClient`, transport guards | Yes (public) | Medium | Feature gate + runtime switch; if missing, Stream silently disabled. |
| `STREAM_API_KEY` | Supabase Edge secrets | `stream-token`, `stream-webhook`, `stream-setup-permissions` | Yes | Medium | Should match `VITE_STREAM_API_KEY`; mismatch explicitly throws in client connect. |
| `STREAM_API_SECRET` | Supabase Edge secrets | `stream-token`, `stream-setup-permissions` | Yes | Low | Properly server-only in inspected codepaths. |
| `STREAM_WEBHOOK_SECRET` | Supabase Edge secrets | `stream-webhook` | Yes | High | Missing/rotated wrongly => webhook delivery breaks. |
| `STREAM_ADMIN_SECRET` | Supabase Edge secrets | `stream-setup-permissions` header gate | Yes | Medium | Operational secret; must not be reused elsewhere. |
| `VITE_SUPABASE_URL` | Vite env | frontend + direct fetch callers | Partially | High | Some callsites hard-require `VITE_SUPABASE_ANON_KEY` and ignore publishable alias. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Vite env | `main.tsx`, `supabase/client.ts` | Partially | Medium | Modern key accepted in client bootstrap, but not in `ogMetadataService`/`linkService` direct fetch helpers. |
| `VITE_SUPABASE_ANON_KEY` | Vite env | multiple direct fetch helpers | Legacy/partial | Medium | Legacy key still expected by helper modules and health checks. |
| Built-in Supabase fallback URL+key constants | hardcoded in `src/integrations/supabase/client.ts` | all frontend Supabase clients | **No (prod hygiene issue)** | **Critical** | Reintroduced fallback credentials conflict with explicit env-driven model; increases drift/security governance risk. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secrets | many edge functions including webhook | Yes | High | Broad blast radius if leaked; many functions depend on custom auth logic. |
| `NOTIFICATION_DISPATCH_SECRET` | Supabase secrets | create-notification/dispatch-notification-deliveries | Yes | Medium | Missing secret can weaken inter-function trust boundary. |
| `CRON_SECRET` | Supabase secrets | cron guard shared module | Yes | Medium | Guard now fail-closed in code; must be present in all envs. |
| `VITE_LIVEKIT_WS_URL` | Vite env | voice frontend hook/flags | Yes (public) | Medium | Has default hardcoded cloud URL fallback in code, possible environment drift. |
| `LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET`/`LIVEKIT_URL` | Supabase secrets | `livekit-token` | Yes | High | Voice auth/session issuance depends on all three. |
| `GEMINI_API_KEY`/`LOVABLE_API_KEY`/`AI_PROVIDER` | Supabase secrets/env | concierge edge functions | Mixed | Medium | Deprecated Lovable fallback still present; architecture intent and runtime options diverge. |

### Proven Drift / Mismatch Findings
1. Frontend Supabase client contains hardcoded fallback URL + anon key constants and uses them when env pair is incomplete/missing; this undermines strict env-based deployment contracts and can mask config mistakes.
2. `main.tsx` warns with publishable-key fallback, but several helper services still require `VITE_SUPABASE_ANON_KEY` explicitly, creating inconsistent key model assumptions.
3. Health/dev banners still reference anon key naming as canonical despite publishable-key migration intent.

## 4) Functional Message Flow Traces

### 4.1 App boot / provider init
- Expected: auth hydrates -> Stream connects once -> chat hooks watch channels.
- Actual: `AppInitializer` always calls `useStreamClient`; connect errors are mostly swallowed in `streamClient`.
- Divergence: reduced observability of connect failures.
- Grade: **78**.

### 4.2 Auth/session initialization
- Expected: Supabase auth token drives edge token fetch.
- Actual: `streamTokenService` pulls session and bearer token, calls edge function.
- Hidden assumption: frontend Supabase client URL/key resolution is correct.
- Grade: **84**.

### 4.3 Stream client initialization
- Expected: strict API key match and robust reconnect events.
- Actual: key mismatch check exists; connection.changed subscribers wired.
- Risk: optional/no-throw failure mode can leave UI degraded without hard failure.
- Grade: **82**.

### 4.4 Token fetch flow
- Expected: JWT validated, Stream token returned, profile upserted.
- Actual: exactly implemented in `stream-token` with server secret validation.
- Risk: 24h token lifetime + 20h cache is okay, but no explicit proactive refresh on reconnect boundary besides TTL.
- Grade: **88**.

### 4.5 Channel list/query flow
- Expected: one source for list + membership + transport.
- Actual: list/membership from Supabase, messages from Stream (hybrid by design).
- Divergence: sync drift possible when Stream membership updates fail client-side.
- Grade: **74**.

### 4.6 Channel creation/membership
- Expected: atomic role/channel membership coherence.
- Actual: channel CRUD in Supabase; Stream membership best-effort from client hooks/flows.
- Race risk: user role changes while client offline => Stream channel membership stale until other corrective action.
- Grade: **70**.

### 4.7 Message send flow (trip chat)
- Expected: one canonical send path.
- Actual: `useStreamTripChat.dispatchStreamSend` is canonical for UI path; separate helper `sendTripMessageViaStream` exists for share asset flow.
- Divergence: multiple send APIs to same transport increase drift risk (payload conventions differ slightly).
- Grade: **80**.

### 4.8 Read/unread flow
- Expected: Stream native unread/read markers as source of truth.
- Actual: `useUnreadCounts` uses Stream read state; `useChatReadReceipts` has Stream mode plus legacy Supabase mode fallback.
- Divergence: dual logic retained; complexity high but fallback guarded.
- Grade: **76**.

### 4.9 Typing/presence flow
- Expected: Stream typing events in Stream mode.
- Actual: hook uses Stream when activeChannel exists, otherwise Supabase presence service.
- Divergence: two implementations still alive; fallback complexity remains.
- Grade: **73**.

### 4.10 Threads/replies/reactions
- Expected: native Stream semantics.
- Actual: parent_id/reaction events are used; TripChat mapping still heavily `any`-based with custom transforms.
- Risk: mapper drift and type safety debt.
- Grade: **77**.

### 4.11 Attachments/link preview
- Expected: uniform attachment mapping across senders.
- Actual: Stream attachments used; URL preview fallback still computed client-side in hooks.
- Risk: multiple attachment/link paths (share hook, chat composer, stream send).
- Grade: **75**.

### 4.12 Notifications/webhooks
- Expected: Stream webhook -> deterministic recipient resolution -> notification dispatch.
- Actual: signature + idempotency implemented; channel-specific recipient resolution in Supabase.
- Risk: channel membership table drift directly impacts notification accuracy.
- Grade: **81**.

### 4.13 Reconnect/disconnect
- Expected: robust reconnect and state backfill.
- Actual: connection status subscribers + channel watch; some historical backfill logic documented in lessons but not centralized in Stream hooks.
- Grade: **74**.

### 4.14 Legacy coexistence seams
- Expected: legacy path disabled cleanly.
- Actual: many guards in tests/services block legacy writes when Stream configured, but legacy modules remain and some non-guarded channel methods persist.
- Grade: **72**.

## 5) Architectural Fractures

1. **Env model fracture (publishable vs anon vs hardcoded fallback)**
   - Root cause: partial migration and reintroduction of fallback constants.
   - Symptom: local/preview can work while prod env is misconfigured ("fake green").
   - Impacted layers: frontend bootstrap, edge invocation helpers, health pages.
   - Severity: **Critical**.
   - Debt class: increased by recent fixes (regression against prior key-rotation hardening intent).

2. **Hybrid source-of-truth friction (Supabase channel roster + Stream transport)**
   - Root cause: transport migration without server-side authoritative membership sync pipeline.
   - Symptom: channel access discrepancies, webhook recipient drift, inconsistent unread/typing behavior edge cases.
   - Impacted layers: role channels, notifications, membership updates.
   - Severity: **High**.
   - Debt class: old debt partially reduced but not retired.

3. **Legacy module retention with partial guarding**
   - Root cause: safe migration strategy kept old services, but cleanup incomplete.
   - Symptom: duplicated logic surface and higher cognitive load; possible accidental re-use.
   - Impacted layers: chat service, typing/read receipts, role channel service.
   - Severity: **Medium-High**.
   - Debt class: old debt persists.

4. **Type safety erosion in core chat rendering**
   - Root cause: bridging Stream payloads into historic UI shapes via `any`/custom mapping.
   - Symptom: hidden runtime assumptions, harder refactors, potential silent breakage.
   - Impacted layers: TripChat formatting + message item rendering.
   - Severity: **Medium**.
   - Debt class: increased during migration pragmatism.

5. **Silent failure posture on Stream connect/membership sync**
   - Root cause: intentional non-fatal behavior without robust telemetry counters.
   - Symptom: users can have degraded chat with weak visibility.
   - Impacted layers: runtime reliability/ops.
   - Severity: **Medium**.
   - Debt class: old behavior still present.

## 6) PR / Change Coherence Audit (recent flurry)

### What improved
- Read/unread logic moved closer to Stream native state and removed earlier approximation logic.
- Read receipts were explicitly refactored for Stream mode and duplicate client declaration issues were addressed.
- Stream webhook routing expanded for channel/message event variants and includes idempotency safety.

### What became messier / riskier
- Configuration coherence regressed: codebase currently shows hardcoded Supabase fallback credentials despite prior hardening notes claiming removal.
- Multiple send/adapter pathways now coexist (`useStreamTripChat` send path vs `sendTripMessageViaStream`) with overlapping responsibilities.
- Legacy services are guarded but remain operationally present, increasing accidental coupling risk.

### Convergence judgment
**Partial convergence at transport layer, divergence at configuration and migration cleanup layer.**

## 7) 0–100 Grades
- Frontend chat UI: **78** — functional but mapper complexity and `any` usage remain.
- Chat state management: **75** — mixed historical abstractions, not fully consolidated.
- Provider/init architecture: **80** — clear boot path, weak failure surfacing.
- Token/auth flow: **88** — solid edge validation and scoped token issuance.
- GetStream integration: **82** — good core usage, partial fragmentation around helpers.
- Supabase integration (messaging-related): **74** — necessary but hybrid seams are fragile.
- Env var hygiene: **52** — significant drift and contradictory assumptions.
- Secrets hygiene: **81** — server-only boundaries mostly respected; operational dependency high.
- Deployment/runtime consistency: **63** — local fallback can hide bad prod config.
- Type safety across layers: **68** — too many `any` bridges in critical message path.
- Reliability/reconnect behavior: **74** — reasonable baseline, not deeply hardened.
- Message flow correctness: **80** — mostly correct in normal path.
- Channel/membership correctness: **70** — sync drift risk.
- Notification/event coherence: **79** — webhook path decent, depends on clean membership data.
- Legacy code cleanup: **64** — guards exist, cleanup incomplete.
- Observability/debuggability: **69** — some telemetry, many silent non-fatal catches.
- Security/privacy posture: **76** — good secret boundaries but config fallbacks are concerning.
- Maintainability: **67** — migration-era overlap and duplicate pathways.
- Migration cleanliness: **65** — effective but incomplete cutover discipline.
- Production readiness: **71** — workable with notable config and coherence risks.

### Interconnection Grade (0–100)
**68/100** — the machine runs, but boundaries are still leaky: transport is mostly coherent, while config model, legacy residues, and membership synchronization strategy create cross-component fragility.

## 8) Technical Debt Ledger

### Architecture debt
| Issue | Category | Severity | Evidence | Risk if ignored | Fastest safe fix | Proper long-term fix | Blast radius | Confidence |
|---|---|---|---|---|---|---|---|---|
| Dual send surfaces for trip messaging | Architecture | Medium | `useStreamTripChat` + `tripMessageTransport` | divergent payload semantics | centralize shared payload builder | single transport service consumed by all callers | Medium | High |
| Client-side membership sync only | Architecture | High | `streamMembershipSync` called fire-and-forget in UI flows | stale Stream channel membership | add retry queue/telemetry | server-side authoritative membership sync worker + reconciliation | High | Medium-High |
| Legacy services retained | Architecture | Medium | `chatService`/`roleChannelService` legacy branches still present | accidental reactivation/drift | mark internal-only + dead-path warnings | remove legacy modules after compatibility window | Medium | High |

### Config/env debt
| Issue | Category | Severity | Evidence | Risk if ignored | Fastest safe fix | Proper long-term fix | Blast radius | Confidence |
|---|---|---|---|---|---|---|---|---|
| Hardcoded Supabase fallback credentials | Config | Critical | `src/integrations/supabase/client.ts` constants/fallback chain | fake-green deployments, drift, governance risk | disable fallback in non-dev | strict required env + startup hard-fail + CI validation | Critical | High |
| Publishable vs anon mismatch in helper services | Config | High | `ogMetadataService` and `linkService` require anon key | edge calls fail when publishable-only env used | use shared exported key alias | remove direct env reads; consume centralized client config | Medium | High |
| Health/dev messaging uses legacy key wording | Config | Medium | `DevEnvBanner`, `Healthz` | operator confusion | update copy/logic | single env-schema package + generated docs | Low | High |

### Security debt
| Issue | Category | Severity | Evidence | Risk if ignored | Fastest safe fix | Proper long-term fix | Blast radius | Confidence |
|---|---|---|---|---|---|---|---|---|
| Public fallback key baked into client | Security | High | same fallback constants | key governance + accidental project coupling | remove fallback constants | secret/config policy gate in CI | High | High |
| Broad service-role usage in many functions | Security | Medium | widespread `SUPABASE_SERVICE_ROLE_KEY` usage | auth bug in any function = large data risk | audit top chat-adjacent functions | centralized auth helper and policy tests | High | Medium |

### Reliability debt
| Issue | Category | Severity | Evidence | Risk if ignored | Fastest safe fix | Proper long-term fix | Blast radius | Confidence |
|---|---|---|---|---|---|---|---|---|
| Stream connect failures often swallowed | Reliability | Medium | `streamClient.connectStreamClient` catch/no throw | silent degraded chat | emit structured telemetry events | SLO-backed connection health + alerting | Medium | High |
| Membership sync non-fatal and non-observable | Reliability | High | fire-and-forget catch ignored in join/leave paths | hidden drift | log + metric + retry | backend reconciliation job and dead-letter queue | High | Medium |

### Migration debt
| Issue | Category | Severity | Evidence | Risk if ignored | Fastest safe fix | Proper long-term fix | Blast radius | Confidence |
|---|---|---|---|---|---|---|---|---|
| Legacy typing/read-receipt code still coexists | Migration | Medium | hooks branch on stream vs legacy | regressions from dual logic | consolidate adapters | remove legacy infra post-cutover milestone | Medium | High |

### Maintainability debt
| Issue | Category | Severity | Evidence | Risk if ignored | Fastest safe fix | Proper long-term fix | Blast radius | Confidence |
|---|---|---|---|---|---|---|---|---|
| Heavy `any` mapping in TripChat | Maintainability | Medium | explicit eslint disable + `any` payload transforms | brittle UI on payload changes | introduce typed mapper utility | end-to-end typed chat DTO contract | Medium | High |

## 9) Minimal-Blast-Radius Fix Plan

### Phase 1: Critical Fixes (do now)
1. **Remove hardcoded Supabase fallback credentials from frontend client.**
   - Why: prevents fake-green and config drift.
   - Code: `src/integrations/supabase/client.ts`, `src/main.tsx`, health/dev banners.
   - External: Vercel env completeness required.
   - Risk: Medium (startup failure if env missing, which is desired fail-fast).

2. **Unify Supabase public key consumption for direct edge fetch helpers.**
   - Why: publishable-key rollout currently inconsistent.
   - Code: `src/services/ogMetadataService.ts`, `src/services/linkService.ts`, any direct fetch caller.
   - Risk: Low.

### Phase 2: Coherence / Consolidation (next)
1. **Create one canonical chat send payload builder used by both TripChat and share-asset flows.**
   - Code: `src/services/stream/tripMessageTransport.ts`, `src/hooks/stream/useStreamTripChat.ts`, `src/hooks/useShareAsset.ts`.
   - Risk: Medium.

2. **Centralize membership sync into retriable service wrapper with telemetry.**
   - Code: `streamMembershipSync` + join/leave/member hooks.
   - External: ideally add server reconciliation function.
   - Risk: Medium-High.

### Phase 3: Hardening / Cleanup
1. **Deprecate and remove legacy chat service call paths post-verification.**
2. **Replace `any` mapping in TripChat with typed adapter from Stream MessageResponse -> UI DTO.**
3. **Add integration test asserting env contract + stream token boot path with publishable key only.**

### Phase 4: Nice-to-have
1. **Stream connection health panel + diagnostics for support mode.**
2. **Automated drift detector comparing Supabase membership tables vs Stream channel members.**

## 10) Fake Green Risks
1. Chat appears fine in local/preview because fallback Supabase credentials mask missing env vars.
2. Tests that stub `VITE_STREAM_API_KEY` pass while deployment env mismatch (`STREAM_API_KEY` vs `VITE_STREAM_API_KEY`) can still break runtime connect.
3. UI send appears successful (fire-and-forget) even when downstream Stream membership or webhook notification logic is stale.
4. Stream-only paths may look healthy while old helper modules still encode legacy anon-key assumptions.
5. Channel list can render from Supabase even when Stream channel membership is out-of-sync, producing delayed/partial failure only on send/read operations.

## 11) Final Verdict
- **Fundamentally coherent right now?** **No** (partially coherent transport, incoherent config/migration boundaries).
- **Production safe right now?** **Not fully** (usable but with material config and sync fragility).
- **Recent fixes reducing or increasing debt overall?** Mixed: transport debt reduced, config/migration coherence debt increased.

### Top 5 risks
1. Hardcoded Supabase fallback credentials hiding env defects.
2. Membership sync drift between Supabase and Stream.
3. Hybrid/legacy dual logic in typing/read receipts.
4. Inconsistent key model assumptions (publishable vs anon).
5. Limited observability for silent Stream degrade paths.

### Top 5 highest-leverage fixes
1. Remove fallback credentials; enforce strict env contract.
2. Unify public Supabase key usage in all direct fetch helpers.
3. Add server-side authoritative membership reconciliation.
4. Consolidate message send payload construction.
5. Retire legacy chat modules after targeted regression suite.

### Sign-off bar
I would require **≥88 interconnection score** before production sign-off for long-term maintainability.

## External Blockers / Manual Checks Required
The following cannot be fully verified from repo-only static audit:
- Vercel production env actual values and parity across Preview/Prod.
- Supabase Edge Function secret presence and rotation state.
- Stream dashboard webhook endpoint config/signing secret parity.
- Stream channel type permissions currently applied in target app.

### A) Human operator checklist
1. In Vercel project settings, confirm `VITE_STREAM_API_KEY`, `VITE_SUPABASE_URL`, and publishable key vars are present in Production + Preview with identical intended values.
2. In Supabase Dashboard > Edge Functions > Secrets, verify: `STREAM_API_KEY`, `STREAM_API_SECRET`, `STREAM_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `NOTIFICATION_DISPATCH_SECRET`, `CRON_SECRET`.
3. In Stream Dashboard > Webhooks, verify endpoint is `.../functions/v1/stream-webhook` and signing secret matches `STREAM_WEBHOOK_SECRET`.
4. Trigger a test message in a trip and verify webhook row insert/idempotency in `webhook_events` and resulting `notifications` row creation.

### B) AGENTIC BROWSER SCRIPT
1. Open Vercel dashboard and select Chravel project.
2. Go to **Settings → Environment Variables**.
3. Search and verify each variable: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (or anon), `VITE_STREAM_API_KEY` in both **Production** and **Preview** scopes.
4. Open Supabase dashboard for the target project.
5. Navigate to **Edge Functions → Secrets**.
6. Confirm existence (not values): `STREAM_API_KEY`, `STREAM_API_SECRET`, `STREAM_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `NOTIFICATION_DISPATCH_SECRET`, `CRON_SECRET`.
7. Open Stream dashboard, select app, go to **Chat → Webhooks**.
8. Verify endpoint URL points to Supabase `stream-webhook` function and enable event `message.new` (plus update/delete if desired).
9. Send a test trip message from staging app with two users.
10. In Supabase table editor, inspect `webhook_events` for a new `stream:message.new` row and `notifications` for recipient rows.
