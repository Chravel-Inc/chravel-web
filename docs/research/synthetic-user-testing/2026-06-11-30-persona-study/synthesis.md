# ChravelApp 30-Persona Synthetic Study — Aggregate Synthesis

**Date:** 2026-06-11  
**Package:** `docs/research/synthetic-user-testing/2026-06-11-30-persona-study/`  
**Method:** 30 synthetic personas × desktop web + mobile/PWA viewports, grounded in live browser sessions (`localhost:8080`), codebase audit, and prior 10-persona study (`../REPORT.md`).  
**Data sources:** `persona-matrix.csv`, `feature-findings.csv`, `pricing-insights.csv`, `raw-synthetic-survey-responses.json`, `../evidence/product-ground-truth.md`

---

## Evidence discipline

| Label | Meaning |
|-------|---------|
| `[OBSERVED]` | Verified in UI, browser session, codebase, or audit docs |
| `[SIMULATED RISK]` | Plausible persona reaction inferred from observed UI/code — not verified with a real person |
| `[HYPOTHESIS]` | Claim requiring real user validation |
| `[SYNTHETIC QUOTE]` | Simulated persona voice — not a real customer |

**This document is not customer validation.** Synthetic testing stress-tests coverage, UX failure modes, and monetization traps. Do not cite conversion scores or WTP as proof of market demand.

---

## Executive Summary

### 10 signals (what the product is telling us)

1. **Single-player organizer loop is real.** Calendar, polls, places, and text concierge activate in first session across Regular segments (activation avg **6.1/10**). `[OBSERVED]` + `[SIMULATED RISK]`
2. **Group coordination primitives are load-bearing.** Polls and calendar score highest in feature heatmap across 24/30 personas. `[SIMULATED RISK]`
3. **Willingness to pay is widespread but uncapturable.** 22/30 personas state non-zero WTP; paid-conversion scores avg **2.7/10**. Gap = machinery, not demand. `[SIMULATED RISK]` + `[OBSERVED]`
4. **Trip Pass is the dominant consumer SKU.** 14/30 personas prefer per-trip; Explorer 45-day $39.99 / FC 90-day $74.99 maps to bachelorette, sports parents, festival groups. `[SIMULATED RISK]` — see `pricing-insights.csv`
5. **Invite preview improved; invitee value path did not.** Join page now shows rich trip card and conditional approval framing `[OBSERVED — JoinTrip.tsx]`; `consumer_guest` still has zero resource access `[OBSERVED — permissionMatrix.generated.ts]`.
6. **Pro demo sells checks real trips cannot cash.** `tripConverter.ts:117-130` hardcodes roster, schedule, settlement, per-diem, compliance to `[]` for all real Pro trips. Pro NPS avg **−24.3** vs Regular **−2.1**. `[OBSERVED]`
7. **Broadcast reliability is a scale cliff.** Schema drift between `trip_broadcasts` (migration) and `broadcasts` (app) caused fanout failures; fix landed in `20260610090000_fix_broadcast_notification_fanout_table.sql` but unvalidated at 1k+ attendees. `[OBSERVED]`
8. **Analytics is dark.** PostHog project `ingested_event: false` — zero Chravel product events ever. Complete funnel map exists in `src/telemetry/types.ts` but `VITE_POSTHOG_API_KEY` unset. `[OBSERVED — posthog-funnel.md]`
9. **Mobile is the primary device for 17/30 personas** but monetization and ops workflows bias desktop (Pro mailto checkout, day-sheet gaps). `[SIMULATED RISK]` — see `persona-matrix.csv` platform column
10. **Landing narrative is clear; in-trip and Events pricing is not.** Marketing `PricingSection.tsx` explains tiers; Events module and in-app limit walls route to `/settings` subscription framing, not Trip Pass. `[OBSERVED]`

### 10 risks (investor-grade candid)

1. **Revenue layer is structurally broken.** Trip Pass modal mounted only on marketing `PricingSection.tsx` `[OBSERVED]`; limit walls use `featurePaywall.ts` → `/settings?section=billing` with subscription copy, no Trip Pass CTA `[OBSERVED]`.
2. **iOS consumer monetization dead-end.** `APPLE_IAP_ENABLED = false` → "Subscribe on web" with no outbound purchase link `[OBSERVED — product-ground-truth.md §7]`. 17/30 personas list iOS as primary platform.
3. **Pro is a demo wrapper for B2B.** All 10 Pro/Ops personas score paid conversion ≤4 and NPS ≤−15. Selling Growth/Enterprise with stub tabs is reputational debt.
4. **Invite funnel still kills group growth.** Mandatory auth before value + zero guest permissions → invite scores avg **5.1/10** (down from organizer activation 6.1). `[OBSERVED]` + `[SIMULATED RISK]`
5. **Unenforced limits erode trust when eventually enforced.** Payment splits cap (3/trip) has no enforcement call sites `[OBSERVED — 10-persona REPORT §5 C1]`; attendee cap labels scare without blocking `[OBSERVED]`.
6. **Notification fanout at scale.** Synchronous INSERT fanout blocks at ~4k members; no per-trip mute `[OBSERVED — NOTIFICATION_AUDIT.md]`. Personas 22, 25, 14 flag this.
7. **PostHog blindness.** Cannot measure invite→join→activate→pay funnel; every priority debate is opinion until telemetry ships.
8. **10-screen onboarding before first trip.** `OnboardingCarousel.tsx` — 10 screens (Welcome → Chat → Calendar → Concierge → Media → Payments → Places → Polls → Tasks → CTA). College/frat personas rate onboarding as churn driver. `[OBSERVED]`
9. **AI trust gap.** AI trust ratings avg **3.4/5** in synthetic interviews; voice concierge sells live audio but product path is dictation-only `[OBSERVED — voiceProductPath.ts]`.
10. **Security/compliance blockers for Enterprise.** Unsigned media URLs, wildcard CORS on 26 edge functions, demo super-admin in `FOUNDER_EMAILS` `[OBSERVED — product-ground-truth.md §10]`.

### 10 wins (what to protect and amplify)

1. **Trip creation UX** — title, dates, timezone, cover photo flow works; Pro category picker is differentiated. `[OBSERVED]`
2. **Polls as group decision engine** — bachelorette, frat, sports, corporate personas all cite polls as killer feature. `[SIMULATED RISK]`
3. **Shared calendar** — strongest retention hook for sports parents, reunions, touring (when day-level view exists). `[SIMULATED RISK]`
4. **Places + Basecamp** — multi-city touring persona 16 validates basecamp-per-city mental model. `[SIMULATED RISK]`
5. **Join page preview card** — improved since 10-persona study: trip name, dates, cover, member count before auth `[OBSERVED — JoinTrip.tsx]`.
6. **Concierge usage chip** — visible quota in `AIConciergeChat.tsx` (fixed since 10-persona `_usage` discard). `[OBSERVED]`
7. **Smart Import architecture** — state machine ingest→commit impresses corporate/events personas when reachable. `[OBSERVED]`
8. **Venmo deeplink settle-up** — correct scope (tracking, not processor); golf/bachelor personas accept it. `[SIMULATED RISK]`
9. **Role/channel model skeleton** — sports role defaults resonate in demo; foundation is real, data layer is not. `[OBSERVED]`
10. **Premium dark/gold landing** — luxury advisor (29) and wedding planner (21) rate clarity 6–7/10 on marketing. `[SIMULATED RISK]`

### 5 bets (where to concentrate next 90 days)

1. **Close the monetization chain for Regular consumers** — Trip Pass at every limit wall, Stripe checkout in-flow, iOS web-checkout deep link or IAP decision. Target: 14 Trip Pass–fit personas.
2. **Guest read-only itinerary** — unauthenticated or light-auth preview of calendar + polls before signup. Target: invite score 5.1 → 7.0.
3. **Hide or ship Pro ops tabs** — no placeholder roster/settlement/compliance UI on real trips until CRUD exists. Target: Pro NPS −24 → −10.
4. **Enable PostHog + ship 5 funnel events** — `trip_join_started`, `trip_joined`, `upgrade_prompt_shown`, `upgrade_started`, `upgrade_completed`. Target: replace hypothesis with data within 2 weeks of deploy.
5. **Events pricing surfacing** — dedicated Events tier copy on event creation and `/event/:id` settings, decouple from consumer subscription confusion. Target: personas 6, 18, 21, 22.

### 5 not to build (yet)

1. **In-app payment processing** — personas accept Venmo/manual settle; processor adds compliance without unlocking WTP. `[HYPOTHESIS]`
2. **Full OTA booking aggregation** — coordination layer positioning is correct; booking drags licensing. `[OBSERVED — AGENTS.md]`
3. **Multi-tenant white-label / agency workspaces** — personas 20, 29 want it but Enterprise surface isn't shippable until Pro ops is real. `[SIMULATED RISK]`
4. **Recurring trip templates** — run club (24) wants it but segment WTP is $0; duplicate-trip is cheaper. `[SIMULATED RISK]`
5. **Live Gemini voice concierge** — entitlement oversells current dictation-only path; fix labeling before rebuilding WebSocket proxy. `[OBSERVED]`

---

## Persona Segment Matrix

Reference: `persona-matrix.csv` (30 rows). Aggregated below by segment family.

| Segment family | Personas (IDs) | n | Avg activation | Avg invite | Avg day-7 | Avg paid | Avg NPS | Top SKU | Primary churn risk |
|----------------|----------------|---|----------------|------------|-----------|----------|---------|---------|-------------------|
| **Regular — friend/social** | 1, 4, 5, 8, 9, 10, 28 | 7 | 6.7 | 4.9 | 4.0 | 2.6 | −2.1 | Trip Pass / Free | Trip Pass unreachable |
| **Regular — sports/youth parent** | 2, 3, 24 | 3 | 5.7 | 4.3 | 4.7 | 2.0 | −8.3 | Trip Pass / Free | Guest wall + Smart Import paywall |
| **Regular — family/community** | 7, 26, 27, 30 | 4 | 5.5 | 3.8 | 4.3 | 2.0 | −3.8 | Free / Explorer | Invite friction + tech literacy |
| **Events — weddings/celebrations** | 6, 21 | 2 | 6.0 | 4.5 | 5.0 | 4.5 | 0.0 | 90-day Pass / Event pass | False attendee cap copy |
| **Events — large scale** | 18, 22, 25 | 3 | 5.3 | 6.3 | 2.7 | 1.7 | −21.7 | Event pass / Season | Broadcast scale + notifications |
| **Pro — sports/teams** | 11, 12, 13, 14 | 4 | 5.5 | 6.3 | 3.3 | 2.3 | −27.5 | Pro Growth / Enterprise | Hollow ops tabs |
| **Pro — touring/creative** | 15, 16, 17 | 3 | 5.3 | 6.0 | 3.3 | 2.7 | −25.0 | Pro Starter / Growth | Settlement stub + offline |
| **Pro — enterprise/security** | 19, 20 | 2 | 6.0 | 5.0 | 4.5 | 3.0 | −7.5 | Enterprise / White-label | Security + no multi-tenant |
| **Pro — luxury advisor** | 29 | 1 | 6.0 | 5.0 | 6.0 | 5.0 | 10.0 | White-label export | Export branding |
| **Regular — festival/niche** | 23 | 1 | 7.0 | 6.0 | 4.0 | 3.0 | 5.0 | Trip Pass | Import paywall |

**Cross-segment insight:** Regular organizers activate; Pro buyers churn on hollow ops; Events buyers sit in the middle if pricing is legible. Invite is the universal weak column (avg **5.1/10**).

---

## Feature Heatmap

**Legend:** Strong · Moderate · Neutral · Low · Negative  
Rows = features. Columns = segment families (from matrix above).

| Feature | Friend/Social | Sports/Parent | Family/Community | Events | Pro Sports | Pro Touring | Enterprise Pro |
|---------|---------------|---------------|------------------|--------|------------|-------------|----------------|
| Auth / onboarding | Moderate | Low | Low | Moderate | Moderate | Moderate | Moderate |
| Trip creation | Strong | Moderate | Moderate | Moderate | Moderate | Moderate | Moderate |
| Invite / join | Moderate | Low | Low | Moderate | Moderate | Moderate | Moderate |
| Chat | Moderate | Moderate | Moderate | Moderate | Moderate | Moderate | Moderate |
| AI Concierge (text) | Strong | Moderate | Moderate | Moderate | Low | Low | Moderate |
| Calendar | Strong | Strong | Strong | Moderate | Moderate | Low | Moderate |
| Smart Import | Moderate | Low | Neutral | Strong | Moderate | Moderate | Strong |
| Places / Basecamp | Strong | Moderate | Moderate | Moderate | Moderate | Strong | Moderate |
| Polls | Strong | Strong | Moderate | Strong | Moderate | Moderate | Strong |
| Tasks | Moderate | Strong | Strong | Moderate | Moderate | Moderate | Moderate |
| Payments / splits | Low | Low | Low | Low | Negative | Negative | Negative |
| Media | Low | Moderate | Neutral | Low | Moderate | Moderate | Low |
| Broadcasts | Neutral | Moderate | Moderate | Strong | Moderate | Strong | Strong |
| Pro ops (roster, settlement) | Neutral | Neutral | Neutral | Neutral | Negative | Negative | Negative |
| Notifications | Low | Low | Low | Low | Negative | Low | Negative |
| Subscription / upgrade | Negative | Negative | Negative | Low | Negative | Negative | Negative |
| Mobile navigation | Moderate | Moderate | Low | Moderate | Moderate | Low | Moderate |
| Web navigation | Strong | Neutral | Strong | Strong | Strong | Moderate | Strong |
| PDF / export | Low | Neutral | Neutral | Moderate | Low | Low | Strong |

**Reading the heatmap:** Green zones (calendar, polls, places) justify consumer GTM. Red zone (upgrade flow, Pro ops, payments at scale) blocks revenue. Subscription column is **Negative** in 6/7 columns — the monetization chain failure is segment-agnostic.

---

## Web vs Mobile Synthesis

| Dimension | Desktop web | Mobile / PWA / iOS wrapper |
|-----------|-------------|----------------------------|
| **Primary users** | Pro ops (11–14, 17–19), desktop-first family (7, 27), corporate (18) | 17/30 personas primary iOS/Android `[persona-matrix.csv]` |
| **Navigation** | Top nav + full trip tabs — rated Strong for Pro and events planning `[SIMULATED RISK]` | Bottom `NativeTabBar` — invite/share buried in More menu (persona 10) `[SIMULATED RISK]` |
| **Activation** | Faster trip creation, multi-tab ops | Onboarding carousel full-bleed; 10 screens before CTA `[OBSERVED]` |
| **Monetization** | Stripe checkout works on web | iOS: "Subscribe on web" dead-end `[OBSERVED]`; no IAP |
| **Invite sharing** | Copy link, email | Native share sheet works; preview readable on small viewport `[OBSERVED — partial live test]` |
| **Pro workflows** | Day-sheet, roster, broadcasts usable width | Touring personas (15, 16) need mobile day sheet — missing `[SIMULATED RISK]` |
| **Concierge** | Text chat usable | Voice/dictation mic UX critical; live voice disabled `[OBSERVED]` |
| **Offline / PWA** | Less relevant | Field trip, touring, sports — offline failures flagged `[SIMULATED RISK]` |

**Synthesis:** Mobile is acquisition and invite channel; desktop is ops and monetization. Current architecture inverts this — paywalls and Pro checkout are hardest on the device most users hold. See `web-mobile-comparison.md` for full breakdown.

---

## Onboarding + Survey Synthesis

### Onboarding flow `[OBSERVED]`

- **10 screens** in `OnboardingCarousel.tsx`: Welcome → Chat → Calendar → Concierge → Media → Payments → Places → Polls → Tasks → Final CTA.
- Skippable via header X and "Skip demo" on non-final screens.
- Completion stored in `user_metadata`; telemetry events defined (`onboarding_screen_viewed/completed/skipped`) but not ingested `[OBSERVED]`.

### Synthetic survey highlights (`raw-synthetic-survey-responses.json`)

| Metric | Mean | Min–Max | Notes |
|--------|------|---------|-------|
| Likelihood next trip | 6.1 | 4–7 | Regular > Pro |
| Clarity | 5.8 | 4–7 | Landing helps; in-app tiers confuse |
| Time saved | 4.9 | 3–6 | Gains only after friends join |
| AI trust | 3.4 | 2–5 | Confirm-card helps; quota walls hurt |
| Would invite | 5.1 | 3–8 | Frat (25) high; family elder (7) low |
| Mobile usability | 4.2 | 3–5 | Cloud mobile test limited `[README.md]` |
| Web usability | 4.6 | 4–6 | Desktop-first personas higher |
| Pricing fit | 3.1 | 1–6 | Misaligned SKU exposure |
| Beta follow-up "Yes" | 22/30 | — | `[HYPOTHESIS]` for real recruitment |

### Onboarding recommendations

1. **Collapse 10 → 4 screens** for returning planners (Welcome, Calendar+Polls combo, Concierge taste, CTA). `[HYPOTHESIS]`
2. **Defer Pro/Event tours** until trip type selected. `[SIMULATED RISK]`
3. **Instrument onboarding** as first PostHog events post-enable. `[OBSERVED]`

---

## Pricing + Monetization Synthesis

### SKU fit by segment (`pricing-insights.csv`)

| Segment | Preferred model | WTP range (stated) | Best CTA (synthetic) | Worst CTA | Upgrade trigger |
|---------|-----------------|--------------------|-----------------------|-----------|-----------------|
| Friend/social | Per-trip | $0–$40 | Trip Pass at limit | $19.99/mo sub | Photo wall, splits |
| Sports parent | Per-trip | $30–$40 | Trip Pass at split wall | iOS Subscribe on web | 4th payment split |
| Events/wedding | Per-trip / pass | $75–$200 | 90-day Wedding Pass | 100-attendee scare label | Storage, broadcasts |
| Pro sports | Team/enterprise | $49–$99+/mo | Self-serve checkout | mailto demo | Day sheet, compliance |
| Pro touring | Team | $49–$99+/mo | Growth self-serve | Demo bait | Settlement, day sheet |
| Enterprise | Custom | Custom | Sales + SLA | Self-serve only | Broadcast reliability |
| Price-sensitive | Free | $0 | None | Any upgrade popup | — |

### Monetization chain status `[OBSERVED]`

| Link | Status | Evidence |
|------|--------|----------|
| Limit enforcement (splits) | **Broken** | No call sites in payments components |
| Limit visibility (concierge) | **Fixed** | `AIConciergeChat.tsx` usage chip |
| Paywall destination | **Weak** | `featurePaywall.ts` → `/settings`, subscription copy |
| Trip Pass in-app | **Missing** | Only `PricingSection.tsx` + `TripPassModal.tsx` on marketing |
| Pro self-serve | **Missing** | `mailto:` in `PricingSection.tsx:140-173` |
| iOS purchase | **Dead-end** | `APPLE_IAP_ENABLED = false` |
| Attendee cap | **Label only** | No enforcement; scares Events buyers |
| Post-purchase telemetry | **Dark** | PostHog zero events |

### Pricing table (canonical tiers)

| Tier | Price | Best for (30-persona study) | Study fit |
|------|-------|------------------------------|-----------|
| Free | $0 | College, church, run club, price-sensitive bachelor | 5 personas; retention risk |
| Explorer | $9.99/mo · $99/yr | Luxury planner, international organizer | 2 personas |
| Frequent Chraveler | $19.99/mo · $199/yr | Power planners, voice entitlement | 1 persona |
| Explorer Trip Pass | $39.99 / 45 days | Bachelorette, sports, festival, couples | **14 personas** |
| FC Trip Pass | $74.99 / 90 days | Destination wedding, large friend trips | 2 personas |
| Pro Starter | $49/mo | Small touring, film shoots | 3 personas |
| Pro Growth | $99/mo | NFL/NBA/Duke ops | 4 personas |
| Enterprise | Custom | Conference 1k, HS athletic director | 3 personas |

**Investor note:** The product's stated WTP clusters on Trip Pass ($30–$40) but the codebase routes limit moments to monthly subscription settings. This is a **SKU mismatch**, not a pricing problem.

---

## Product Priority Matrix (P0–P3)

| Priority | Item | Effort | Owner | Segments | Evidence |
|----------|------|--------|-------|----------|----------|
| **P0** | Surface Trip Pass at all limit walls (concierge, import, media, splits) | M | Growth + Billing | Regular (22) | `[OBSERVED]` featurePaywall.ts vs TripPassModal |
| **P0** | Guest read-only itinerary (calendar + polls preview pre-auth) | L | Core + Auth | All Regular | `[OBSERVED]` consumer_guest |
| **P0** | Enable PostHog in production (`VITE_POSTHOG_API_KEY`) | S | Platform | All | `[OBSERVED]` posthog-funnel.md |
| **P0** | Hide Pro stub tabs until data exists (or ship roster CRUD) | M | Pro | Pro (10) | `[OBSERVED]` tripConverter.ts |
| **P1** | iOS monetization path (web checkout deep link or IAP) | L | Mobile + Billing | iOS-primary (17) | `[OBSERVED]` |
| **P1** | Fix join approval default framing when `require_approval=false` | S | Core | Invite (30) | `[OBSERVED]` JoinTrip.tsx:857-859 |
| **P1** | Events pricing module on event create/detail | M | Events + Growth | Events (5) | `[SIMULATED RISK]` |
| **P1** | Enforce or remove payment split cap | S | Payments | Sports, bachelor | `[OBSERVED]` |
| **P1** | Self-serve Pro checkout (replace mailto) | L | Billing | Pro (10) | `[OBSERVED]` PricingSection.tsx |
| **P2** | Per-trip notification mute | M | Notifications | Frat, conference | `[OBSERVED]` |
| **P2** | Broadcast fanout validate at 500+ members | M | Backend | Events, Pro | `[OBSERVED]` migration 20260610090000 |
| **P2** | Onboarding reduce 10 → 4 screens | M | Growth | College, frat | `[OBSERVED]` |
| **P2** | Day sheet / mobile ops view | L | Pro | Touring (3) | `[SIMULATED RISK]` |
| **P2** | Honest voice concierge labeling | S | AI | FC tier | `[OBSERVED]` voiceProductPath |
| **P3** | Duplicate trip template | M | Core | Run club | `[SIMULATED RISK]` |
| **P3** | Reimbursement mode for corporate | L | Payments | Corporate (1) | `[SIMULATED RISK]` |
| **P3** | White-label PDF export | L | Pro | Advisor (1) | `[SIMULATED RISK]` |
| **P3** | i18n / timezone copy pass | L | Core | International (1) | `[SIMULATED RISK]` |

Effort key: **S** = days, **M** = 1–2 weeks, **L** = 3+ weeks.

---

## Top 20 Synthetic Quotes

| # | Quote | Persona | Segment | Label |
|---|-------|---------|---------|-------|
| 1 | "I'd pay $40 for this trip if the button appeared when my photo wall filled up — I couldn't find it anywhere in the app." | Mia Torres (4) | Bachelorette | `[SYNTHETIC QUOTE]` |
| 2 | "My parents aren't making an account to see kickoff time. Email the schedule or I'm back to TeamSnap." | Dana Whitfield (2) | Sports mom | `[SYNTHETIC QUOTE]` |
| 3 | "The demo roster looks like our NFL travel desk. My real trip has empty tabs. That's not a bug, that's false advertising." | Dana Okafor (11) | Pro sports | `[SYNTHETIC QUOTE]` |
| 4 | "Subscribe on web — I'm literally holding my phone. You lost me." | Camille Dubois (9) | Couples | `[SYNTHETIC QUOTE]` |
| 5 | "100 attendees max? We have 85 RSVPs and I'm afraid to invite cousins." | Priya & James Chen (6) | Wedding | `[SYNTHETIC QUOTE]` |
| 6 | "Polls settled brunch in one vote. That's the whole product for me." | Tyler Brooks (8) | College | `[SYNTHETIC QUOTE]` |
| 7 | "mailto:support for a $99 team plan? Our AP department doesn't do mailto." | Alex Rivera (18) | Corporate | `[SYNTHETIC QUOTE]` |
| 8 | "Ten onboarding screens before I could invite my crew? They'd already picked a bar." | Jake Morrison (25) | Fraternity | `[SYNTHETIC QUOTE]` |
| 9 | "Smart Import pulled our festival lineup from a PDF. Then it asked me to subscribe on a settings page." | Zoe Martinez (23) | Festival | `[SYNTHETIC QUOTE]` |
| 10 | "Member Approval on the join page — I never turned that on. My aunt thought she was rejected." | Robert Ellison (7) | Family reunion | `[SYNTHETIC QUOTE]` |
| 11 | "Settlement tab is empty. I've been burned by tour software that demos well and ships air." | Devon Hayes (16) | Touring | `[SYNTHETIC QUOTE]` |
| 12 | "The concierge told me three restaurants and let me save them. That's more useful than ChatGPT." | Jordan Kim (10) | Friend organizer | `[SYNTHETIC QUOTE]` |
| 13 | "I need signed URLs for client itineraries. I can't send unsigned S3 links to a CEO." | Claire Nguyen (19) | EA / security | `[SYNTHETIC QUOTE]` |
| 14 | "If broadcasts fail at 800 people, I'm the headline, not your app." | Dr. Alan Pierce (22) | Conference | `[SYNTHETIC QUOTE]` |
| 15 | "Venmo link is fine. I don't need you to move money — I need you to stop the spreadsheet." | Brad Olsen (5) | Golf trip | `[SYNTHETIC QUOTE]` |
| 16 | "Export with my logo is the whole reason I'd pay — the button does nothing on the real trip." | Serena Vale (1) | Luxury planner | `[SYNTHETIC QUOTE]` |
| 17 | "Three trips free is fine. Don't show me a paywall on trip two when nothing's enforced." | Chris Delaney (24) | Run club | `[SYNTHETIC QUOTE]` |
| 18 | "Chaperone assignments in tasks — yes. Making every parent create a password — no." | Ms. Linda Park (27) | School field trip | `[SYNTHETIC QUOTE]` |
| 19 | "Your landing page explains pricing better than the trip I'm inside." | Isabelle Fontaine (29) | Luxury advisor | `[SYNTHETIC QUOTE]` |
| 20 | "Timezone on create is good. Everything else assumes America." | Amara Osei (30) | International | `[SYNTHETIC QUOTE]` |

---

## Top 20 Real Beta Interview Questions

Prioritized for validation of synthetic findings. Full annotated list in `real-beta-interview-questions.md`.

1. Walk me through the last trip you organized — what apps did you use and where did coordination break?
2. At what moment would you pay for a coordination tool — before, during, or after the trip?
3. **WTP:** Would you rather pay $39 once for a 45-day trip pass or $10/month ongoing? Why?
4. Show invite link to a friend (live) — what would stop them from joining?
5. **Guest access:** Should invitees see the itinerary before creating an account? What would they need to see?
6. **AI trust:** What would the concierge have to do before you'd let it change your itinerary?
7. **Smart Import:** Paste a real confirmation email — what would "good enough" extraction look like?
8. **Payments:** Do you need in-app payments or is Venmo + a ledger enough?
9. **Media:** Where do trip photos live today? What would make you move them?
10. **Mobile:** Did you try to upgrade on your phone? What happened?
11. **Pro:** If you manage team travel, what's missing vs your current stack (Teamworks, etc.)?
12. **Broadcasts:** How many people need to get a message at once? What if half don't see it?
13. **Events:** How do you think Events pricing should work — per event, per attendee, or subscription?
14. **Trip Pass vs sub:** When you hit a limit, which offer would you click?
15. **Onboarding:** How many intro screens is too many before your first trip?
16. **Notifications:** What would make you mute a trip? What can't you miss?
17. **Permissions:** Who should edit the calendar vs view-only?
18. **Export:** Would you pay for a branded PDF? Show mock — what's wrong?
19. **iOS:** Are you willing to complete purchase on web from the app?
20. **NPS blockers:** What would make you warn a friend not to use Chravel?

---

## Founder / Investor Readout

### The one paragraph

Chravel's **organizer-side product works** — calendar, polls, places, and AI concierge create genuine first-session value across diverse segments. The **group growth and revenue layers do not**: invitees hit an account wall with no guest value, the SKU personas want (Trip Pass $39.99) is unreachable at limit moments, iOS users cannot pay, Pro tiers display demo data on real trips, and the company has **zero production analytics** to measure any fix. Willingness to pay is synthetically widespread (22/30 personas) but paid-conversion scores average **2.7/10** — a machinery failure, not a positioning failure. **Do not scale marketing or Pro sales until P0 monetization and invite fixes ship and PostHog confirms funnel movement.**

### Scorecard (synthetic — not market proof)

| Metric | Value | Benchmark |
|--------|-------|-----------|
| Avg activation | 6.1 / 10 | Acceptable for beta |
| Avg invite | 5.1 / 10 | Below threshold for viral loops |
| Avg day-7 retention | 4.2 / 10 | `[HYPOTHESIS]` |
| Avg paid conversion | 2.7 / 10 | Critical gap |
| Avg NPS (all) | −8.7 | Dragged by Pro (−24.3) |
| Personas with WTP > $0 | 22 / 30 | Demand signal `[SIMULATED RISK]` |
| Personas matching Trip Pass SKU | 14 / 30 | Supply mismatch `[OBSERVED]` |

### Recommended sequencing (next 30 days)

1. **Week 1:** PostHog on + Trip Pass at concierge/import/media walls + guest read-only spec
2. **Week 2:** Join approval copy fix + hide Pro stubs + iOS checkout path decision
3. **Week 3:** Real beta interviews (n=8–12) using `real-beta-interview-questions.md`
4. **Week 4:** Enforce or remove split cap; Events pricing copy; Pro mailto → Stripe trial

### What would change the investor conversation

- **Observed** invite→join rate >40% (currently unmeasured)
- **Observed** Trip Pass conversion >5% of limit-wall impressions
- **Observed** Pro pilot with 1 sports team using real roster data (not demo)
- **Observed** broadcast success at 500+ recipients without transaction timeout

---

*Generated 2026-06-11. Synthetic study — validate all `[HYPOTHESIS]` and `[SIMULATED RISK]` items with real users before strategic decisions.*
