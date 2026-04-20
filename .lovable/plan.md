

## Confirmation: site-wide icon parity

Yes — the plan covers **all four card surfaces** site-wide, not just the screenshot examples:

| Card type | File | Where icon appears |
|---|---|---|
| Consumer trips | `src/components/TripCard.tsx` | Hero (mobile + desktop) next to date range |
| Pro trips | `src/components/ProTripCard.tsx` | Hero next to date range |
| Events (desktop) | `src/components/EventCard.tsx` | Hero next to date range |
| Events (mobile) | `src/components/MobileEventCard.tsx` | Hero next to date range |

Every list that renders these cards inherits the fix automatically:
- Dashboard "My Trips" (Consumer + Pro tabs) → `TripCard` / `ProTripCard`
- Dashboard "Events" tab → `EventCard` / `MobileEventCard`
- Archived view → already uses `CalendarGlyph` (verified in `ArchivedTripCard.tsx`)
- Search results, recent trips, shared trips → all reuse the same card components

## What changes

In each of the 4 files, replace the Lucide `<CalendarDays>` instance(s) in the **hero section** with the wrapped `CalendarGlyph`:

```tsx
<span className="gold-gradient-icon inline-flex">
  <CalendarGlyph size={14} />  {/* mobile */}
</span>
<span className="gold-gradient-icon inline-flex">
  <CalendarGlyph size={18} />  {/* desktop */}
</span>
```

Stats-row calendar icons already use `CalendarGlyph` — no change needed there. Result: hero calendar icon matches stats-row calendar icon **exactly** on Trips, Pro Trips, and Events, on both mobile and desktop.

## Files changed (4)

| File | Change |
|---|---|
| `src/components/TripCard.tsx` | Swap hero `CalendarDays` → wrapped `CalendarGlyph` (mobile + desktop) |
| `src/components/ProTripCard.tsx` | Swap hero `CalendarDays` → wrapped `CalendarGlyph` |
| `src/components/EventCard.tsx` | Swap hero `CalendarDays` → wrapped `CalendarGlyph` |
| `src/components/MobileEventCard.tsx` | Swap hero `CalendarDays` → wrapped `CalendarGlyph` |

Remove the now-unused `CalendarDays` import from each file if no other usages remain.

## Verification

1. Dashboard → My Trips (Consumer): hero calendar icon = stats-row calendar icon. ✅
2. Dashboard → My Trips (Pro): same parity. ✅
3. Dashboard → Events (desktop + mobile viewport): same parity. ✅
4. MapPin icon untouched — still matches Places-row icon. ✅
5. `npm run typecheck && npm run lint && npm run build` pass.

## Risk

**LOW.** Pure icon swap across 4 files. No layout/logic/data changes. Rollback = revert the 4 files.

