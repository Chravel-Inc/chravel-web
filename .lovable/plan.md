

# Make Stream Chat Work — Final Fix

## Root Cause
The `stream-token` edge function call fails with "Failed to fetch" because the **Lovable preview origin** (`https://id-preview--20feaa04-0946-4c68-a68d-0eb88cc1b9c4.lovable.app`) is **not in the CORS allowlist** in `supabase/functions/_shared/cors.ts`. Only the old `.lovableproject.com` origin is listed.

Without a valid Stream token, the entire Stream pipeline is dead: no client connection → no channel → no send → no receive.

## What's Actually Working
- All secrets are set (STREAM_API_KEY, STREAM_API_SECRET, STREAM_WEBHOOK_SECRET, STREAM_ADMIN_SECRET) ✅
- Edge functions deployed (stream-token, stream-webhook, stream-setup-permissions) ✅
- Transport guards aligned (fallback key added) ✅
- `webhook_events` table exists ✅
- Frontend hook code (`useStreamTripChat`) is complete and correct ✅
- `stream-token` edge function logic is correct ✅

## The One Fix Needed

### File: `supabase/functions/_shared/cors.ts`

Add the Lovable preview origin to the allowlist:

```
'https://id-preview--20feaa04-0946-4c68-a68d-0eb88cc1b9c4.lovable.app',
```

Also add the published domain:
```
'https://chravel.lovable.app',
```

### Then: Redeploy `stream-token` and `stream-webhook`

Since CORS is in `_shared/`, all edge functions using it need redeployment. The two critical ones are `stream-token` (client calls it to connect) and `stream-webhook` (Stream calls it on new messages).

## What Happens After This Fix

```
1. User opens trip chat
2. useStreamClient connects → calls stream-token edge function
3. stream-token returns { token, userId, apiKey } ← CORS now allows this
4. StreamChat.connectUser(userId, token) → WebSocket connected
5. useStreamTripChat watches channel → loads history
6. User sends message → channel.sendMessage() → Stream API
7. Stream pushes message.new event back via WebSocket
8. handleNewMessage appends to messages[] → renders in chat
```

## Risk
**None.** Adding the preview origin is required for the app to work from the Lovable preview. No other code changes needed.

