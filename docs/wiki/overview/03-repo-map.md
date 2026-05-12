# Repo Map

Top-level directories at SHA `1e833665`. One line each. Cross-link target docs where applicable.

## Top-level

| Dir | Purpose | Notes |
|---|---|---|
| `src/` | Frontend source — 1,105 .ts/.tsx files | See `architecture/02-routing.md`, `architecture/03-state-management.md` |
| `supabase/` | Edge functions + migrations | 88 functions, 358 migrations, 215 tables, 824 RLS policies |
| `public/` | Static assets served as-is by Vite | manifest.json, icons, robots.txt, etc. |
| `e2e/` | Playwright end-to-end tests | See `testing/e2e-strategy.md` |
| `docs/` | All product/engineering docs | This wiki lives at `docs/wiki/`. Existing `docs/ACTIVE/`, `docs/ADRs/`, `docs/ios/` are cross-linked, not duplicated. |
| `scripts/` | Build, QA, env, screenshot, dead-code scripts | `build-sw.cjs`, `validate-env.ts`, `doctor.sh`, `qa/*.cjs`, etc. |
| `api/` | Vercel Edge Functions for OG link previews | Small surface — 4 functions |
| `unfurl/` | Render-hosted unfurl proxy for branded OG previews | Lives separately for `p.chravel.app` host |
| `migrations/` | (legacy) | Modern migrations live under `supabase/migrations/` |
| `.github/workflows/` | 13 CI workflows | See `architecture/08-deployment-topology.md` |
| `agent/`, `tasks/`, `optimizer/`, `qa/` | Misc tooling and notes | Not part of the runtime build |
| `remotion/` | Video / motion graphics tooling | Optional artifact pipeline |
| `appstore/`, `playstore/` | Store metadata + screenshot scripts | App Store / Play Store assets |
| `macos/`, `ios-release/` | Native release scaffolding | iOS app shell lives in `chravel-mobile`; this dir holds adjacent assets |
| `.husky/` | Git hooks | `prepare` script installs |
| `.claude/`, `.cursor/`, `.lovable/`, `.agents/`, `.ai/` | AI agent harness configs | Not runtime |
| `test-results/`, `tmp/`, `optimizer_knowledge/` | Generated / scratch | gitignored or transient |

## `src/` (one level down)

Source: directory listing under `/home/user/chravel-web/src/` plus file-count counts verified via `find`.

| Path | Files | Purpose |
|---|---|---|
| `src/App.tsx` | 1 | Composition root + 33 lazy routes |
| `src/main.tsx` | 1 | Vite entry, renders `<App />` |
| `src/components/` | ~365 | Shared components (flat; some debt — see `RISKS.md`) |
| `src/features/` | 6 modules | `broadcasts/`, `calendar/`, `chat/`, `concierge/`, `smart-import/`, `trips/` |
| `src/hooks/` | 107 | Custom hooks (flat) |
| `src/services/` | 80 | Domain services (flat) |
| `src/pages/` | 36 | Page-level route targets |
| `src/store/` + `src/stores/` | 6 stores total | Zustand state. See `architecture/03-state-management.md` |
| `src/integrations/` | — | `supabase/client.ts`, `revenuecat/*` |
| `src/billing/` | — | Subscription tier config + types + providers + tests |
| `src/lib/` | — | `queryKeys.ts`, `queryClient.ts`, utilities |
| `src/types/` | — | TypeScript domain types |
| `src/utils/` | — | Pure utilities |
| `src/contexts/` | — | React contexts (consumer subscription provider, etc.) |
| `src/config/` | — | App config constants |
| `src/constants/` | — | Hard-coded constants (RevenueCat entitlement IDs, etc.) |
| `src/data/` | — | Static data (curated lists, etc.) |
| `src/mockData/` | — | Demo mode data — **never mutate** (see memory #27) |
| `src/offline/` | — | IndexedDB cache + offline queue |
| `src/platform/` | — | Platform-specific shims (Capacitor bridge surface lives here when present) |
| `src/voice/` | — | Voice concierge client-side state |
| `src/telemetry/` | — | PostHog + Sentry event helpers |
| `src/assets/` | — | Bundled assets (app screenshots, landing imagery, etc.) |
| `src/__tests__/` | — | Vitest specs at root level (`security_audit_structured_objects.test.ts` etc.) |

## `supabase/` (one level down)

| Path | Count | Purpose |
|---|---|---|
| `supabase/functions/` | 88 functions + `_shared/` | Edge functions (Deno). See `architecture/06-edge-functions.md` |
| `supabase/functions/_shared/` | ~40 utilities | Shared auth, CORS, AI gateway, validation, feature flags |
| `supabase/migrations/` | 358 .sql files | Append-only schema history. See `architecture/04-data-model-er.md` |
| `supabase/config.toml` | 1 | Project ID + per-function `verify_jwt` flags |

## `docs/` (one level down)

| Path | Purpose |
|---|---|
| `docs/wiki/` | **This wiki** — auto-generated, regeneratable |
| `docs/ACTIVE/` | Live reference docs (35+ files): handbook, auth setup, environment guide, schema audit, security findings |
| `docs/ADRs/` | Architecture Decision Records: 002 (Supabase over Firebase), 003 (Google Maps over Mapbox), 004 (TanStack Query over Redux) |
| `docs/ios/` | iOS-specific feature guides — companion docs to `chravel-mobile` repo |
| `docs/mobile/` | Mobile/Capacitor guides |
| `docs/ops/` | Incident response, reliability runbooks |
| `docs/audits/` | Forensic audits (stream coherence, data evolution, launch readiness) |
| `docs/_archive/` | Archived docs (~300+ files) |
| (root level) | 124+ MD files: README, design system, AI concierge notes, Gemini Live notes, security audits |

## `scripts/` (highlights)

| Script | Purpose |
|---|---|
| `scripts/build-sw.cjs` | Build the service worker (runs after `vite build`) |
| `scripts/doctor.sh` | Health check for local dev env |
| `scripts/validate-env.ts` | Ensure env vars are configured |
| `scripts/check-env-coverage.ts` | CI: validate env var coverage |
| `scripts/lint-migrations.ts` | Validate new migration safety |
| `scripts/eslint-warning-budget.cjs` | Budget-tracked ESLint warning count |
| `scripts/qa/validate-tier0-gate.cjs` | Tier-0 QA gate |
| `scripts/qa/check-skipped-tests.cjs` | Block skipped tests in critical paths |
| `scripts/qa/voice-model-guard.cjs` | Pin voice model version |
| `scripts/qa/run-chat-production-readiness-gate.cjs` | Chat readiness gate |
| `scripts/check-stream-config-parity.cjs` | Stream Chat config parity |
| `scripts/capture-appstore-screenshots.ts` | App Store screenshot capture |

## Source Refs

- Top-level `ls` at SHA `1e833665`
- `package.json:9-47` — script names confirm presence
- `tsconfig.app.json:24` — `include: ["src"]` confirms src is the TS root
- `supabase/config.toml` — confirms Supabase project structure
- Existing `docs/ACTIVE/CODEBASE_MAP.md` — supplementary mapping with deeper detail per module
