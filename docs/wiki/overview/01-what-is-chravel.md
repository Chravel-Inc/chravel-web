# What is Chravel

## In one line
A multi-platform group-trip coordination layer — chat, calendar, places, payments, media, polls, tasks, and an AI travel concierge — for consumer travelers and professional tour / event / sports teams.

## What it is NOT
**Not an OTA, not a booking engine, not a metasearch.** Chravel does not sell flights, hotels, cars, or activities. It coordinates the trip that already exists, regardless of where it was booked.

## Product surfaces

| Surface | Where it ships | Notes |
|---|---|---|
| Web app | `chravel.app` (Vercel SPA) | Primary surface for desktop + mobile web |
| PWA | Same domain, installable | Service worker via `workbox-build` |
| iOS native | `chravel-mobile` sister repo | Capacitor v8 shell wrapping this same React app |
| Android native | `chravel-mobile` sister repo | Same Capacitor shell, Play Store distribution |
| Marketing site | Same domain, `/teams` `/recs` `/advertiser` routes | Public-route subset of the SPA |

This wiki documents **the web / PWA shell only**. The native shell, its native plugins, and platform-specific behavior live in `chravel-mobile`.

## User types

| Type | Tier | Entry point | Source ref |
|---|---|---|---|
| Consumer traveler | Free → Explorer → Frequent Chraveler | `/` (`Index.tsx`) | `src/App.tsx:329-335` |
| Pro/Enterprise team member | Org-seat billed | `/tour/pro/:proTripId` | `src/App.tsx:425-431` |
| Event organizer / attendee | Event-tier | `/event/:eventId` | `src/App.tsx:441-447` |
| Organization admin | B2B seat billing | `/organization/:orgId` | `src/App.tsx:570-578` |
| Advertiser | Campaign dashboard | `/advertiser` | `src/App.tsx:464-471` |
| Internal admin | Email-gated | `/admin/scheduled-messages` | `src/App.tsx:550-559` |

## Top 10 product systems (with subsystem doc)

1. Trip management (create, join, archive) — covered across `architecture/02-routing.md` and `subsystems/*`
2. [Chat & Broadcasts](../subsystems/chat-broadcasts.md) — Stream Chat 9.40 hybrid
3. [AI Concierge](../subsystems/ai-concierge.md) — Gemini text + Vertex/LiveKit voice
4. [Calendar](../subsystems/calendar.md) — Google Calendar bi-sync
5. [Payments](../subsystems/payments.md) — Stripe (web) + RevenueCat (iOS)
6. Smart Import — Gmail OAuth + receipt OCR (lives in `src/features/smart-import/`)
7. [Media](../subsystems/media.md) — upload pipeline + AI tagging
8. [Places & Links](../subsystems/places-and-links.md) — Google Maps + OG link previews
9. Organizations & Teams — [`subsystems/pro-enterprise-tiers.md`](../subsystems/pro-enterprise-tiers.md)
10. Notifications & Realtime — `architecture/07-realtime-channels.md`

## Business model

| Tier | Billed via | Capability gate |
|---|---|---|
| Free (Consumer) | n/a | Default. Throttled concierge, basic features. |
| Explorer | Stripe (web) / RevenueCat (iOS) | Entitlement: `EXPLORER_ENTITLEMENT_ID` (`VITE_REVENUECAT_EXPLORER_ENTITLEMENT_ID`) |
| Frequent Chraveler | Stripe / RevenueCat | Entitlement: `FREQUENT_CHRAVELER_ENTITLEMENT_ID` |
| Pro / Enterprise | Org seat billing | Per-organization seats, role-based channels |
| Advertiser | Campaign-based | Separate dashboard surface |

Single source of truth for tier state: `src/store/entitlementsStore.ts` (Zustand store) — `plan`, `status`, `source`, `isPro`, `isExplorer`, `isFrequentChraveler`, `isOrgPro`, `isSuperAdmin`.

## Viral loop (events)

```
public event link  →  /event/:eventId (guest renders)
                  →  guest creates trip / joins existing
                  →  guest converts to authenticated user
                  →  invited to chat / channels / agenda
```

Trip preview short-circuits this: `/t/:tripId` (or `/trip/:tripId/preview`) is a public preview surface used to onboard guests before login. See `src/App.tsx:352-367`.

## Demo mode (sacred)

Demo mode is a first-class product surface, not a developer mode. It powers:
- Marketing landing page interactivity (`demoView === 'marketing'`)
- App preview without sign-up (`demoView === 'app-preview'`)
- Mock data fed from `src/mockData/` and `src/services/UniversalMockDataService.ts`

Single source: `src/store/demoModeStore.ts`. Never mutate mock data — `agent_memory.jsonl` entry #27 (Mock-ID tier gate) is the recurring regression class. See `subsystems/*` "Demo vs Authenticated" sections.

## Critical paths (zero-tolerance from `CLAUDE.md`)

In priority order:
1. Auth (`src/hooks/useAuth.tsx`)
2. Trips (`src/pages/TripDetail.tsx`, `src/pages/ProTripDetail.tsx`)
3. Chat (`src/features/chat/`)
4. Payments (`src/billing/`, `src/services/paymentProcessors/`)
5. AI Concierge (`src/features/concierge/`)
6. Calendar (`src/features/calendar/`)
7. Permissions (RLS + role propagation)
8. Notifications (push + email + in-app + Stream system messages)

Regressions on any of these are launch blockers per `CLAUDE.md`.

## Source Refs

- `src/App.tsx:1-618` — single composition root, all 33 lazy routes
- `package.json:1-156` — pinned deps, scripts
- `tsconfig.app.json:1-25` — TS config (note: `strict: false`, `noImplicitAny: false`)
- `vite.config.ts:1-102` — Vite build pipeline
- `src/store/entitlementsStore.ts` — tier state of truth
- `src/store/demoModeStore.ts` — demo mode state of truth
- [`README.md`](../../../README.md) — Lovable-flavored project description
- [`CLAUDE.md`](../../../CLAUDE.md) — engineering manifesto, critical-path designations
