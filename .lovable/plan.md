# Concierge MVP Voice — Record → STT → Existing Text Pipeline → TTS

## Goal
Replace the brittle Web Speech API dictation in the AI Concierge with a reliable, cross-platform MVP:
**MediaRecorder → secure backend STT (Lovable AI Gateway) → existing typed concierge send path → existing response render → existing TTS (`useConciergeReadAloud` / `concierge-tts`) for optional playback.**

No duplex live voice. No new providers. No browser-exposed keys. Typed concierge path is untouched.

## Current state (verified)
- Shipped voice = `useConciergeVoice` → `useWebSpeechVoice` (browser Web Speech API only). Works on Chrome/Android, flaky on iOS Safari, broken in iOS PWA.
- `VoiceButton` toggles dictation; transcript is appended to the input field, user reviews + taps Send. So the voice path already funnels through the existing typed send handler (good — we keep that contract).
- Duplex voice is already disabled behind `DUPLEX_VOICE_ENABLED = false` in `AIConciergeChat.tsx`. Leave it dormant; no changes.
- TTS: `useConciergeReadAloud` + `supabase/functions/concierge-tts` already work. Keep as-is.
- Edge functions present: `lovable-concierge` (text pipeline), `concierge-tts`, `gemini-tts`, `google-tts`. No `concierge-stt` yet.
- Lovable AI Gateway supports STT (`openai/gpt-4o-mini-transcribe`) via `LOVABLE_API_KEY` — secret already provisioned.

## Architecture (smallest durable change)

```text
[mic tap]
  -> useConciergeVoiceInput (new hook)
     - getUserMedia + MediaRecorder (webm/mp4 fallback per browser)
     - recording state machine: idle | recording | transcribing | error
     - AbortController, cleanup on unmount/route change
     - blob size/duration guards (reject <1KB, cap ~25MB)
  -> POST multipart/form-data to supabase/functions/concierge-stt
     - requireAuth (existing _shared/requireAuth)
     - forwards to https://ai.gateway.lovable.dev/v1/audio/transcriptions
       model: openai/gpt-4o-mini-transcribe, stream=false for MVP
     - returns { transcript }
  -> transcript piped into existing input setter, then existing send handler
     (same code path as typed message — no fork in lovable-concierge logic)
  -> existing assistant response renders in chat
  -> existing TTS speaker button (useConciergeReadAloud) plays response
```

Web Speech dictation is removed from the production path. `useWebSpeechVoice` file stays (referenced by tests) but is no longer wired into the concierge; we can delete in a follow-up once tests are migrated.

## Files to change

**New**
- `supabase/functions/concierge-stt/index.ts` — auth-gated multipart proxy to Lovable AI Gateway transcriptions. CORS via `_shared/cors.ts`. 25MB cap. Returns `{ transcript }`.
- `src/features/concierge/hooks/useConciergeVoiceInput.ts` — MediaRecorder state machine + STT call via `supabase.functions.invoke('concierge-stt', { body: formData })`.

**Edited**
- `src/features/concierge/hooks/useConciergeVoice.ts` — swap `useWebSpeechVoice` for `useConciergeVoiceInput`; preserve `{ convoVoiceState, handleConvoToggle }` shape so `AIConciergeChat` is unchanged.
- `src/features/chat/components/VoiceButton.tsx` — extend `VoiceState` mapping for `recording | transcribing | error`; reuse existing pulse/connecting visuals. No new props.
- `src/config/voiceFeatureFlags.ts` — add single `VITE_CONCIERGE_VOICE_ENABLED` (default true). Keep `VITE_VOICE_LIVE_ENABLED` separate for dormant duplex.
- `src/features/concierge/hooks/__tests__/useConciergeVoice.test.ts` — update mock from `useWebSpeechVoice` to `useConciergeVoiceInput`.

**Untouched (explicitly)**
- `lovable-concierge` edge function, prompts, tools, RAG, usage counters.
- `useConciergeReadAloud` + `concierge-tts` (TTS stays).
- `AIConciergeChat.tsx` business logic (only the hook contract is reused).
- Duplex stack (`useGeminiLive`, `gemini-voice-session`, `circuitBreaker`, `audioCapture/Playback`, `VoiceLiveOverlay`) — left dormant, no deletes in this PR.

## State machine (hook)

`idle` → tap → request mic → `recording` → stop → `transcribing` → success: emit transcript + back to `idle` | error: `error` (auto-reset 3s)
Cancel/unmount at any state stops tracks, aborts fetch, releases AudioContext refs.

## Edge function contract

```
POST /functions/v1/concierge-stt
Authorization: Bearer <user JWT>   (verified via requireAuth)
Content-Type: multipart/form-data
fields: audio (Blob, <=25MB), mimeType (string)

200 { transcript: string }
400 invalid audio / empty
401 unauthorized
413 too large
429 rate limited (passthrough)
402 credits exhausted (passthrough message)
500 upstream failure
```

Server forwards to Lovable AI Gateway with `model=openai/gpt-4o-mini-transcribe`, names the file with the correct extension derived from the incoming MIME type (per `ai-speech-to-text` knowledge — webm/mp4/wav).

## Edge cases handled
- mic denied / no device / unsupported MediaRecorder → button shows disabled-with-tooltip, typed input stays fully functional.
- iOS Safari `audio/mp4` fallback; Chrome `audio/webm`. Detect via `MediaRecorder.isTypeSupported`.
- empty/silent blob (<1KB) → never uploaded, user sees "didn't catch that".
- double-tap → guarded by state machine.
- route unmount mid-recording → tracks stopped, fetch aborted.
- 402/429 from Gateway → surface toast, no retry loop.
- Capacitor: requires `NSMicrophoneUsageDescription` (iOS) and `RECORD_AUDIO` (Android). Audit in a follow-up if those strings aren't already present; not changed in this PR unless missing.

## Out of scope / deferred
- Streaming STT (`stream=true` SSE) — keep non-streaming for MVP simplicity; trivial to flip later.
- Removing `useWebSpeechVoice.ts` and its tests — defer until after MVP burn-in.
- Reviving / deleting `VoiceLiveOverlay` and duplex code — separate PR.
- Migrating TTS off `concierge-tts` onto Lovable Gateway TTS — already works, no benefit yet.

## Validation
1. `npm run lint:check && npm run typecheck && npm run build`
2. Vitest: updated `useConciergeVoice.test.ts` + new tests for `useConciergeVoiceInput` state machine (mock MediaRecorder + `supabase.functions.invoke`).
3. Manual QA in a real trip on desktop Chrome (happy path), desktop Safari (mp4 fallback), mobile Safari (permission prompt + send), Android Chrome.
4. Verify no `lovable-concierge` changes in git diff.
5. Verify network panel: no `LOVABLE_API_KEY` or service-role secret in any client request.
6. Edge function logs: STT calls succeed and 401 for unauthenticated callers.

## Rollback
Set `VITE_CONCIERGE_VOICE_ENABLED=false` — `VoiceButton` hides; typed concierge unaffected. Revert the two new files + 4 edits if needed; no DB migrations.

## Definition of done
- Voice flow in AI Concierge works on desktop Chrome and at least one mobile browser through the existing typed send handler.
- Backend STT is auth-gated and key-free on the client.
- TTS playback unchanged.
- Typed concierge regression-free.
- One flag toggles the feature.
- Tests/lint/typecheck/build green.
