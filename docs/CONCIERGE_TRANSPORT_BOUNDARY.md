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

- `src/services/stream/streamTransportGuards.ts`
  - `assertConciergeStreamTransportUnsupported()`
  - `getUnsupportedConciergeTransportMessage()`
- `src/services/stream/streamChannelFactory.ts`
  - `getOrCreateConciergeChannel(...)` is deprecated and hard-fails via the guard.
- `src/services/stream/index.ts`
  - Removed concierge channel type/id and mapper exports to avoid accidental new dependencies.

## Regression tests

- `src/services/stream/__tests__/streamTransportGuards.test.ts`
  - validates deterministic unsupported message and throw behavior.
- `src/services/stream/__tests__/streamChannelFactory.conciergeTransport.test.ts`
  - validates deprecated concierge factory invocation rejects with unsupported transport error.
