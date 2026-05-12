# Gemini / Vertex / Lovable API

## Why we use it
All AI workloads — concierge text, function-calling, embeddings, TTS, voice. Gemini direct via `GEMINI_API_KEY` is the default; `LOVABLE_API_KEY` (Lovable gateway) is the rollback path.

## Models in use (from `.env.example`)
| Model | Purpose | Var |
|---|---|---|
| `gemini-3.1-flash` | Text/chat (non-realtime) | `GEMINI_FLASH_MODEL` |
| `gemini-3.1-flash-tts-preview` | TTS | `GEMINI_TTS_MODEL` |
| `gemini-live-2.5-flash-native-audio` | Realtime voice (Vertex AI Live) | `GEMINI_LIVE_MODEL` |

## Where it's initialized
- Edge wrapper: `supabase/functions/_shared/gemini.ts` (17 KB)
- Vertex auth: `supabase/functions/_shared/vertexAuth.ts` (service-account-derived bearer)
- Concierge dispatcher: `supabase/functions/lovable-concierge/index.ts` (text), ``gemini-voice-session` (config-declared; no impl on disk — see RISKS R-013)` (voice)

## API surface used
- Gemini text — non-streaming and streaming generate-content with function-calling
- Vertex AI Live — duplex audio websocket, function-calling, voice presets (default `Charon`, configurable via `VITE_GEMINI_VOICE_NAME`)
- TTS via `concierge-tts` / `gemini-tts` / `google-tts` (fallback)
- Embeddings via `generate-embeddings` / `batch-generate-embeddings`

## Env vars
| Var | Side | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | edge | Direct Gemini API key |
| `LOVABLE_API_KEY` | edge | Lovable gateway fallback |
| `AI_PROVIDER` | edge | `gemini` (default) or `lovable` (rollback) |
| `GEMINI_ENABLE_LOVABLE_FALLBACK` | edge | Auto-fallback on Gemini failure |
| `GEMINI_FLASH_MODEL`, `GEMINI_TTS_MODEL`, `GEMINI_LIVE_MODEL` | edge | Model selection |
| `GEMINI_TTS_API_KEY` | edge | Optional dedicated TTS key |
| `VITE_VOICE_LIVE_ENABLED` | client | Voice feature flag |
| `VITE_LIVEKIT_WS_URL` | client | LiveKit WSS |
| `VITE_GEMINI_VOICE_NAME` | client | Voice preset |
| `VITE_CONCIERGE_TTS_ENABLED` | client | TTS feature flag |
| `ENABLE_DEMO_CONCIERGE`, `DEMO_CONCIERGE_RPM`, `DEMO_CONCIERGE_RPH` | edge | Demo concierge |
| `VERTEX_*` | edge | Vertex service account |

## Failure modes & retry behavior
- Circuit breaker (`_shared/circuitBreaker.ts`) wraps Gemini calls.
- Lovable fallback automatically engages on Gemini failure if `GEMINI_ENABLE_LOVABLE_FALLBACK=true`.
- Voice prereqs (memory #14): LiveKit agent must be deployed and room metadata seeded. Without these, voice silently fails.
- Voice lifecycle (memory #11): explicit cleanup required to prevent leaked sessions.
- Tool calls missing declarations fail silently (`DEBUG_PATTERNS.md`); the tool registry must be the single source of truth (memory #23).

## Cost / quota notes
- Per-request billing. Conditional tool loading by query class (memory #24) reduces token cost.
- Embedding generation is bulk-priced; batch via `batch-generate-embeddings`.
- Voice is the most expensive surface.

## Source Refs
- `supabase/functions/_shared/gemini.ts`, `vertexAuth.ts`, `circuitBreaker.ts`
- `supabase/functions/_shared/concierge/toolRegistry.ts` — single tool source
- `supabase/functions/lovable-concierge/`, `gemini-voice-session/`, `gemini-voice-proxy/`, `concierge-tts/`, `gemini-tts/`, `google-tts/`, `livekit-token/`
- `agent_memory.jsonl` #11, #14, #23, #24, #25, #26
- `DEBUG_PATTERNS.md` — voice tool, action plan, preference injection
- `docs/GEMINI_LIVE_*.md`
