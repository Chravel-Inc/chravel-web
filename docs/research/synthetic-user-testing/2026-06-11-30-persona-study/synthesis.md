# ChravelApp 30-Persona Synthetic Study — Aggregate Synthesis

**Original study:** 2026-06-11 · **Evidence refresh:** 2026-07-26 (rebased onto `main`)  
**Package:** `docs/research/synthetic-user-testing/2026-06-11-30-persona-study/`  
**Delta doc:** `REBASE-REFRESH-2026-07-26.md`  
**Method:** 30 synthetic personas × desktop web + mobile/PWA viewports, grounded in browser sessions, codebase audit, prior 10-persona study, and July 2025–26 product audits.  
**Data sources:** `persona-matrix.csv` (scores refreshed 2026-07-26), `feature-findings.csv`, `pricing-insights.csv`, `raw-synthetic-survey-responses.json`, `../evidence/product-ground-truth.md` (delta header), `docs/audits/CHRAVEL_PRODUCT_AUDIT_2026-07-25.md`

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

> **July 26 refresh:** Paid conversion improved (+0.8 avg) after Trip Pass in-app + Apple IAP. Invite slightly worse because always-approval is now explicit product policy. Pro less dishonest (tabs hidden) but ops CRUD still missing. See `REBASE-REFRESH-2026-07-26.md`.

### Scoreboard (synthetic averages)

| Metric | June 11 | July 26 | Note |
|--------|---------|----------|------|
| Activation | 6.1 | **6.0** | Organizer loop still real |
| Invite | 5.1 | **4.9** | Always-approval + guest wall |
| Paid conversion | 2.7 | **3.5** | Trip Pass + IAP unlocked |
| NPS avg | ~−10 | **−5.8** | Pro NPS still negative |

### 10 signals (what the product is telling us)

1. **Single-player organizer loop is still real.** Calendar, polls, places, text concierge activate in first session. `[OBSERVED]` + `[SIMULATED RISK]`
2. **Monetization machinery partially repaired.** Trip Pass reachable from concierge/`PlusUpsellModal`/`ConsumerBillingSection`; `APPLE_IAP_ENABLED: true`. `[OBSERVED — billing/config.ts:260]`
3. **Paid conversion still trails stated WTP.** Avg paid **3.5/10** despite 22/30 stating non-zero WTP — remaining gaps are settings-routed walls + invite→organizer loop. `[SIMULATED RISK]`
4. **Trip Pass remains the dominant consumer SKU** for 14/30 personas — now purchasable in more places, not only marketing. `[OBSERVED]`
5. **Invite is always approval-only by design** — not a framing bug. Guest still has zero resource access. Invite is the **sole** growth path for real trips. `[OBSERVED — JoinTrip.tsx:115-121, July product audit §2]`
6. **Pro is less bait-and-switch, still unfinished.** Placeholder tabs hidden on real trips; live roster works; schedule/settlement/medical/compliance still empty in converter. `[OBSERVED — ProTabsConfig.tsx:50-67, tripConverter.ts]`
7. **Broadcast schema drift closed;** scale validation at 1k+ still open. `[OBSERVED — migration 20260610090000]`
8. **PostHog autocapture exists; product funnel still dark.** Project `464040` — no custom `trip_joined` / `upgrade_*` events. `[OBSERVED]`
9. **Settlement race and split-cap theater closed.** Atomic settlement RPCs; `checkPaymentSplitLimit` enforced (Trip Pass CTA at split wall still missing). `[OBSERVED]`
10. **Landing narrative clear; Events pricing and guest value still unclear.** `/trip/:id/preview` ≠ guest itinerary. `[OBSERVED]`

### 10 risks (investor-grade candid)

1. **Growth is single-threaded on the invite link** with no email/phone add fallback; org invite email silently broken. `[OBSERVED — July product audit]`
2. **Guest zero-access still kills viral loops.** Always-approval compounds the account wall. `[OBSERVED]`
3. **Incomplete Trip Pass surfacing** — Smart Import / some `featurePaywall` gates still → `/settings`. `[OBSERVED]`
4. **Marketing Pro path still mailto** while in-app checkout works — discovery/conversion split-brain. `[OBSERVED — ForTeams.tsx]`
5. **Pro ops CRUD still absent** — day sheet / settlement / per-diem not shippable for live ops. `[OBSERVED]`
6. **Product analytics insufficient** for monetization experiments. `[OBSERVED]`
7. **Onboarding still 10 screens** before first trip. `[OBSERVED — OnboardingCarousel.tsx]`
8. **Voice entitlement oversells** dictation-only path (realtime flag default OFF). `[OBSERVED — voiceProductPath.ts]`
9. **Upload quota still fails open** on lookup errors. `[OBSERVED — uploadService.ts]`
10. **Security/compliance blockers for Enterprise** remain (unsigned media patterns, CORS history, etc.). `[OBSERVED — prior audits]`

### 10 wins (what to protect and amplify)

1. **Trip creation UX** still strong. `[OBSERVED]`
2. **Polls** as group decision engine. `[SIMULATED RISK]`
3. **Shared calendar** retention hook. `[SIMULATED RISK]`
4. **Places + Basecamp** (incl. personal basecamp). `[OBSERVED — July feature inventory]`
5. **Trip Pass at concierge wall** — correct SKU at correct moment. `[OBSERVED]`
6. **iOS IAP path live** for App Review / native purchase. `[OBSERVED]`
7. **Smart Import 1-free taste** — free users can sample the differentiator. `[OBSERVED]`
8. **Pro placeholder honesty** — hide unfinished tabs on real trips. `[OBSERVED]`
9. **Atomic settlement** — money-trust P0 closed. `[OBSERVED]`
10. **In-app Pro Stripe checkout** via `ProUpgradeModal`. `[OBSERVED]`

### 5 bets (next 90 days)

1. **Guest read-only itinerary** on active invite tokens — target invite 4.9 → 7.0.
2. **Complete Trip Pass at every limit wall** (import, splits, trip cap) — target paid 3.5 → 5.0 among Trip-Pass-fit personas.
3. **Growth fallback** (add-by-email + fix org invites) — remove single-threaded invite risk.
4. **PostHog product events** — replace hypothesis with funnel data in 2 weeks.
5. **Pro ops MVP or claim purge** — day sheet + rooming OR remove logistics claims from `/teams`.

### 5 not to build (yet)

1. **In-app payment processing** — Venmo settle is enough. `[HYPOTHESIS]`
2. **Full OTA booking aggregation** — coordination positioning correct. `[OBSERVED — AGENTS.md]`
3. **Agency white-label** before Pro ops CRUD ships. `[SIMULATED RISK]`
4. **Recurring trip templates** — duplicate-trip cheaper; run-club WTP ≈ $0. `[SIMULATED RISK]`
5. **Live Gemini voice rebuild** before labeling honesty on dictation path. `[OBSERVED]`

## Persona Segment Matrix

Reference: `persona-matrix.csv` (30 rows). Aggregated below by segment family.

| Segment family | Personas (IDs) | n | Avg activation | Avg invite | Avg day-7 | Avg paid | Avg NPS | Top SKU | Primary churn risk |
|----------------|----------------|---|----------------|------------|-----------|----------|---------|---------|-------------------|
| **Regular — friend/social** | 1, 4, 5, 8, 9, 10, 28 | 7 | 6.4 | 4.9 | 4.1 | 4.1 | 3.6 | Trip Pass / Free | Always-approval + guest wall |
| **Regular — sports/youth parent** | 2, 3, 24 | 3 | 5.7 | 4.0 | 4.7 | 3.3 | −5.0 | Trip Pass / Free | Guest wall + settings-routed import wall |
| **Regular — family/community** | 7, 26, 27, 30 | 4 | 5.2 | 3.0 | 4.2 | 2.2 | −3.8 | Free / Explorer | Invite friction + tech literacy |
| **Events — weddings/celebrations** | 6, 21 | 2 | 6.0 | 3.5 | 5.0 | 5.5 | 2.5 | 90-day Pass / Event pass | Always-approval guest path |
| **Events — large scale** | 18, 22, 25 | 3 | 5.3 | 6.3 | 2.7 | 2.0 | −16.7 | Event pass / Season | Broadcast scale + notifications |
| **Pro — sports/teams** | 11, 12, 13, 14 | 4 | 6.5 | 6.2 | 4.0 | 3.2 | −19.2 | Pro Growth / Enterprise | Ops CRUD still missing |
| **Pro — touring/creative** | 15, 16, 17 | 3 | 6.0 | 6.0 | 4.0 | 3.7 | −17.3 | Pro Starter / Growth | Day sheet / settlement CRUD |
| **Pro — enterprise/security** | 19, 20 | 2 | 6.0 | 5.0 | 4.5 | 3.0 | −7.5 | Enterprise / White-label | Security + no multi-tenant |
| **Pro — luxury advisor** | 29 | 1 | 6.0 | 5.0 | 6.0 | 5.0 | 10.0 | White-label export | Export branding |
| **Regular — festival/niche** | 23 | 1 | 7.0 | 6.0 | 4.0 | 4.0 | 10.0 | Trip Pass | Import wall → settings |

**Cross-segment insight (July 26):** Regular paid conversion improved where Trip Pass is reachable; Pro NPS less catastrophic after placeholder tabs hidden but still negative. Invite is the universal weak column (avg **4.9/10**).

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
| Pro ops (roster, settlement) | Neutral | Neutral | Neutral | Neutral | Low | Low | Low |
| Notifications | Low | Low | Low | Low | Negative | Low | Negative |
| Subscription / upgrade | Low | Low | Low | Moderate | Low | Low | Low |
| Mobile navigation | Moderate | Moderate | Low | Moderate | Moderate | Low | Moderate |
| Web navigation | Strong | Neutral | Strong | Strong | Strong | Moderate | Strong |
| PDF / export | Low | Neutral | Neutral | Moderate | Low | Low | Strong |

**Reading the heatmap (July 26):** Green zones (calendar, polls, places) still justify consumer GTM. Upgrade flow improved from “Negative everywhere” to mixed — Trip Pass at concierge helps Regular; Smart Import/settings walls and marketing Pro mailto keep friction. Pro ops moved from pure Negative toward Low/Negative after placeholder tabs were hidden.

---

## Web vs Mobile Synthesis

| Dimension | Desktop web | Mobile / PWA / iOS wrapper |
|-----------|-------------|----------------------------|
| **Primary users** | Pro ops (11–14, 17–19), desktop-first family (7, 27), corporate (18) | 17/30 personas primary iOS/Android `[persona-matrix.csv]` |
| **Navigation** | Top nav + full trip tabs — rated Strong for Pro and events planning `[SIMULATED RISK]` | Bottom `NativeTabBar` — invite/share buried in More menu (persona 10) `[SIMULATED RISK]` |
| **Activation** | Faster trip creation, multi-tab ops | Onboarding carousel full-bleed; 10 screens before CTA `[OBSERVED]` |
| **Monetization** | Stripe + Trip Pass in PlusUpsell / Billing `[OBSERVED]` | iOS: `APPLE_IAP_ENABLED: true` — RevenueCat path live `[OBSERVED — billing/config.ts:260]` |
| **Invite sharing** | Copy link, email | Native share sheet works; preview readable on small viewport `[OBSERVED — partial live test]` |
| **Pro workflows** | Day-sheet, roster, broadcasts usable width | Touring personas (15, 16) need mobile day sheet — missing `[SIMULATED RISK]` |
| **Concierge** | Text chat usable | Voice/dictation mic UX critical; live voice disabled `[OBSERVED]` |
| **Offline / PWA** | Less relevant | Field trip, touring, sports — offline failures flagged `[SIMULATED RISK]` |

**Synthesis (July 26):** Mobile remains the acquisition/invite channel; iOS purchase dead-end is closed. Remaining inversion: Pro ops and some paywalls still desktop-biased; invite approval + guest wall still hurt mobile-first invitees. See `web-mobile-comparison.md`.

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
| Sports parent | Per-trip | $30–$40 | Trip Pass at split wall | Always-approval + guest wall | 4th payment split |
| Events/wedding | Per-trip / pass | $75–$200 | 90-day Wedding Pass | 100-attendee scare label | Storage, broadcasts |
| Pro sports | Team/enterprise | $49–$99+/mo | Self-serve checkout | mailto demo | Day sheet, compliance |
| Pro touring | Team | $49–$99+/mo | Growth self-serve | Demo bait | Settlement, day sheet |
| Enterprise | Custom | Custom | Sales + SLA | Self-serve only | Broadcast reliability |
| Price-sensitive | Free | $0 | None | Any upgrade popup | — |

### Monetization chain status `[OBSERVED]` — refreshed 2026-07-26

| Link | Status | Evidence |
|------|--------|----------|
| Limit enforcement (splits) | **Fixed** | `paymentService.checkPaymentSplitLimit` (+ tests) |
| Limit visibility (concierge) | **Fixed** | `AIConciergeChat.tsx` usage chip |
| Paywall destination | **Partial** | Concierge → PlusUpsell/Trip Pass; Smart Import/`featurePaywall` still → `/settings` |
| Trip Pass in-app | **Partial** | `PlusUpsellModal`, Concierge, `ConsumerBillingSection` — not every wall |
| Pro self-serve | **Partial** | In-app `ProUpgradeModal` Stripe OK; marketing `ForTeams` still `mailto:` |
| iOS purchase | **Fixed** | `APPLE_IAP_ENABLED: true` |
| Settlement race | **Fixed** | Atomic RPCs `20260610100000` |
| Member capacity (Pro/Event) | **Fixed** | `is_trip_at_member_capacity` RPC |
| Post-purchase telemetry | **Still dark** | Autocapture only; 0 custom product events |

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

### The one paragraph (refreshed 2026-07-26)

Chravel's **organizer-side product still works**, and several June blockers closed: Trip Pass is reachable from concierge/upsell, Apple IAP is on, Pro placeholder tabs are hidden on real trips, settlement is atomic, and payment split caps are enforced. The **group growth layer remains the critical gap**: invite is always approval-only, `consumer_guest` has zero access, and the invite link is the sole join path with a broken org-email fallback (July product audit). Paid-conversion synthetic average rose **2.7 → 3.5/10** — better machinery, still not conversion. Product analytics remain dark (autocapture only). **Scale consumer acquisition only after guest itinerary + remaining Trip Pass walls + PostHog product events; do not scale Pro marketing until `/teams` mailto is replaced and ops CRUD exists or claims are removed.**

### Scorecard (synthetic — not market proof)

| Metric | June 11 | July 26 | Benchmark |
|--------|---------|----------|-----------|
| Avg activation | 6.1 | **6.0** | Acceptable for beta |
| Avg invite | 5.1 | **4.9** | Below viral threshold |
| Avg paid conversion | 2.7 | **3.5** | Improving; still critical |
| Avg NPS (all) | ~−10 | **−5.8** | Pro still drags |
| Personas with WTP > $0 | 22 / 30 | 22 / 30 | Demand signal `[SIMULATED RISK]` |
| Trip Pass SKU fit | 14 / 30 | 14 / 30 | Now partially reachable `[OBSERVED]` |

### Recommended sequencing (next 30 days)

1. **Week 1:** Guest read-only itinerary + PostHog product events (`trip_joined`, `upgrade_*`)
2. **Week 2:** Trip Pass at Smart Import / split-cap walls; fix org-invite email + add-by-email fallback
3. **Week 3:** Real beta interviews (n=8–12) — prioritize invite + WTP questions in `real-beta-interview-questions.md`
4. **Week 4:** ForTeams mailto → Stripe/Calendly; Pro ops MVP or claim purge on `/teams`

### What would change the investor conversation

- **Observed** invite→join rate >40% (currently unmeasured)
- **Observed** Trip Pass conversion >5% of limit-wall impressions
- **Observed** Pro pilot with 1 sports team using real day sheet (not just roster)
- **Observed** broadcast success at 500+ recipients without transaction timeout

---

*Original study 2026-06-11 · Evidence refresh 2026-07-26. Synthetic — validate `[HYPOTHESIS]` / `[SIMULATED RISK]` with real users before fundraising claims.*
