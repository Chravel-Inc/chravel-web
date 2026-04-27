# Speed & Latency Plan — Perceived Performance Overhaul

Goal: cut time-to-interactive on home, trip open, tab switches, and Places — without changing UI, behavior, or dependencies. Same code paths, smarter timing.

Mobile note: iOS/Android ship via **Expo Go + EAS** (web app loaded in a WebView shell). Every web-bundle win below applies directly to the mobile builds — smaller JS, fewer queries, and faster paint all carry over.

---

## 1. Home page — kill the golden-spinner wait

**File:** `src/pages/Index.tsx`, `src/hooks/useTrips.ts`

- Replace full-page `LoadingSpinner` during `authLoading` with a dashboard skeleton shell (header + 3 trip card skeletons). Page paints in <100ms.
- Add `placeholderData: keepPreviousData` to `useTrips` so the last-known trip list renders instantly while the fresh fetch runs in the background.
- Keep the existing hydration gate (preview-race fix) intact.

## 2. Trip cards — prefetch on hover/touch

**File:** `src/components/home/TripGrid.tsx`, `src/components/home/TripCard.tsx`

- On `onMouseEnter` / `onTouchStart`: warm the `TripDetail` route chunk + prefetch `useTrip(tripId)`, `useTripMembers(tripId)`, and the priority tab chunks (chat/calendar).
- Idempotent — TanStack Query and dynamic `import()` both dedupe.
- By the time the click fires, the chunk + first-screen data are already cached.

## 3. Trip detail — tiered tab pre-mount (the "click away and back" fix)

**Files:** `src/components/TripTabs.tsx`, `src/components/mobile/MobileTripTabs.tsx`

Three tiers based on cost vs. likelihood of use:

- **Tier 1 — pre-mount immediately** (visible or near-certain): Chat, Calendar, Concierge.
- **Tier 2 — pre-mount after 800ms idle**: Tasks, Polls, Places, Payments. Eliminates the "click → blank → click away → come back" bug for Places and Payments without paying the full burst cost on trip open.
- **Tier 3 — lazy on first click**: Media (heavy gallery + video).

Mechanism: render hidden (`display:none`) Suspense boundaries for Tier 1 on mount; schedule Tier 2 via `requestIdleCallback` (with `setTimeout` fallback). Already-mounted tabs stay mounted (current behavior preserved).

Also: when a tab has cached query data, render it immediately (`placeholderData: keepPreviousData`) instead of showing the Suspense skeleton.

## 4. Chat — render shell first, hydrate messages second

**File:** `src/features/chat/components/TripChat.tsx`

- Render the chat header + composer immediately on mount, even while `messages` is loading.
- Show 3-5 skeleton message bubbles in the scroll area instead of a full-component spinner.
- No change to subscription, send, or realtime logic.

## 5. Bundle — defer heavy non-critical imports

**Files:** `src/components/TripDetail.tsx` and siblings

- `React.lazy()` the following (all loaded eagerly today, ~80KB+ gz combined):
  - `TripDetailModals` (66KB gz)
  - `SettingsMenu`
  - Any modal-only component not needed for first paint
- Wrap in `<Suspense fallback={null}>`. Modals only mount when opened — invisible to the user, big win on first paint. Particularly impactful inside the Expo WebView where JS parse cost is higher than desktop Chrome.

## 6. Prefetch timing tightening

**File:** `src/hooks/usePrefetchTrip.ts`

- Move the priority-tab prefetch (chat + calendar) to fire as soon as `tripId` is known, not after the trip detail mounts.
- Lower the stagger between Tier-1 and Tier-2 prefetches.

## 7. Places tab — slim down without changing UI

The actual `PlacesSection.tsx` is 256 lines / 11 hooks (the earlier 720/21 figure was wrong — that scale lives across the panel + service tree). Real wins:

**a. Consolidate basecamp queries** — `src/hooks/useTripBasecamp.ts` + `src/hooks/usePersonalBasecamp.ts`
- Two separate queries fire on Places mount. Run them in parallel via `useQueries` (or combine into one `useBasecamps(tripId)` hook) to remove the waterfall step.

**b. Lazy-load the map** — `src/components/places/MapCanvas.tsx` + Google Maps JS SDK
- The Maps SDK is the single biggest cost on the Places tab (~150KB+ gz, plus tile network). `React.lazy()` `MapCanvas` and only load the Google Maps script on first map render. The list/links render immediately.

**c. Trim `LinksPanel` props** — `src/components/places/LinksPanel.tsx`
- Accepts 9 props, uses 1 (`tripId`). Drop the rest and stop computing `linkedPlaceIds`/`places` in the parent. Removes a `useMemo` and a Set construction on every Places render.

**d. Cache + `placeholderData` on `fetchTripPlaces`** — `src/services/tripPlacesService.ts`
- Add `placeholderData: keepPreviousData` and bump `staleTime` to 60s. The IndexedDB cache already exists; surface it to React Query so the list paints instantly on revisit.

**e. Lazy-mount `AddPlaceModal`** in `LinksPanel` — only when the user opens it.

No visual change. Same features. Fewer queries, smaller initial bundle, instant repeat-visit paint.

---

## What stays the same

- All features, layouts, copy, animations.
- All existing data, RLS, realtime, auth flows.
- No new dependencies. No business-logic refactors.
- Demo mode untouched.

## Expected impact

| Path | Before | After (target) |
|---|---|---|
| Home first paint | 1.5–4s spinner | <200ms skeleton, trips in <500ms |
| Trip open (warm) | 800ms–2s | <300ms |
| Tab switch (Tier 1) | 200–600ms | instant |
| Tab switch (Places/Payments first time) | "click → blank → click away → back" | <300ms, no away-and-back |
| Places tab open (repeat) | 600ms–1.5s | <200ms |
| Initial JS on trip detail | baseline | −80KB+ gz from deferred modals |

iOS/Android (Expo Go + EAS WebView) inherit every gain.

## Risk & rollback

- Low risk — all changes are timing/ordering/lazy-loading, no logic rewrites.
- Each item ships independently; revert any single commit if regression appears.
- Tier 2 pre-mount delay is a single tunable constant.

## Verification

- `npm run lint && npm run typecheck && npm run build` after each step.
- Manual: cold-load home, open trip, click each tab in order, then click Places/Payments first — confirm no blank-then-reload.
- Lighthouse before/after on home + trip detail.
- Smoke-test in Expo Go to confirm WebView parity.

## Memory correction (post-approval)

Update `mem://architecture/capacitor-purged-web-pure-react` → "Pure React web app shipped to mobile via Expo Go + EAS WebView. No Capacitor, no React Native screens." Adjust the Core memory line accordingly.
