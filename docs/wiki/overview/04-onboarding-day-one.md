# Day-One Onboarding

A fresh contributor lands here. Goal: from `git clone` to a passing local build in under 30 minutes, then a first reviewable PR.

> **Read first:** [`CLAUDE.md`](../../../CLAUDE.md) (engineering manifesto) and [`docs/ACTIVE/DEVELOPER_HANDBOOK.md`](../../ACTIVE/DEVELOPER_HANDBOOK.md). This page bootstraps the environment; those documents explain the rules.

## 0. Prereqs

- **Node `>=20.0.0`** (`package.json:6-8`). Use `nvm` and `nvm install 20`.
- **npm** (no `packageManager` field declared — npm assumed).
- Git, a terminal, an editor.
- Access to the Supabase project (URL `https://jmjiyekmxwsxkfnqwyaa.supabase.co`) — request `VITE_SUPABASE_URL` + a publishable key from a teammate.
- Optional: Google Maps API key for Places features.

## 1. Clone and install

```bash
git clone <repo>
cd chravel-web
npm install
```

`npm install` runs `husky install` via the `prepare` script (`package.json:30`). This wires git hooks under `.husky/`.

## 2. Env vars

```bash
cp .env.example .env
# Fill in at minimum:
#   VITE_SUPABASE_URL
#   VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY)
```

Full env reference: `.env.example` at repo root. ~94 vars referenced from code via `import.meta.env`. The minimum for `npm run dev` to load the app is the two Supabase vars above.

Validate completeness with:
```bash
npm run validate-env
```
which runs `npx tsx scripts/validate-env.ts`.

## 3. Run the dev server

```bash
npm run dev
```

Defaults: `host 0.0.0.0`, `port 8080` (`vite.config.ts:24-27`). Open `http://localhost:8080`.

The app boots through:
1. `index.html` (with `__BUILD_VERSION__` placeholder replaced by `vite.config.ts:10-15`).
2. `src/main.tsx` mounts `<App />`.
3. `src/App.tsx:300-615` wraps in `<QueryClientProvider>` → `<AuthProvider>` → `<ConsumerSubscriptionProvider>` → `<AppInitializer>` → `<Router>`.
4. The default `/` route is `<Index />` lazy-loaded via `retryImport`.

## 4. Build gate (must pass before any commit)

Per `CLAUDE.md`:
```bash
npm run lint && npm run typecheck && npm run build
```

If `build` fails:
1. Read the error (file + line).
2. Check bracket / JSX balance.
3. Re-run `typecheck` to surface the underlying TS error.
4. Fix and re-run.

If a Vercel deploy fails after push, check the Vercel deployment logs.

## 5. Run the tests

```bash
npm run test:run          # Vitest, no watch
npm run test:run:ci       # CI: reporter=dot, with coverage
npm run test:e2e          # Playwright (requires E2E env)
npm run test:e2e:smoke    # Playwright smoke only (chromium)
```

Vitest pulls a mix of `happy-dom` and `jsdom` (see `package.json:110, 149`).

## 6. Local doctor check

```bash
npm run doctor   # scripts/doctor.sh
```

Reports common local-env issues. Not required, but useful when something feels off.

## 7. First reviewable PR loop

1. Create a branch off `main`: `git checkout -b your-name/feature-x`.
2. Read the relevant subsystem in [`docs/wiki/subsystems/`](../subsystems/). Note the cited file paths.
3. Make the smallest correct change. Per `CLAUDE.md`:
   - Don't introduce new libs.
   - Don't weaken RLS.
   - Edit only via `/src/integrations/supabase/client.ts` — never call Supabase from JSX.
   - One map instance per page — use the shared `MapView`.
4. Run `npm run validate` (lint:check + typecheck + format:check) plus `npm run test:run`.
5. Push. The `auto-format.yml` workflow runs Prettier on PR-open; `ci.yml` runs the full validation.
6. Open a PR. Use a HEREDOC to format the description (see `CLAUDE.md` PR template).
7. Watch the PR webhook events — review comments, CI status, and merge-conflict checks all flow through the harness.

## 8. Common first-day pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| `dispatcher.useState` error on boot | Demo mode init at module load (already fixed in `App.tsx:169-171`) | Verify you're on latest `main` |
| Blank screen on `/join/:token` | Vite `base: './'` was reverted to `'/'` for this reason | Confirm `vite.config.ts:21-23` |
| "Loading chunk" toast loop | Stale SW cache after deploy | Auto-recovers via `App.tsx:243-298`; if not, hard-refresh |
| Trip Not Found flash on hard refresh | Auth hydration race | See `DEBUG_PATTERNS.md` "Trip Not Found flash" + memory #3 |
| Supabase calls 401 in dev | Anon key missing | Set `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY` |
| Maps tab empty | `VITE_GOOGLE_MAPS_API_KEY` missing | Set in `.env` |

## 9. Where to read next

- [`overview/03-repo-map.md`](./03-repo-map.md) — codebase layout
- [`architecture/01-system-architecture.md`](../architecture/01-system-architecture.md) — system topology
- [`architecture/02-routing.md`](../architecture/02-routing.md) — all 33 routes
- [`architecture/05-auth-and-rls.md`](../architecture/05-auth-and-rls.md) — auth flow + RLS posture
- [`docs/ACTIVE/DEVELOPER_HANDBOOK.md`](../../ACTIVE/DEVELOPER_HANDBOOK.md) — long-form coding standards
- [`docs/ACTIVE/ENVIRONMENT_SETUP_GUIDE.md`](../../ACTIVE/ENVIRONMENT_SETUP_GUIDE.md) — deep env reference

## Source Refs

- `package.json:6-47` — engines, scripts
- `.env.example:1-50` — env var template
- `vite.config.ts:21-27` — base + dev server config
- `src/main.tsx` — Vite entry
- `src/App.tsx:300-615` — composition root
- `.husky/` — git hooks (installed by `prepare` script)
- `scripts/doctor.sh`, `scripts/validate-env.ts`
- [`CLAUDE.md`](../../../CLAUDE.md) — engineering manifesto
- [`docs/ACTIVE/DEVELOPER_HANDBOOK.md`](../../ACTIVE/DEVELOPER_HANDBOOK.md), [`docs/ACTIVE/ENVIRONMENT_SETUP_GUIDE.md`](../../ACTIVE/ENVIRONMENT_SETUP_GUIDE.md)
