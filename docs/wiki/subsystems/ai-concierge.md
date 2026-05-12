# AI Concierge

## Purpose
AI-powered trip assistant with text + voice. Plans, recommends, summarizes, and executes trip mutations through a typed tool registry. Text is Gemini direct (or via Lovable gateway); voice is Vertex AI Live or LiveKit-hosted.

## Entry Points
| Component / Hook | File | Purpose |
|---|---|---|
| `AiChatInput` | `src/features/chat/components/AiChatInput.tsx` | Concierge composer |
| `ConciergeActionCard(Group)` | `src/features/chat/components/ConciergeActionCard*.tsx` | Pending-action renderer |
| `PendingActionCard` | `src/features/chat/components/PendingActionCard.tsx` | Confirm card |
| `VoiceLiveInline`, `VoiceButton` | `src/features/chat/components/VoiceLive*.tsx`, `VoiceButton.tsx` | Voice surface |
| Concierge hooks | `src/features/concierge/hooks/` | Conversation + tool execution |
| `useConciergeUsage` | `src/hooks/useConciergeUsage.ts` | Quota |
| `useConciergeHistory` | `src/hooks/useConciergeHistory.ts` | Message history |
| `useAIConciergePreferences` | `src/hooks/useAIConciergePreferences.ts` | User prefs |
| `useConciergeReadAloud` | `src/hooks/useConciergeReadAloud.ts` | TTS |
| `conciergeGateway` | `src/services/conciergeGateway.ts` | Main client -> edge gateway |
| `conciergeCacheService` | `src/services/conciergeCacheService.ts` | Local response cache |

## Edge function
`supabase/functions/lovable-concierge/index.ts` — 2,155 lines per `CLAUDE.md` tech-debt note. Pipeline:

1. **Auth + rate limit** — `requireAuth.ts` + `rateLimitGuard.ts`
2. **Query classification** — 18 classes from `_shared/concierge/queryClassifier.ts` (memory #24)
3. **Selective tool loading** — 38 tools from `_shared/concierge/toolRegistry.ts` (memory #23)
4. **Context build** — `contextBuilder.ts` (30 KB) assembles trip-scoped context
5. **Prompt assembly** — `promptBuilder.ts` conditional layers
6. **Gemini call** — `gemini.ts`, function-calling enabled
7. **Tool execution** — capability tokens + `functionExecutor.ts` (143 KB)
8. **Usage tracking** — `conciergeUsage.ts` -> `concierge_usage`, `concierge_trip_usage`, `user_concierge_monthly_usage`
9. **Idempotency** — `concierge_tool_idempotency` (memory #25)
10. **Response** — streamed back to client

## Data Flow

**Text:**
1. User types in `AiChatInput`.
2. `conciergeGateway.send(...)` -> `lovable-concierge` edge function.
3. Edge runs the pipeline; pending writes go to `trip_pending_actions` (memory #7).
4. Client renders `PendingActionCard` for human-confirm flows.
5. On confirm: `execute-concierge-tool` edge function commits the pending action.

**Voice:**
1. User taps `VoiceButton`.
2. Client requests a voice session token via `gemini-voice-session` (or `livekit-token`).
3. Voice agent attaches to room (memory #14 — LiveKit agent must be deployed; room metadata must be seeded).
4. Audio streams duplex.
5. Tool calls trigger the same `functionExecutor` path.

## State Touched
- **Zustand:** `useConciergeSessionStore` (sessions, messages, voice state, last error/success, history loaded flag)
- **TanStack Query:** concierge usage queries; conversation history queries
- **Local:** `conciergeCacheService` localStorage cache (cleared on sign-out per `useAuth.tsx:1117`)

## Tables & RLS
| Table | Read | Write | Notes |
|---|---|---|---|
| `ai_queries` | self | service | Conversation log |
| `ai_conversations` | self | service | |
| `ai_processing_queue` | service | service | |
| `kb_documents` | service | service | KB source |
| `kb_chunks` | service | service | RAG chunks |
| `trip_embeddings` | trip members | service | Per-trip embedding |
| `concierge_usage`, `concierge_trip_usage`, `user_concierge_monthly_usage` | self | service | Quota |
| `concierge_tool_idempotency` | service | service | Memory #25 |
| `shared_inbound_items` | self | service | Shared content for ingest |
| `message_parser_logs` | service | service | Parse audit |

## Edge Functions Used
- `lovable-concierge` — main
- `demo-concierge` (public; separate rate limits)
- `execute-concierge-tool` — post-confirm tool execution
- `concierge-tts`, `gemini-tts`, `google-tts` — TTS
- `gemini-voice-session`, `gemini-voice-proxy`, `livekit-token` — voice
- `place-grounding` — ground responses with place data
- `ai-answer`, `ai-features`, `ai-ingest`, `ai-search`
- `generate-embeddings`, `batch-generate-embeddings`, `regenerate-all-embeddings`
- `artifact-ingest`, `artifact-search`
- `populate-search-index`

## Demo vs Authenticated
- Demo uses `demo-concierge` (public, rate-limited by `DEMO_CONCIERGE_RPM` / `DEMO_CONCIERGE_RPH` from `.env.example`).
- Demo concierge is **disabled by default** (`ENABLE_DEMO_CONCIERGE=false`).
- Voice not available in demo.

## Mobile / PWA / Capacitor considerations
- Voice requires microphone permission; gate behind explicit request.
- LiveKit WebRTC works in both web and Capacitor (with native WebView mic permission).
- Background memory pressure can kill WebRTC; restart on visibility regain.

## Known Risks (cross-link `RISKS.md`)

- **Memory #23, #26 — single source of truth + 5-file sync.** New tools must update: (1) `_shared/concierge/toolRegistry.ts`, (2) `_shared/functionExecutor.ts`, (3) confirm handler for any pending-buffer write tool (memory #25), (4) `_shared/voiceToolDeclarations.ts` if used in voice, (5) the UI renderer (e.g., `ConciergeActionCard`). Miss one → silent failure.
- **Memory #25 — pending action confirm handler** must have a case for every pending-buffer write tool.
- **Memory #7 — AI writes go through pending actions buffer.** New tools should never mutate shared trip data directly without a pending-action gate.
- **Memory #24 — tools conditionally loaded by query class.** Adding a tool without registering its query class means it never loads.
- **Memory #11 — Gemini Live voice sessions require explicit lifecycle cleanup.**
- **Memory #14 — voice prereqs:** LiveKit agent deployment + room metadata.
- **DEBUG_PATTERNS** — "Voice tool call fails silently due to unimplemented declaration", "Action Plan JSON mandate ignored by model", "Preference injection on irrelevant queries wastes tokens".

## Source Refs
- `supabase/functions/lovable-concierge/` — 2,155 line monolith
- `supabase/functions/_shared/concierge/toolRegistry.ts` — tool single source
- `supabase/functions/_shared/functionExecutor.ts` — 143 KB dispatcher
- `supabase/functions/_shared/voiceToolDeclarations.ts`
- `supabase/functions/_shared/contextBuilder.ts`, `promptBuilder.ts`, `gemini.ts`
- `supabase/functions/execute-concierge-tool/`
- `src/features/concierge/` — feature module
- `src/services/conciergeGateway.ts`, `conciergeCacheService.ts`, `chatAnalysisService.ts`
- `src/hooks/useConciergeUsage.ts`, `useConciergeHistory.ts`, `useAIConciergePreferences.ts`, `useConciergeReadAloud.ts`
- `src/store/conciergeSessionStore.ts`
- `agent_memory.jsonl` #7, #11, #14, #23, #24, #25, #26
- `DEBUG_PATTERNS.md` — voice tool, action plan, preference injection patterns
- `docs/AI_CONCIERGE_*.md`, `docs/GEMINI_LIVE_*.md`
- Diagram: [`../diagrams/ai-concierge-sequence.mmd`](../diagrams/ai-concierge-sequence.mmd)
