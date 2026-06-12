# Web vs Mobile/PWA Comparison — 30-Persona Study (2026-06-11)

> Grounded in the live harvest: identical journeys driven at desktop 1440×900 and mobile 390×844
> (touch, iPhone UA) against the same build. Screenshots: `screenshots/desktop[2]-*` vs
> `screenshots/mobile[2]-*`; machine logs alongside. Persona reactions aggregated from the 30
> reports. Environment caveat: backend unreachable in the sandbox (see `evidence-delta.md`), so
> this compares *rendered experience*, not network performance.

## Headline

**Feature parity is excellent — discoverability is not.** Nothing tested on desktop was missing on
mobile; the demo walkthrough captured the same tabs, modals, and data at both viewports
[OBSERVED]. But mobile hides what desktop shows: the horizontal tab strip keeps Tasks, Polls, and
Media off-screen, and the two live render defects both degrade mobile harder than desktop.

## Desktop web

**Strengths [OBSERVED]**
- The full marketing narrative exists only here in comfort: hero demo dashboard → fragmentation
  pitch → how-it-works → segments → AI → pricing → FAQ (`desktop-18..23`).
- Dense pro surfaces earn their pixels: 57-member roster chips with roles, Broadcasts/Channels/
  Messages side-by-side, PDF Recap flow (`desktop-08`, `desktop2-18..21`).
- All 8 consumer tabs + invite modal walk cleanly (`desktop2-01..11`).

**Issues [OBSERVED]**
- R2: "Maximum update depth exceeded" loop across consumer-trip tabs (129 occurrences; worst on
  chat Pinned, 34×) — `desktop-harvest2-log.json`.
- Upgrade walls route to `/settings` rather than checkout (`useConciergeUsage.ts:368`).
- "For Teams"/"Pricing" header links appear only after scrolling into marketing content
  (`desktop-22` vs `desktop-01`) — pro evaluators landing on `/` see a consumer demo first.
- Desktop-first personas (11, 13, 18, 20, 27) wanted admin affordances that don't exist yet:
  multi-trip portfolio view, CSV import/export, bulk operations. [SIMULATED RISK]

## Mobile web / PWA

**Strengths [OBSERVED]**
- Payments is the best mobile surface in the app: color-coded You-Owe/You're-Owed/Net summary,
  pending/settled chips, full-width thumb-reach "Add Payment Request" CTA (`mobile2-05`).
- Chat input carries mention, voice-input, attach, send affordances in one thumb row; inline
  system messages ("Sarah Chen added an expense…") merge activity into the conversation
  (`mobile2-01`).
- Event agenda cards are genuinely phone-first (`mobile-15`, `mobile2-21..23`).
- Complete parity: every desktop tab/subview rendered on mobile in the harvest.

**Issues [OBSERVED]**
- **R1 render storm hits mobile only**: duplicate keys in `MobileGroupCalendar.tsx:525` fire
  continuously (~150/step) on consumer, pro, AND event mobile pages — including while the user is
  on *other* tabs, proving the calendar stays mounted everywhere. 5,940 warnings in one session.
- **Tab-strip overflow**: only ~3.5 tabs visible at 390px; Tasks/Polls/Media require an
  undiscoverable horizontal scroll (`mobile2-01`). Persona 1's #1 feature (Tasks) was effectively
  invisible. No bottom navigation bar exists on mobile web.
- Header truncates trip names ("Spring Break Cancun 2…"); input placeholder clips ("Type @ to…")
  (`mobile2-01`).
- Demo-mode banner + header + tab strip consume ~25% of the 844px viewport before content.

**Persona verdicts (synthetic)**
- Mobile-primary personas (3, 7, 15, 23, 25, 28) rated mobile usability 3–4/5: right surfaces,
  wrong wayfinding. [SIMULATED RISK]
- Desktop-first org personas (6, 11, 18, 27) planned on desktop and only *checked* on mobile —
  parity matters more than mobile depth for them. [SIMULATED RISK]

## PWA / native-wrapper risks

- **Android has no story.** No Play Store presence (iOS Capacitor focus), no in-product PWA
  install prompt observed; Android personas (2, 24, 30) treat push reliability as the adoption
  gate. [OBSERVED absence + HYPOTHESIS on push behavior — needs device testing]
- **Offline guarantees unverified.** A service worker ships (`scripts/build-sw.cjs`), but no
  user-facing "this day is available offline" affordance exists — production coordinator (17) and
  race-day organizer (24) both need a pin-offline promise, not a cache lottery. [OBSERVED + SIMULATED RISK]
- **iOS wrapper:** consumer purchases on iOS still route around IAP (`APPLE_IAP_ENABLED = false`,
  ground truth §7) — monetization on the native wrapper remains web-dependent. [OBSERVED]

## Fix lists

**Mobile-first (ordered)**
1. R1 key fix + unmount inactive tabs (P0-1) — every mobile minute currently pays a render tax.
2. Tab strip: wrap/reorder per trip type or adopt bottom nav for Chat/Calendar/Payments/More (P3).
3. Truncation polish: header trip name, input placeholder (P3).
4. Android PWA story: install prompt, push reliability verification on devices (Later, but cheap
   to *test* now).
5. "Pin day offline" with cached-at stamp (P2-tier for ops/event segments).

**Desktop/admin-first (ordered)**
1. R2 setState loop (P0-2).
2. Checkout routing from limit walls (P1-5) and self-serve Pro checkout (P1-2).
3. Multi-trip portfolio dashboard for agency/ops personas (with P1-6).
4. Header nav: surface For Teams/Pricing pre-scroll (P3).
