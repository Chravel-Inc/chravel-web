# Honest audit of the previous perf round + fix for the home page

## What I actually shipped last round

Verified each committed file. Summary:

| File | Status | Verdict |
|---|---|---|
| `src/hooks/useTrips.ts` | `placeholderData: keepPreviousData` added | ✅ correct, but only helps **return visits** to `/`, not the cold load you just hit |
| `src/components/TripTabs.tsx` | Tier 1/2/3 mounting, idle pre-mount of Places/Payments/Tasks/Polls | ✅ correct, but **only runs after you open a trip** |
| `src/components/mobile/MobileTripTabs.tsx` | Same tiered strategy | ✅ correct, trip-detail only |
| `src/components/TripCard.tsx` | `onTouchStart` + `import('@/pages/TripDetail')` warm-up | ✅ correct, only fires on hover/tap of a card — useless before cards render |
| `src/components/trip/TripDetailModals.tsx` | 5 modals lazy-loaded | ✅ correct, trip-detail only |
| `src/components/PlacesSection.tsx` + `LinksPanel.tsx` | Slimmed props, `keepPreviousData` | ✅ correct, places-tab only |

**Console shows zero JS errors.** The white "Loading…" screen is the app-shell hydration gate (`preview-hydration-race-prevention`), not a crash.

## The disconnect — what I missed

**Every single change targeted `/trip/:id` and its tabs. Nothing touched the home page render path (`/`).**

That's why your refresh felt identical: when you hit `/` cold, you still pay the full cost of:

- `src/pages/Index.tsx` — **1,398 lines**, eagerly imports `CreateTripModal`, `UpgradeModal`, `SettingsMenu`, `AuthModal`, `OnboardingCarousel`, `DemoModal`, `NotificationsDialog`, `SearchOverlay`, `FullPageLanding`, plus the entire pro/event mock datasets
- `src/components/home/TripGrid.tsx` — **720 lines**, eager
- `src/components/TripCard.tsx` — **659 lines**, eager, rendered N times
- All eight home-page sibling components imported synchronously at the top of Index.tsx

So on a cold load the browser parses ~3,000 lines of home-page code + every modal you might never open, **before** React even gets to render. `keepPreviousData` only helps after that first paint succeeds, on subsequent revisits.

The previous round was correct work but aimed at the wrong surface for the symptom you're now describing.

## Fix — extend the same playbook to the home page

Five targeted, low-risk changes. No refactors, no behavior changes.

### 1. Lazy-load the seven home-page modals in `Index.tsx`
`CreateTripModal`, `UpgradeModal`, `SettingsMenu`, `AuthModal`, `DemoModal`, `OnboardingCarousel`, `NotificationsDialog`, `SearchOverlay` — all conditionally rendered behind `open` flags. Convert each to `React.lazy()` + `<Suspense fallback={null}>`. Estimated initial-bundle win: ~200–350 KB on `/`.

### 2. Lazy-load `FullPageLanding`
It only renders for the unauthenticated marketing view. Logged-in users pay for it today. Lazy.

### 3. Defer pro/event mock data
`proTripMockData` and `eventsMockData` are imported eagerly even when you only have consumer trips visible. Switch to dynamic import inside the `useMemo` that needs them, or gate behind the active tab.

### 4. Add `placeholderData: keepPreviousData` to `useDashboardJoinRequests`
Same pattern as `useTrips`. Eliminates a second skeleton flash on `/`.

### 5. Fix the unrelated console error you're hitting
`useDashboardJoinRequests.ts:112` is querying `trip_join_requests.created_at` which doesn't exist. Switch to the column that does (likely `requested_at` or `inserted_at` — verify against the table) so the fallback path stops erroring on every load.

## What this will and won't fix

**Will fix:**
- Cold-load time to first meaningful paint on `/` (the symptom you just reported)
- The home-page "Loading…" spinner persisting longer than necessary
- Repeated console errors from the join-requests query

**Won't fix:**
- The initial app-shell hydration gate (intentional, prevents Lovable preview race condition — see `mem://architecture/preview-hydration-race-prevention`)
- First-ever cold load on a fresh service worker (browser must download the JS regardless)

## Verification plan

1. `npm run typecheck && npm run build` — must stay green
2. Hard-refresh `/` in preview, confirm the loading spinner clears in <2s on warm cache
3. Open a trip, switch tabs — confirm last round's tiered mounting still works
4. Click a modal trigger (settings, create trip) — confirm it still opens (lazy chunk loads on demand)
5. Check console — confirm `trip_join_requests.created_at` error is gone

## Risk

LOW. All changes are mechanical (eager → lazy with Suspense fallback null on already-conditional renders) plus one column-name fix. Identical pattern to what shipped successfully for `TripDetailModals.tsx` last round.

## Rollback

`git revert` the single commit. Each file change is independent — partial rollback is also safe.
