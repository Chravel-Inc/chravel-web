# Places & Links

## Purpose
Save places (POIs) from Google Maps to a trip, share links with rich OG previews, build itinerary anchors. Single map instance per page (memory #18).

## Entry Points
| Component / Hook | File | Purpose |
|---|---|---|
| `PlacesSection` | `src/components/PlacesSection.tsx` | Places tab |
| `usePlaceResolution` | `src/hooks/usePlaceResolution.ts` | Resolve place_id -> details |
| `usePlacesLinkSync` | `src/hooks/usePlacesLinkSync.ts` | Sync places ↔ links |
| `useSaveToTripPlaces` | `src/hooks/useSaveToTripPlaces.ts` | Save mutation |
| `googlePlacesNew` | `src/services/googlePlacesNew.ts` | New Places API client |
| `googlePlacesCache` | `src/services/googlePlacesCache.ts` | Place response cache |
| `tripPlacesService` | `src/services/tripPlacesService.ts` | Trip-scoped place mutations |
| `linkService` | `src/services/linkService.ts` | Trip links |
| `tripLinksService` | `src/services/tripLinksService.ts` | Trip-scoped link mutations |
| `ogMetadataService` | `src/services/ogMetadataService.ts` | OG fetch + cache |

## Data Flow

**Places:**
1. User searches in Places input → `googlePlacesNew` calls Google Places API.
2. Result clicked → `useSaveToTripPlaces` mutates `trip_links` (or trip-places equivalent) via `tripPlacesService`.
3. Realtime channel on `trip_links` updates the list.

**Links:**
1. User pastes URL in chat or Links tab.
2. `chatUrlExtractor` / `linkService` strips URL.
3. `fetch-og-metadata` edge function (or `unfurl/` Render proxy for branded hosts) fetches OG tags.
4. Result cached in `google_places_cache` or `trip_links` (per source).
5. `LinkPreviewCard` renders inline.

## State Touched
- **TanStack Query keys:** `tripKeys.places(tripId, isDemoMode?)` = `['tripPlaces', tripId, isDemoMode]`, `tripKeys.tripLinks(tripId, isDemoMode?)` = `['tripLinks', tripId, isDemoMode]`
- **Cache config:** Both `staleTime: 120s, gcTime: 10m, refetchOnWindowFocus: false` (`src/lib/queryKeys.ts:136-140`)
- Map instance state lives in `MapView` component; debounced events per memory #18.

## Tables & RLS
| Table | Read | Write | Notes |
|---|---|---|---|
| `trip_links` | trip members | members | |
| `trip_link_index` | trip members | service | Search index |
| `google_places_cache` | trip members | service | TTL-bounded |
| `loyalty_*` (airlines/hotels/rentals) | self | self | User loyalty programs (related links) |

## Edge Functions Used
- `google-maps-proxy` — server-side Maps calls for key protection
- `fetch-og-metadata` — OG fetch
- `place-grounding` — grounds AI concierge with place data
- `venue-enricher` — enriches a venue with extra metadata

## Demo vs Authenticated
- Demo places are mocked. Real Maps API calls are NOT made in demo.
- Demo links are mocked OG previews.

## Mobile / PWA / Capacitor considerations
- Memory #18: **single map instance per page**, debounce drag/zoom/`bounds_changed` (300ms), null-check `mapRef.current`, cleanup listeners.
- Map can be heavy on iOS — lazy-mount when tab is visible.

## Known Risks
- Memory #18: never duplicate `MapView`. Any UI showing two maps (e.g., overview + detail simultaneously) must use a single shared instance.
- OG fetcher must respect `LESSONS.md` warning: "branded OG hosts should never be used as app CTA destinations" — the unfurl proxy at `p.chravel.app` is for rendering, not navigation targets.
- `google_places_cache` row growth — periodic cleanup via `cleanup-staging-tables` or similar.
- `VITE_GOOGLE_MAPS_API_KEY` must be restricted to your domains in Google Cloud Console.

## Source Refs
- `src/components/PlacesSection.tsx`
- `src/hooks/usePlaceResolution.ts`, `usePlacesLinkSync.ts`, `useSaveToTripPlaces.ts`
- `src/services/googlePlacesNew.ts`, `googlePlacesCache.ts`, `tripPlacesService.ts`, `linkService.ts`, `tripLinksService.ts`, `ogMetadataService.ts`, `openStreetMapFallback.ts`
- `supabase/functions/google-maps-proxy/`, `fetch-og-metadata/`, `place-grounding/`, `venue-enricher/`
- `unfurl/` (Render-hosted proxy)
- `src/lib/queryKeys.ts:40-47`
- `agent_memory.jsonl` #18
- `docs/ACTIVE/GOOGLE_MAPS_PLACES_INTEGRATION.md`
