# App Store Release Gate

Chravel's App Store release gate is the repo-owned launch blocker checklist for the web/PWA code that ships inside the native iOS wrapper. It intentionally separates automated repo checks from external checks that require Apple, Supabase, Firebase, Stream, Stripe/RevenueCat, or physical-device access.

## Command

```bash
npm run qa:appstore-release
```

By default this runs all local deterministic gates and treats browser/device-only checks as optional warnings. To make the gate stricter for CI or final release validation:

```bash
CHRAVEL_APPSTORE_RELEASE_GATE=1 \
CHRAVEL_APPSTORE_INCLUDE_E2E=1 \
CHRAVEL_APPSTORE_INCLUDE_SCREENSHOTS=1 \
npm run qa:appstore-release
```

## Automated steps

1. `npm run validate-env`
2. `npm run qa:guardrails`
3. `npm run permissions:drift`
4. `npm run iap:parity`
5. `npm run iap:validate`
6. `npm run lint:check`
7. `npm run typecheck`
8. `npm run test:run`
9. `npm run build`
10. `npm run qa:mobile-perf-budget`
11. `npm run qa:chat-production-readiness`
12. `npm run test:e2e:smoke` when `CHRAVEL_APPSTORE_INCLUDE_E2E=1`
13. `npm run test:e2e:concierge-device-smoke` when `CHRAVEL_APPSTORE_INCLUDE_E2E=1`
14. `npm run screenshots:appstore:all` when `CHRAVEL_APPSTORE_INCLUDE_SCREENSHOTS=1`

## Required external release checks

These cannot be fully proven from the repo alone:

- TestFlight install and cold start on iPhone SE-sized screen, current iPhone, and iPad.
- Apple Sign in with Apple native bridge and fallback OAuth callback.
- Apple IAP/RevenueCat product availability and restore purchases.
- Push notifications through APNs/Firebase on a physical device.
- Universal/deep links for `/j/:token`, `/join/:token`, `/trip/:tripId`, `/event/:eventId`, and auth callbacks.
- Supabase production/staging edge-function secrets, RLS, and CORS allowed origins.
- Stream production app token/channel provisioning and webhook membership sync.
- Stripe/webhook delivery for web billing surfaces.

## Failure policy

- Any required local step failure blocks release.
- Optional browser/device checks must be made required for final CI by setting the include flags above.
- Do not add a skip to a Tier-0 journey to pass this gate. Fix the test, isolate external dependency setup, or document the blocker in the PR.
- Do not weaken auth, RLS, CORS, payment, webhook, or entitlement checks to make launch tests pass.
