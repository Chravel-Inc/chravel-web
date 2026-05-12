# Google Maps

## Why we use it
Places search, place details, geocoding, autocomplete, map render for places + location sharing. ADR-003 (`docs/ADRs/003-google-maps-over-mapbox.md`) documents the choice.

## Where it's initialized
- Loader: `@googlemaps/js-api-loader` 1.16.10 (`package.json:55`)
- Client services: `src/services/googlePlacesNew.ts` (new Places API), `googlePlacesCache.ts` (cache), `googleMapsService.ts`
- Components: `src/features/chat/components/GoogleMapsWidget.tsx`; the shared `MapView` (one instance per page, memory #18)
- Fallback: `src/services/openStreetMapFallback.ts` (if Maps fails)

## API surface used
- Places API (new) — `searchText`, `searchNearby`, `getPlace`, autocomplete
- Maps JavaScript API — `Map`, `Marker`, `InfoWindow`, drag/zoom events (debounced 300ms per `CLAUDE.md` Maps rule #3)
- Geocoding API — server-side via `google-maps-proxy`

## Env vars
| Var | Side | Purpose |
|---|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | client | Maps JS key (restrict to chravel.app + localhost in GCP Console) |
| `GOOGLE_MAPS_API_KEY` | edge | Server-side calls (`google-maps-proxy`) |

## Failure modes & retry behavior
- Quota exceeded -> `openStreetMapFallback.ts` provides a degraded mode for basic location display.
- Place autocomplete debounced 300ms to limit billable calls.
- `googlePlacesCache.ts` caches by `place_id` (and stores in `google_places_cache` table) to avoid duplicate billed lookups.

## Cost / quota notes
- Maps + Places billed per request. The proxy + cache combo is critical for cost containment.
- Restricting the client key to specific HTTP referrers is mandatory.

## Mobile / PWA / Capacitor considerations
- Memory #18: **one map instance per page**. Never render two `MapView`s simultaneously.
- Debounce drag/zoom/`bounds_changed` to 300ms (`CLAUDE.md` Maps rule #3).
- Always null-check `mapRef.current`.
- Cleanup listeners in `useEffect` return.
- iOS performance — lazy-mount map when its tab is active.

## Source Refs
- `src/services/googlePlacesNew.ts`, `googlePlacesCache.ts`, `googleMapsService.ts`, `openStreetMapFallback.ts`
- `src/features/chat/components/GoogleMapsWidget.tsx`
- `supabase/functions/google-maps-proxy/`
- `docs/ADRs/003-google-maps-over-mapbox.md`
- `docs/ACTIVE/GOOGLE_MAPS_PLACES_INTEGRATION.md`
- `agent_memory.jsonl` #18
- `CLAUDE.md` — Google Maps rules section
