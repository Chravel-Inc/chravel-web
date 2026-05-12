# Stack at a Glance

All versions verified from `package.json` at SHA `1e833665`. Adjust this section in any regen pass — these are caret ranges, not pins.

## Runtime / Engine

| Item | Value | Source |
|---|---|---|
| Node engine | `>=20.0.0` | `package.json:6-8` |
| Module type | `"type": "module"` (ESM) | `package.json:5` |
| Package manager | not declared (use `npm`) | `package.json` (no `packageManager` field) |
| TypeScript | 5.9.3 | `package.json:153` |
| TS strict | **OFF** (`"strict": false`, `"noImplicitAny": false`) | `tsconfig.app.json:13,20` |
| Path alias | `@/* → ./src/*` | `tsconfig.app.json:16-18` |
| Target | ES2020 | `tsconfig.app.json:21` |

## Frontend framework

| Item | Version | Source |
|---|---|---|
| React | 18.3.1 | `package.json:124` |
| React DOM | 18.3.1 | `package.json:126` |
| React Router DOM | 6.26.2 | `package.json:131` |
| Vite | 5.4.21 | `package.json:140` |
| Vite React plugin | `@vitejs/plugin-react-swc` 3.5 | `package.json:94` |

## State management

| Item | Version | Source |
|---|---|---|
| TanStack Query | 5.56.2 | `package.json:83` |
| Zustand | 5.0.6 | `package.json:142` |
| TanStack Virtual | 3.13.18 | `package.json:84` |

## UI primitives & styling

| Item | Version | Source |
|---|---|---|
| Tailwind CSS | 3.4.11 | `package.json:136` |
| tailwindcss-animate | 1.0.7 | `package.json:137` |
| Tailwind typography | 0.5.15 | `package.json:82` |
| Radix UI primitives | 23 packages, `^1.x` or `^2.x` | `package.json:57-78` |
| `lucide-react` icons | 0.462.0 | `package.json:119` |
| `framer-motion` | 10.18.0 | `package.json:108` |
| `cmdk` | 1.1.1 | `package.json:99` |
| `vaul` (drawer) | 0.9.3 | `package.json:139` |
| `sonner` (toasts) | 2.0.6 | `package.json:133` |
| `next-themes` | 0.3.0 | `package.json:120` |
| `react-day-picker` | 8.10.1 | `package.json:125` |
| `embla-carousel-react` | 8.3.0 | `package.json:102` |
| `react-dropzone` | 14.3.8 | `package.json:127` |
| `recharts` | 2.12.7 | `package.json:132` |

## Backend / data

| Item | Version | Source |
|---|---|---|
| Supabase JS | 2.53.0 | `package.json:81` |
| Stream Chat JS | 9.40.0 | `package.json:134` |
| LiveKit Client | 2.18.1 | `package.json:117` |

## Integrations (client side)

| Item | Version | Source |
|---|---|---|
| RevenueCat web | 1.23.0 | `package.json:79` |
| Sentry React | 10.43.0 | `package.json:80` |
| PostHog JS | 1.360.2 | `package.json:122` |
| Google Maps loader | 1.16.10 | `package.json:55` |

## Build / dev / lint / test

| Item | Version | Source |
|---|---|---|
| ESLint | 9.9.0 | `package.json:103` |
| Prettier | 3.1.0 | `package.json:123` |
| Husky | 8.0.3 | `package.json:112` |
| lint-staged | 15.2.0 | `package.json:116` |
| Vitest | 4.0.18 | `package.json:154` |
| Vitest coverage (v8) | 4.0.18 | `package.json:147` |
| `happy-dom` | 20.0.11 | `package.json:110` |
| `jsdom` | 27.4.0 | `package.json:149` |
| Playwright | 1.58.2 | `package.json:56` |
| `knip` (dead code) | 6.3.0 | `package.json:150` |
| `ts-prune` | 0.10.3 | `package.json:151` |
| `tsx` | 4.21.0 | `package.json:152` |
| `workbox-build` (SW) | 7.4.0 | `package.json:141` |

## Utility libs

| Item | Version | Source |
|---|---|---|
| `date-fns` | 3.6.0 | `package.json:100` |
| `clsx` | 2.1.1 | `package.json:98` |
| `tailwind-merge` | 2.5.2 | `package.json:135` |
| `class-variance-authority` | 0.7.1 | `package.json:97` |
| `react-markdown` | 10.1.0 | `package.json:130` |
| `react-intersection-observer` | 10.0.3 | `package.json:129` |
| `react-image-crop` | 11.0.10 | `package.json:128` |
| `browser-image-compression` | 2.0.2 | `package.json:96` |
| `jspdf` + `jspdf-autotable` | 4.2.0 + 5.0.2 | `package.json:114-115` |
| `html2canvas` | 1.4.1 | `package.json:111` |
| `exceljs` | 4.4.0 | `package.json:106` |
| `idb` (IndexedDB wrapper) | 8.0.3 | `package.json:113` |
| `fake-indexeddb` (test) | 6.2.5 | `package.json:107` |
| `dotenv` | 17.2.3 | `package.json:101` |
| `@dnd-kit/*` | 6.3.1 / 10.0.0 / 3.2.2 | `package.json:49-51` |
| `@emoji-mart/*` | 1.2.1 / 1.1.1 | `package.json:52-53` |
| `lovable-tagger` (dev only) | 1.1.7 | `package.json:118` |

## Scripts (from `package.json:9-47`)

| Script | What it does |
|---|---|
| `npm run dev` | `vite` |
| `npm run build` | `vite build && node scripts/build-sw.cjs` |
| `npm run build:dev` | `vite build --mode development` |
| `npm run preview` | `vite preview` |
| `npm run lint` | `eslint . --fix` |
| `npm run lint:check` | `eslint .` |
| `npm run lint:budget` | `node scripts/eslint-warning-budget.cjs` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | `prettier --write ...` |
| `npm run format:check` | `prettier --check ...` |
| `npm run validate` | lint:check + typecheck + format:check |
| `npm run test` | `vitest` |
| `npm run test:run` | `vitest run` |
| `npm run test:run:ci` | `vitest run --reporter=dot --coverage` |
| `npm run test:e2e` | `playwright test` |
| `npm run test:e2e:smoke` | `playwright test e2e/tests/pwa-smoke.spec.ts --project=chromium` |
| `npm run doctor` | `bash scripts/doctor.sh` |
| `npm run validate-env` | `npx tsx scripts/validate-env.ts` |
| `npm run qa:tier0` | tier-0 QA gate |
| `npm run qa:guardrails` | tier0 + skip-policy + e2e-docs + voice-model-guard |
| `npm run qa:chat-production-readiness` | chat readiness gate |
| `npm run screenshots:appstore[:iphone|:ipad|:all]` | App Store screenshot capture |
| `npm run optimize` | optimizer CLI |
| `npm run ops:check-stream-parity` | Stream Chat config parity check |

## Build pipeline (from `vite.config.ts`)

| Aspect | Value | Source |
|---|---|---|
| Base path | `/` (P0 fix: relative base broke `/join/:code` deep links) | `vite.config.ts:21-23` |
| Dev server | host `0.0.0.0`, port `8080` | `vite.config.ts:24-27` |
| Build version | `Date.now().toString(36)` injected as `__BUILD_VERSION__` in `index.html` | `vite.config.ts:7,10-15` |
| Inject `VITE_BUILD_ID` | Falls back to `RENDER_GIT_COMMIT` or buildVersion | `vite.config.ts:38-40` |
| Inject `VITE_DEPLOY_SHA` | From `VERCEL_GIT_COMMIT_SHA` or `RENDER_GIT_COMMIT` or `'local'` | `vite.config.ts:42-44` |
| Inject `VITE_DEPLOY_TIMESTAMP` | ISO timestamp at build time | `vite.config.ts:45` |
| Minifier | esbuild | `vite.config.ts:86` |
| Source maps | enabled when `mode !== 'production'` | `vite.config.ts:92` |
| Chunk size warn | 1000 KB | `vite.config.ts:90` |
| Assets inline | ≤ 4096 B | `vite.config.ts:94` |
| Excluded from deps optimize | `@sentry/react`, `posthog-js` | `vite.config.ts:100` |

### Manual chunks (`vite.config.ts:52-67`)

- `react-vendor` — react, react-dom, react-router-dom
- `ui-vendor` — Radix dialog/dropdown/select/tabs
- `supabase` — @supabase/supabase-js
- `utils` — date-fns, clsx, tailwind-merge
- `charts` — recharts
- `pdf` — jspdf, jspdf-autotable, html2canvas
- `revenuecat-web` — @revenuecat/purchases-js (808 KB — only loaded at paywall)

## What is NOT in this repo

- React Native — Chravel uses Capacitor instead. See `chravel-mobile` sister repo.
- Capacitor — wrapper config is in `chravel-mobile`, not here.
- Python — except `appstore/scripts/generate_marketing_screenshots.py` for one screenshot script.
- A traditional Node/Express server — Supabase Edge Functions cover backend logic.
- GraphQL — direct Supabase JS client + RPC calls only.
- OpenAI SDK on the client — `openai-chat` edge function exists as legacy; AI traffic is Gemini.

## Source Refs

- `package.json:1-156`
- `tsconfig.app.json:1-25`
- `tsconfig.json:1-22`
- `vite.config.ts:1-102`
