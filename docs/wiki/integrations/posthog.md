# PostHog

## Why we use it
Product analytics. Page views, conversion funnels, feature flags (we use Supabase `feature_flags` table separately), session replays optional.

## Where it's initialized
- Package: `posthog-js` 1.360.2 (`package.json:122`)
- Excluded from Vite optimizeDeps (`vite.config.ts:100`)
- Service: `src/telemetry/service.ts`
- Events helper: `src/telemetry/events.ts` (exports `pageView`, etc.)
- Init: app boot

## API surface used
- `telemetry.identify({ id, display_name, is_pro, organization_id })` post-auth (`useAuth.tsx:765-770`).
- `telemetry.reset()` on `SIGNED_OUT` (`useAuth.tsx:794-796`).
- `pageView(pathname)` on every route change (`src/App.tsx:120-138`).
- Custom event emission via `telemetry.capture(...)`.

## Env vars
| Var | Side | Purpose |
|---|---|---|
| `VITE_POSTHOG_API_KEY` | client | Project API key |
| `VITE_POSTHOG_HOST` | client | Host (defaults to US cloud) |

## Failure modes & retry behavior
- PostHog batches and retries internally.
- Network failures are silent — analytics must never block UX.

## Cost / quota notes
- Billed by tracked events. Identify-on-sign-in plus per-page-view is the baseline.

## Source Refs
- `src/telemetry/service.ts`, `events.ts`
- `src/App.tsx:120-138` (pageView wiring)
- `src/hooks/useAuth.tsx:765-770, 794-796` (identify/reset)
- `vite.config.ts:100`
