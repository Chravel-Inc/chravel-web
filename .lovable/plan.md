

## Fix: Voice Dictation Paywall + Concierge Error + Build Errors

### Issue 1: Voice dictation locked behind upgrade paywall

**Root cause:** `AIConciergeChat.tsx` line 2529 passes `isVoiceEligible={DUPLEX_VOICE_ENABLED}`, where `DUPLEX_VOICE_ENABLED = false` (line 76). This constant gates **Gemini Live** (duplex voice), but it's incorrectly also gating basic **Web Speech API dictation**, which should always be available.

**Fix in `src/components/AIConciergeChat.tsx`:**
- Change line 2529 from `isVoiceEligible={DUPLEX_VOICE_ENABLED}` to `isVoiceEligible={true}`
- Basic dictation (Web Speech API) is always free — the paywall should only apply to Gemini Live duplex voice, which has its own separate button gated by `DUPLEX_VOICE_ENABLED`

### Issue 2: Concierge returns "Sorry, I encountered an error processing your request"

**Root cause:** CORS origin mismatch. The Lovable preview origin (`https://id-preview--20feaa04-0946-4c68-a68d-0eb88cc1b9c4.lovable.app`) is **not** in the CORS allowlist in `supabase/functions/_shared/cors.ts`. The edge function returns 200 OK, but the CORS `Access-Control-Allow-Origin` header defaults to `https://chravel.app`, so the browser blocks the response body — manifesting as "Failed to fetch" in the network log. The SSE streaming path catches this error and shows the fallback error message.

**Fix in `supabase/functions/_shared/cors.ts`:**
- Add `.lovable.app` as a suffix matcher to `ALLOWED_ORIGINS` — this allows `*.lovable.app` preview URLs. This is safe because only Lovable preview deployments use this domain.

**Note:** This only affects the Lovable preview environment. Production (`chravel.app`) is already in the allowlist and works fine.

### Issue 3: Build errors (3 files)

**3a. `src/services/stream/streamClient.ts` line 117:**
- `notifyConnectionStatusSubscribers` is called but never defined. It's a duplicate of `notifyStatusChangeSubscribers` (which exists and is called on the adjacent line 113).
- **Fix:** Remove line 117 (the redundant call).

**3b. `supabase/functions/livekit-token/index.ts` line 142:**
- `agents: [{ agentName: 'chravel-voice' }]` — the `RoomAgentDispatch` type from the LiveKit SDK requires more fields than just `agentName`.
- **Fix:** Cast to `any` with intentional comment: `agents: [{ agentName: 'chravel-voice' } as any]`

**3c. `supabase/functions/send-push/index.ts` line 81:**
- `notification.data as Record<string, unknown>` fails because `PushPayload` doesn't have an index signature.
- **Fix:** Double-cast: `notification.data as unknown as Record<string, unknown>`

### Summary of changes

| File | Change |
|------|--------|
| `src/components/AIConciergeChat.tsx` | `isVoiceEligible={true}` |
| `supabase/functions/_shared/cors.ts` | Add `.lovable.app` to ALLOWED_ORIGINS |
| `src/services/stream/streamClient.ts` | Remove duplicate `notifyConnectionStatusSubscribers` call |
| `supabase/functions/livekit-token/index.ts` | Cast agent dispatch to `any` |
| `supabase/functions/send-push/index.ts` | Double-cast `notification.data` |

