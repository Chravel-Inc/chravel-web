

# Fix capabilityTokens.ts + LiveKit Build Error

## Context
1. `SUPABASE_JWT_SECRET` is **automatically injected** by Supabase into all Edge Functions at runtime — you do NOT add it manually (the `SUPABASE_` prefix is reserved in the secrets dashboard)
2. The previous edit left `capabilityTokens.ts` in a broken state: it calls `getSecretKey()` but never defines the function, AND still has the top-level throw guard
3. The `livekit-token` build error is a separate issue — `npm:livekit-server-sdk@2` needs a `deno.json` entry

## Changes

### 1. Fix `capabilityTokens.ts` — define `getSecretKey()` + remove top-level throw

Replace the top-level crash with a lazy helper:

```typescript
const JWT_SECRET = Deno.env.get('SUPABASE_JWT_SECRET');

function getSecretKey(): Uint8Array {
  const secret = JWT_SECRET || Deno.env.get('SUPABASE_JWT_SECRET');
  if (!secret) {
    throw new Error(
      'SUPABASE_JWT_SECRET is required — this value is auto-injected by Supabase at runtime.'
    );
  }
  return new TextEncoder().encode(secret);
}
```

Remove lines 11-17 (the `if (!JWT_SECRET) throw` block). The error now only fires when a tool call actually needs a capability token, not at module load time.

### 2. Fix LiveKit build error — `supabase/functions/livekit-token/deno.json`

Create a `deno.json` in the livekit-token function directory to resolve the npm import:

```json
{
  "imports": {
    "livekit-server-sdk": "npm:livekit-server-sdk@^2"
  }
}
```

And update the import in `index.ts` from `npm:livekit-server-sdk@2` to use the import map.

### 3. Fix `requireSecrets` misuse in `livekit-token/index.ts`

Line 31: `requireSecrets()` returns a `Record<string, string>` (throws on failure), but the code treats it as if it returns an error. The current code:
```typescript
const secretsError = requireSecrets([...]);
if (secretsError) { ... }
```
This is wrong — `requireSecrets` throws, it doesn't return an error. Wrap in try/catch or use destructuring.

## Risk
**LOW** — fixes broken code, no behavior change for working paths.

