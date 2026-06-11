# Evidence Delta & Live-Harvest Log — 2026-06-11 Study

This file does two jobs for the 30-persona study:

1. **Delta:** what changed since the 2026-06-09 ground truth
   (`docs/research/synthetic-user-testing/evidence/product-ground-truth.md`). Read that file first;
   this file overrides it where they disagree.
2. **Live-evidence log:** what was actually observed in a running browser session on 2026-06-11
   (Chromium 141 via Playwright, desktop 1440×900 and mobile 390×844 touch viewports, local Vite dev
   server on the repo's current `main`). Screenshots live in `./screenshots/`.

## Environment limits (read before citing anything as [OBSERVED])

- The test sandbox **blocks all external network**, including `*.supabase.co` (HTTP 403
  `host_not_allowed` from the egress proxy). Therefore **every backend call failed by design**:
  auth, RLS reads, realtime, edge functions, Stream token fetch, PostHog.
- Consequence 1: **authenticated flows (signup, real trip creation, invite joins, real data CRUD)
  could not be live-tested.** Findings about them are code-grounded → label [SIMULATED RISK] or
  [HYPOTHESIS], never [OBSERVED-live].
- Consequence 2: any console/network error mentioning `supabase.co`, PostHog, cert errors, or
  "Failed to fetch" in the harvest logs is an **environment artifact, not a product defect** —
  with the specific exceptions called out under "Real defects" below (those are app-side bugs that
  fire regardless of backend availability).
- An isolated Supabase branch was created for authenticated testing and then deleted: the platform's
  migration replay failed (0 of 214 applied — production's migration history does not bootstrap a
  fresh database), and the sandbox could not reach the branch anyway. Both facts are themselves
  findings (see D7).
- What WAS fully live-testable: the marketing landing, SEO pages, auth screens (render only), and
  the entire **demo mode** (`/demo` → app-preview) — consumer trip, pro trips, and event surfaces
  with local mock data, at both viewports.

## Part 1 — Ground-truth delta since 2026-06-09

Commit `3cd1c2a` (2026-06-10, "Fix audit findings: monetization chain, join flow, settlement
atomicity, exports, honest surfaces, per-trip mute") fixed most of the prior study's headline
defects. Do **not** recycle the old findings; current state:

| # | Prior finding (2026-06-09) | Current state (2026-06-11) | Evidence |
|---|---|---|---|
| D1 | Dead "Export PDF" stub | **FIXED** — full export pipeline with entitlement gating | `src/components/ItineraryView.tsx:78-135` |
| D2 | Concierge usage computed but invisible; limit message routes to /settings with wrong tier | **MOSTLY FIXED** — visible usage meter + statuses; `upgradeUrl` still `/settings`, not checkout | `src/hooks/useConciergeUsage.ts:310-368`, `src/components/AIConciergeChat.tsx:52-53` |
| D3 | 3-splits free cap unenforced | **FIXED** — typed error + upgrade copy + tests | `src/billing/entitlements.ts:272-279`, `src/services/__tests__/paymentService.splitLimit.test.ts` |
| D4 | Trip Pass unreachable from limit walls | **FIXED** — reachable from in-app limit moments | commit `3cd1c2a`; `src/components/conversion/PricingSection.tsx` |
| D5 | ProTripDetailDesktop upsell wired to `close` | **FIXED** | `src/pages/ProTripDetailDesktop.tsx:61,571,596-597` |
| D6 | JoinTrip leaked spec copy + false approval message | **FIXED** — real copy; approval framing gated on `require_approval` | `src/pages/JoinTrip.tsx:107-127,993` |
| D7 | Pro ops (roster/rooms/schedule/settlement) empty arrays for real trips | **STILL TRUE, reframed** — now "honest surfaces": placeholder Pro tabs hidden on real trips instead of showing phantom data. Real Pro trips still have no structured ops data. | `src/utils/tripConverter.ts:118-130` |
| D8 | Voice concierge dictation-only | **STILL TRUE** — `VOICE_PRODUCT_PATH = 'dictation-only'`; relabeled "voice input" | `supabase/functions/_shared/voiceProductPath.ts:1` |
| D9 | No self-serve Pro checkout (mailto:) | **PARTIALLY FIXED** — consumer checkout + Trip Pass self-serve exist; Pro self-serve checkout still pending ("ship next") | commit `3cd1c2a` notes |
| D10 | Media cap counted trip-wide | **FIXED** — per-uploader semantics + tests | `src/services/uploadService.ts:90-107` |
| D11 | No per-trip notification mute | **FIXED** — `trip_members.notifications_muted` + RPC + kill-switch flag | `src/hooks/useTripNotificationMute.ts:26-94` |
| D12 | PostHog never ingested an event | **CHANGED** — API key added 2026-06-09 (commit `224b4ed`); telemetry is typed and now live in prod. Funnel numbers in THIS study remain synthetic. | `src/telemetry/providers/posthog.ts:21-36` |
| D13 | 9-screen onboarding carousel | **CHANGED** — 10 screens, explicit "Skip demo" on every non-final screen (owner decision to keep length) | `src/components/onboarding/OnboardingCarousel.tsx:54-121,253` |
| D14 | Limit-copy drift (queries/storage/trips) | **ALIGNED** — pricing copy matches `FEATURE_LIMITS` (Free: 10 AI queries/user/trip, 3 active trips, 500 MB, 3 splits, 3 lifetime events) | `src/billing/entitlements.ts:236-371`, `src/components/conversion/PricingSection.tsx:65-70` |
| D15 | consumer_guest zero access | **STILL TRUE** — guests have no resource access; invitees must fully join | `src/types/permissionMatrix.generated.ts:44-50` |

Still-open items from the prior register that this delta does **not** change: settlement
double-credit race hardening was addressed in `3cd1c2a` ("settlement atomicity") — treat as
recently-fixed/regression-watch; notification fanout at event scale, hot-trip realtime isolation,
storage quota advisory-only, and Smart Import replay idempotency remain open as documented in
ground truth §10.

## Part 2 — Live-harvest evidence log (2026-06-11)

82 screenshots in `./screenshots/`, named `{viewport}[2]-{step}-{slug}.jpg`; machine logs in
`{viewport}-harvest-log.json` / `{viewport}-harvest2-log.json` (steps, console errors, failed
requests). Harness: `harvest.mjs`, `harvest2.mjs` (committed for reproducibility).

### What was live-verified [OBSERVED — screenshot]

- **L1. Landing = product, not promises.** Unauthenticated `/` renders an interactive demo
  dashboard as the hero ("ChravelApp — The Group Chat Travel App. For Friend & Family trips, Team
  Travel, Touring Crews, Local Community Clubs, & Anybody Organizing a Group") with six populated
  sample trip cards, then scrolls (inner container) into marketing sections: "Why Juggle a Dozen
  Apps for One Trip?", "How It Works", "Built for Every Journey", "AI That Knows Your Trip",
  pricing ("Start free. Upgrade when your trip gets serious." / "Free works forever—upgrade only
  when you need more"), FAQ. (`desktop-01`, `desktop-18..23`, `mobile-18..23`)
- **L2. Demo mode is deep and polished.** `/demo` enables app-preview; consumer trip (all 8 tabs),
  pro trips (Beyoncé tour, Eli Lilly retreat — Chat/Calendar/Concierge/Media/Payments/Places/Polls/
  Tasks/Team + Broadcasts/Pinned/Channels chat subviews + 57-member roster with roles + PDF Recap
  button), and event (Netflix Joke Fest — Agenda/Tasks/Polls/Calendar) all render rich mock data at
  both viewports. (`desktop2-01..21`, `mobile2-01..20`, `desktop-08..15`)
- **L3. Invite modal (demo)** shows share link `chravel.app/j/…`, Regenerate, copy, "Require
  approval to join" (forced **Required** on the fraternity demo trip), 7-day expiry toggle, max-uses
  selector, and an explicit "Demo Mode: Link is for demonstration only." banner. (`desktop2-11`)
- **L4. Auth page** renders sign-in/sign-up UI with email + Google/Apple OAuth buttons at both
  viewports (network-dependent submission untested). (`*-04`, `*-05`)
- **L5. SEO page `/trip-planner`** renders dedicated marketing copy. (`*-03`)
- **L6. Demo escape hatch** `/demo?off=1` cleanly returns to marketing landing. (`*-17`)

### Real defects observed live (app-side, not environment) [OBSERVED — file:line + log]

- **R1. Mobile duplicate-key render storm.** React "two children with the same key" warnings fire
  continuously (~150/step on every mobile trip surface; 2,528 during pro chat-channels step; 5,940
  total in mobile pass 2). Root cause located: `src/components/mobile/MobileGroupCalendar.tsx:525`
  uses `key={`compact-${day}`}` over single-letter weekday headers S·M·T·W·T·F·S — "T" and "S"
  repeat. Component stack confirms `MobileGroupCalendar` inside `MobileTripTabs` (consumer, pro,
  AND event mobile pages). The warning volume also shows the calendar component stays mounted and
  re-renders continuously while the user is on *other* tabs — a mobile perf smell.
- **R2. Desktop consumer-trip setState loop.** "Maximum update depth exceeded" fired ~10×/tab
  across the desktop consumer trip walk (worst: 34× on the chat Pinned subview; 129 total). Did not
  reproduce on initial load — triggered by tab interaction. Component not yet pinpointed; needs a
  dev-tools session. (`desktop-harvest2-log.json` steps 3–13)
- **R3. Raw developer error copy on demo trip gate.** `/demo/trip/:id` surfaces "Failed to send a
  request to the Edge Function" verbatim inside an otherwise polished signup card when its edge
  call fails. Users on flaky networks will see engineer-speak at a conversion moment.
  (`desktop-07`; `src/pages/DemoTripGate.tsx`)
- **R4. CSP blocks demo imagery.** The app's Content-Security-Policy refuses
  `images.unsplash.com` (20 blocked image loads in desktop pass 2) — demo-mode mock avatars/photos
  render as broken/blank in some surfaces. Either the CSP allowlist or the mock-data image hosts
  are wrong. (`desktop-harvest2-log.json` failedRequests)
- **R5. Demo mode still calls real backend.** In app-preview mode the client fires real requests
  (user roles, PDF-export usage, payment methods, Stream token, realtime WS) that 401/fail for
  anonymous demo visitors; the UI tolerates it, but it's wasted load + console noise and a
  demo-contamination risk vector. (harvest logs; cf. CLAUDE.md zero-tolerance "demo-mode data
  contamination")
- **R6. Branch/migration reproducibility gap.** A fresh Supabase branch could not be bootstrapped
  from the project's migration history (0/214 replayed; repo `supabase/migrations/` holds 410 files
  with mixed naming, diverged from production's 214 recorded versions). Disaster-recovery and
  preview-environment work will hit this wall. [OBSERVED — Supabase MCP branch create on
  2026-06-11]

### Notable non-defect observations

- Mobile renders the same in-trip tab set as desktop with a horizontal tab strip; no bottom
  navigation bar appeared on mobile web in demo mode (`mobile2-01..08`) — personas evaluating
  thumb-reach should cite these screenshots rather than assuming a native-style bottom tab bar.
- Pro trip header exposes Invite, **PDF Recap**, and Leave Trip; roster chips show role labels
  (Artists, Performers, Tour Manager, Crew). (`desktop-08`)
- Top nav in marketing scroll shows "For Teams" and "Pricing" links; in demo dashboard it shows
  My Trips / Pro / Events / Recs / New Trip / Alerts / Settings. (`desktop-22`, `desktop-06`)

### Screenshot index (key files)

| Surface | Desktop | Mobile |
|---|---|---|
| Landing hero (demo dashboard) | `desktop-01` | `mobile-01` |
| Landing marketing sections | `desktop-18..23` | `mobile-18..23` (how-it-works missing) |
| Auth sign-in / sign-up | `desktop-04/05` | `mobile-04/05` |
| Demo dashboard | `desktop-06` | `mobile-06` |
| Consumer trip tabs (8) | `desktop2-01..08` | `mobile2-01..08` |
| Chat subviews + invite modal | `desktop2-09..11` | `mobile2-09..11` |
| Pro trip (Beyoncé tour) tabs | `desktop-08..11`, `desktop2-12..20` | `mobile-08..12`, `mobile2-12..20` |
| Pro corporate retreat | `desktop-12` | `mobile-13` |
| Event (Netflix Joke Fest) | `desktop-13..15`, `desktop2-22..24` | `mobile-14..16`, `mobile2-21..23` |
| PDF Recap flow | `desktop2-21` | — |
| Join page (env-degraded) | `desktop-16` | `mobile-17` |
