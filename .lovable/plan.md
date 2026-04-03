

# Fix Concierge Tool-Calling Architecture

## Problem
The concierge fails on ALL tool calls because `capabilityTokens.ts` crashes at **module import time** when `SUPABASE_JWT_SECRET` is missing. Additionally, multi-action requests like "book a hotel + add to calendar + make it my basecamp" can't work because the `booking_reservation` tool set doesn't include `setBasecamp`, and the basecamp regex doesn't match "make it my basecamp."

## Changes

### 1. Graceful capability token failure — `supabase/functions/_shared/security/capabilityTokens.ts`
- Remove the top-level `if (!JWT_SECRET) throw` guard (lines 11-16) and the top-level `secretKey` constant (line 18)
- Add a `getSecretKey()` helper that throws only when called — deferring the crash to actual tool execution
- Call `getSecretKey()` inside `generateCapabilityToken()` and `verifyCapabilityToken()` instead of using module-level `secretKey`
- This lets text-only concierge responses continue working even when the secret is missing

### 2. Add `setBasecamp` to `booking_reservation` tools — `supabase/functions/_shared/concierge/toolRegistry.ts`
- Line 859: Add `'setBasecamp'` after `'addToCalendar'` in the `booking_reservation` array
- Hotels frequently become basecamps — these actions are tightly coupled

### 3. Broaden basecamp regex — `supabase/functions/_shared/concierge/queryClassifier.ts`
- Line 74-75: Expand `BASECAMP_ACTION_PATTERN` to also match `make .+ (my |our )?(personal )?basecamp`
- This catches phrases like "make it my personal basecamp" that previously failed

### 4. User action: Add `SUPABASE_JWT_SECRET` to Edge Function secrets
- Navigate to **Supabase Dashboard → Project Settings → API → JWT Secret** → copy the value
- Go to **Edge Functions → Secrets** → add `SUPABASE_JWT_SECRET` with that value
- This is the critical unblock for ALL tool calling

## Risk
**LOW** — No runtime behavior change for text-only responses. Tool calls that were already crashing now fail gracefully with a clear error per-tool. The regex and tool registry changes are additive only.

