## Root cause (first principles)

The whole chat pipeline now runs through Stream only — `useTripChat` is a thin wrapper around `useStreamTripChat`, and the legacy Supabase chat path has been deprecated:

```
src/features/chat/hooks/useTripChat.ts → useStreamTripChat (only path)
```

For Stream to work, three things have to line up:

1. **Client env**: `VITE_STREAM_API_KEY` baked into the bundle (read in `src/services/stream/streamClient.ts` and `streamTransportGuards.ts`).
2. **Server secrets**: `STREAM_API_KEY` + `STREAM_API_SECRET` available to the `stream-token` edge function.
3. **API keys match**: `streamClient.connectStreamClient()` aborts with “Stream API key mismatch” if `apiKey` from `stream-token` ≠ `VITE_STREAM_API_KEY`.

Current state in this project:

- ✅ Server has `STREAM_API_KEY` and `STREAM_API_SECRET` set as Supabase secrets.
- ❌ Client `.env` has `VITE_STREAM_API_KEY=` (empty). I just confirmed it.
- Consequence: `getStreamApiKey()` returns `null` → `useStreamClient` early-returns → Stream client is never connected → `useStreamTripChat` init throws (or never gets `streamClientReady`) → `chatError` flips on → the panel renders:

  > **Something went wrong in Chat** — _Some chat enhancements are temporarily unavailable._ — `Retry`

  Pressing Retry calls `reload()`, which immediately fails the same way, so the toast `“Chat needs a refresh”` keeps re-appearing. That is exactly the symptom you’re seeing.

This is a configuration regression, not a logic bug — no code change broke chat; the client lost its Stream key.

## Fix (regression-free, surgical)

### 1. Restore the client Stream API key
- Add `VITE_STREAM_API_KEY` as a project secret using the publishable Stream API key (same value as the existing `STREAM_API_KEY` server secret). Lovable will inject it into the build so `import.meta.env.VITE_STREAM_API_KEY` is no longer empty.
- I cannot read the existing `STREAM_API_KEY` value (secrets are encrypted), so I’ll need you to paste it once when prompted, or confirm I can copy it from your Stream dashboard. No code change required for this step.

### 2. Verify parity, no key mismatch
- After the secret is set, the next build will have `VITE_STREAM_API_KEY` populated. `connectStreamClient()` will compare it against the `apiKey` returned by the `stream-token` edge function and throw if they diverge.
- Run `node scripts/check-stream-config-parity.cjs` in CI/locally to confirm `frontend VITE_STREAM_API_KEY === supabase STREAM_API_KEY`. No new code, just exercising the existing guard.

### 3. Quick health check of `stream-token`
- Hit `POST /functions/v1/stream-token` with a real Supabase JWT and confirm it returns `{ token, userId, apiKey }`. No deploy needed unless logs show an error.

### 4. Soften the failure UI so a future outage doesn’t spam toasts (small, non-aggressive)
Two tiny edits in `src/features/chat/components/TripChat.tsx`:

- When `getStreamApiKey()` is `null` (Stream simply not configured in this environment, e.g. preview/dev without the key), render a calm “Chat is initializing — try again in a moment.” block instead of the red-flag “Something went wrong in Chat” panel. This avoids alarming users when the cause is config, not corruption.
- Stop firing the `toast.error('Chat needs a refresh', …)` on the Retry click. The toast is redundant with the inline state and is what makes it feel like the chat is yelling “reload me” repeatedly. Keep the `reload?.()` call; just drop the toast.

No changes to `useStreamTripChat`, `streamClient`, `streamTokenService`, RLS, or the membership recovery flow. Stream wiring stays exactly as it is — we only restore the missing key and stop the noisy retry toast.

## Verification
- `npm run typecheck && npm run lint && npm run build` clean.
- Load a trip → chat panel hydrates, messages render, no “Something went wrong in Chat”.
- DevTools network → `stream-token` returns 200, then Stream WebSocket (`wss://chat.stream-io-api.com`) connects.
- Console shows no `[Stream] membership recovery failed` or `read_channel_denied`.

## Rollback
- Single-commit revert of the two `TripChat.tsx` edits.
- Removing `VITE_STREAM_API_KEY` returns us to the current broken-but-known state.

## Risk
LOW. No data model, RLS, edge function, or hook-graph changes. Pure config + two cosmetic lines.
