# Web vs Mobile / PWA — 30-Persona Synthetic Study

**Date:** 2026-06-11  
**Scope:** Desktop web (1280×800 live test) vs mobile/PWA/iOS Capacitor (390×844 partial test + responsive code review)  
**Caveat:** Cloud environment limited full mobile browser automation `[OBSERVED — README.md]`. Mobile findings blend code review, prior 10-persona study, and partial live session.

---

## Executive comparison

| | **Desktop web** | **Mobile / PWA / iOS** |
|---|-----------------|------------------------|
| **Verdict** | Best for activation, Pro ops, Events planning | Best for invite receipt, on-the-go chat, polls — worst for paywalls |
| **Strength** | Multi-tab trip workspace, landing pricing clarity | Native share, bottom nav thumb reach, push opt-in |
| **Critical gap** | Not where most users plan (13/30 desktop-first) | Monetization dead-end, onboarding length, ops views missing |
| **Study scores** | Web usability avg **4.6/5** | Mobile usability avg **4.2/5** |

---

## Persona platform distribution

From `persona-matrix.csv`:

| Platform | Count | Persona IDs |
|----------|-------|-------------|
| iOS primary | 12 | 1, 2, 4, 8, 9, 15, 23, 25, 28 + mixed-iOS |
| Android primary | 3 | 5, 24, 28 |
| mixed | 8 | 3, 6, 10, 13, 16, 20, 21, 26, 30 |
| Desktop-first | 13 | 7, 11, 12, 14, 17, 18, 19, 22, 27, 29 |

**Insight:** Revenue-ready personas (bachelorette, sports mom, couples) skew mobile. Pro/enterprise skew desktop. Product monetization is desktop-biased; growth is mobile-biased. **Mismatch.**

---

## Navigation architecture

### Desktop `[OBSERVED]`

- Top navigation + header actions
- Full trip tab bar visible: Chat, Calendar, Media, Payments, Places, Tasks, Polls, Concierge (+ Team/Broadcasts on Pro/Event)
- Trip settings, export, invite accessible from header
- **Persona ratings:** Strong for Pro (11–14, 17–19), Events (18, 22), family desktop-first (7, 27)

### Mobile / PWA `[OBSERVED]`

- Bottom `NativeTabBar`: Trips · Pro/Events · Recs · More
- Trip detail uses tab pattern; some actions in overflow
- Invite/share cited as buried (persona 10: "invite buried in menu") `[SIMULATED RISK]`
- Capacitor iOS = same web app, not React Native `[OBSERVED — AGENTS.md]`

| Task | Desktop | Mobile | Delta |
|------|---------|--------|-------|
| Create trip | Fast — modal + full keyboard | Acceptable — modal scroll | Neutral |
| Send invite | Copy link prominent | Share sheet native | **Mobile wins** |
| Add calendar event | Full form | Smaller viewport; place autocomplete usable | Moderate friction |
| Split expense | Multi-column summary | Single column; Venmo deeplink works | Neutral |
| Upgrade | Stripe checkout in browser | "Subscribe on web" dead-end | **Desktop wins** |
| Pro day sheet | Wide schedule possible | No dedicated mobile day sheet | **Desktop wins** |
| Onboarding | Two-column carousel + phone frame | Full-bleed 10 screens | **Mobile loses** |

---

## Onboarding experience

| Attribute | Desktop | Mobile |
|-----------|---------|--------|
| Screens | 10 (`OnboardingCarousel.tsx`) | Same 10, full-bleed |
| Skip affordance | Header X + "Skip demo" | Same |
| Perceived length | Moderate (side-by-side preview) | Long (immersive swipe) |
| Persona friction | Low (desktop-first users skip) | High (personas 8, 25) `[SIMULATED RISK]` |

**Recommendation:** Mobile-specific short path (3 screens) before first trip create. `[HYPOTHESIS]`

---

## Monetization & billing

### Desktop

- Landing `PricingSection.tsx` shows Trip Pass, tiers, FAQ `[OBSERVED]`
- `/settings?section=billing` — Stripe subscription management
- Trip Pass checkout via `TripPassModal.tsx` — **only reached from marketing**, not in-trip walls `[OBSERVED]`
- Pro CTAs → `mailto:` `[OBSERVED]`

### Mobile / iOS

- `APPLE_IAP_ENABLED = false` → consumer subscription shows "Subscribe on web" `[OBSERVED]`
- No deep link to web checkout documented in flow
- RevenueCat constants exist but IAP disabled `[OBSERVED — revenuecat.ts]`
- **17/30 personas** hit this dead-end on primary device

| Monetization step | Desktop success | Mobile success |
|-------------------|-----------------|----------------|
| See pricing | High (landing) | Medium (landing in browser) |
| Hit limit wall | Medium (settings redirect) | Medium |
| Complete Trip Pass | High (if on marketing) | **Low** |
| Complete subscription | High (Stripe) | **Blocked** |
| Pro purchase | Low (mailto) | **Very low** |

**Synthetic WTP lost at device boundary:** Personas 4, 9, 28 explicitly cite iOS upgrade failure in `pricing-insights.csv`.

---

## Invite & join flow

### Improvements since 10-persona study `[OBSERVED]`

- Rich trip preview card on join page (name, dates, cover, member count)
- `getJoinActionPresentation()` conditional approval framing
- 7 typed error states (`inviteErrors.ts`)

### Remaining mobile-specific issues

| Issue | Desktop impact | Mobile impact | Evidence |
|-------|----------------|---------------|----------|
| Auth before itinerary | Moderate | **High** — phone users less patient | `[OBSERVED]` guest permissions |
| Approval default framing | Same | Same — confusing on small screen | `[OBSERVED]` JoinTrip.tsx:857 |
| Preview readable | Good | Good (partial live test) | `[OBSERVED]` |
| Post-join empty chat | Same | **High** — primary comms channel empty | `[SIMULATED RISK]` |

---

## Feature parity by surface

| Feature | Desktop | Mobile/PWA | Parity |
|---------|---------|------------|--------|
| Chat | Full Stream UI | Full; past overflow/tap-steal bugs fixed | ✅ |
| Calendar | Month/day/list | Month/day/list; narrower | ✅ |
| Polls | Full | Full | ✅ |
| Places + map | Large map | Smaller map; usable | 🟡 |
| AI Concierge text | Full | Full; usage chip visible | ✅ |
| AI voice | Dictation | Dictation; mic UX critical | 🟡 |
| Smart Import | File upload easy | Camera/screenshot ingest valuable | 🟡 |
| Media hub | Grid + lightbox | Grid; iOS share-sheet ingestion | ✅ |
| Payments | Full | Venmo deeplink native | ✅ |
| Pro ops tabs | Visible (stubbed) | Hidden in overflow / cramped | ❌ |
| Broadcasts | Full compose | Compose OK; receipt depends on push | 🟡 |
| PDF export | Modal | Modal; smaller preview | 🟡 |
| Notifications prefs | Settings | Push opt-in + in-app | 🟡 |
| Offline | N/A | Limited PWA; touring pain | ❌ |

---

## Performance & perceived quality

| Signal | Desktop | Mobile | Notes |
|--------|---------|--------|-------|
| Loading skeletons | Present | Present | `[OBSERVED]` code |
| Trip Not Found flash | Fixed (regression watch) | Same | `[OBSERVED]` prior fix |
| Chat reconnect backfill | Fixed | Same | `[OBSERVED]` |
| Map jank | Lower | Higher on old devices | `[HYPOTHESIS]` |
| Live test coverage | Full 1280×800 | Partial 390×844 | `[OBSERVED — README]` |

---

## PWA-specific considerations

| Capability | Status | Persona impact |
|------------|--------|----------------|
| Add to home screen | Supported | Frat, sports — `[HYPOTHESIS]` |
| Push notifications | Opt-in flow exists | Rush chair (25) needs mute not just push |
| Share extension (iOS) | Media ingestion path | Festival (23) — `[OBSERVED]` |
| Offline itinerary | Weak | Touring (15, 16) — `[SIMULATED RISK]` |
| Service worker precache | Build includes SW | Faster repeat loads — `[OBSERVED]` build |

---

## Segment-specific web vs mobile synthesis

### Regular consumer (friend, bachelorette, golf)

- **Mobile:** Receive invite, vote in polls, chat, photos
- **Desktop:** Organizer setup, calendar bulk entry, concierge research
- **Gap:** Organizer on mobile can't complete Trip Pass purchase
- **Personas:** 4, 5, 8, 9, 10, 28

### Sports / youth parent

- **Mobile:** Parents live on phone; schedule glance critical
- **Desktop:** Coordinator sets up season
- **Gap:** Guest read-only schedule must work on mobile Safari without app install
- **Personas:** 2, 3, 24

### Events / wedding

- **Mobile:** Guests RSVP from phone
- **Desktop:** Organizer builds agenda, broadcasts
- **Gap:** Events pricing not visible on either; cap label scares on mobile preview
- **Personas:** 6, 21, 22

### Pro / touring

- **Mobile:** Day-of coordination, bus calls, venue changes
- **Desktop:** Roster, rooming, settlement setup
- **Gap:** No mobile day sheet; ops tabs empty on both but worse on mobile
- **Personas:** 11–17

---

## Priority fixes by platform

### Mobile-first (P0–P1)

1. iOS Trip Pass / subscription checkout path (P1-1)
2. Guest read-only itinerary on mobile Safari (P0-2)
3. Invite/share from trip header not buried in More (P2-5)
4. Short onboarding on mobile (P2-2)

### Desktop-first (P1–P2)

1. Self-serve Pro checkout (P1-4)
2. Pro ops data or hidden tabs (P0-4)
3. Events pricing on event create (P1-2)

### Both

1. Trip Pass at limit walls (P0-1)
2. PostHog with device dimension (P0-3)
3. Join approval framing (P0-5)

---

## Metrics to split by platform (post-PostHog)

| Event | Why split |
|-------|-----------|
| `trip_join_started` / `trip_joined` | Mobile invite conversion |
| `upgrade_prompt_shown` | Which device hits walls |
| `upgrade_started` / `upgrade_completed` | Mobile checkout abandonment |
| `onboarding_completed` vs `skipped` | Mobile drop-off |
| `concierge_query_sent` | Mobile vs desktop AI usage |

---

## Bottom line

**Mobile is the growth channel; desktop is the revenue and ops channel.** Today's architecture blocks revenue on the device where 57% of personas primarily coordinate (iOS + Android + mixed-mobile). Fixing iOS checkout and guest mobile preview unlocks the Regular consumer segment. Pro and Events can remain desktop-weighted temporarily **only if** sales motion is honest about mobile ops gaps.

---

*Cross-reference: `synthesis.md` § Web vs Mobile · `top-priority-fixes.md` P1-1, P2-2, P2-5*
