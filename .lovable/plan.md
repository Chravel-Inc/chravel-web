
# Fix Pre-Existing TypeScript Build Errors

Your Supabase connection is working fine. The build errors are pre-existing type mismatches across 4 files. Here's the plan:

## Errors and Fixes

### 1. `src/components/home/TripGrid.tsx` (lines 528-536)
**Problem:** `pendingTrips` is typed as local `Trip[]` but used as `DashboardJoinRequest[]` (accessing `.trip_id`, `.trip?.name`, `.requested_at`).
**Fix:** Change `pendingTrips` prop type from `Trip[]` to `DashboardJoinRequest[]` in the `TripGridProps` interface. Import `DashboardJoinRequest` (already imported on line 26).

### 2. `src/features/chat/components/TripChat.tsx`
**Two sub-issues:**
- **Line 754:** `filterMessages` called with messages whose `linkPreview` can be `unknown`. Fix: ensure mock message `linkPreview` is typed as `undefined` instead of `unknown`.
- **Line 829:** First `PullToRefreshIndicator` missing required `threshold` prop. Fix: add `threshold={80}` to the first instance, or remove the duplicate (line 829 is a duplicate of line 830-834).

### 3. `src/utils/__tests__/tokenValidation.test.ts`
**Problem:** `vi.stubEnv('DEV', 'true')` passes a string but the function expects boolean. Also, many `@ts-expect-error` directives are unused (the underlying function signatures changed to accept the inputs).
**Fix:** Change `vi.stubEnv('DEV', true)`. Remove all unused `@ts-expect-error` directives.

### 4. `src/utils/__tests__/tripConverter.test.ts`
**Problem:** Test creates objects with `trip_members` and `trip_events_places` properties that don't exist on the `Trip` interface from `tripService.ts`. Also references `categories` which doesn't exist.
**Fix:** Either add these optional properties to the `Trip` interface in `tripService.ts`, or cast test objects with `as unknown as Trip` since these are aggregate/join fields returned by Supabase queries.

## Technical Details

- All fixes are type-level only; no runtime behavior changes
- Each file fix is independent and can be verified with `npm run typecheck`
- Total: ~6 surgical edits across 4 files
