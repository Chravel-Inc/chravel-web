

# Deep Dive: Stream Chat Integration — What's Working, What's Missing

## Root Cause of "Message Disappears But Doesn't Hydrate"

The **immediate blocker** is that `VITE_STREAM_API_KEY` is not set in the environment. Without it:
1. `getStreamApiKey()` returns `null`
2. `useStreamClient` skips connection entirely
3. `useStreamTripChat` times out after 10s with "Stream chat is not configured"
4. `sendMessage` fires into a null channel ref — message vanishes silently

The code architecture is solid. The wiring is complete. But the infrastructure layer is incomplete.

---

## Complete Stream Integration Checklist

### A. Secrets & Environment Variables

| Item | Where | Status |
|------|-------|--------|
| `VITE_STREAM_API_KEY` | Lovable project env / `.env` | **MISSING** — This is the #1 blocker. It's a publishable key, safe to store in the codebase. |
| `STREAM_API_KEY` | Supabase Edge Function secrets | **MISSING** — Required by `stream-token` and `stream-setup-permissions` |
| `STREAM_API_SECRET` | Supabase Edge Function secrets | **MISSING** — Required by `stream-token` and `stream-setup-permissions` |
| `STREAM_ADMIN_SECRET` | Supabase Edge Function secrets | **MISSING** — Required by `stream-setup-permissions` (one-time setup) |
| `STREAM_WEBHOOK_SECRET` | Supabase Edge Function secrets | **MISSING** — Required by `stream-webhook` for signature verification |

### B. Stream Dashboard Configuration

| Item | Status |
|------|--------|
| Stream app created at getstream.io/dashboard | **YOU TELL ME** — need app name and API key |
| 4 custom channel types created: `chravel-trip`, `chravel-broadcast`, `chravel-channel`, `chravel-concierge` | **LIKELY MISSING** — these must be created in Stream Dashboard → Chat → Channel Types before `stream-setup-permissions` can configure grants |
| Webhook URL configured in Stream Dashboard pointing to `https://jmjiyekmxwsxkfnqwyaa.supabase.co/functions/v1/stream-webhook` | **YOU TELL ME** |
| Webhook events enabled: `message.new`, `message.updated`, `message.deleted`, `reaction.new`, `reaction.updated`, `reaction.deleted` | **YOU TELL ME** |

### C. Database Requirements

| Item | Status |
|------|--------|
| `webhook_events` table (idempotency) | **MISSING** — `stream-webhook` will crash on `INSERT INTO webhook_events`. I will create this migration. |

### D. Edge Functions Deployment

| Item | Status |
|------|--------|
| `stream-token` deployed | **NO LOGS** — Either not deployed or never called (because client key is missing) |
| `stream-webhook` deployed | **NO LOGS** — Either not deployed or webhook not configured |
| `stream-setup-permissions` deployed | Unknown — one-time setup function |

### E. Frontend Code (All Complete ✅)

| Component | Status |
|-----------|--------|
| `streamClient.ts` — singleton, connect/disconnect lifecycle | ✅ |
| `streamTokenService.ts` — fetches token from edge function | ✅ |
| `useStreamClient` — mounted in AppInitializer | ✅ |
| `useStreamTripChat` — full message CRUD, reactions, pagination | ✅ |
| `useTripChat` — routes to Stream hook | ✅ |
| `streamChannelFactory.ts` — channel ID conventions | ✅ |
| `streamMessagePayload.ts` — payload builder | ✅ |
| `streamTransportGuards.ts` — cutover guards | ✅ |
| `streamMembershipSync.ts` — member add/remove | ✅ |
| `TripChat.tsx` — wired to Stream hook | ✅ |

---

## What I Will Do (Implementation Plan)

### Step 1: Create `webhook_events` table migration
```sql
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
```

### Step 2: Add `VITE_STREAM_API_KEY` to the codebase
Since this is a publishable/public key, I'll add it once you provide the value.

---

## What YOU Need To Do (Step-by-Step)

### 1. Get your Stream credentials
Go to **https://getstream.io/dashboard/** → Your App → **Access Keys**
- Copy **API Key** (public) — this is both `VITE_STREAM_API_KEY` and `STREAM_API_KEY`
- Copy **API Secret** — this is `STREAM_API_SECRET`

### 2. Create custom channel types in Stream Dashboard
Go to **Stream Dashboard → Chat → Channel Types** and create these 4 types:
- `chravel-trip`
- `chravel-broadcast`
- `chravel-channel`
- `chravel-concierge`

Use default settings for each.

### 3. Add Supabase Edge Function secrets
Go to **https://supabase.com/dashboard/project/jmjiyekmxwsxkfnqwyaa/settings/functions** and add:
- `STREAM_API_KEY` = your Stream API Key
- `STREAM_API_SECRET` = your Stream API Secret
- `STREAM_WEBHOOK_SECRET` = your Stream webhook signing secret (get from Stream Dashboard → Webhooks)
- `STREAM_ADMIN_SECRET` = any strong random string you choose (used as a gate for the setup endpoint)

### 4. Give me your Stream API Key
Tell me the `VITE_STREAM_API_KEY` value so I can add it to the project environment. It's a publishable key — safe for the frontend.

### 5. Configure webhook in Stream Dashboard
Go to **Stream Dashboard → Chat → Webhooks**:
- **Webhook URL**: `https://jmjiyekmxwsxkfnqwyaa.supabase.co/functions/v1/stream-webhook`
- Enable events: `message.new`, `message.updated`, `message.deleted`

### 6. Run the one-time permissions setup
After all secrets are set, call the setup endpoint once:
```bash
curl -X POST \
  https://jmjiyekmxwsxkfnqwyaa.supabase.co/functions/v1/stream-setup-permissions \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -H "X-Admin-Secret: YOUR_STREAM_ADMIN_SECRET" \
  -H "Content-Type: application/json"
```

---

## Expected Flow Once Everything Is Connected

```
User types message → ChatInput clears → dispatchStreamSend fires
  → channel.sendMessage(payload) → Stream API
  → Stream WebSocket pushes `message.new` event back
  → useStreamTripChat handler appends to messages[]
  → Message renders in chat window
```

The message "disappears" right now because the input clears on submit (correct), but the channel ref is null (no Stream connection), so `sendMessage` silently returns and no WebSocket event ever arrives.

