# E2E Strategy

## Stack
- **Playwright** 1.58.2 (`package.json:56`)
- Config: `playwright.config.ts`
- Test dir: `e2e/`
- Fixtures: `e2e/fixtures/`
- Spec subdirs: `e2e/specs/`, `e2e/tests/`

## Test files (top-level specs at SHA `1e833665`)

| File | Coverage area |
|---|---|
| `auth.spec.ts` | Auth flows |
| `chat.spec.ts` | Chat / messaging |
| `invite-links.spec.ts` | Invite token + viral loop |
| `offline-resilience.spec.ts` | Offline / PWA resilience |
| `settings.spec.ts` | Settings + preferences |
| `trip-creation.spec.ts` | Create trip happy path |
| `trip-flow.spec.ts` | Trip lifecycle end-to-end |

(Additional specs under `e2e/specs/` and `e2e/tests/`.)

## Running

| Script | Behavior |
|---|---|
| `npm run test:e2e` | All Playwright tests |
| `npm run test:e2e:smoke` | `pwa-smoke.spec.ts` only, chromium project |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run test:e2e:debug` | Step-debug |

## CI integration

- **`scheduled-e2e-staging.yml`** — nightly run against staging environment.
- Failures alert via `deploy-notify.yml` (and Sentry/PostHog correlation).
- Not blocking on PRs by default; can be enabled per critical-path change.

## Critical-path coverage (canonical)

From `CLAUDE.md`:
1. Auth
2. Trips
3. Chat
4. Payments
5. AI Concierge
6. Calendar
7. Permissions
8. Notifications

E2E specs above cover #1, #2, #3, viral loop. **Gaps:** payments E2E, AI concierge E2E, calendar bi-sync E2E, role-propagation E2E.

## Conventions

- Tests must be idempotent — clean up created trips / users on teardown.
- Use Supabase service role only via dedicated test fixtures (`e2e/fixtures/`), never in spec files directly.
- Avoid hard-coded sleeps — use `page.waitForResponse` or `page.waitForSelector`.
- Mark known-flake tests via Playwright tag, never `.skip` them silently (`qa:skip-policy` enforces this — `package.json:41`).

## Doc drift check

`npm run qa:e2e-docs` (`scripts/qa/check-e2e-doc-drift.cjs`) verifies that E2E docs match the actual spec inventory.

## Source Refs

- `playwright.config.ts`
- `e2e/` — full test tree
- `.github/workflows/scheduled-e2e-staging.yml`
- `scripts/qa/check-skipped-tests.cjs`, `scripts/qa/check-e2e-doc-drift.cjs`
- `package.json:26-29, 41, 42` — E2E scripts
