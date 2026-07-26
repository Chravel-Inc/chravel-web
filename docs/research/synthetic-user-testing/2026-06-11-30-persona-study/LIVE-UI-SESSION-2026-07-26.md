# Live UI Session — 2026-07-26

**Purpose:** Re-ground the 30-persona package with browser-observed evidence on current `main`.  
**Environment:** Vite `http://localhost:8080/` · Chromium via computer-use agent · Desktop ~1280×800 · Mobile emulation ~400×924  
**Scope:** Unauthenticated marketing + `/teams` + pricing tabs + signup modal + demo-mode activation. Auth-gated create/invite/payments not exercised with real credentials.

All bullets below are **[OBSERVED]** unless marked otherwise.

---

## Desktop — Marketing landing (`/`)

- Hero brand: **“ChravelApp — The Group Chat Travel App”** with coordination tagline and primary CTA **“Get Started — It’s Free”** plus **“See How It Works →”**.
- Nav includes Blog, **For Teams**, Use Cases, Log In / Get Started.
- Feature storytelling covers Chat, Calendar, Concierge, Media, Payments, Broadcasts, BaseCamps, Smart Import, PDF Recap.
- **“Built for Every Journey”** use-case grid lists sports, touring, weddings, faith, conferences, etc. — **Regular vs Pro vs Events is not a first-viewport mental model**; Pro appears as a secondary line (“roles, rosters & broadcasts…”).
- Console: React Router v7 future-flag warnings + Supabase hardcoded-fallback warning. No hard app crash observed during landing scroll.

## Desktop — Pricing (landing `PricingSection`)

- Tabs: **ChravelApp Plus** · **ChravelApp Pro** · **Trip Passes**; Monthly/Annual toggle on Plus.
- **Free $0** copy includes: 3 active trips, AI assistant **3 queries per user per trip**, **1 PDF export per trip**, chat/calendar/media/payments/polls.
- **Explorer $9.99/mo** (Most Popular): unlimited trips, 25 AI queries/trip, unlimited PDF, Smart Import from URL, etc.
- **Frequent Chraveler $19.99/mo**: unlimited AI, file Smart Import, role-based channels / Pro features; Trip Pass callout **$74.99 / 90 days**.
- **Trip Passes tab:** Explorer Pass **$39.99 / 45 days**; Frequent Chraveler Pass **$74.99 / 90 days** (“Best value · Multi-city”).
- **ChravelApp Pro tab:** Starter **$49**, Growth **$99**, Enterprise custom — CTAs **“Start 14-Day Trial”** / **“Contact Sales”**.
- Code cross-check: marketing Pro trial handlers are **`mailto:`** in `PricingSection.tsx` and `ForTeams.tsx` (in-app `ProUpgradeModal` uses Stripe via `billing/checkout.ts`).

## Desktop — Auth modal

- **Get Started** opens Create Account modal with Google, Apple, email/password (first/last name), Terms/Privacy footer, Sign in / Sign up tabs.
- No critical console errors opening the modal.

## Desktop — `/teams` (For Teams)

- Hero: “Built for Teams That Move” with **Schedule a Demo** and **Start 14-Day Trial**.
- Starter / Growth / Enterprise cards match marketing Pro pricing.
- Clicking **Schedule a Demo** opens a **mailto:** client chooser `[OBSERVED — browser + ForTeams.tsx mailto handlers]`.

## Demo mode

- `localStorage.setItem('TRIPS_DEMO_VIEW','app-preview')` + reload activates demo surfaces.
- Demo trip cards (Cancún spring break, Tokyo, wedding, bachelorette, Coachella, Dubai birthday) appeared in one desktop session with Recap/Invite/View/Share controls.
- A later session could not reliably enter an in-trip shell from those cards (clicks scrolled marketing sections / modal chrome). **In-trip tab inventory was not re-confirmed live in this session** — treat trip-tab structure as code-grounded via `MobileTripDetail` / Pro tab configs, not re-screenshoted today.
- Exit Demo affordance exists in code (`ExitDemoButton` / `DemoTripBar`); not always visible on the marketing chrome depending on route/state.

## Mobile viewport (~400×924)

- Landing stacks vertically; hamburger nav; primary CTA remains thumb-reachable; no horizontal overflow observed on hero/feature sections sampled.
- Create Trip / demo trip card chrome appeared in mobile emulation during exploration.
- Bottom trip-tab bar **not** re-validated inside an opened trip this session.

## Cross-check vs July refresh claims

| Claim in `REBASE-REFRESH-2026-07-26.md` | Live/code status this session |
|----------------------------------------|-------------------------------|
| Marketing Pro still mailto | **Confirmed** on `/teams` + PricingSection handlers |
| Trip Passes visible self-serve on marketing | **Confirmed** ($39.99 / $74.99) |
| Free AI = 3 queries/trip | **Confirmed** in pricing UI copy |
| Guest itinerary still blocked | **Code-confirmed** (`consumer_guest` all-false); not re-joined live |
| IAP enabled | **Code-confirmed** (`APPLE_IAP_ENABLED: true`); not purchased live |

## Not tested (auth / credentials)

- Real signup completion, invite join, payment splits, Smart Import commit, Concierge live answers, Stripe/RevenueCat checkout, Pro ops CRUD on a real trip.

## Implication for persona scores

Keep **`persona-matrix.csv` (2026-07-26)** as the score source of truth. Inline June narrative scores in `30-persona-full-report.md` remain synthetic interview texture; a subset of June `[OBSERVED]` lines were patched for IAP / free AI query count / always-approval framing, but always prefer the refresh delta + this live log when prioritizing tickets.
