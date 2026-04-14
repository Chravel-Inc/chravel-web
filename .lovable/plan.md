

# Fix: Edge Function Build Errors + Production Blank Screen

## Why chravel.app Shows a Black Screen

The app's background is pure black (`--background: 0 0% 0%`). If edge functions like `check-subscription` fail to deploy or return 500s, the auth/subscription flow can stall, leaving the user stuck on the loading spinner against the black background — appearing as a "blank screen."

The Lovable preview works because it connects to already-deployed edge functions. But if the latest edge function code can't deploy due to type errors, production stays broken.

## Build Errors to Fix (2 edge functions)

### 1. `check-subscription/index.ts` — 4 TS errors

**Lines 173, 184:** `syncProfileFromResponse` uses `ReturnType<typeof createClient>` which resolves to a generic type that doesn't match the `supabaseClient` created with `createClient<any>(...)`. The `.update()` call infers `never` for the argument because the untyped client can't resolve the table schema.

**Fix:** Change `syncProfileFromResponse` parameter type from `ReturnType<typeof createClient>` to `any` (or the actual `SupabaseClient` type). Since this is a Deno edge function with no generated types, casting is the pragmatic fix.

**Lines 278, 304:** Same `supabaseClient` type mismatch when passing to `syncProfileFromResponse`.

**Fix:** Same — relaxing the function signature fixes all 4 errors.

### 2. `stream-webhook/index.ts` — 2 TS errors

**Line 149:** `HANDLED_STREAM_EVENT_TYPES.has(eventType)` — `eventType` is `string` but the Set was created with `as const`, making it `Set<"message.new" | "message.updated" | "message.deleted">`. `.has()` on a const Set only accepts the literal union.

**Line 173:** Same pattern with `HANDLED_STREAM_CHANNEL_TYPES.has(channelType)`.

**Fix:** Cast the argument: `.has(eventType as any)` — or widen the Set type by removing `as const` from the initializer array in `eventRouting.ts`.

## Files to Change

1. **`supabase/functions/check-subscription/index.ts`** — Change `syncProfileFromResponse` first parameter type to `any` (line 166)
2. **`supabase/functions/stream-webhook/eventRouting.ts`** — Remove `as const` from both Set initializers so they become `Set<string>`
3. **Redeploy** both edge functions: `check-subscription`, `stream-webhook`

## Risk
Low — type-only changes. No runtime behavior change. Fixes blocking deployment errors.

