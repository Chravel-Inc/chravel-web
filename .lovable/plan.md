

## Fix: Runtime crash blocking app load

The app crashes on `/` because of **variable name typos** in `TripGrid.tsx` and **missing props** in `PendingTripCard.tsx`. These are pre-existing bugs, not caused by the delete-account page.

### Root cause

1. **`TripGrid.tsx`** — State is declared as `requestsTab` / `setRequestsTab` (line 90), but lines 119, 121, 417, 421, and 458 reference `requestTab` / `setRequestTab` (missing the "s"). This causes `ReferenceError: requestTab is not defined` at runtime.

2. **`PendingTripCard.tsx`** — The component body uses `ctaVariant` (line 43) and `disabledCta` (line 108), but neither is declared in the `PendingTripCardProps` interface or destructured from props.

### Fix

**File: `src/components/home/TripGrid.tsx`**
- Replace all 5 occurrences of `requestTab` → `requestsTab` and `setRequestTab` → `setRequestsTab`

**File: `src/components/trip/PendingTripCard.tsx`**
- Add `ctaVariant?: 'default' | 'destructive'` and `disabledCta?: boolean` to the interface
- Destructure both (with defaults) in the component params

### What this does NOT touch
- The delete-account page (already built, unaffected)
- Any other build errors in edge functions or services (those are pre-existing type issues that don't affect the frontend runtime)

