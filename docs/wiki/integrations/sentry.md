# Sentry

## Why we use it
Frontend error tracking + performance monitoring + release health correlation. Edge functions log to their own observability via Supabase logs.

## Where it's initialized
- Package: `@sentry/react` 10.43.0 (`package.json:80`)
- Excluded from Vite optimizeDeps (`vite.config.ts:100`) so it's bundled normally.
- Init point: `src/services/errorTracking.ts` (called from `src/App.tsx:180-188`)

## API surface used
- `errorTracking.init({ environment })` on app boot.
- `errorTracking.setUser(userId)` once auth resolves.
- Auto error capture; manual breadcrumbs from key events.
- Release / deploy-SHA correlation via `VITE_DEPLOY_SHA`.

## Env vars
| Var | Side | Purpose |
|---|---|---|
| `VITE_SENTRY_DSN` | client | DSN |
| `VITE_SENTRY_FORCE_ENABLE` | client | Force-enable in non-prod for debugging |
| `VITE_DEPLOY_SHA` | client | Release marker (auto-injected by Vite) |

## Failure modes & retry behavior
- Errors deduped by Sentry server-side (stack-trace hash).
- DSN missing -> Sentry silently no-ops; production should always have DSN set.
- Sample rate configured in `errorTracking.ts`.

## Cost / quota notes
- Sentry billed by event volume. Set sample rate appropriately.

## Source Refs
- `src/services/errorTracking.ts`
- `src/App.tsx:180-188`
- `vite.config.ts:100`
