# ChravelApp 30-Persona Synthetic Study — Aggregate Synthesis

**Original study:** 2026-06-11 · **Evidence refresh:** 2026-08-02 (weekly cron; post–PR #867)  
**Package:** `docs/research/synthetic-user-testing/2026-06-11-30-persona-study/`  
**Delta doc:** `REBASE-REFRESH-2026-08-02.md` (July archive: `REBASE-REFRESH-2026-07-26.md`)  
**Method:** 30 synthetic personas × desktop web + mobile/PWA viewports, grounded in browser sessions, codebase audit, prior 10-persona study, July product audits, and August live UI sample.  
**Data sources:** `persona-matrix.csv` (scores refreshed 2026-08-02), `feature-findings.csv`, `pricing-insights.csv`, `raw-synthetic-survey-responses.json`, `../evidence/product-ground-truth.md` (Aug 2 delta header)

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

> **August 2 refresh:** Invite improved (+0.4) after add-by-contact for existing users; paid +0.2 as Settings paywalls open PlusUpsell and `/teams` trial uses Stripe helper; NPS −5.8 → **−1.6** after Pro day-sheet MVP + Seen-by roster. Guest wall for cold invitees remains the growth cliff. See `REBASE-REFRESH-2026-08-02.md`.

### Scoreboard (synthetic averages)

| Metric | June 11 | July 26 | **August 2** | Note |
|--------|---------|----------|--------------|------|
| Activation | 6.1 | 6.0 | **6.0** | Organizer loop still real |
| Invite | 5.1 | 4.9 | **5.3** | Add-by-contact helps known users; guest wall remains |
| Paid conversion | 2.7 | 3.5 | **3.7** | Upsell hop shorter; split wall still weak |
| NPS avg | ~−10 | −5.8 | **−1.6** | Pro less hollow; still unfinished |

### 10 signals (what the product is telling us)

1. **Single-player organizer loop is still real.** Calendar, polls, places, text concierge activate in first session. `[OBSERVED]` + `[SIMULATED RISK]`
2. **Monetization machinery mostly repaired.** Trip Pass in PlusUpsell/Concierge/Billing; IAP on; Settings `?gate=` opens upsell. `[OBSERVED]`
3. **Paid conversion still trails stated WTP.** Avg paid **3.7/10** despite 22/30 stating non-zero WTP. `[SIMULATED RISK]`
4. **Trip Pass remains the dominant consumer SKU** for 14/30 personas — live pricing shows $39.99 / $74.99. `[OBSERVED — browser 2026-08-02]`
5. **Growth is dual-path for existing users, single-path for cold invites.** Add-by-email/phone shipped; `consumer_guest` still zero access. `[OBSERVED]`
6. **Pro day-sheet MVP is live** from `trip_events`; settlement/medical/compliance still converter stubs. `[OBSERVED — ProDaySheet.tsx, tripConverter.ts]`
7. **Broadcast Seen-by roster shipped;** scale validation at 1k+ still open. `[OBSERVED]`
8. **PostHog product funnel still unproven** — typed events exist; emit coverage incomplete. `[OBSERVED — code]` / `[HYPOTHESIS — prod]`
9. **Free AI quota is 3/user/trip** (not 10); Smart Import taste is **5 account-wide**. `[OBSERVED — entitlements.ts, useSmartImportTaste.ts]`
10. **Landing narrative clear** (“Group Chat Travel App”); `/teams` trial is Stripe-capable; footer demo CTA still mailto. `[OBSERVED — live UI]`

### 10 risks (investor-grade candid)

1. **Cold-invite viral loop still broken** — guest zero-access + always-approval. `[OBSERVED]`
2. **Add-by-contact does not help non-users** — majority of consumer invitees. `[OBSERVED]` + `[SIMULATED RISK]`
3. **Trip Pass still not at every wall** — Settings hop + no split-cap CTA. `[OBSERVED]`
4. **ForTeams footer mailto + Calendly often unset** — demo falls back to email. `[OBSERVED — live /teams]`
5. **Pro ops beyond day-sheet still thin** — settlement/medical empty. `[OBSERVED]`
6. **Product analytics insufficient** for monetization experiments. `[OBSERVED]` / `[HYPOTHESIS]`
7. **Onboarding still 10 screens** before first trip. `[OBSERVED]`
8. **Voice entitlement oversells** dictation-only path. `[OBSERVED]`
9. **Upload quota still fails open** on lookup errors. `[OBSERVED]`
10. **Org invite email delivery not re-proven** after July audit. `[HYPOTHESIS]`

### 10 wins (what to protect and amplify)

1. **Trip creation UX** still strong. `[OBSERVED]`
2. **Polls** as group decision engine. `[SIMULATED RISK]`
3. **Shared calendar** retention hook + Pro day-sheet feed. `[OBSERVED]`
4. **Places + Basecamp.** `[OBSERVED]`
5. **Trip Pass at concierge wall.** `[OBSERVED]`
6. **iOS IAP path live.** `[OBSERVED]`
7. **Smart Import 5-free account taste.** `[OBSERVED]`
8. **Add-by-contact for existing users.** `[OBSERVED]`
9. **Broadcast Seen-by + Payments Remind.** `[OBSERVED]`
10. **ForTeams / marketing Pro Stripe trial helper.** `[OBSERVED]`

### 5 bets (next 90 days)

1. **Guest read-only itinerary** on active invite tokens — target invite 5.3 → 7.0.
2. **In-place Trip Pass** at import/split/trip-cap walls — target paid 3.7 → 5.0 among Trip-Pass-fit personas.
3. **PostHog product events proven in prod** — replace hypothesis with funnel data.
4. **Calendly env + ForTeams CTA consistency** — close Pro discovery friction.
5. **Pro multi-day day sheet + settlement honesty** — or purge `/teams` claims.

### 5 not to build (yet)

1. **In-app payment processing** — Venmo settle + Remind is enough. `[HYPOTHESIS]`
2. **Full OTA booking aggregation** — coordination positioning correct. `[OBSERVED — AGENTS.md]`
3. **Agency white-label** before Pro settlement/rooming ships. `[SIMULATED RISK]`
4. **Recurring trip templates** — duplicate-trip cheaper; run-club WTP ≈ $0. `[SIMULATED RISK]`
5. **Live Gemini voice rebuild** before labeling honesty on dictation path. `[OBSERVED]`

## Persona Segment Matrix

Reference: `persona-matrix.csv` (30 rows). Aggregated below by segment family.

| Segment family | Personas (IDs) | n | Avg activation | Avg invite | Avg day-7 | Avg paid | Avg NPS | Top SKU | Primary churn risk |
|----------------|----------------|---|----------------|------------|-----------|----------|---------|---------|-------------------|
| **Regular — friend/social** | 1, 4, 5, 8, 9, 10, 28 | 7 | 6.4 | 4.9 | 4.1 | 4.1 | 6.4 | Trip Pass / Free | Always-approval + guest wall |
| **Regular — sports/youth parent** | 2, 3, 24 | 3 | 5.7 | 4.0 | 4.7 | 3.7 | −1.7 | Trip Pass / Free | Guest wall + Settings hop on import |
| **Regular — family/community** | 7, 26, 27, 30 | 4 | 5.2 | 3.0 | 4.2 | 2.2 | −3.8 | Free / Explorer | Invite friction + tech literacy |
| **Events — weddings/celebrations** | 6, 21 | 2 | 6.0 | 4.5 | 5.0 | 5.5 | 7.5 | 90-day Pass / Event pass | Always-approval guest path |
| **Events — large scale** | 18, 22, 25 | 3 | 5.3 | 6.7 | 2.7 | 2.3 | −13.3 | Event pass / Season | Broadcast scale + notifications |
| **Pro — sports/teams** | 11, 12, 13, 14 | 4 | 6.5 | 7.2 | 4.0 | 3.8 | −11.2 | Pro Growth / Enterprise | Settlement/medical still empty |
| **Pro — touring/creative** | 15, 16, 17 | 3 | 6.0 | 7.0 | 4.0 | 4.3 | −9.0 | Pro Starter / Growth | Day sheet today-only; settlement |
| **Pro — enterprise/security** | 19, 20 | 2 | 6.0 | 5.5 | 4.5 | 3.5 | −2.5 | Enterprise / White-label | Security + no multi-tenant |
| **Pro — luxury advisor** | 29 | 1 | 6.0 | 5.0 | 6.0 | 5.0 | 15.0 | White-label export | Export branding |
| **Regular — festival/niche** | 23 | 1 | 7.0 | 6.0 | 4.0 | 5.0 | 15.0 | Trip Pass | Import wall Settings hop |

**Cross-segment insight (August 2):** Invite avg **5.3/10** after add-by-contact; cold-guest wall still the weak column for Regular. Pro NPS less catastrophic after day-sheet MVP. Paid **3.7/10** — machinery improved, conversion not yet.

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

**Reading the heatmap (August 2):** Green zones (calendar, polls, places) still justify consumer GTM. Upgrade flow mixed-positive for Regular; Smart Import Settings hop remains friction. Pro ops moved from Low toward Moderate for day-sheet/roster/broadcasts; settlement/medical still Negative. Marketing Pro trial is Stripe-capable — footer mailto is residual.

---

## Web vs Mobile Synthesis

| Dimension | Desktop web | Mobile / PWA / iOS wrapper |
|-----------|-------------|----------------------------|
| **Primary users** | Pro ops (11–14, 17–19), desktop-first family (7, 27), corporate (18) | 17/30 personas primary iOS/Android `[persona-matrix.csv]` |
| **Navigation** | Top nav + full trip tabs — rated Strong for Pro and events planning `[SIMULATED RISK]` | Bottom `NativeTabBar` — invite/share buried in More menu (persona 10) `[SIMULATED RISK]` |
| **Activation** | Faster trip creation, multi-tab ops | Onboarding carousel full-bleed; 10 screens before CTA `[OBSERVED]` |
| **Monetization** | Stripe + Trip Pass in PlusUpsell / Billing `[OBSERVED]` | iOS: `APPLE_IAP_ENABLED: true` — RevenueCat path live `[OBSERVED — billing/config.ts:260]` |
| **Invite sharing** | Copy link, email | Native share sheet works; preview readable on small viewport `[OBSERVED — partial live test]` |
| **Pro workflows** | Day-sheet MVP + roster + Seen-by on desktop width | Touring personas (15, 16) still want richer mobile day sheet `[SIMULATED RISK]` |
| **Concierge** | Text chat usable | Voice/dictation mic UX critical; live voice disabled `[OBSERVED]` |
| **Offline / PWA** | Less relevant | Field trip, touring, sports — offline failures flagged `[SIMULATED RISK]` |

**Synthesis (August 2):** Mobile remains the acquisition/invite channel; iOS IAP closed; add-by-contact helps organizers who already know Chravel users. Guest wall + 10-screen onboarding still hurt mobile-first invitees. See `web-mobile-comparison.md`.

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

### Monetization chain status `[OBSERVED]` — refreshed 2026-08-02

| Link | Status | Evidence |
|------|--------|----------|
| Limit enforcement (splits) | **Fixed** | `paymentService.checkPaymentSplitLimit` (+ tests) |
| Limit visibility (concierge) | **Fixed** | `AIConciergeChat.tsx` usage chip |
| Paywall destination | **Partial** | Concierge → PlusUpsell; `featurePaywall` → `/settings` which now opens upsell |
| Trip Pass in-app | **Partial** | PlusUpsell / Concierge / Billing — split wall still no CTA |
| Pro self-serve | **Mostly fixed** | `startProCheckout` on `/teams` trial; footer demo still mailto; Calendly env often unset |
| iOS purchase | **Fixed** | `APPLE_IAP_ENABLED: true` |
| Settlement race | **Fixed** | Atomic RPCs |
| Member capacity (Pro/Event) | **Fixed** | Capacity RPC + invite preview |
| Add existing member | **Fixed** | email/phone for existing accounts |
| Post-purchase telemetry | **Still unproven** | Typed events; emit coverage incomplete |

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

> Canonical ticket list: `top-priority-fixes.md` (August 2). Closed June/July items removed from open P0.

| Priority | Item | Effort | Owner | Segments | Evidence |
|----------|------|--------|-------|----------|----------|
| **P0** | Guest read-only itinerary (calendar + polls pre-auth) | L | Core + Auth | All Regular | `[OBSERVED]` consumer_guest |
| **P0** | Emit + verify PostHog product events | S | Platform | All | `[OBSERVED — code]` / `[HYPOTHESIS — prod]` |
| **P0** | Trip Pass in-place at import / split / trip-cap walls | M | Growth + Billing | Regular Trip-Pass fit | `[OBSERVED]` featurePaywall.ts |
| **P1** | Unify ForTeams footer demo CTA + set Calendly env | S | Growth | Pro (10) | `[OBSERVED — live /teams]` |
| **P1** | Pro ops beyond day-sheet (settlement/rooming) or claim purge | L | Pro | Pro sports/touring | `[OBSERVED]` tripConverter.ts |
| **P1** | Invitee onboarding ≤2–4 screens | M | Growth | College, parents | `[OBSERVED]` |
| **P1** | Honest voice labeling | S | AI | FC tier | `[OBSERVED]` |
| **P1** | Upload quota fail-closed | S | Backend | Media-heavy | `[OBSERVED]` |
| **P1** | Prove org-invite email delivery | M | Backend | Enterprise | `[HYPOTHESIS]` |
| **P2** | Per-trip notification mute | M | Notifications | Frat, conference | `[OBSERVED]` |
| **P2** | Broadcast fanout validate at 500+ | M | Backend | Events, Pro | `[OBSERVED]` |
| **P2** | Multi-day Pro day sheet | M | Pro | Touring | `[OBSERVED]` today-only filter |
| **P2** | Align free AI copy with 3/trip | S | Growth | Free users | `[OBSERVED]` |
| **P3** | Duplicate trip template | M | Core | Run club | `[SIMULATED RISK]` |
| **P3** | Reimbursement mode for corporate | L | Payments | Corporate | `[SIMULATED RISK]` |
| **P3** | White-label PDF export | L | Pro | Advisor | `[SIMULATED RISK]` |
| **P3** | i18n / timezone copy pass | L | Core | International | `[SIMULATED RISK]` |

Effort key: **S** = small code change, **M** = multi-file / multi-surface, **L** = cross-stack / schema+UI.

---

## Top 20 Synthetic Quotes

| # | Quote | Persona | Segment | Label |
|---|-------|---------|---------|-------|
| 1 | "I'd pay $40 for this trip if the button appeared when my photo wall filled up — I couldn't find it anywhere in the app." | Mia Torres (4) | Bachelorette | `[SYNTHETIC QUOTE]` |
| 2 | "My parents aren't making an account to see kickoff time. Email the schedule or I'm back to TeamSnap." | Dana Whitfield (2) | Sports mom | `[SYNTHETIC QUOTE]` |
| 3 | "The demo roster looks like our NFL travel desk. My real trip has empty tabs. That's not a bug, that's false advertising." | Dana Okafor (11) | Pro sports | `[SYNTHETIC QUOTE]` |
| 4 | "Subscribe on web — I'm literally holding my phone. You lost me." *(June quote — IAP now enabled; keep as historical risk if IAP regresses)* | Camille Dubois (9) | Couples | `[SYNTHETIC QUOTE]` |
| 5 | "100 attendees max? We have 85 RSVPs and I'm afraid to invite cousins." | Priya & James Chen (6) | Wedding | `[SYNTHETIC QUOTE]` |
| 6 | "Polls settled brunch in one vote. That's the whole product for me." | Tyler Brooks (8) | College | `[SYNTHETIC QUOTE]` |
| 7 | "mailto:support for a $99 team plan? Our AP department doesn't do mailto." *(partially mitigated — `/teams` trial uses Stripe; footer demo can still mailto)* | Alex Rivera (18) | Corporate | `[SYNTHETIC QUOTE]` |
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

### The one paragraph (refreshed 2026-08-02)

Chravel's **organizer-side product still works**, and the post–June fix wave continued through PR #867: Trip Pass/IAP/settlement/split enforcement remain closed; organizers can **add existing members by email/phone**; Pro has a **calendar-backed day-sheet MVP** and broadcast **Seen-by** roster; `/teams` trial uses a Stripe checkout helper. The **critical remaining gap is cold-invite growth**: always-approval + `consumer_guest` zero access still kill viral loops for people who do not already have Chravel accounts. Synthetic paid conversion is **3.7/10** (from 2.7 in June); invite **5.3/10**. Product analytics are still unproven. **Scale consumer acquisition only after guest itinerary + in-place Trip Pass walls + PostHog proof; Pro marketing can run with Calendly configured, but do not claim full ops until settlement/rooming exist or claims are purged.**

### Scorecard (synthetic — not market proof)

| Metric | June 11 | July 26 | August 2 | Benchmark |
|--------|---------|----------|----------|-----------|
| Avg activation | 6.1 | 6.0 | **6.0** | Acceptable for beta |
| Avg invite | 5.1 | 4.9 | **5.3** | Below viral threshold |
| Avg paid conversion | 2.7 | 3.5 | **3.7** | Improving; still critical |
| Avg NPS (all) | ~−10 | −5.8 | **−1.6** | Approaching neutral |
| Personas with WTP > $0 | 22 / 30 | 22 / 30 | 22 / 30 | Demand signal `[SIMULATED RISK]` |
| Trip Pass SKU fit | 14 / 30 | 14 / 30 | 14 / 30 | Reachable at more walls `[OBSERVED]` |

### Recommended sequencing (next implementation wave)

1. Guest read-only itinerary + PostHog product event emit/verify
2. Trip Pass in-place at Smart Import / split-cap walls (no Settings hop)
3. ForTeams footer → `openProDemoScheduler` + set `VITE_CALENDLY_DEMO_URL`
4. Real beta interviews (n=8–12) — invite + WTP questions in `real-beta-interview-questions.md`
5. Pro multi-day day sheet + settlement honesty or claim purge

### What would change the investor conversation

- **Observed** invite→join rate >40% (currently unmeasured)
- **Observed** Trip Pass conversion >5% of limit-wall impressions
- **Observed** Pro pilot with 1 sports team using live multi-day day sheet (not demo)
- **Observed** broadcast success at 500+ recipients without transaction timeout
- **Observed** guest itinerary open-rate before signup

---

*Original study 2026-06-11 · Evidence refresh 2026-07-26. Synthetic — validate `[HYPOTHESIS]` / `[SIMULATED RISK]` with real users before fundraising claims.*
