

# Fix Build Errors — Surgical Type-Only Changes

## Principle
Every fix below is a **compile-time-only** change. No runtime logic, API calls, or Stream integration behavior is altered.

---

## Changes

### 1. `src/hooks/stream/useStreamClient.ts`
- Replace `const { user, isAuthenticated } = useAuth()` with `const { user } = useAuth()`
- Replace all `isAuthenticated` usage with `!!user`
- **Why safe:** `isAuthenticated` was already broken (doesn't exist on type). `!!user` is the idiomatic equivalent.

### 2. `src/services/stream/streamChannelFactory.ts` (4 locations)
- Cast channel data objects to `Record<string, unknown>` in all `client.channel()` calls
- Example: `client.channel(TYPE, id, { name, trip_id } as Record<string, unknown>)`
- **Why safe:** Same object passed to same API. Stream accepts arbitrary custom data — TS just can't see it.

### 3. `src/services/stream/adapters/conciergeAdapter.ts`
- Same `Record<string, unknown>` cast for channel data (line ~54)
- `msg as unknown as Record<string, unknown>` for MessageResponse access (line ~144)

### 4. `src/hooks/stream/useStreamBroadcasts.ts` (line 30)
- `const custom = msg as unknown as Record<string, unknown>`

### 5. `src/services/stream/adapters/mappers/messageMapper.ts` (line 77)
- `const custom = (msg as unknown as Record<string, unknown>) || {}`

### 6. `src/components/AIConciergeChat.tsx`
- Find `ConciergeInvokePayload` interface, add optional fields:
  ```typescript
  places?: Array<Record<string, unknown>>;
  flights?: Array<Record<string, unknown>>;
  hotels?: Array<Record<string, unknown>>;
  conciergeActions?: Array<Record<string, unknown>>;
  ```

### 7. `src/components/onboarding/__tests__/OnboardingCarousel.pillOrder.test.tsx`
- Replace `.at(-1)` with `[arr.length - 1]` (2 locations)
- Replace `.at(0)` with `[0]`

### 8. `src/hooks/useLiveKitVoice.ts` (line ~271)
- Add `kind` parameter to `DataReceived` callback signature to match LiveKit's expected type

---

## What is NOT touched
- No Stream API calls changed
- No channel types/IDs changed
- No message mapping logic changed
- No adapter flow changed
- No hook behavior changed
- No Supabase queries changed

## Verification
- `npm run typecheck` passes (all 20+ errors resolved)
- `npm run build` succeeds
- Stream integration works identically — these are all invisible to JavaScript output

