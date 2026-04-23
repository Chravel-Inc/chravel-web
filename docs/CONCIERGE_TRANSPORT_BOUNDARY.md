# Concierge Transport Boundary (April 2026)

## Decision

Chravel concierge remains **SSE + database persisted** (`lovable-concierge` edge flow and `trip_messages`/concierge history paths), and is **not** Stream-chat backed.

## Why this boundary exists

1. **Single-source write path already productionized:** concierge assistant generation, tool execution, and persistence currently flow through the concierge gateway + Supabase data model. Introducing Stream as a second transport would duplicate message/event contracts.
2. **Operational clarity:** Stream is the canonical transport for group chat/broadcast/channel messaging. Concierge is a separate AI workflow with different latency, token streaming, and tool-side effects.
3. **Regression containment:** Deprecated Stream concierge factory calls now throw deterministic errors so accidental invocation fails fast in test/dev instead of silently creating orphan Stream channels.

## Architecture contract

- ✅ Trip chat/channel/broadcast: Stream-backed
- ✅ Concierge: SSE request/response + DB storage/history
- ❌ Unsupported: creating/reading concierge Stream channels (`chravel-concierge`)

## Guardrails implemented

- `src/services/stream/streamChannelFactory.ts`
  - No concierge channel factory exists in the Stream surface.
- `src/services/stream/index.ts`
  - Stream barrel exposes only trip/channel/broadcast channel APIs.
- `src/services/stream/streamTransportGuards.ts`
  - Keeps only active transport-state checks (`isStreamConfigured`, `shouldUseLegacyChatSync`, `isStreamChatActive`).

## Regression tests

- `src/services/stream/__tests__/streamTransportGuards.test.ts`
  - validates transport-state checks (configured vs legacy vs active connection).
