> **Refreshed 2026-08-02:** Live desktop 1280×800 + mobile 390×844 sample on Vite `8080` (landing, pricing, `/teams`). iOS IAP + Trip Pass at concierge remain closed; add-by-contact and Pro day-sheet MVP shipped. See `REBASE-REFRESH-2026-08-02.md`.

# Web vs Mobile / PWA — 30-Persona Synthetic Study

**Date:** 2026-06-11 · **Evidence refresh:** 2026-08-02  
**Scope:** Desktop web (1280×800 live test) vs mobile/PWA/iOS Capacitor (390×844 live landing + responsive code review)  
**Caveat:** Cloud environment blocked demo trip interior (Stream/Supabase CORS) `[OBSERVED — 2026-08-02]`. Mobile trip-tab findings blend code review, prior 10-persona study, and partial live session.

---

## Executive comparison

| | **Desktop web** | **Mobile / PWA / iOS** |
|---|-----------------|------------------------|
| **Verdict** | Best for activation, Pro ops, Events planning | Best for invite receipt, on-the-go chat, polls — worst for paywalls |
| **Strength** | Multi-tab trip workspace, landing pricing clarity | Native share, bottom nav thumb reach, push opt-in |
| **Critical gap** | Not where most users plan (13/30 desktop-first) | Invite/guest wall, onboarding length, ops views missing (IAP fixed July 26) |
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
| Upgrade | Stripe + Trip Pass in-app; `/teams` trial via `startProCheckout` | IAP enabled (`APPLE_IAP_ENABLED: true`) | **Parity improved** |
| Pro day sheet | `ProDaySheet` today view from calendar | Same component; narrow viewport | **Desktop still better for ops** |
| Onboarding | Two-column carousel + phone frame | Full-bleed 10 screens | **Mobile loses** |
| Add member | Email/phone tabs in InviteModal | Same; 44px tabs | **Parity** `[OBSERVED — code]` |

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

- Landing `PricingSection.tsx` shows Trip Pass ($39.99 / $74.99), tiers, FAQ `[OBSERVED — browser 2026-08-02]`
- `/settings?section=billing` — Stripe + Trip Pass accordion; `?gate=` opens `PlusUpsellModal` `[OBSERVED]`
- Trip Pass also via Concierge / PlusUpsell — **not marketing-only** `[OBSERVED]`
- Remaining gap: Smart Import / some gates still hop through settings; split wall has no Trip Pass CTA `[OBSERVED]`
- `/teams` trial → `startProCheckout` (Stripe); footer Schedule Demo still mailto; Calendly env often unset `[OBSERVED — live /teams]`

### Mobile / iOS

- `APPLE_IAP_ENABLED: true` → RevenueCat IAP path for iOS native review builds `[OBSERVED — billing/config.ts:260]`
- iOS-primary personas — purchase path unblocked; **guest wall** remains the mobile growth risk

| Monetization step | Desktop success | Mobile success |
|-------------------|-----------------|----------------|
| See pricing | High (landing) | Medium (landing in browser) |
| Hit concierge limit | High (Trip Pass in PlusUpsell) | High (same modal) |
| Hit Smart Import wall | Medium (settings → upsell) | Medium |
| Complete Trip Pass | High (billing / upsell) | **Medium–High** (IAP) |
| Complete subscription | High (Stripe) | **Medium–High** (IAP) |
| Pro purchase | High (trial checkout) / Medium (demo mailto fallback) | Medium (in-app) |

**Synthetic growth risk on mobile (August 2):** Not purchase — **always-approval invite + zero guest value** for cold invitees. Add-by-contact helps only when friends already have Chravel.

---

## Invite & join flow

### Improvements since 10-persona study `[OBSERVED]`

- Rich trip preview card on join page (name, dates, cover, member count)
- `getJoinActionPresentation()` now **always** request-to-join (approval is product policy)
- 7 typed error states (`inviteErrors.ts`)
- **Aug 2:** Add existing Chravel user by email/phone in InviteModal (`AddExistingMemberSection`)
- **Aug 2:** Invite preview surfaces seat capacity / `TRIP_FULL`

### Remaining mobile-specific issues

| Issue | Desktop impact | Mobile impact | Evidence |
|-------|----------------|---------------|----------|
| Auth before itinerary | Moderate | **High** — phone users less patient | `[OBSERVED]` guest permissions |
| Always-approval wait | Same | Same — confusing on small screen | `[OBSERVED]` product policy |
| Preview readable | Good | Good (partial live test) | `[OBSERVED]` |
| Post-join empty chat | Same | **High** — primary comms channel empty | `[SIMULATED RISK]` |
| Add-by-contact requires existing account | Helps organizers | Cold SMS/iMessage invitees still blocked | `[OBSERVED]` |

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
| Pro ops tabs | Day-sheet MVP + roster; finance/medical hidden | Same; cramped | 🟡 |
| Broadcasts | Compose + Seen-by roster | Compose OK; Seen-by sheet; push for receipt | 🟡 |
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
