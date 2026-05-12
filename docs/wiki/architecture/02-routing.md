# Routing

Single router in `src/App.tsx:322-608`. `BrowserRouter` (`src/App.tsx:111`). Every route is wrapped in `<LazyRoute>` (`src/components/LazyRoute.tsx`) and lazy-imported via `retryImport` (`src/lib/retryImport.ts`).

## Route table

| Path | Component | Page file | Guard | Public/auth | Line |
|---|---|---|---|---|---|
| `/` | `Index` | `src/pages/Index.tsx` | - | Public | `src/App.tsx:328-335` |
| `/api/gmail/oauth/callback` | `GmailCallbackPage` | `src/pages/GmailCallbackPage.tsx` | - | Public (callback) | `src/App.tsx:336-343` |
| `/trip/:tripId` | `TripDetail` | `src/pages/TripDetail.tsx` | in-component | Public route, auth-gated data | `src/App.tsx:344-351` |
| `/trip/:tripId/preview` | `TripPreview` | `src/pages/TripPreview.tsx` | - | Public | `src/App.tsx:352-359` |
| `/t/:tripId` | `TripPreview` | `src/pages/TripPreview.tsx` | - | Public | `src/App.tsx:360-367` |
| `/demo/trip/:demoTripId` | `DemoTripGate` | `src/pages/DemoTripGate.tsx` | - | Demo | `src/App.tsx:368-375` |
| `/demo` | `DemoEntry` | `src/pages/DemoEntry.tsx` | - | Demo | `src/App.tsx:376-383` |
| `/auth` | `AuthPage` | `src/pages/AuthPage.tsx` | - | Public | `src/App.tsx:384-391` |
| `/auth-callback` | `AuthPage` | `src/pages/AuthPage.tsx` | - | Public (callback) | `src/App.tsx:392-399` |
| `/reset-password` | `ResetPasswordPage` | `src/pages/ResetPasswordPage.tsx` | - | Public | `src/App.tsx:400-407` |
| `/join/:token` | `JoinTrip` | `src/pages/JoinTrip.tsx` | - | Public (token-gated) | `src/App.tsx:408-415` |
| `/j/:token` | `InviteSlugRedirect` | `src/pages/InviteSlugRedirect.tsx` | - | Public (redirect) | `src/App.tsx:416-423` |
| `/tour/pro/:proTripId` | `ProTripDetail` | `src/pages/ProTripDetail.tsx` | in-component | Auth-gated data | `src/App.tsx:424-431` |
| `/tour/pro-:proTripId` | `LegacyProTripRedirect` | inline component | - | Redirect | `src/App.tsx:432-439` |
| `/event/:eventId` | `EventDetail` | `src/pages/EventDetail.tsx` | - | Public (event surface) | `src/App.tsx:440-447` |
| `/teams` | `ForTeams` | `src/pages/ForTeams.tsx` | - | Marketing | `src/App.tsx:448-455` |
| `/recs` | `ChravelRecsPage` | `src/pages/ChravelRecsPage.tsx` | - | Marketing | `src/App.tsx:456-463` |
| `/advertiser` | `AdvertiserDashboard` | `src/pages/AdvertiserDashboard.tsx` | - | Advertiser-tier | `src/App.tsx:464-471` |
| `/healthz` | `Healthz` | `src/pages/Healthz.tsx` | - | Public (probe) | `src/App.tsx:472-479` |
| `/privacy` | `PrivacyPolicy` | `src/pages/PrivacyPolicy.tsx` | - | Public | `src/App.tsx:480-487` |
| `/support` | `SupportPage` | `src/pages/SupportPage.tsx` | - | Public | `src/App.tsx:488-495` |
| `/terms` | `TermsOfService` | `src/pages/TermsOfService.tsx` | - | Public | `src/App.tsx:496-503` |
| `/sms-terms` | `SmsTerms` | `src/pages/SmsTerms.tsx` | - | Public | `src/App.tsx:504-511` |
| `/delete-account` | `DeleteAccountPage` | `src/pages/DeleteAccountPage.tsx` | - | Public | `src/App.tsx:512-519` |
| `/profile` | `ProfilePage` | `src/pages/ProfilePage.tsx` | `<ProtectedRoute>` | Auth | `src/App.tsx:520-529` |
| `/settings` | `SettingsPage` | `src/pages/SettingsPage.tsx` | `<ProtectedRoute>` | Auth | `src/App.tsx:530-539` |
| `/archive` | `ArchivePage` | `src/pages/ArchivePage.tsx` | `<ProtectedRoute>` | Auth | `src/App.tsx:540-549` |
| `/admin/scheduled-messages` | `AdminDashboard` | `src/pages/AdminDashboard.tsx` | `<InternalAdminRoute>` | Admin | `src/App.tsx:550-559` |
| `/organizations` | `OrganizationsHub` | `src/pages/OrganizationsHub.tsx` | `<ProtectedRoute>` | Auth | `src/App.tsx:560-569` |
| `/organization/:orgId` | `OrganizationDashboard` | `src/pages/OrganizationDashboard.tsx` | `<ProtectedRoute>` | Auth | `src/App.tsx:570-579` |
| `/accept-invite/:token` | `AcceptOrganizationInvite` | `src/pages/AcceptOrganizationInvite.tsx` | - | Public (token-gated) | `src/App.tsx:580-587` |
| `/dev/device-matrix` | `DeviceTestMatrix` | `src/pages/DeviceTestMatrix.tsx` | `import.meta.env.DEV` | Dev only | `src/App.tsx:588-597` |
| `*` | `NotFound` | `src/pages/NotFound.tsx` | - | Catch-all | `src/App.tsx:598-605` |

Total: **33 routes + 1 catch-all + 1 dev-only**.

## Route guards

| Guard | File | What it does |
|---|---|---|
| `<ProtectedRoute>` | `src/components/ProtectedRoute.tsx` | Requires `useAuth().user`; redirects to `/auth?returnTo=...` otherwise |
| `<InternalAdminRoute>` | `src/components/InternalAdminRoute.tsx` | Email allow-list against `VITE_SUPER_ADMIN_EMAILS` / `SUPER_ADMIN_EMAILS` constant |
| `<LazyRoute>` | `src/components/LazyRoute.tsx` | Suspense boundary + error handling for lazy chunks |

## Public route surface (OfflineIndicator skip-list)

`OfflineIndicatorGate` in `src/App.tsx:140-164` enumerates public-route prefixes that should NOT show the offline indicator (they don't require auth):

```
/, /auth, /reset-password, /join, /j/, /accept-invite,
/teams, /recs, /advertiser, /privacy, /support, /terms,
/sms-terms, /delete-account, /demo, /healthz
```

This list is the de-facto "public surface" inventory.

## Mobile route variants

Pages with explicit mobile variants:
- `MobileTripDetail.tsx` vs `TripDetail.tsx` (`src/pages/`)
- `MobileProTripDetail.tsx` vs `ProTripDetail.tsx`
- `MobileEventDetail.tsx` vs `EventDetail.tsx`
- `TripDetailDesktop.tsx`, `ProTripDetailDesktop.tsx` (desktop refinements)

Switching between mobile and desktop is component-internal, not route-based; the `MobileAppLayout` wrapper (`src/App.tsx:326`) gates layout.

## Page-view telemetry

Every route change fires `pageView(pathname)` via `src/telemetry/events.ts`. The tracker lives in `PageViewTracker` (`src/App.tsx:120-138`) and runs both on initial mount and on every `pathname` change.

## Demo entry points

Two surfaces:
- `/demo` (`DemoEntry`) - landing
- `/demo/trip/:demoTripId` (`DemoTripGate`) - preconfigured demo trip

Demo mode state lives in `useDemoModeStore`. The `ExitDemoButtonWithNav` floating control is rendered globally (`src/App.tsx:114-117, 324`).

## Mobile / PWA / Capacitor considerations

- All routes are accessible in the PWA shell - no route is web-only.
- Auth callbacks in installed shells return to `chravel.app/auth-callback` (a Universal Link) rather than the localhost dev origin (`useAuth.tsx:907-908`).
- `/auth-callback` deliberately mounts the same `AuthPage` component so the OAuth `detectSessionInUrl` exchange completes inside the SPA.

## Known risks

- Trip detail routes are publicly routable but auth-gate inside the component. This is intentional (allows preview surfaces) but is the recurring regression vector tracked in `agent_memory.jsonl` entry #3 and `DEBUG_PATTERNS.md`.
- `<ProtectedRoute>` evaluates `useAuth().user`; if auth is still hydrating, a brief redirect flash can occur. Apply the pattern from memory entry #5 - gate data fetches on `!isLoading && user`.

## Source Refs

- `src/App.tsx:39-99` - lazy imports
- `src/App.tsx:104-108` - legacy redirect inline component
- `src/App.tsx:140-164` - public route prefix list
- `src/App.tsx:322-608` - full Routes block
- `src/components/ProtectedRoute.tsx`, `src/components/InternalAdminRoute.tsx`, `src/components/LazyRoute.tsx`
- `src/lib/retryImport.ts`
