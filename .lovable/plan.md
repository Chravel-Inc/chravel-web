

# Fix Build Errors Blocking Preview

## Problem
4 distinct build errors introduced from recent PR merges are preventing the preview from loading.

## Errors & Fixes

### 1. `toolRegistry.ts` — `hotel_search` not in `QueryClass` type
**Error:** `hotel_search` does not exist in type `Record<QueryClass, ...>`
**Root cause:** `hotel_search` was added to the tool map but not to the `QueryClass` union in `queryClassifier.ts`.
**Fix:** Add `'hotel_search'` to the `QueryClass` union type in `queryClassifier.ts` (after `flight_search`).

### 2. `livekit-token/index.ts` — `RoomAgentDispatch` type mismatch
**Error:** `{ agentName: string }` is missing properties from `RoomAgentDispatch`.
**Root cause:** LiveKit SDK v2 uses protobuf-generated types for `RoomAgentDispatch` — you can't use a plain object literal.
**Fix:** Use `new RoomAgentDispatch({ agentName: 'chravel-voice' })` instead of the plain object, importing `RoomAgentDispatch` from the SDK. If unavailable, cast with `as any` (documented).

### 3. `TripChat.tsx` — missing `threshold` prop on `PullToRefreshIndicator`
**Error:** Property `threshold` is missing in type.
**Root cause:** The component requires 3 props but only 2 are passed.
**Fix:** Add `threshold={80}` (or whatever the pull-to-refresh threshold constant is) to the `PullToRefreshIndicator` usage at line 955.

### 4. `tripService.ts` — `cover_display_mode` type mismatch
**Error:** `string` not assignable to `"contain" | "cover"`.
**Root cause:** Supabase returns `string` from the DB, but the `Trip` interface expects the narrower union `'cover' | 'contain'`.
**Fix:** Cast the Supabase row data with `as Trip` at the assignment site (line ~531), or add an intermediate cast. The field is already typed correctly in the interface — the issue is the raw Supabase return type.

## Risk
**LOW** — All fixes are type-level or prop additions. No runtime behavior changes.

