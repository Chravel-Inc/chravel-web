

# Fix Stream Chat — Complete Integration Plan

## Root Cause Analysis

There are **two blocking issues** preventing Stream chat from working:

### Issue 1: `VITE_STREAM_API_KEY` not in `.env`
The `streamClient.ts` has a hardcoded fallback (`k2dbmuesv2a9`), but `streamTransportGuards.ts` reads `import.meta.env.VITE_STREAM_API_KEY` directly — which is **empty**. This means:
- `isStreamConfigured()` → `false`
- `isStreamChatActive()` → `false`  
- `shouldUseLegacyChatSync()` → `true`

Result: The entire Stream transport path is bypassed. Messages go to the legacy Supabase path (which throws errors because Stream guards block DB writes), or silently fail.

### Issue 2: Edge function deploy error (stale)
The `conciergeTripQueryLimits.ts` import fix is already applied in the codebase, but edge functions may not have been redeployed since the fix. This blocks **all** edge function deployments (the bundler fails on any function that shares the `_shared` directory).

## Fix Plan

### Step 1: Add `VITE_STREAM_API_KEY` to `.env`
Add `VITE_STREAM_API_KEY="k2dbmuesv2a9"` to the `.env` file. This unblocks all guard checks.

### Step 2: Align `streamTransportGuards.ts` with `streamClient.ts`
Update `isStreamConfigured()` to use the same fallback constant, ensuring the guard and the client agree:

```typescript
const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY || 'k2dbmuesv2a9';

export function isStreamConfigured(): boolean {
  return typeof STREAM_API_KEY === 'string' && STREAM_API_KEY.trim().length > 0;
}
```

### Step 3: Redeploy all edge functions
Deploy `stream-token`, `stream-webhook`, and `stream-setup-permissions` to pick up the inlined `usagePolicy.ts` fix and clear the stale bundle error.

### Step 4: Verify end-to-end
- Confirm `stream-token` returns a valid token
- Confirm `useStreamClient` connects successfully
- Confirm `useStreamTripChat` initializes a channel and receives `message.new` events

## What This Fixes

```
User types message → ChatInput clears → dispatchStreamSend fires
  → isStreamConfigured() now returns TRUE ✓
  → channel.sendMessage(payload) → Stream API
  → Stream WebSocket pushes message.new event back
  → useStreamTripChat handler appends to messages[]
  → Message renders in chat window
```

## Files Changed
1. `.env` — add `VITE_STREAM_API_KEY`
2. `src/services/stream/streamTransportGuards.ts` — add hardcoded fallback to match `streamClient.ts`
3. Edge functions redeployed (no code changes, just deploy)

## Risk
**Low.** The API key is already hardcoded in `streamClient.ts`. Adding it to the guards aligns the two paths. No behavior change for any non-chat feature.

## Instructions for You (Manual Steps)

After I make these changes, you need to verify:

1. **STREAM_WEBHOOK_SECRET** — confirm it's set in [Supabase Edge Function secrets](https://supabase.com/dashboard/project/jmjiyekmxwsxkfnqwyaa/settings/functions). Without it, the webhook rejects all Stream callbacks (signature verification fails).

2. **Stream Dashboard webhook config** — confirm the webhook URL `https://jmjiyekmxwsxkfnqwyaa.supabase.co/functions/v1/stream-webhook` is active with `message.new`, `message.updated`, `message.deleted` events enabled.

3. **Test by sending a message** in any trip chat. It should appear in the chat window within ~1 second.

