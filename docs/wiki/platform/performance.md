# Performance

## Headline numbers (verified at SHA `1e833665`)

| Metric | Value | Source |
|---|---|---|
| Total `.ts/.tsx` files in `src` | 1,105 | `find` count |
| Custom hooks | 107 | `ls src/hooks` |
| Services | 80 | `ls src/services` |
| Components | ~365 | `ls src/components` |
| Lazy routes | 33 | `src/App.tsx:39-99` |
| Test files | 217 (`*.test.*` / `*.spec.*` under `src`) | `find` count |
| ESLint warning baseline | 1,293 | `CLAUDE.md` (budget-tracked) |

## Bundle strategy

Vite manual chunks (`vite.config.ts:52-67`):

| Chunk | Contents | Notes |
|---|---|---|
| `react-vendor` | react, react-dom, react-router-dom | Stable; rarely re-fetched |
| `ui-vendor` | Radix dialog/dropdown/select/tabs | Core UI primitives |
| `supabase` | `@supabase/supabase-js` | Single Supabase client |
| `utils` | date-fns, clsx, tailwind-merge | Shared utilities |
| `charts` | recharts | Heavier; loaded when charts render |
| `pdf` | jspdf, jspdf-autotable, html2canvas | Export-path-only |
| `revenuecat-web` | `@revenuecat/purchases-js` | 808 KB — only loaded at paywall |

Build minifier: `esbuild`. CSS minify: enabled. Asset inline limit: 4096 B. Source maps off in production builds.

## Code splitting

Every route in `src/App.tsx:39-99` is lazy-loaded via `retryImport` (`src/lib/retryImport.ts`). `<LazyRoute>` provides Suspense boundary + error fallback. Chunk-load failures auto-recover via `src/App.tsx:243-298`.

## Cache buster

Chunk filenames include build version: `assets/js/[name]-[hash]-${buildVersion}.js` (`vite.config.ts:69-70`). `index.html` is uncached so stale clients always get a fresh manifest.

## Re-render hotspots (audit targets)

| Component | Why | Mitigation |
|---|---|---|
| `TripDetail` (and `TripDetailDesktop`/`MobileTripDetail`) | Many tabs, heavy data fan-in | Tab data isolated; per-tab query keys |
| `ChatMessages` / `TripChat` | Realtime + virtualization | `@tanstack/react-virtual` 3.13.18 (`package.json:84`); `VirtualizedMessageContainer` |
| `MapView` / `PlacesSection` | Map re-renders are expensive | Memory #18: one instance, debounced events |
| `UnifiedMediaHub` | Large list | Virtualization |
| `AIConciergeChat` (orchestrator) | Extracted to `src/features/concierge/hooks/` to reduce monolith |

## Realtime cap

Supabase Realtime client config: `eventsPerSecond: 40` (`src/integrations/supabase/client.ts:48`). Per-channel filters by `trip_id` are required (memory #20) — unfiltered subscriptions are an N×M cost.

## Query cache (TanStack 5)

Per-domain stale/gc tuning at `src/lib/queryKeys.ts:71-158`. Heavy domains (media, places, channels) have longer stale times and `refetchOnWindowFocus: false`. Sensitive domains (payments) refetch on focus. See `architecture/03-state-management.md`.

## Image pipeline

- Client-side compression via `browser-image-compression` 2.0.2 (`package.json:96`) before upload (memory #12).
- Server-side validation + signed URL via `file-upload` / `image-upload` edge functions (memory #17).
- `image-proxy` (`verify_jwt = false`) serves transformed images via capability tokens.

## Offline / IndexedDB

- `idb` 8.0.3 (`package.json:113`) for IndexedDB wrapping.
- Offline message queue: `src/services/offlineMessageQueue.ts`.
- Global sync processor: `src/services/globalSyncProcessor.ts`.
- Prefetch metadata: `offline_prefetch_metadata` table.

## Known performance regressions / risks

- **Read-receipt write amplification** (`DEBUG_PATTERNS.md`): N×M upserts per visible message. Throttle/debounce in `readReceiptService.ts`.
- **Reaction refetch storm** (`DEBUG_PATTERNS.md`): full reactions refetch on every new message — guard against regression.
- **Preference injection on irrelevant queries** (`DEBUG_PATTERNS.md`): wasted concierge tokens. Memory #24 — conditional tool loading via query class.
- **Chunk size warn limit set at 1000 KB** (`vite.config.ts:90`). Some vendor chunks (rcat-web, pdf) push this.
- **Concierge monoliths**: `lovable-concierge` (2,155 lines), `functionExecutor.ts` (143 KB), `contextBuilder.ts` (30 KB). High refactor cost.
- **Flat directories**: `src/hooks/` (107 files), `src/services/` (80 files) — slow IDE navigation; needs modularization per feature.

## Tooling

| Tool | Purpose | Script |
|---|---|---|
| `knip` 6.3.0 | Dead exports | `package.json:150` |
| `ts-prune` 0.10.3 | Unused exports | `package.json:151` |
| `eslint-warning-budget.cjs` | Track lint debt | `npm run lint:budget` |
| Lighthouse / Web Vitals | Manual perf checks | not wired in CI |

## Source Refs

- `vite.config.ts:1-102` — full Vite config
- `src/lib/queryKeys.ts:71-158` — cache config
- `src/integrations/supabase/client.ts:46-50` — realtime cap
- `src/App.tsx:39-99, 243-298` — lazy loading + chunk-load recovery
- `package.json:96, 113, 84, 150, 151` — perf-relevant deps
- `CLAUDE.md` — ESLint warning baseline + tech-debt notes
- `DEBUG_PATTERNS.md` — performance regression patterns
- `agent_memory.jsonl` #12, #17, #18, #20, #24
