# Media

## Purpose
Per-trip photo/video/file gallery with compression, server-side validation, AI tagging, and search.

## Entry Points
| File | Purpose |
|---|---|
| `src/components/UnifiedMediaHub.tsx` | Unified gallery |
| `src/components/media/MediaUrlsPanel.tsx` | URL panel |
| `src/hooks/useMediaManagement.ts` | Upload + delete |
| `src/hooks/useMediaLimits.ts` | Quota check |
| `src/hooks/useResolvedTripMediaUrl.ts` | Resolve signed URLs |
| `src/services/mediaService.ts` | CRUD |
| `src/services/tripMediaService.ts` | Trip-scoped |
| `src/services/tripMediaUrlResolver.ts` | URL resolution |
| `src/services/mediaSearchService.ts` | Search |
| `src/services/mediaAITagging.ts` | AI tagging |

## Data Flow
1. User picks file → `browser-image-compression` (`package.json:96`) compresses (memory #12).
2. Upload via `mediaService` → `file-upload` or `image-upload` edge function.
3. Edge function validates (size, MIME, virus-ish heuristics) → uploads to Supabase Storage → returns signed URL.
4. DB row in `trip_photos` / `trip_files`.
5. `mediaAITagging` enqueues to `ai_processing_queue` → `file-ai-parser` extracts tags / OCR → updates `file_ai_extractions`.
6. Search index `trip_media_index` populated for the gallery search bar.

## State Touched
- **TanStack Query keys:** `tripKeys.media(tripId, isDemoMode?)` = `['tripMedia', tripId, isDemoMode]`
- **Cache config:** `staleTime: 120s, gcTime: 10m, refetchOnWindowFocus: false` (`src/lib/queryKeys.ts:114-119`)

## Tables & RLS
| Table | Read | Write | Notes |
|---|---|---|---|
| `trip_photos` | trip members | uploader + admins | |
| `trip_files` | trip members | uploader + admins | |
| `trip_media_index` | trip members | service | Search |
| `file_ai_extractions` | trip members | service | OCR / tags |
| `audio_summaries` | self | service | |
| `audio_usage_quota` | self | service | |
| `ocr_rate_limits` | service | service | |

## Edge Functions Used
- `file-upload` — validation + signed URL issuance
- `image-upload` — image-specific path
- `image-proxy` (verify_jwt = false) — transforms / serves images
- `file-ai-parser` — OCR + AI parsing
- `process-receipt-ocr` (overlap with payments)

## Demo vs Authenticated
- Demo media reads from `src/mockData/` and `src/assets/`.
- Demo upload is no-op or local-only.

## Mobile / PWA / Capacitor considerations
- Compression happens client-side via `browser-image-compression` to reduce upload bandwidth (memory #12).
- iOS native camera capture goes through Capacitor (in `chravel-mobile`), not here.
- Large gallery virtualization for memory pressure on iOS.

## Known Risks
- Memory #12: compression before storage is required; uncompressed uploads can blow storage quotas.
- Memory #17: server-side validation + signed URLs + cleanup triggers all required.
- `image-proxy` is `verify_jwt = false`. Must enforce capability tokens (DEBUG_PATTERNS #1).
- `trip_photos` and `trip_files` storage paths must be RLS-gated; a leaked signed URL is a P0.

## Source Refs
- `src/components/UnifiedMediaHub.tsx`, `src/components/media/MediaUrlsPanel.tsx`
- `src/hooks/useMediaManagement.ts`, `useMediaLimits.ts`, `useResolvedTripMediaUrl.ts`
- `src/services/mediaService.ts`, `tripMediaService.ts`, `tripMediaUrlResolver.ts`, `mediaSearchService.ts`, `mediaAITagging.ts`
- `supabase/functions/{file-upload,image-upload,image-proxy,file-ai-parser,process-receipt-ocr}/`
- `src/lib/queryKeys.ts:36-39`
- `agent_memory.jsonl` #12, #17
- `DEBUG_PATTERNS.md` — capability token default secret fallback
