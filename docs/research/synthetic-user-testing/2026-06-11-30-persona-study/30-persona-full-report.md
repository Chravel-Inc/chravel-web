# ChravelApp 30-Persona Synthetic User Testing — Full Reports

> **Date:** 2026-06-11 · **Method:** Code-grounded synthetic simulation + live browser session
> **Warning:** Synthetic research only. Not customer validation. See README.md.

---

> **Disclaimer:** This document is **synthetic user research** — code-grounded simulations and browser observations conducted 2026-06-11. No real users were interviewed. Findings are labeled `[OBSERVED]`, `[SIMULATED RISK]`, or `[HYPOTHESIS]` per `docs/research/synthetic-user-testing/evidence/product-ground-truth.md`. Synthetic quotes are labeled `[SYNTHETIC QUOTE]`. Do not cite this as customer validation or revenue proof.

**Evidence base:** Live browser session at `http://localhost:8080` (2026-06-11); `src/billing/config.ts`, `src/billing/entitlements.ts`, `src/pages/JoinTrip.tsx`, `src/components/onboarding/OnboardingCarousel.tsx`, `src/utils/tripConverter.ts`, `src/types/permissionMatrix.generated.ts`, `src/pages/ForTeams.tsx`, `docs/research/synthetic-user-testing/evidence/posthog-funnel.md`, prior 10-persona study.

---

## Persona 1 — Serena Vale (Girls Luxury Trip Planner)

### A. Profile

| Field | Detail |
|-------|--------|
| **Name** | Serena Vale |
| **Age range** | 32–38 |
| **Segment** | Consumer — luxury friend-group trips (8 women, 3–5 nights) |
| **Tech comfort** | High. Instagram, Resy, Amex Travel, shared Notes. Expects premium aesthetics. |
| **Planning style** | Curates restaurants, spas, photo moments. Builds vibe-first itineraries; delegates logistics to one "ops friend." |
| **Main pain points** | Group chat chaos; re-typing reservations; ugly shared docs; chasing RSVPs for $400 dinners |
| **Budget sensitivity** | Low for trip spend; medium for apps — will pay $15–30/mo if output looks client-worthy |
| **Platform** | iPhone (Safari + PWA) |
| **Why adopt** | One polished link for the group; AI restaurant picks; shared media album; polls that end debates |
| **Why reject** | "Group Chat Travel App" branding; guest signup wall; export that looks cheap; AI confirm-card fatigue |

### B. Jobs-to-be-Done

1. When I am **building a Cabo girls-weekend itinerary**, I want to **import confirmations and pin restaurants in one workspace**, so I can **stop screenshotting Resy emails into the group chat**.
2. When the group **can't decide on beach club vs. yacht day**, I want **a poll with a deadline**, so I can **book without 80 unread messages**.
3. When I am **sharing the plan with friends who won't read a doc**, I want **a beautiful mobile calendar they actually open**, so I can **be the hero, not the nag**.
4. When I am **collecting for the villa and chef**, I want **clear who-owes-whom**, so I can **Venmo-chase without spreadsheets**.
5. When the trip ends, I want **every photo in one album**, so I can **post the recap reel**.

### C. Screener Table

| Question | Pass criteria | Serena |
|----------|---------------|--------|
| Plan 2+ group trips/year? | Yes | ✅ 4–6/year |
| Group size 6+? | Yes | ✅ 8 women |
| Primary device mobile? | Yes | ✅ iPhone |
| Will create account to test? | Yes | ✅ |
| Pay for coordination tool? | Maybe $10–30/mo | ✅ |
| Need white-label/client export? | Nice-to-have | ⚠️ wants polish |

### D. Full Survey (Persona Voice)

**Q: What apps do you use today for group trips?**  
"iMessage obviously, a shared Google Doc nobody opens, Venmo, and I literally made a Canva itinerary last time because the doc was embarrassing."

**Q: First impression of Chravel landing?**  
"The dark gold vibe is cute — feels more premium than I expected. But the headline says 'The Group Chat Travel App' and that's… not the energy I'm going for in front of my friends." `[OBSERVED — HeroSection.tsx:57, index.html meta]`

**Q: Would you pay?**  
"I'd do Explorer for a busy season. Not $20/mo unless voice AI actually works — and I don't need that."

**Q: What almost made you leave?**  
"When I tried to export something pretty and either nothing happened or it still said 'Group Chat Travel App' at the bottom." `[SIMULATED RISK — export branding]`

**Q: NPS reasoning?**  
"I'd tell my planner friends to try it for polls and photos, but I'd warn them the export isn't luxury-ready yet."

### E. Web Flow Walkthrough

| Step | Action | Finding |
|------|--------|---------|
| 1 | Land on `/` | Hero: "The Group Chat Travel App" `[OBSERVED — browser 2026-06-11, HeroSection.tsx]` |
| 2 | Scroll pricing | "Start free. Upgrade when your trip gets serious." `[OBSERVED — PricingSection.tsx]` |
| 3 | Sign up (Google) | Auth modal; email verification on email path `[OBSERVED — product-ground-truth §3]` |
| 4 | Onboarding | 10 screens, skippable `[OBSERVED — OnboardingCarousel.tsx:54-118, screens.length === 10]` |
| 5 | Create trip | Consumer default; title/dates/tz required `[OBSERVED — CreateTripModal.tsx]` |
| 6 | Invite link | Rich preview pre-auth; then signup gate `[OBSERVED — JoinTrip.tsx:861-966]` |
| 7 | Join CTA copy | Open invite: "Join Trip"; missing `require_approval` defaults to approval framing `[OBSERVED — JoinTrip.tsx:112-127, 859]` — fixed from prior "dark auth flow" leak `[OBSERVED]` |
| 8 | Smart Import | 1 free taste per trip, then paywall `[OBSERVED — MobileGroupCalendar.tsx:142-158]` |
| 9 | AI concierge | 10 queries/user/trip on free `[OBSERVED — entitlements.ts:237-238]` |
| 10 | Guest access | `consumer_guest`: NO read access `[OBSERVED — permissionMatrix.generated.ts:44-50]` |

### F. Mobile/PWA Walkthrough

| Step | Action | Finding |
|------|--------|---------|
| 1 | Open on iPhone Safari | Marketing landing responsive; bottom CTA visible `[OBSERVED — browser 2026-06-11]` |
| 2 | Add to Home Screen | PWA install path exists `[HYPOTHESIS — Capacitor/PWA parity]` |
| 3 | Onboarding skip | "Skip tour" visible; lands Create Trip `[OBSERVED — OnboardingCarousel.tsx]` |
| 4 | Trip tabs | Chat default; Media tab loads grid `[OBSERVED — MobileTripDetail.tsx]` |
| 5 | Invite share | Native share sheet for join link `[OBSERVED — ground-truth §5]` |
| 6 | iOS subscribe | `APPLE_IAP_ENABLED: false` → "Subscribe on web" `[OBSERVED — billing/config.ts:246]` |
| 7 | Media upload | Loves grid + lightbox; 500 MB free cap `[OBSERVED — entitlements.ts:265]` |
| 8 | Polls | Fast tap targets; realtime counts `[OBSERVED — ground-truth §6]` |
| 9 | Places | "Basecamp" label confuses `[SIMULATED RISK]` |
| 10 | Demo mode | `localStorage TRIPS_DEMO_VIEW=app-preview` grants mock access `[OBSERVED — SettingsMenu.tsx, e2e specs]` |

### G. Feature Table

| Feature | Rating (1–5) | Evidence label | Notes |
|---------|--------------|----------------|-------|
| Landing aesthetic | 4 | [OBSERVED] | Dark/gold on-brand |
| Landing copy | 2 | [OBSERVED] | "Group Chat Travel App" |
| Onboarding | 3 | [OBSERVED] | 10 screens; skippable |
| Trip creation | 5 | [OBSERVED] | Fast consumer path |
| Invite preview | 4 | [OBSERVED] | Rich OG card |
| Invite auth gate | 2 | [OBSERVED] | No guest read |
| Smart Import | 3 | [OBSERVED] | Paywalled after 1 taste |
| AI Concierge | 4 | [OBSERVED] | 10-query cap |
| Polls | 5 | [OBSERVED] | Strong fit |
| Payments | 3 | [OBSERVED] | Venmo deeplink only |
| Media hub | 5 | [OBSERVED] | **Loves this** |
| PDF export | 2 | [SIMULATED RISK] | Branding/stub concerns |
| Calendar | 4 | [OBSERVED] | Itinerary view solid |
| Places/Basecamp | 3 | [SIMULATED RISK] | Naming |
| Pricing clarity | 4 | [OBSERVED] | Trip Pass $39.99/45d visible |

### H. Emotional Reaction

Serena feels **cautiously impressed** — the product looks more expensive than the headline suggests, and Media/Polls genuinely delight her. Export branding and the guest signup wall trigger a "this is still a consumer toy" recoil right when she'd recommend it to her social circle.

> **[SYNTHETIC QUOTE]:** "Okay the photo grid is actually stunning — I'd use this just for the album. But I'm not sending my girls a link that makes them create an account before they see where we're having dinner."

### I. Conversion Scores

| Metric | Score (1–10) |
|--------|----------------|
| Activation (create trip) | 6 |
| Invite success | 5 |
| Day-7 retention | 5 |
| Paid conversion likelihood | 5 |
| Overall likelihood to use | 7 |
| **NPS** | **-10** |

### J. Top 5 Fixes

1. **Read-only guest itinerary view** — `permissionMatrix.generated.ts`, `JoinTrip.tsx` — guests see schedule without full member perms.
2. **Remove/replace "Group Chat Travel App" in exports** — `supabase/functions/export-trip/index.ts`, `exportPdfClient.ts`.
3. **Smart Import first-trip wow before paywall** — `MobileGroupCalendar.tsx:142-158`.
4. **Surface Trip Pass at paywall moments** — `TripPassModal.tsx`, `featurePaywall.ts`.
5. **Fix `require_approval ?? true` default** — `JoinTrip.tsx:859` — open invites should default false server-side.

### K. Confidence & Beta Question

**Confidence:** Medium-high for consumer flows; low for export polish (needs live PDF test).

**Real beta question:** "If you could share a read-only itinerary link without friends signing up, would 7/8 of your group actually open it before the trip?"

---

## Persona 2 — Dana Whitfield (Youth Soccer Team Mom)

### A. Profile

| Field | Detail |
|-------|--------|
| **Name** | Dana Whitfield |
| **Age range** | 38–45 |
| **Segment** | Consumer — youth travel sports (11 families) |
| **Tech comfort** | Low-moderate. iPhone, GroupMe, Google Sheet. Won't read docs. |
| **Planning style** | Reactive list-maker; team mom for tournament weekends |
| **Main pain points** | Schedule changes unseen; field addresses repeated; snack money chaos |
| **Budget sensitivity** | **High** — won't pay $9.99/mo; Trip Pass $30–40 conceivable |
| **Platform** | iPhone |
| **Why adopt** | One link for schedule + hotel + who owes what |
| **Why reject** | Parent signup wall; Pro "Sports" trap; two-chat problem (GroupMe + Chravel) |

### B. Jobs-to-be-Done

1. When I get **the tournament schedule Wednesday night**, I want **all games with field addresses in one place in 10 minutes**, so parents stop texting me for Field 7.
2. When I **rally 10 families**, I want **one link that works first try on phones**, so I'm not chasing stragglers.
3. When planning **team dinner**, I want **a poll on restaurant + headcount**, so I book once.
4. When I **front snacks and gate fees**, I want **expense splits**, so I get reimbursed without awkward texts.
5. When I'm **at the field at 7:40 AM**, I want **next game time + address one tap away**.

### C. Screener Table

| Question | Pass? | Dana |
|----------|-------|------|
| Organize youth sports travel? | Yes | ✅ |
| 8+ families to coordinate? | Yes | ✅ 11 |
| iPhone primary? | Yes | ✅ |
| Would pay subscription? | No | ❌ |
| Would pay one-time weekend fee? | Maybe | ✅ ~$35 |

### D. Full Survey (Persona Voice)

**Q: Current tools?**  
"GroupMe for everything. A Google Sheet the manager made in 2022 that half the parents lost the link to."

**Q: First impression?**  
"It looks fancy. I don't know what 'AI concierge' means and I don't care. I need the schedule."

**Q: Biggest friction?**  
"Sarah's mom clicked the link and had to make an account just to see game times. She gave up and texted me."

**Q: Would you pay?**  
"Not monthly. I'd pay like thirty bucks for Memorial Day weekend if it actually worked for every parent."

### E. Web Flow Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| Landing | Consumer travel framing, not "team schedule" | [SIMULATED RISK] |
| Pricing | Free: 3 trips, 10 AI/trip, 500 MB | [OBSERVED — entitlements.ts] |
| Onboarding | 10 screens; she skips at 2 | [OBSERVED — OnboardingCarousel.tsx] |
| Create trip | **Trap:** Pro → Sports category → upgrade wall | [OBSERVED — CreateTripModal.tsx, entitlements.ts:253-259] |
| Consumer path | 3 fields, fast | [OBSERVED] |
| Invite | Preview good; auth required | [OBSERVED — JoinTrip.tsx] |
| Join copy | Fixed — no "dark auth flow"; approval only when flagged | [OBSERVED — JoinTrip.tsx:112-127] |
| Smart Import | Tournament PDF ingest — paywalled after 1 | [OBSERVED — MobileGroupCalendar.tsx] |
| Polls | Strong fit | [OBSERVED] |
| PostHog | Zero events — can't measure parent drop-off | [HYPOTHESIS — posthog-funnel.md] |

### F. Mobile/PWA Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| GroupMe link open | In-app browser may trap OAuth | [SIMULATED RISK] |
| Skip onboarding | Works; Create Trip CTA | [OBSERVED] |
| Calendar add game | Manual entry on phone keyboard painful | [SIMULATED RISK] |
| Poll "team dinner" | 2 taps, fast | [OBSERVED] |
| Payments | 3 splits/trip free cap | [OBSERVED — entitlements.ts:272-274] |
| Notifications | No per-trip mute | [OBSERVED — NOTIFICATION_AUDIT.md] |
| Invite buried | ⋮ menu on mobile | [SIMULATED RISK — MobileTripDetail.tsx] |

### G. Feature Table

| Feature | Rating | Label | Notes |
|---------|--------|-------|-------|
| Landing relevance | 2 | [SIMULATED RISK] | Not sports-native |
| Onboarding skip | 4 | [OBSERVED] | Saves her |
| Consumer trip create | 5 | [OBSERVED] | If she avoids Pro |
| Pro Sports trap | 1 | [OBSERVED] | Accidental paywall |
| Invite preview | 4 | [OBSERVED] | Pretty card |
| Parent signup wall | 2 | [OBSERVED] | consumer_guest blocked |
| Calendar | 4 | [OBSERVED] | Needs Smart Import |
| Smart Import | 5 | [OBSERVED] | **Would love** if discovered |
| Polls | 5 | [OBSERVED] | Perfect use case |
| Payments | 4 | [OBSERVED] | Snack splits |
| AI Concierge | 3 | [OBSERVED] | 10 queries enough |
| Chat | 2 | [SIMULATED RISK] | Duplicates GroupMe |
| Trip Pass pricing | 4 | [OBSERVED] | $39.99/45d fits tournament |
| iOS purchase | 1 | [OBSERVED] | IAP disabled |

### H. Emotional Reaction

Dana is **pragmatically hopeful then frustrated**. Polls and calendar earn trust; the parent signup wall and Pro Sports trap feel like the product wasn't built for her exact job.

> **[SYNTHETIC QUOTE]:** "I got the schedule in there and the poll for pizza night was genuinely magic. Then three moms said 'it wanted me to sign up' and I went back to GroupMe like a loser."

### I. Conversion Scores

| Metric | Score |
|--------|-------|
| Activation | 6 |
| Invite | 4 |
| Day-7 retention | 5 |
| Paid conversion | 2 |
| Likelihood to use | 6 |
| **NPS** | **-5** |

### J. Top 5 Fixes

1. **Guest read-only schedule** — `permissionMatrix.generated.ts`
2. **Rename/hide Pro Sports on consumer onboarding** — `CreateTripModal.tsx`
3. **Smart Import discoverability + 1 free import** — `MobileGroupCalendar.tsx`
4. **Prominent Trip Pass for weekend tournaments** — `TripPassModal.tsx`
5. **Surface Invite on mobile header** — `MobileTripDetail.tsx`

### K. Confidence & Beta Question

**Confidence:** High on invite friction; medium on Smart Import discoverability.

**Real beta question:** "What percentage of parents on your team would create an account to see the game schedule — 25%, 50%, or 75%+?"

---

## Persona 3 — Keisha Morgan (AAU Volleyball Parent Coordinator)

### A. Profile

| Field | Detail |
|-------|--------|
| **Name** | Keisha Morgan |
| **Age range** | 41–48 |
| **Segment** | Consumer — AAU volleyball, multi-city tournament circuit |
| **Tech comfort** | Moderate. Uses TeamSnap, Cash App, hotel apps |
| **Planning style** | Coordinates 14 families across 3 cities in one weekend |
| **Main pain points** | Multi-city logistics; hotel blocks; carpool; schedule changes at midnight |
| **Budget sensitivity** | Medium — Trip Pass acceptable, not subscription |
| **Platform** | Mixed (iPhone + Android parents) |
| **Why adopt** | Multi-stop calendar + Smart Import for PDF schedules |
| **Why reject** | Single basecamp model; Smart Import paywall; no multi-city view |

### B. Jobs-to-be-Done

1. When **tournament spans Dallas → Austin → San Antonio**, I want **one itinerary with city segments**, so parents know which hotel each night.
2. When the **director emails an updated bracket PDF**, I want **import without retyping**, so changes propagate instantly.
3. When **carpooling 14 kids**, I want **polls + tasks**, so seats get filled.
4. When **collecting hotel block deposits**, I want **expense tracking**, so I'm not the human Venmo ledger.
5. When a **match time moves**, I want **one notification parents actually see**.

### C. Screener Table

| Question | Pass? | Keisha |
|----------|-------|--------|
| Multi-city youth sports? | Yes | ✅ |
| 10+ families? | Yes | ✅ 14 |
| Coordinates logistics? | Yes | ✅ |
| Pays for tools? | Trip Pass | ✅ |

### D. Full Survey (Persona Voice)

**Q: What broke today?**  
"Bracket dropped at 11 PM. I screenshot it to three group texts and still had parents at the wrong venue Saturday."

**Q: Chravel fit?**  
"Calendar and import could save my sanity — if I can do three cities without pretending we're only in one hotel."

**Q: Paywall reaction?**  
"I used my one free import on Dallas. When Austin bracket came, it wanted me to upgrade mid-tournament. Hard no."

### E. Web Flow Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| Landing | Generic group travel | [OBSERVED] |
| Sign-up | 10-screen onboarding skipped | [OBSERVED] |
| Trip create | Single destination field | [SIMULATED RISK] |
| Smart Import | 1 free/trip then Explorer paywall | [OBSERVED — MobileGroupCalendar.tsx:142-158] |
| Calendar | List view good for game times | [OBSERVED] |
| Basecamp | One trip basecamp — wrong for multi-city | [SIMULATED RISK — PlacesSection.tsx] |
| Free limits | 3 trips, 10 AI, 500 MB | [OBSERVED — entitlements.ts] |
| Notifications | No batching; fanout risk at scale | [OBSERVED — NOTIFICATION_AUDIT.md] |

### F. Mobile/PWA Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| Android parent join | Join flow works; Google auth | [OBSERVED] |
| PDF import on phone | Smart Import modal | [OBSERVED] |
| Paywall toast | "View Plans" → settings | [OBSERVED — featurePaywall.ts] |
| Poll carpool | Works cross-platform | [OBSERVED] |
| Mixed OS group | PWA parity acceptable | [HYPOTHESIS] |

### G. Feature Table

| Feature | Rating | Label |
|---------|--------|-------|
| Calendar list view | 5 | [OBSERVED] |
| Smart Import | 5 | [OBSERVED] — loves when available |
| Smart Import paywall | 2 | [OBSERVED] |
| Multi-city support | 2 | [SIMULATED RISK] |
| Polls | 5 | [OBSERVED] |
| Payments | 4 | [OBSERVED] |
| Tasks | 4 | [OBSERVED] |
| Chat | 3 | [SIMULATED RISK] |
| Basecamp | 2 | [SIMULATED RISK] |
| Invite flow | 4 | [OBSERVED] |
| Trip Pass | 4 | [OBSERVED — $39.99/45d] |
| AI Concierge | 3 | [OBSERVED] |
| Media | 4 | [OBSERVED] |
| Notification reliability | 3 | [OBSERVED] |
| Guest access | 2 | [OBSERVED] |

### H. Emotional Reaction

Keisha is **energized by Smart Import, deflated by paywall timing**. She'd champion the app to other volleyball parents if multi-city and import limits were fixed.

> **[SYNTHETIC QUOTE]:** "The import literally pulled six game times off the PDF. I almost cried. Then it told me I needed Explorer for the second city bracket and I almost threw my phone."

### I. Conversion Scores

| Metric | Score |
|--------|-------|
| Activation | 6 |
| Invite | 4 |
| Day-7 retention | 5 |
| Paid conversion | 3 |
| Likelihood to use | 6 |
| **NPS** | **0** |

### J. Top 5 Fixes

1. **2–3 Smart Imports on free per trip** — `MobileGroupCalendar.tsx`, `useSmartImportTaste`
2. **Multi-city / multi-basecamp itinerary** — `PlacesSection.tsx`, calendar models
3. **Trip Pass CTA at import paywall** — `featurePaywall.ts`
4. **Guest schedule view** — `permissionMatrix.generated.ts`
5. **Notification batching for schedule changes** — `NOTIFICATION_AUDIT.md` recommendations

### K. Confidence & Beta Question

**Confidence:** Medium.

**Real beta question:** "How many distinct cities does a typical AAU weekend span, and would you pay $40 once per season for unlimited schedule imports?"

---

## Persona 4 — Mia Torres (Bachelorette Maid of Honor)

### A. Profile

| Field | Detail |
|-------|--------|
| **Name** | Mia Torres ("Mia") |
| **Age range** | 27–31 |
| **Segment** | Consumer — bachelorette (12 women, 3 nights) |
| **Tech comfort** | High. iMessage, Venmo, Partiful, Instagram |
| **Planning style** | Decisive but consensus-performing; runs polls so nobody blames her |
| **Main pain points** | Group text entropy; Venmo chasing; "what time is the bus?" ×6 |
| **Budget sensitivity** | Medium — Trip Pass yes; $9.99/mo no |
| **Platform** | iPhone only |
| **Why adopt** | Polls, payments summary, shared media, one link |
| **Why reject** | Payments don't move money; media cap; subscription framing |

### B. Jobs-to-be-Done

1. When **kicking off planning**, I want **one group-text link showing the plan**, so I stop being human FAQ.
2. When **the group can't decide dinner/outfits**, I want **polls with deadlines**.
3. When I've **fronted Airbnb + party bus + dinners**, I want **split tracking + who owes**.
4. When **we're in Nashville**, I want **day schedule + addresses one tap away**.
5. When **the weekend ends**, I want **all photos in one place** for the bride.

### C. Screener Table

| Question | Pass? | Mia |
|----------|-------|-----|
| Planning bachelorette in 90 days? | Yes | ✅ |
| 8+ attendees? | Yes | ✅ 12 |
| iPhone? | Yes | ✅ |
| Uses Venmo? | Yes | ✅ |
| One-time pass OK? | Yes | ✅ $39.99 |

### D. Full Survey (Persona Voice)

**Q: First click?**  
"TikTok sent me. The landing actually looks fun — not like corporate travel software."

**Q: Favorite feature?**  
"Polls. Oh my god, polls. 'Strip club or wine tasting' was settled in an hour."

**Q: Worst moment?**  
"It said it replaces Venmo but I still had to Venmo everyone individually. The settle button just opens Venmo."

**Q: Would you pay?**  
"Forty bucks for the weekend? Sure. Monthly? I'm not marrying the app, I'm marrying my best friend."

### E. Web Flow Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| Landing | "Replaces Venmo" sets false expectation | [OBSERVED — ReplacesGridData.ts] |
| Pricing tagline | "Start free. Upgrade when your trip gets serious." | [OBSERVED] |
| Trip create | Cover photo crop feels premium | [OBSERVED — CreateTripModal.tsx] |
| Invite OG | "Join NASH BASH • Nashville!" | [OBSERVED — JoinTrip.tsx] |
| Join copy | Clean; no dark-auth leak | [OBSERVED — JoinTrip.tsx:112-127] |
| Payments | Venmo deeplink only | [OBSERVED — product-ground-truth §6] |
| Settlement race | Double-credit risk documented | [OBSERVED — PLATFORM_AUDIT_CONSTITUTION.md] |
| Media | 500 MB free — tight for 12 women | [OBSERVED — entitlements.ts:265] |
| Trip Pass | $39.99/45d Explorer pass | [OBSERVED — billing/config.ts:197-202] |

### F. Mobile/PWA Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| Safari signup | Google OAuth smooth | [OBSERVED] |
| Poll creation | 30 seconds | [OBSERVED] |
| Media upload | **Loves** shared album | [OBSERVED] |
| Party bus address | Calendar + Places | [OBSERVED] |
| iOS upgrade | Web-only subscribe | [OBSERVED — APPLE_IAP_ENABLED=false] |
| Trip Pass in-app | Hard to find at paywall | [SIMULATED RISK] |
| Chat | Fine; group text still primary | [SIMULATED RISK] |

### G. Feature Table

| Feature | Rating | Label |
|---------|--------|-------|
| Polls | 5 | [OBSERVED] — **loves** |
| Media hub | 5 | [OBSERVED] — **loves** |
| Trip creation UX | 5 | [OBSERVED] |
| Invite preview | 5 | [OBSERVED] |
| Payments tracking | 4 | [OBSERVED] |
| Payments settlement | 2 | [OBSERVED] — no in-app money |
| AI Concierge | 4 | [OBSERVED] |
| Places | 4 | [OBSERVED] |
| Calendar | 4 | [OBSERVED] |
| Storage cap | 3 | [OBSERVED] |
| Trip Pass discoverability | 2 | [SIMULATED RISK] |
| Onboarding length | 3 | [OBSERVED] |
| Guest access | 2 | [OBSERVED] |
| Brand/vibe | 4 | [OBSERVED] |
| Chat | 3 | [SIMULATED RISK] |

### H. Emotional Reaction

Mia is **delighted by polls and media, annoyed by payments mismatch**. She'd recommend Chravel for bachelorettes with the caveat "it's not actually Venmo."

> **[SYNTHETIC QUOTE]:** "The photo album alone made the bride cry. But tell your marketing team to stop saying you replace Venmo unless you're paying my friends for me."

### I. Conversion Scores

| Metric | Score |
|--------|-------|
| Activation | 7 |
| Invite | 5 |
| Day-7 retention | 4 |
| Paid conversion | 4 |
| Likelihood to use | 7 |
| **NPS** | **-5** |

### J. Top 5 Fixes

1. **Honest payments copy** — `ReplacesGridData.ts`, `PricingSection.tsx`
2. **Trip Pass at media/AI paywalls** — `TripPassModal.tsx`, `featurePaywall.ts`
3. **Settlement idempotency** — payments RPC per PLATFORM_AUDIT_CONSTITUTION.md
4. **Raise free storage or event-scoped burst** — `entitlements.ts`, `featureTiers.ts`
5. **Guest weekend preview** — `permissionMatrix.generated.ts`

### K. Confidence & Beta Question

**Confidence:** High on polls/media delight; medium on payment expectations.

**Real beta question:** "For a 3-night bachelorette, would you rather pay $40 once or use free and hit limits on photos/splits?"

---

## Persona 5 — Brad Olsen (Guys Golf Birthday Trip)

### A. Profile

| Field | Detail |
|-------|--------|
| **Name** | Brad Olsen |
| **Age range** | 34–42 |
| **Segment** | Consumer — guys golf weekend (8 friends) |
| **Tech comfort** | Moderate. Android phone, WhatsApp, Splitwise |
| **Planning style** | One friend books tee times; Brad tracks money and dinner |
| **Main pain points** | Tee time coordination; dinner splits; too many app tabs |
| **Budget sensitivity** | Low-medium — $5–15/mo if simple |
| **Platform** | Android (Chrome) |
| **Why adopt** | Polls for courses; expense split; low drama |
| **Why reject** | Feature overload; feels "designed for women" aesthetic |

### B. Jobs-to-be-Done

1. When **picking morning vs. afternoon tee times**, I want **a quick poll**, so we stop debating in WhatsApp.
2. When I **pay for the Airbnb and greens fees**, I want **equal splits visible**, so I collect once.
3. When **we're at the course**, I want **today's schedule without digging**, so we make our tee time.
4. When **someone suggests a steakhouse**, I want **save place + vote**, so we book.
5. When the trip ends, I want **one photo dump**, so the group chat doesn't die with memories.

### C. Screener Table

| Question | Pass? | Brad |
|----------|-------|------|
| Plans guys trips annually? | Yes | ✅ |
| Handles money? | Yes | ✅ |
| Android user? | Yes | ✅ |
| Wants simple UX? | Yes | ✅ |

### D. Full Survey (Persona Voice)

**Q: Honest first reaction?**  
"Looks nice. Bit fancy for golf boys but whatever."

**Q: What worked?**  
"Poll for Pebble vs. Spyglass was done in ten minutes. Payments tab actually made sense — who owes me forty bucks."

**Q: What didn't?**  
"Too many tabs. Chat, calendar, places, tasks, polls, payments, concierge… bro I just need tee time and beer money."

**Q: Pay?**  
"Ten bucks a month maybe. Or nothing — Splitwise is free."

### E. Web Flow Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| Desktop landing | Hero + pricing visible | [OBSERVED — browser 2026-06-11] |
| Sign-up | Google auth | [OBSERVED] |
| Onboarding | Skips immediately | [SIMULATED RISK] |
| Trip create | Fast | [OBSERVED] |
| Tabs count | 7+ in-trip modules | [OBSERVED — ground-truth §2] |
| Polls | Strong | [OBSERVED] |
| Payments | 3 splits free | [OBSERVED — entitlements.ts:272-274] |
| Settlement race | Documented risk | [OBSERVED] |
| AI | Uses 2–3 queries for restaurants | [OBSERVED] |

### F. Mobile/PWA Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| Android Chrome | Responsive | [OBSERVED] |
| Bottom tab bar | Trips · Pro/Events · Recs · More | [OBSERVED] |
| Poll on phone | Easy | [OBSERVED] |
| Payments settle | Venmo deeplink | [OBSERVED] |
| PWA install | Optional | [HYPOTHESIS] |
| Google billing | Also disabled | [OBSERVED — GOOGLE_BILLING_ENABLED=false] |

### G. Feature Table

| Feature | Rating | Label |
|---------|--------|-------|
| Polls | 5 | [OBSERVED] |
| Payments | 4 | [OBSERVED] |
| Simplicity | 2 | [SIMULATED RISK] |
| Trip create | 5 | [OBSERVED] |
| Calendar | 4 | [OBSERVED] |
| Chat | 3 | [SIMULATED RISK] |
| AI Concierge | 3 | [OBSERVED] |
| Media | 3 | [OBSERVED] |
| Places | 3 | [OBSERVED] |
| Tasks | 2 | [SIMULATED RISK] |
| Onboarding | 2 | [OBSERVED] |
| Pricing | 4 | [OBSERVED] |
| Invite | 4 | [OBSERVED] |
| Android billing | 2 | [OBSERVED] |
| Design gender vibe | 3 | [SIMULATED RISK] |

### H. Emotional Reaction

Brad is **mildly positive** — polls and payments earn a nod; tab sprawl and premium aesthetic are friction, not blockers.

> **[SYNTHETIC QUOTE]:** "Polls slapped. Everything else is fine. Just don't make me feel like I'm planning a wedding when I'm planning bogeys and beers."

### I. Conversion Scores

| Metric | Score |
|--------|-------|
| Activation | 6 |
| Invite | 5 |
| Day-7 retention | 4 |
| Paid conversion | 3 |
| Likelihood to use | 6 |
| **NPS** | **5** |

### J. Top 5 Fixes

1. **Simplified "weekend mode" tab layout** — `MobileTripDetail.tsx`
2. **Settlement atomic RPC** — payments layer per audit
3. **Explorer tier clarity at split cap** — `ConsumerBillingSection.tsx`
4. **Reduce onboarding to 3 screens** — `OnboardingCarousel.tsx`
5. **Android billing or clear web-checkout path** — `billing/providers/iap.ts`

### K. Confidence & Beta Question

**Confidence:** Medium.

**Real beta question:** "For a 3-day guys trip, which two features matter — polls, splits, schedule, or chat — rank them."

---

## Persona 6 — Priya & James Chen (Destination Wedding)

### A. Profile

| Field | Detail |
|-------|--------|
| **Names** | Priya & James Chen |
| **Age range** | 29–35 |
| **Segment** | Events — destination wedding (~85 guests) |
| **Tech comfort** | High (Priya); Medium (James) |
| **Planning style** | Priya runs vendors; James runs family logistics |
| **Main pain points** | Guest comms fragmentation; RSVP tracking; weekend schedule for guests |
| **Budget sensitivity** | Medium — 90-day Trip Pass $74.99 conceivable |
| **Platform** | Mixed |
| **Why adopt** | Events module, broadcasts, RSVP, shared agenda |
| **Why reject** | Attendee cap copy scare; guest signup wall; notification scale risk |

### B. Jobs-to-be-Done

1. When **guests need weekend schedule**, I want **broadcasts + agenda**, so we're not texting 85 people.
2. When **tracking RSVPs**, I want **clear states**, so catering count is right.
3. When **out-of-town guests arrive**, I want **one link with hotels + events**, so family stops calling us.
4. When **vendors change timing**, I want **push announcements**, so the ceremony doesn't chaos.
5. When **the wedding ends**, I want **guest photo pool**, so we get every angle.

### C. Screener Table

| Question | Pass? | Chens |
|----------|-------|-------|
| Destination wedding? | Yes | ✅ |
| 50+ guests? | Yes | ✅ 85 |
| Need guest comms? | Yes | ✅ |
| Event-tier features? | Yes | ✅ |

### D. Full Survey (Persona Voice)

**Priya:** "We almost used Partiful for everything but needed a real weekend itinerary for guests flying in."

**James:** "The Events thing looked right until I saw '100 attendee cap' somewhere and panicked we had 85 plus kids."

**Both:** "We'd pay seventy-five bucks for ninety days if broadcasts actually reach everyone."

### E. Web Flow Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| Landing | Events mentioned in nav | [OBSERVED] |
| Event create | Free: 3 lifetime events | [OBSERVED — product-ground-truth §4] |
| Attendee caps | Advertised but not enforced | [OBSERVED — billing/config.ts comment] |
| Broadcasts | Feature exists | [OBSERVED] |
| Broadcast fanout | Schema drift; scale risk 4k members | [OBSERVED — REPORT.md C3, NOTIFICATION_AUDIT.md] |
| Guest access | consumer_guest: none | [OBSERVED] |
| Smart Import agenda | Paywalled for free | [OBSERVED — featurePaywall.ts] |
| Trip Pass 90d | Frequent $74.99 | [OBSERVED — billing/config.ts] |

### F. Mobile/PWA Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| Guest on iPhone | Must sign up for agenda | [OBSERVED] |
| RSVP flow | Event detail surfaces | [OBSERVED — EventDetail.tsx] |
| Broadcast push | Depends on opt-in | [OBSERVED] |
| Elderly guests | Account wall painful | [SIMULATED RISK] |
| Media | Couple loves guest uploads | [OBSERVED] |

### G. Feature Table

| Feature | Rating | Label |
|---------|--------|-------|
| Events module | 4 | [OBSERVED] |
| RSVP | 4 | [OBSERVED] |
| Broadcasts | 3 | [OBSERVED] — scale risk |
| Agenda/calendar | 4 | [OBSERVED] |
| Guest onboarding | 2 | [OBSERVED] |
| Attendee cap copy | 2 | [OBSERVED] — false scare |
| Media | 5 | [OBSERVED] — **love** |
| Payments | 3 | [OBSERVED] |
| Smart Import | 4 | [OBSERVED] |
| Polls | 4 | [OBSERVED] |
| Tasks | 4 | [OBSERVED] |
| Pricing | 3 | [OBSERVED] |
| Notification reliability | 2 | [OBSERVED] |
| AI Concierge | 3 | [OBSERVED] |
| Invite preview | 4 | [OBSERVED] |

### H. Emotional Reaction

**Cautiously optimistic** — Events module direction is right; guest friction and broadcast reliability worry them for the actual wedding weekend.

> **[SYNTHETIC QUOTE]:** "If 60 of 85 guests actually get the 'bus leaves at 4' push notification, this is a lifesaver. If twelve miss it because they didn't make an account, we're fired by our own families."

### I. Conversion Scores

| Metric | Score |
|--------|-------|
| Activation | 6 |
| Invite | 4 |
| Day-7 retention | 5 |
| Paid conversion | 5 |
| Likelihood to use | 6 |
| **NPS** | **-5** |

### J. Top 5 Fixes

1. **Fix broadcast schema drift** — migrations + `broadcastService.ts` per REPORT.md C3
2. **Guest read-only event agenda** — `permissionMatrix.generated.ts`, Events routes
3. **Remove/enforce attendee cap copy** — `billing/config.ts`, marketing
4. **Async notification fanout** — `NOTIFICATION_AUDIT.md`
5. **Wedding-specific onboarding template** — `CreateTripModal.tsx`

### K. Confidence & Beta Question

**Confidence:** Medium-low on broadcast reliability without live load test.

**Real beta question:** "What percentage of wedding guests over 55 would create an account to see the weekend schedule?"

---

## Persona 7 — Robert Ellison (Family Reunion)

### A. Profile

| Field | Detail |
|-------|--------|
| **Name** | Robert Ellison |
| **Age range** | 58–65 |
| **Segment** | Consumer — family reunion (22 relatives, multi-generational) |
| **Tech comfort** | Low. Desktop email; kids set up his iPad |
| **Planning style** | Committee of cousins; Robert is treasurer + schedule keeper |
| **Main pain points** | Older relatives can't use apps; printable schedule; potluck signup |
| **Budget sensitivity** | **Free only** |
| **Platform** | Desktop-first; elders on iPad |
| **Why adopt** | Shared calendar clarity; task assignments |
| **Why reject** | Account required for everyone; no print-first flow; complexity |

### B. Jobs-to-be-Done

1. When **planning a 3-day reunion**, I want **a schedule everyone can understand**, so cousins stop calling me.
2. When **assigning potluck dishes**, I want **tasks or polls**, so we don't get twelve mac-and-cheeses.
3. When **tracking shared cabin costs**, I want **simple splits**, so family politics stay minimal.
4. When **Aunt Martha (78) needs the plan**, I want **print or SMS**, not an app login.
5. When **photos come in from everyone**, I want **one album**, so we make the memory book.

### C. Screener Table

| Question | Pass? | Robert |
|----------|-------|--------|
| Plans family reunion? | Yes | ✅ |
| 15+ attendees? | Yes | ✅ 22 |
| Mixed ages? | Yes | ✅ |
| Will pay? | No | ❌ |

### D. Full Survey (Persona Voice)

**Q: Could you set this up alone?**  
"My niece helped. The onboarding had ten screens — she skipped them. I would have quit."

**Q: Did your family join?**  
"Six of twenty-two. The rest said 'send me a PDF.'"

**Q: What worked?**  
"The calendar made sense once my niece showed me. Tasks for potluck was clever."

**Q: Overall?**  
"Fine for the cousins who live on their phones. Useless for the aunts who still use flip phones."

### E. Web Flow Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| Desktop landing | Readable | [OBSERVED] |
| Onboarding | 10 screens — elder killer | [OBSERVED — OnboardingCarousel.tsx] |
| Trip create | Workable on desktop | [OBSERVED] |
| Invite | Auth wall for all value | [OBSERVED — consumer_guest] |
| PDF export | Explorer+ feature | [OBSERVED — billing] |
| Print path | No dedicated print view | [SIMULATED RISK] |
| Free trips | 3 active cap | [OBSERVED] |
| Demo mode | app-preview for sales demos only | [OBSERVED] |

### F. Mobile/PWA Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| iPad Safari | Usable with help | [SIMULATED RISK] |
| Elder tap targets | Generally OK | [OBSERVED — mobile-first rules] |
| PWA | Unlikely for elders | [HYPOTHESIS] |
| Notifications | Elders disable push | [SIMULATED RISK] |

### G. Feature Table

| Feature | Rating | Label |
|---------|--------|-------|
| Calendar clarity | 4 | [OBSERVED] |
| Tasks/potluck | 4 | [OBSERVED] |
| Elder accessibility | 1 | [SIMULATED RISK] |
| Invite/signup | 1 | [OBSERVED] |
| Guest read access | 1 | [OBSERVED] |
| PDF/print | 2 | [OBSERVED] — gated |
| Payments | 3 | [OBSERVED] |
| Polls | 3 | [OBSERVED] |
| Chat | 2 | [SIMULATED RISK] |
| Media | 4 | [OBSERVED] |
| Onboarding | 1 | [OBSERVED] |
| Free tier | 4 | [OBSERVED] |
| AI | 1 | [SIMULATED RISK] |
| Pricing | N/A | [OBSERVED] — won't pay |
| Support burden | 2 | [SIMULATED RISK] |

### H. Emotional Reaction

Robert is **resigned** — appreciates structure for willing cousins; knows the product cannot reach his full family without guest access and print.

> **[SYNTHETIC QUOTE]:** "My nephew says this is the future. My sister says 'email me the schedule like a normal person.' They're both right."

### I. Conversion Scores

| Metric | Score |
|--------|-------|
| Activation | 5 |
| Invite | 3 |
| Day-7 retention | 4 |
| Paid conversion | 1 |
| Likelihood to use | 5 |
| **NPS** | **-15** |

### J. Top 5 Fixes

1. **Guest read-only + printable schedule link** — `JoinTrip.tsx`, export routes
2. **Skip onboarding for invite deep-links** — `OnboardingCarousel.tsx`, auth flow
3. **Free PDF export for reunions** — `entitlements.ts`, export hooks
4. **SMS/email schedule digest** — notifications edge functions
5. **Simpler elder UI mode** — large-type trip view component

### K. Confidence & Beta Question

**Confidence:** High on elder friction; low on willingness to adopt any app.

**Real beta question:** "What fraction of your reunion attendees are 65+ and would not create an account under any circumstances?"

---

## Persona 8 — Tyler Brooks (College Spring Break)

### A. Profile

| Field | Detail |
|-------|--------|
| **Name** | Tyler Brooks |
| **Age range** | 20–22 |
| **Segment** | Consumer — college spring break (10 friends) |
| **Tech comfort** | High. TikTok, Snap, Venmo |
| **Planning style** | One organized friend; budget-conscious |
| **Main pain points** | Budget tracking; who's in/out; hostel/Airbnb decision |
| **Budget sensitivity** | **Free only** — price sensitive |
| **Platform** | iPhone |
| **Why adopt** | Polls, chat, free tier |
| **Why reject** | Onboarding length; upgrade prompts |

### B. Jobs-to-be-Done

1. When **10 friends debate Cancún vs. Miami**, I want **a poll**, so we pick before prices spike.
2. When **tracking who paid deposit**, I want **expense splits**, so nobody ghosts.
3. When **we're on the trip**, I want **today's plan in chat/calendar**, so we don't miss the boat party.
4. When **someone finds a bar**, I want **pin it**, so the group finds it.
5. When **it's over**, I want **photos for the group chat recap**.

### C. Screener Table

| Question | Pass? | Tyler |
|----------|-------|-------|
| College student? | Yes | ✅ |
| Plans group trip? | Yes | ✅ |
| Price sensitive? | Yes | ✅ |
| iPhone? | Yes | ✅ |

### D. Full Survey (Persona Voice)

**Q: Would you use this?**  
"Yeah if it's free. Polls are clutch for picking where we go."

**Q: Annoying part?**  
"The tutorial thing had like ten slides. I skipped. Also don't show me upgrade stuff when I'm broke."

**Q: Favorite?**  
"Chat is fine. Media hub for the trip pics actually goes hard."

### E. Web Flow Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| TikTok → landing | "Group Chat Travel App" resonates | [OBSERVED] |
| Free tier | 3 trips, 10 AI, 500 MB | [OBSERVED] |
| Onboarding | 10 screens — skips | [OBSERVED] |
| Polls | Immediate value | [OBSERVED] |
| Upgrade prompts | PlusUpsellModal | [OBSERVED] |
| PostHog | No funnel data | [HYPOTHESIS] |

### F. Mobile/PWA Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| iPhone flow | Fast signup | [OBSERVED] |
| Poll on beach | Works | [OBSERVED] |
| Media | **Loves** — uploads party pics | [OBSERVED] |
| AI | Uses for cheap eats | [OBSERVED] |
| Paywall | Bounces at upgrade | [SIMULATED RISK] |

### G. Feature Table

| Feature | Rating | Label |
|---------|--------|-------|
| Polls | 5 | [OBSERVED] |
| Chat | 4 | [OBSERVED] |
| Media | 5 | [OBSERVED] — **loves** |
| Free tier | 5 | [OBSERVED] |
| Onboarding | 2 | [OBSERVED] |
| Payments | 4 | [OBSERVED] |
| AI | 4 | [OBSERVED] |
| Places | 3 | [OBSERVED] |
| Calendar | 3 | [OBSERVED] |
| Upgrade CTAs | 2 | [SIMULATED RISK] |
| Invite | 4 | [OBSERVED] |
| Tasks | 3 | [OBSERVED] |
| Trip Pass | 2 | [SIMULATED RISK] — won't buy |
| Design | 4 | [OBSERVED] |
| Guest access | 3 | [OBSERVED] |

### H. Emotional Reaction

Tyler is **enthusiastic on free** — polls, chat, and media fit spring break perfectly; monetization surfaces are turn-offs.

> **[SYNTHETIC QUOTE]:** "Bro the shared album ate. I'm not paying ten a month though — I'm paying for gas to Miami."

### I. Conversion Scores

| Metric | Score |
|--------|-------|
| Activation | 7 |
| Invite | 6 |
| Day-7 retention | 3 |
| Paid conversion | 1 |
| Likelihood to use | 7 |
| **NPS** | **10** |

### J. Top 5 Fixes

1. **Short onboarding (3 screens)** — `OnboardingCarousel.tsx`
2. **Defer upgrade prompts until post-value** — `PlusUpsellModal.tsx`
3. **Guest view for holdouts** — `permissionMatrix.generated.ts`
4. **Visible AI quota counter** — `AIConciergeChat.tsx`
5. **Instrument activation funnel** — enable PostHog `[HYPOTHESIS]`

### K. Confidence & Beta Question

**Confidence:** Medium.

**Real beta question:** "Would you use Chravel for one spring break trip if it stayed 100% free with ads instead of upgrade prompts?"

---

## Persona 9 — Camille Dubois (4 Couples Group)

### A. Profile

| Field | Detail |
|-------|--------|
| **Name** | Camille Dubois |
| **Age range** | 33–40 |
| **Segment** | Consumer — 4 couples, wine country weekend |
| **Tech comfort** | Moderate-high |
| **Planning style** | Rotating dinner hosts; fair cost splitting obsessed |
| **Main pain points** | Uneven splits; reservation coordination; shared tasting fees |
| **Budget sensitivity** | Per-trip Trip Pass OK; subscription skeptical |
| **Platform** | iPhone |
| **Why adopt** | Payments summary; polls; places |
| **Why reject** | Subscription framing; iOS purchase dead-end |

### B. Jobs-to-be-Done

1. When **splitting tastings and dinners across 4 couples**, I want **clear balances**, so nobody keeps a ledger in Notes.
2. When **booking wineries**, I want **polls + calendar holds**, so we lock reservations.
3. When **sharing the weekend plan**, I want **one link**, so partners see the same info.
4. When **someone pays the Airbnb**, I want **custom splits**, so it's fair.
5. When **remembering favorite wineries**, I want **saved places**, so we return next year.

### C. Screener Table

| Question | Pass? | Camille |
|----------|-------|---------|
| Couples group 6+? | Yes | ✅ 8 |
| Cares about fair splits? | Yes | ✅ |
| iPhone? | Yes | ✅ |
| Trip Pass OK? | Yes | ✅ |

### D. Full Survey (Persona Voice)

**Q: Best feature?**  
"Who-owes-whom on the payments tab. My husband stopped asking me 'did we pay the Lees yet.'"

**Q: Worst?**  
"On my phone it said subscribe on the website. I'm in a vineyard with one bar of signal — not doing that."

**Q: Pay model preference?**  
"Charge me once for the trip. Don't marry me."

### E. Web Flow Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| Pricing | Explorer $9.99; Trip Pass $39.99/45d | [OBSERVED — billing/config.ts] |
| Payments | Custom splits; 3 free | [OBSERVED] |
| Settlement | Manual/Venmo; race risk | [OBSERVED] |
| iOS IAP | Disabled | [OBSERVED] |
| Polls | Winery selection | [OBSERVED] |
| Places | Save pins | [OBSERVED] |

### F. Mobile/PWA Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| Payments mobile | Summary readable | [OBSERVED] |
| iOS subscribe | Web redirect | [OBSERVED — APPLE_IAP_ENABLED=false] |
| Trip Pass discovery | Weak | [SIMULATED RISK] |
| Couples invite | 4/8 join realistic | [SIMULATED RISK] |

### G. Feature Table

| Feature | Rating | Label |
|---------|--------|-------|
| Payments summary | 5 | [OBSERVED] — **loves** |
| Custom splits | 5 | [OBSERVED] |
| Polls | 4 | [OBSERVED] |
| Places | 4 | [OBSERVED] |
| Calendar | 4 | [OBSERVED] |
| iOS billing | 1 | [OBSERVED] |
| Trip Pass UX | 2 | [SIMULATED RISK] |
| Subscription pitch | 2 | [SIMULATED RISK] |
| Settlement safety | 3 | [OBSERVED] — race risk |
| Invite | 4 | [OBSERVED] |
| Media | 4 | [OBSERVED] |
| AI | 3 | [OBSERVED] |
| Onboarding | 3 | [OBSERVED] |
| Guest access | 2 | [OBSERVED] |
| Free split cap | 3 | [OBSERVED] — 3/trip |

### H. Emotional Reaction

Camille is **satisfied with payments, irritated by monetization mechanics** on iOS.

> **[SYNTHETIC QUOTE]:** "The split math is chef's kiss. The 'go to our website to pay' on my iPhone is chef's middle finger."

### I. Conversion Scores

| Metric | Score |
|--------|-------|
| Activation | 6 |
| Invite | 5 |
| Day-7 retention | 5 |
| Paid conversion | 3 |
| Likelihood to use | 6 |
| **NPS** | **0** |

### J. Top 5 Fixes

1. **Trip Pass IAP or Stripe mobile web flow** — `billing/providers/iap.ts`, `TripPassModal.tsx`
2. **Settlement idempotency** — payments RPC
3. **Trip Pass at iOS paywall** — `ConsumerBillingSection.tsx`
4. **Raise free split limit to 5** — `entitlements.ts`
5. **Guest balance view (read-only)** — payments permissions

### K. Confidence & Beta Question

**Confidence:** Medium-high on payments delight.

**Real beta question:** "Would you pay $40 once per couples weekend if splits and polls were unlimited?"

---

## Persona 10 — Jordan Kim (Solo Friend-Trip Organizer)

### A. Profile

| Field | Detail |
|-------|--------|
| **Name** | Jordan Kim |
| **Age range** | 27–32 |
| **Segment** | Consumer — default friend-group organizer |
| **Tech comfort** | High |
| **Planning style** | "The one who always plans" — spreadsheet veteran |
| **Main pain points** | Chasing RSVPs; re-answering logistics; empty chat on join |
| **Budget sensitivity** | Trip Pass yes |
| **Platform** | Mixed |
| **Why adopt** | Tasks + concierge + one link |
| **Why reject** | Invite buried; friends won't join; Smart Import paywall |

### B. Jobs-to-be-Done

1. When **herding 6 friends**, I want **one shared link with dates and plan**.
2. When **fronting costs**, I want **automatic splits**.
3. When **debating neighborhoods**, I want **polls that close**.
4. When **saving Instagram finds**, I want **two-tap pin to trip map**.
5. When **2 weeks out**, I want **nudges on tasks and unpaid balances**.

### C. Screener Table

| Question | Pass? | Jordan |
|----------|-------|--------|
| Default planner? | Yes | ✅ |
| 5+ friends? | Yes | ✅ 6 |
| Repeat user potential? | Yes | ✅ |
| Trip Pass? | Yes | ✅ |

### D. Full Survey (Persona Voice)

**Q: Compared to your spreadsheet?**  
"Better for polls and chat. Worse until everyone joins — then it's great."

**Q: Hidden pain?**  
"I couldn't find Invite for three minutes. It's under the three dots. Who hides growth behind a meatball menu?"

**Q: AI?**  
"Concierge saved me an hour on Tokyo restaurants. I didn't know I only had ten asks until I hit the wall."

### E. Web Flow Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| Demo CTA | app-preview via localStorage | [OBSERVED] |
| Onboarding final | Create Trip / Explore demo | [OBSERVED — OnboardingCarousel.tsx] |
| Invite depth | 3 taps on mobile | [SIMULATED RISK — MobileTripDetail.tsx] |
| Join approval default | `?? true` risk | [OBSERVED — JoinTrip.tsx:859] |
| Smart Import | Paywalled | [OBSERVED] |
| AI quota UI | Hidden counter | [SIMULATED RISK — AIConciergeChat.tsx] |
| Dashboard bug | Post-approval missing trip | [OBSERVED — DEBUG_PATTERNS.md] |

### F. Mobile/PWA Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| Chat default tab | Empty on join | [SIMULATED RISK] |
| Tasks | Useful for prep | [OBSERVED] |
| Concierge | Strong | [OBSERVED] |
| Invite share | Native sheet works | [OBSERVED] |
| PWA | Acceptable | [HYPOTHESIS] |

### G. Feature Table

| Feature | Rating | Label |
|---------|--------|-------|
| AI Concierge | 5 | [OBSERVED] |
| Tasks | 4 | [OBSERVED] |
| Polls | 4 | [OBSERVED] |
| Invite discoverability | 2 | [SIMULATED RISK] |
| Smart Import | 4 | [OBSERVED] — paywalled |
| Join flow | 3 | [OBSERVED] |
| Calendar | 4 | [OBSERVED] |
| Payments | 4 | [OBSERVED] |
| Places | 3 | [OBSERVED] |
| Media | 4 | [OBSERVED] |
| Onboarding | 3 | [OBSERVED] |
| Trip Pass | 4 | [OBSERVED] |
| Guest access | 2 | [OBSERVED] |
| Empty chat landing | 2 | [SIMULATED RISK] |
| Post-join dashboard | 3 | [OBSERVED] — bug risk |

### H. Emotional Reaction

Jordan is **competent but mildly betrayed by growth UX** — loves concierge once in; hates buried invite and invisible limits.

> **[SYNTHETIC QUOTE]:** "I'm the planner friend — I want your app to make me look good. Hide the invite button and you're making me look stupid."

### I. Conversion Scores

| Metric | Score |
|--------|-------|
| Activation | 7 |
| Invite | 4 |
| Day-7 retention | 5 |
| Paid conversion | 3 |
| Likelihood to use | 7 |
| **NPS** | **-5** |

### J. Top 5 Fixes

1. **Prominent Invite CTA on mobile** — `MobileTripDetail.tsx`
2. **Default open join when invite omits flag** — `JoinTrip.tsx:859`, edge function contract
3. **Visible AI quota** — `AIConciergeChat.tsx`, `useConciergeUsage.ts`
4. **Smart Import first taste** — `MobileGroupCalendar.tsx`
5. **Fix post-approval dashboard** — `trip_members.status` drift per DEBUG_PATTERNS.md

### K. Confidence & Beta Question

**Confidence:** High on organizer UX gaps.

**Real beta question:** "When you share a trip link, what % of friends join within 24 hours vs. never?"

---

## Persona 11 — Dana Okafor (NFL Travel Logistics)

### A. Profile

| Field | Detail |
|-------|--------|
| **Name** | Dana Okafor |
| **Age range** | 38–45 |
| **Segment** | Pro — NFL team travel logistics (~60 travelers) |
| **Tech comfort** | High — Teamworks, Concur, Smartsheet |
| **Planning style** | Militaristic day sheets; role-gated comms |
| **Main pain points** | Bus call ack; rooming; per-diem; tool sprawl |
| **Budget sensitivity** | Low (employer pays); needs procurement credibility |
| **Platform** | Desktop-first |
| **Why adopt** | Roster + roles + broadcasts + schedule |
| **Why reject** | Stubbed Pro logistics; mailto sales; broadcast drift |

### B. Jobs-to-be-Done

1. When **publishing game-day itinerary**, I want **versioned day sheet to 60 people**.
2. When **bus call changes**, I want **broadcast + ack tracking**.
3. When **onboarding party**, I want **Player/Coach/Crew/Medical/Security walls**.
4. When **hotel rooming**, I want **room assignments in-system**.
5. When **charter slips**, I want **one schedule update + instant notify**.

### C. Screener Table

| Question | Pass? | Dana O. |
|----------|-------|---------|
| Pro sports logistics? | Yes | ✅ |
| 40+ travelers? | Yes | ✅ 60 |
| Needs role gates? | Yes | ✅ |
| Enterprise buyer? | Yes | ✅ |

### D. Full Survey (Persona Voice)

**Q: ForTeams first impression?**  
"Says the right words. 'Schedule a Demo' opens my email client. That's not software, that's a brochure."

**Q: In-app Pro trial?**  
"Sports roles mapped perfectly. Then I opened per-diem and it was a placeholder."

**Q: Would employer buy?**  
"Not until bus-call broadcasts prove delivery to players only — and your compliance tab isn't lorem ipsum."

### E. Web Flow Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| `/teams` | ForTeams marketing | [OBSERVED — ForTeams.tsx] |
| Pro CTAs | All `mailto:support@chravelapp.com` | [OBSERVED — ForTeams.tsx:84-324] |
| Pro trip create | 1 free trial | [OBSERVED — entitlements.ts:253-259] |
| Sports roles | Player/Coach/Crew/Medical/Security | [OBSERVED — proCategories.ts] |
| tripConverter | `roster/schedule/settlement/medical/compliance: []` | [OBSERVED — tripConverter.ts:118-130] |
| Per-diem tab | Placeholder | [OBSERVED — ProTabContent.tsx] |
| Broadcast fanout | Schema drift; sync INSERT risk | [OBSERVED — REPORT.md C3] |
| Voice concierge | Dictation-only; sold as live | [OBSERVED — product-ground-truth §10.2] |

### F. Mobile/PWA Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| Coach on phone | Role channels work | [OBSERVED] |
| Player join | Approval + dashboard bug risk | [OBSERVED] |
| Day-of mobile | Calendar OK; no day sheet | [SIMULATED RISK] |
| Broadcast ack | Not proven in UI | [SIMULATED RISK] |

### G. Feature Table

| Feature | Rating | Label |
|---------|--------|-------|
| Sports role defaults | 5 | [OBSERVED] — **loves fit** |
| Role channels | 5 | [OBSERVED] |
| Roster UI | 4 | [OBSERVED] |
| Schedule/day sheet | 2 | [OBSERVED] — stubbed data |
| Per-diem | 1 | [OBSERVED] — placeholder |
| Settlement | 1 | [OBSERVED] — `[]` |
| Compliance | 1 | [OBSERVED] — `[]` |
| Medical | 1 | [OBSERVED] — `[]` |
| Broadcasts | 3 | [OBSERVED] — drift risk |
| ForTeams sales | 1 | [OBSERVED] — mailto |
| Calendar | 3 | [OBSERVED] |
| Tasks | 4 | [OBSERVED] |
| Media | 3 | [OBSERVED] |
| Invite at scale | 4 | [OBSERVED] |
| Enterprise trust | 2 | [SIMULATED RISK] |

### H. Emotional Reaction

Dana is **professionally insulted by stubs** — role/channel fit is excellent; finance/compliance placeholders kill procurement.

> **[SYNTHETIC QUOTE]:** "You nailed my roster taxonomy and then showed me an empty settlement tab. That's worse than not having the menu item."

### I. Conversion Scores

| Metric | Score |
|--------|-------|
| Activation | 6 |
| Invite | 7 |
| Day-7 retention | 3 |
| Paid conversion | 2 |
| Likelihood to use | 5 |
| **NPS** | **-35** |

### J. Top 5 Fixes

1. **Wire Pro logistics to DB** — replace `tripConverter.ts` empty arrays with real queries
2. **Self-serve Pro checkout** — `ForTeams.tsx` replace mailto with Stripe B2B flow
3. **Broadcast schema + targeting fix** — migrations per REPORT.md C3
4. **Per-diem/settlement MVP** — `ProTabContent.tsx`, pro types
5. **Ack tracking on broadcasts** — `broadcastService.ts`, delivery tables

### K. Confidence & Beta Question

**Confidence:** High on stub gap; medium on broadcast fix scope.

**Real beta question:** "For a 60-person road trip, what's the minimum viable replacement for your current day-sheet tool — schedule only, or schedule + ack broadcasts?"

---

## Persona 12 — Marcus Webb (NBA Travel Operations)

### A. Profile

| Field | Detail |
|-------|--------|
| **Name** | Marcus Webb |
| **Age range** | 36–44 |
| **Segment** | Pro — NBA travel ops variant of Dana Okafor |
| **Tech comfort** | Very high |
| **Planning style** | Charter-level precision; 55-person party |
| **Main pain points** | Bus call acknowledgments; role-targeted broadcasts; procurement |
| **Budget sensitivity** | Enterprise budget |
| **Platform** | Desktop-first |
| **Why adopt** | Targeted broadcasts; sports ops taxonomy |
| **Why reject** | Broadcast targeting not enforced; mailto checkout |

### B. Jobs-to-be-Done

1. When **sending bus call to players only**, I want **role-filtered delivery**, not entire party.
2. When **tracking who saw the change**, I want **per-person ack roster**.
3. When **security moves hotel floor**, I want **Medical/Security channel only**.
4. When **finance audits per-diem**, I want **exportable settlement**.
5. When **evaluating vendors**, I want **self-serve trial without emailing support**.

### C. Screener Table

| Question | Pass? | Marcus |
|----------|-------|--------|
| NBA/NFL ops? | Yes | ✅ NBA |
| 50+ travelers? | Yes | ✅ 55 |
| Role-based comms? | Yes | ✅ |
| Needs ack tracking? | Yes | ✅ |

### D. Full Survey (Persona Voice)

**Q: vs. Teamworks?**  
"Teamworks is ugly but the bus call actually reaches players. Your broadcast said 'Players only' and my equipment manager got it too."

**Q: Dealbreaker?**  
"mailto sales in 2026. I can't put 'email support@chravel' in a procurement packet."

### E. Web Flow Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| Broadcast UI | Role targeting in UI | [OBSERVED] |
| Fanout | May ignore targeting; schema drift | [OBSERVED — persona 03-team-logistics.md] |
| Scale | 4k members → 12k delivery rows sync | [OBSERVED — NOTIFICATION_AUDIT.md] |
| tripConverter | Empty schedule/roster arrays | [OBSERVED — tripConverter.ts] |
| Pro pricing | Growth $99/mo mailto | [OBSERVED — ForTeams.tsx] |

### F. Mobile/PWA Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| Player mobile | Join + channels | [OBSERVED] |
| Staff desktop | Primary ops surface | [SIMULATED RISK] |
| Night-of changes | Calendar edit + notify storm | [OBSERVED] |

### G. Feature Table

| Feature | Rating | Label |
|---------|--------|-------|
| Role taxonomy | 5 | [OBSERVED] |
| Broadcast targeting UI | 4 | [OBSERVED] |
| Broadcast delivery truth | 2 | [OBSERVED] — drift |
| Ack roster | 1 | [SIMULATED RISK] |
| Day sheet | 2 | [OBSERVED] — stub |
| Settlement | 1 | [OBSERVED] |
| ForTeams GTM | 1 | [OBSERVED] |
| Calendar | 3 | [OBSERVED] |
| Role channels | 5 | [OBSERVED] |
| Invite scale | 4 | [OBSERVED] |
| Notification scale | 2 | [OBSERVED] |
| Compliance | 1 | [OBSERVED] |
| Media security | 2 | [OBSERVED] — unsigned URLs |
| AI | 2 | [SIMULATED RISK] |
| Tasks | 4 | [OBSERVED] |

### H. Emotional Reaction

Marcus is **frustrated by almost-enterprise** — sees the vision, cannot stake player safety on unproven broadcast pipeline.

> **[SYNTHETIC QUOTE]:** "I need 'who has not acknowledged bus call' not 'who got a notification maybe.' Those are different jobs."

### I. Conversion Scores

| Metric | Score |
|--------|-------|
| Activation | 6 |
| Invite | 7 |
| Day-7 retention | 3 |
| Paid conversion | 2 |
| Likelihood to use | 5 |
| **NPS** | **-30** |

### J. Top 5 Fixes

1. **Server-enforced broadcast recipient resolution** — edge functions + migrations
2. **Ack tracking UI** — pro admin components
3. **Async fanout** — `NOTIFICATION_AUDIT.md` Stage B
4. **Stripe Pro self-serve** — `ForTeams.tsx`, billing webhooks
5. **Populate schedule from calendar** — bridge `tripConverter.ts` to calendar events

### K. Confidence & Beta Question

**Confidence:** Medium-high on broadcast gaps.

**Real beta question:** "When bus call moves 30 minutes, how do you verify every player received it — phone tree, app ack, or honor system?"

---

## Persona 13 — Coach Elena Ruiz (Duke Basketball Travel Coordinator)

### A. Profile

| Field | Detail |
|-------|--------|
| **Name** | Coach Elena Ruiz |
| **Age range** | 34–42 |
| **Segment** | Pro — NCAA D1 basketball travel (~25 travelers) |
| **Tech comfort** | High within athletics stack |
| **Planning style** | Compliance-aware; NCAA travel rules |
| **Main pain points** | Compliance visibility; role permissions; meal counts |
| **Budget sensitivity** | Athletic department budget |
| **Platform** | Mixed (iPad + desktop) |
| **Why adopt** | Roster + roles + schedule |
| **Why reject** | Compliance tab stub; NCAA-specific gaps |

### B. Jobs-to-be-Done

1. When **planning ACC road swing**, I want **shared schedule for staff + players**.
2. When **NCAA compliance asks for logs**, I want **audit trail**, not placeholder tab.
3. When **assigning managers vs. players**, I want **hard permission walls**.
4. When **counting meals for per diem**, I want **structured data**.
5. When **last-minute practice time moves**, I want **targeted notify**.

### C. Screener Table

| Question | Pass? | Elena |
|----------|-------|-------|
| College athletics? | Yes | ✅ Duke |
| 20+ travelers? | Yes | ✅ 25 |
| Compliance needs? | Yes | ✅ |
| Pro trial? | Yes | ✅ |

### D. Full Survey (Persona Voice)

**Q: Compliance tab?**  
"It literally says coming soon. I can't show that to our compliance officer."

**Q: What worked?**  
"Roles and roster — finally something that knows 'player' isn't 'staff.'"

**Q: Buy?**  
"Department would pay $49/mo if compliance and per-diem weren't vaporware."

### E. Web Flow Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| Pro Sports category | Fits basketball travel | [OBSERVED] |
| Compliance UI | Placeholder | [OBSERVED — ProTabContent.tsx:227-244] |
| tripConverter | `compliance: []` | [OBSERVED — tripConverter.ts:130] |
| Permission matrix | pro_admin vs pro_viewer | [OBSERVED — permissionMatrix.generated.ts] |
| Pro trial | 1 free Pro trip | [OBSERVED] |
| ForTeams | mailto only | [OBSERVED] |

### F. Mobile/PWA Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| iPad on bus | Calendar readable | [OBSERVED] |
| Player phone | Poll write on pro_viewer | [OBSERVED] — governance gap |
| Staff channel | Works | [OBSERVED] |

### G. Feature Table

| Feature | Rating | Label |
|---------|--------|-------|
| Roster/roles | 5 | [OBSERVED] |
| Sports category | 5 | [OBSERVED] |
| Compliance | 1 | [OBSERVED] — stub |
| Per-diem | 1 | [OBSERVED] |
| Schedule | 2 | [OBSERVED] |
| Calendar | 4 | [OBSERVED] |
| Broadcasts | 3 | [OBSERVED] |
| Tasks | 4 | [OBSERVED] |
| Polls governance | 3 | [OBSERVED] |
| Media | 3 | [OBSERVED] |
| ForTeams sales | 2 | [OBSERVED] |
| Invite | 5 | [OBSERVED] |
| Settlement | 1 | [OBSERVED] |
| AI | 2 | [SIMULATED RISK] |
| Mobile ops | 4 | [OBSERVED] |

### H. Emotional Reaction

Elena is **split** — loves roster/roles for athletics; cannot adopt without compliance substance.

> **[SYNTHETIC QUOTE]:** "My AD will ask one question: 'Does it pass compliance review?' Right now the answer is 'there's a tab for that' and that's a no."

### I. Conversion Scores

| Metric | Score |
|--------|-------|
| Activation | 6 |
| Invite | 6 |
| Day-7 retention | 4 |
| Paid conversion | 3 |
| Likelihood to use | 6 |
| **NPS** | **-20** |

### J. Top 5 Fixes

1. **Compliance MVP or hide tab** — `ProTabContent.tsx`
2. **Persist compliance/roster/schedule** — `tripConverter.ts` + migrations
3. **NCAA meal log export** — new pro feature or integration
4. **Pro Starter self-serve** — `ForTeams.tsx`
5. **Restrict pro_viewer poll write** — `permissionMatrix.generated.ts`

### K. Confidence & Beta Question

**Confidence:** High on compliance stub; medium on NCAA specifics.

**Real beta question:** "What compliance artifacts does your AD require for road travel — meal logs, rooming lists, or signed itineraries?"

---

## Persona 14 — Pat Sullivan (HS Athletic Director)

### A. Profile

| Field | Detail |
|-------|--------|
| **Name** | Pat Sullivan |
| **Age range** | 45–55 |
| **Segment** | Pro — HS athletic director, multi-team (~120 people across teams) |
| **Tech comfort** | Moderate |
| **Planning style** | Juggles volleyball, soccer, basketball same weekend |
| **Main pain points** | No multi-trip dashboard; notification firehose; scale |
| **Budget sensitivity** | School budget; needs district approval |
| **Platform** | Desktop-first |
| **Why adopt** | Pro categories for multiple sports |
| **Why reject** | No org-level multi-team view; notification scale |

### B. Jobs-to-be-Done

1. When **3 teams travel same weekend**, I want **one ops dashboard**, not three trips in a list.
2. When **sending district-wide update**, I want **broadcasts without melting DB**.
3. When **onboarding coaches**, I want **repeatable sports templates**.
4. When **parents ask schedules**, I want **shareable links per team**.
5. When **audit season hits**, I want **exportable records**.

### C. Screener Table

| Question | Pass? | Pat |
|----------|-------|-----|
| HS athletics AD? | Yes | ✅ |
| Multi-team? | Yes | ✅ |
| 50+ people? | Yes | ✅ 120 |
| District buyer? | Yes | ✅ |

### D. Full Survey (Persona Voice)

**Q: Biggest gap?**  
"I have four pro trips and no 'athletic department' view. I'm living in a trip list like a tourist."

**Q: Notifications?**  
"Every calendar entry pinged every parent. I turned notifications off."

**Q: Enterprise?**  
"I'd talk Enterprise if someone picks up the phone — not another mailto."

### E. Web Flow Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| Dashboard | Trip list only | [OBSERVED — Index.tsx] |
| Organizations | `/organizations` exists | [OBSERVED — App.tsx routes] |
| Multi-team | No unified AD view | [SIMULATED RISK] |
| Notification fanout | Sync INSERT blocks | [OBSERVED — NOTIFICATION_AUDIT.md] |
| Free trip cap | 3 active — insufficient | [OBSERVED] |
| Enterprise CTA | mailto | [OBSERVED — ForTeams.tsx:279] |

### F. Mobile/PWA Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| Coach mobile | Per-trip OK | [OBSERVED] |
| AD mobile | Needs desktop | [SIMULATED RISK] |
| Parent join | Same consumer_guest wall | [OBSERVED] |

### G. Feature Table

| Feature | Rating | Label |
|---------|--------|-------|
| Pro sports categories | 4 | [OBSERVED] |
| Multi-trip ops | 1 | [SIMULATED RISK] |
| Organizations | 3 | [OBSERVED] — immature |
| Broadcasts | 2 | [OBSERVED] — scale |
| Notifications | 2 | [OBSERVED] |
| Roster | 4 | [OBSERVED] |
| Calendar | 4 | [OBSERVED] |
| Invite | 4 | [OBSERVED] |
| Compliance | 1 | [OBSERVED] |
| ForTeams enterprise | 2 | [OBSERVED] |
| Tasks | 4 | [OBSERVED] |
| Parent experience | 2 | [OBSERVED] |
| Pricing/seats | 3 | [OBSERVED] |
| Media | 3 | [OBSERVED] |
| AI | 2 | [SIMULATED RISK] |

### H. Emotional Reaction

Pat is **overwhelmed-not-impressed** — individual team trips work; department-scale ops do not.

> **[SYNTHETIC QUOTE]:** "I don't need a prettier trip app. I need to see all my teams this Saturday on one screen without my phone exploding."

### I. Conversion Scores

| Metric | Score |
|--------|-------|
| Activation | 5 |
| Invite | 5 |
| Day-7 retention | 3 |
| Paid conversion | 2 |
| Likelihood to use | 5 |
| **NPS** | **-25** |

### J. Top 5 Fixes

1. **AD multi-trip dashboard** — org-level view component
2. **Async notification fanout** — DB triggers per NOTIFICATION_AUDIT.md
3. **Per-trip notification mute** — notification preferences
4. **Sports trip templates** — `CreateTripModal.tsx`
5. **Enterprise sales flow** — replace mailto with calendar booking + Stripe

### K. Confidence & Beta Question

**Confidence:** Medium.

**Real beta question:** "How many concurrent traveling teams do you manage on peak weekends, and what single view would replace your current spreadsheet?"

---

## Persona 15 — Riley Park (Touring Comedian Tour Manager)

### A. Profile

| Field | Detail |
|-------|--------|
| **Name** | Riley Park |
| **Age range** | 29–38 |
| **Segment** | Pro — touring comedy (12-person crew, 15-city run) |
| **Tech comfort** | High mobile; lives on phone night-of |
| **Planning style** | Venue changes night-of; day sheet is bible |
| **Main pain points** | No mobile day sheet; offline gaps; settlement stub |
| **Budget sensitivity** | $49–99/mo if reliable |
| **Platform** | iOS primary |
| **Why adopt** | Calendar + broadcasts for venue changes |
| **Why reject** | No day sheet view; offline; Pro logistics empty |

### B. Jobs-to-be-Done

1. When **load-in moves 2 hours**, I want **one broadcast + updated calendar**, so crew isn't scattered.
2. When **on cellular in basement green room**, I want **offline schedule cache**.
3. When **routing 15 cities**, I want **multi-city calendar**, not single basecamp.
4. When **settling per-diem with opener**, I want **structured settlement**.
5. When **new crew joins mid-tour**, I want **fast invite + role**.

### C. Screener Table

| Question | Pass? | Riley |
|----------|-------|-------|
| Tour manager? | Yes | ✅ |
| 10+ crew? | Yes | ✅ 12 |
| Night-of mobile? | Yes | ✅ |
| Pro features? | Yes | ✅ |

### D. Full Survey (Persona Voice)

**Q: Compared to Google Sheet day sheet?**  
"Sheet works offline. Your app looks better until venue WiFi dies."

**Q: Best moment?**  
"Broadcast that load-in moved — everyone in crew channel saw it. That part slaps."

**Q: Worst?**  
"No actual day sheet view. I'm scrolling calendar events like a tourist."

### E. Web Flow Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| Pro trip | Touring category available | [OBSERVED — proCategories.ts] |
| schedule field | Always `[]` real trips | [OBSERVED — tripConverter.ts:120] |
| Calendar | Usable as pseudo day sheet | [OBSERVED] |
| Broadcasts | Crew channel works | [OBSERVED] |
| Settlement | Stub | [OBSERVED — tripConverter.ts:128] |
| Demo tour | Mock has full schedule | [OBSERVED] — demo vs real gap |
| Smart Import | Could ingest routing PDFs | [OBSERVED] — paywall |

### F. Mobile/PWA Walkthrough

| Step | Finding | Label |
|------|---------|-------|
| iOS night-of | Calendar mobile OK | [OBSERVED] |
| Offline | PWA cache limited | [HYPOTHESIS] |
| Broadcast mobile | **Loves** speed | [OBSERVED] |
| Day sheet | Missing dedicated view | [SIMULATED RISK] |
| APPLE_IAP | Disabled | [OBSERVED] |
| Media | Tour photos | [OBSERVED] — likes |

### G. Feature Table

| Feature | Rating | Label |
|---------|--------|-------|
| Broadcasts | 5 | [OBSERVED] — **loves** |
| Calendar | 4 | [OBSERVED] |
| Day sheet | 1 | [OBSERVED] — stub |
| Mobile UX | 4 | [OBSERVED] |
| Offline | 2 | [HYPOTHESIS] |
| Multi-city | 2 | [SIMULATED RISK] |
| Settlement | 1 | [OBSERVED] |
| Role channels | 4 | [OBSERVED] |
| Smart Import | 4 | [OBSERVED] |
| Invite | 5 | [OBSERVED] |
| Pro sales | 2 | [OBSERVED] — mailto |
| Media | 4 | [OBSERVED] |
| Tasks | 4 | [OBSERVED] |
| Demo vs real | 2 | [OBSERVED] — gap |
| AI | 3 | [OBSERVED] |

### H. Emotional Reaction

Riley is **night-of positive, structurally skeptical** — broadcasts and mobile calendar carry the tour; missing day sheet and offline keep them on Sheets.

> **[SYNTHETIC QUOTE]:** "You get touring comedians at the broadcast button. Lose us at 'settlement coming soon' when I'm paying the opener in cash at 2 AM."

### I. Conversion Scores

| Metric | Score |
|--------|-------|
| Activation | 6 |
| Invite | 6 |
| Day-7 retention | 4 |
| Paid conversion | 3 |
| Likelihood to use | 6 |
| **NPS** | **-15** |

### J. Top 5 Fixes

1. **Day sheet view from calendar events** — pro schedule component
2. **Persist `schedule` in tripConverter** — `tripConverter.ts` + API
3. **Offline PWA itinerary cache** — service worker / trip data
4. **Settlement MVP for crew** — `ProTabContent.tsx`
5. **Touring Smart Import on Pro** — entitlements for pro trips

### K. Confidence & Beta Question

**Confidence:** Medium on night-of mobile; low on offline without device test.

**Real beta question:** "On show night, what % of crew checks the day sheet on paper/WhatsApp vs. an app — and would offline access change that?"

---

*End of Personas 1–15. Personas 16–30 continue in `30-persona-full-report-part2.md`.*

---

**Study date:** 2026-06-11 · **Method:** Code-grounded synthetic simulation (extends 10-persona study + personas 06–09)  
**Evidence base:** `docs/research/synthetic-user-testing/evidence/product-ground-truth.md`, live dev walkthrough notes, `src/` code review  
**Label key:** `[OBSERVED]` verified in UI/code/docs · `[SIMULATED RISK]` inferred friction · `[HYPOTHESIS]` needs live users

---

## Persona 16 — Devon Hayes (Music Artist Tour Manager, 25-City)

> Extends prior **08-touring-artist** (Dee Okafor, 5-city). Same evidence discipline; scaled to arena-level 25-stop run, 45-person party.

### A. Profile

- **Role:** Tour manager for a mid-tier arena act — 25 cities in 10 weeks, 45 traveling (artist camp, band, crew, security, merch, openers), plus per-city promoter contacts.
- **Age / tech:** 34–42; expert in Master Tour, Google Sheets, PDF day sheets. Phone-first 16+ hours/day.
- **Budget:** Low sensitivity — $99–199/mo is noise against tour P&L if it replaces PDF chaos. Zero tolerance for demo/reality gaps.
- **Why adopt:** One rolling home base per city, crew channels, schedule truth, settlement per stop.
- **Why reject:** No credible day sheet, stubbed settlement/per-diem, promoter privacy, offline gaps, `mailto:` Pro checkout.

### B. Jobs-to-be-Done

1. Model 25 cities as one run without 25 separate trips.
2. Push call-time changes that provably reach 45 people (bus call, soundcheck).
3. Scope promoter visibility (venue ops yes; artist hotel/settlement no).
4. Log per-city guarantee/backend/merch settlement for management.
5. Export a printable day sheet per city for greenroom and local crew.

### C. Full User Journey (16 steps)

| # | Step | Tried → Code → Friction → Verdict |
|---|------|-----------------------------------|
| 1 | Discovery | Lands on marketing hero "The Group Chat Travel App" [`HeroSection.tsx:57`] → reads vacation-first → **skeptical** `[SIMULATED RISK]` |
| 2 | Sign-up | Google OAuth + skippable 9-screen carousel `[ground-truth §3]` → skips; no touring onboarding → **mechanical pass** |
| 3 | Pro trip (Touring) | Creates Pro Touring trip; gated Frequent Chraveler+ with 1 free trial `[ground-truth §4]`; roles `Artist Team/Tour Manager/Crew/VIP/Security` `[proCategories.ts:36]` → single `location` string for 25 cities → **creates one trip, fights the model** `[OBSERVED]` |
| 4 | Invite 45 + promoters | Invite link + approval + usage presets 10/25/50/custom up to 1000 [`InviteModal.tsx:20-37`, `useInviteLink.ts:188-203`] → no field-level privacy for promoters as `pro_viewer` → **invites crew, excludes promoters** `[SIMULATED RISK]` |
| 5 | 25-city schedule | **Multi-basecamp works:** `resolveCurrentBaseCamp` rolls by date/timezone [`baseCamps.ts:28-54`]; `ProSchedule` load-in/show types exist in types only, empty on real trips [`tripConverter.ts:117-130`] → **modelable but flat calendar** `[OBSERVED]` |
| 6 | Concierge | 38 tools, basecamp context; voice = dictation-only [`ground-truth §10.2`] → useful near-venue, not schedule truth → **nice-to-have** |
| 7 | Places/Basecamp | 25 dated basecamps = genuine fit → **strongest touring feature** `[OBSERVED]` |
| 8 | Polls | Full polls; offline vote fails fast [`useTripPolls.ts:174`] → irrelevant to core job |
| 9 | Tasks | Multi-assign individuals only; no role-assign → **adequate at 45 people** |
| 10 | Per-diem/settlement | Typed `PerDiemData`/`SettlementData` [`pro.ts:140-165`]; hardcoded empty [`tripConverter.ts:117-130`] → **demo-bait; trust break** `[OBSERVED]` |
| 11 | Media | Grid/lightbox works; storage quotas advisory-only, no signed URLs `[ground-truth §10.7]` → **privacy concern for talent** |
| 12 | Chat/role channels | Stream + per-role channels `[ground-truth §6]` → **real value vs iMessage** |
| 13 | Broadcasts | Priority broadcasts exist; role targeting cosmetic; aggregate read counts only `[ground-truth §6; persona 3 prior verification]` → **cannot prove bus-call receipt** |
| 14 | Day sheet | PDF export date-range filter [`ExportDialog.tsx:37-58`]; branded "ChravelApp Recap — The Group Chat Travel App" [`exportPdfClient.ts:1062-1064`]; no load-in semantics in UI → **adoption kill shot** `[OBSERVED]` |
| 15 | Mid-tour updates | Online calendar realtime OK; `offlineQueue` dead code [`concurrencyUtils.ts:238`]; mutations fail offline → **venue-basement risk** `[HYPOTHESIS]` |
| 16 | Pay/upgrade | Growth $99/mo sells Logistics; Pro CTAs `mailto:` `[ground-truth §7]` → **willing buyer cannot convert** |

### D. Feature-by-Feature Findings

| Feature | Outcome | Severity | Evidence |
|---------|---------|----------|----------|
| Multi-basecamp (25 cities) | ✅ Works | Low positive | `baseCamps.ts:28-54` |
| Pro schedule / settlement | ❌ Stub on real trips | Critical | `tripConverter.ts:117-130` |
| Day sheet export | ❌ Generic recap PDF | Critical | `exportPdfClient.ts:1062-1064` |
| Broadcast receipts | 🟡 Aggregate only | High | `pro.ts:302-310` |
| Promoter privacy | ❌ Missing | High | `permissionMatrix` + `pro.ts:42-59` mock-only |
| Pro purchase | ❌ mailto | Critical | `ground-truth §7` |

### E. Emotional Reaction

**Impressed** by dated multi-basecamps and role channels. **Confused** why Beyoncé demo shows settlement sheets his trip cannot store. **Annoyed** by alphabetized PDF branding on a promoter handoff. **Would abandon** first time he needs a credible Thursday day sheet — likely week 1. **Would run a tour on it?** Comms + routing layer only, not system of record `[SIMULATED RISK]`.

### F. Conversion Scores

| Metric | Score | Notes |
|--------|-------|-------|
| Activation | 5/10 | Trip + basecamps + calendar work; ops layer breaks |
| Invite | 6/10 | Crew yes; promoters no (privacy) |
| Day-7 retention | 3/10 | Day-sheet + broadcast gaps under pressure |
| Paid conversion | 2/10 | Growth features stubbed; mailto checkout |
| NPS | −40 | Demo/reality gap on settlement |

**WTP:** $99–149/mo if day sheet + per-recipient broadcast + real settlement CRUD. **Best SKU:** Pro Growth self-serve (not mailto).

### G. Top 5 Fixes

1. Per-day **Day Sheet** export template (venue header, chronological call times, neutral branding) — failed at greenroom handoff.
2. Honest **role-scoped broadcast fanout + per-recipient read receipts** — failed at bus-call proof.
3. Ship minimal **settlement/per-diem CRUD** or remove from demo — failed at Denver settlement logging.
4. **Per-item role allowlists** on calendar/basecamps — failed at promoter invite.
5. **Self-serve Pro Growth checkout** — failed at mid-tour purchase (`mailto:`).

### H. Representative Quotes

> [SYNTHETIC QUOTE] "The basecamps actually roll city to city — someone on your team gets routing. But I opened Settlement and it's empty while your demo tour has numbers. That's not a bug, that's a lie."

> [SYNTHETIC QUOTE] "I need a day sheet, not a 'Group Chat Travel App Recap' sorted alphabetically. My promoter will laugh me out of the building."

> [SYNTHETIC QUOTE] "I'm on a bus with a company card and your buy button opens Gmail. Who ships B2B like that?"

### I. Web vs Mobile

- **Desktop:** Preferred for advancing and bulk calendar entry; trip export modal accessible [`TripExportModal` in `EventDetail.tsx` pattern].
- **Mobile:** Required on show day; `MobileTripDetail.tsx` exposes trip options; per-trip mute behind `per_trip_notification_mute` feature flag [`MobileTripDetail.tsx:71-72`] — **not default-on** `[OBSERVED]`.
- **Gap:** Day-sheet PDF generation is desktop-weighted; no offline read cache verified `[HYPOTHESIS]`.

### J. Real Beta Validation Questions

1. Can you produce tonight's call-time sheet on your phone in under 2 minutes and hand it to a local promoter?
2. After a bus-call broadcast, can you name who has not acknowledged it?
3. Would you log a real settlement figure in-app, or keep it in email?

### K. Persona Verdict

**Segment fit:** Pro Touring — **partial** (basecamps + channels yes; ops layer no). **Revenue path blocked** by stubbed Growth features and mailto. **Priority:** P0 day sheet + settlement reality or strip demo ops.

---

## Persona 17 — Sofia Marchetti (Film Shoot Production Coordinator)

### A. Profile

- **Role:** Production coordinator, 6-week location shoot, ~80 cast/crew (Talent/Crew/Security roles per Productions category [`proCategories.ts:122-152`]).
- **Age / tech:** 28–36; StudioBinder, call sheets in PDF, walkie culture. Desktop-first; phone on set.
- **Budget:** Client-billable; $99+/mo pass-through if it replaces call-sheet email chaos.
- **Why adopt:** One call sheet distribution surface, role channels (camera/hair/background), schedule updates.
- **Why reject:** No call-sheet export, notification scale risk, stubbed Pro ops on real trips.

### B. Jobs-to-be-Done

1. Distribute daily call sheet (call times, locations, parking, contacts) to 80 people by 6 AM.
2. Update scene moves in real time when weather slips.
3. Keep talent contacts separate from background visibility where possible.
4. Collect on-set photos for marketing unit.
5. Bill client for coordination tool as line item.

### C. Full User Journey (16 steps)

| # | Step | Verdict summary |
|---|------|-----------------|
| 1 | Discovery via `/teams` or peer | Productions category exists [`proCategories.ts:122`] but marketing tour-first → curious `[SIMULATED RISK]` |
| 2 | Sign-up | Standard auth; skips carousel → OK |
| 3 | Pro Productions trip | Roles Talent/Crew/Security seeded; `tripConverter` empties roster/schedule on real trips → **Team tab hollow** `[OBSERVED]` |
| 4 | Invite 80 | Usage limit presets available [`InviteModal.tsx:20-37`]; approval queue chair-only on Pro/Event → **bottleneck** `[SIMULATED RISK]` |
| 5 | Call sheet as calendar | Flat events; no "call sheet" template; `ProSchedule` types unused in UI → **workaround only** |
| 6 | Concierge | Location lookups near basecamp OK; not call-sheet authority |
| 7 | Basecamp | Shoot location + crew hotel as dated camps → works |
| 8 | Polls | Lunch preference etc. — fine, not core |
| 9 | Tasks | "Lock street by 7 AM" assignable → works |
| 10 | Payments | Crew meal splits via Venmo model — wrong abstraction for production accounting |
| 11 | Media | On-set stills hub → **positive**; unsigned URLs concern for talent |
| 12 | Chat | Role channels map to departments → **positive if roles wired** |
| 13 | Broadcasts | "Schedule moved 30 min" — fanout blocks INSERT at scale for 80+ [`ground-truth §10.4`] → **risk** |
| 14 | Call sheet export | PDF = generic trip recap, not production call sheet → **fail** |
| 15 | Weather delay update | Online edit OK; offline on location unverified |
| 16 | Pay | Client won't pay via `mailto:` Pro CTA |

### D. Feature-by-Feature Findings

| Feature | Verdict | Severity |
|---------|---------|----------|
| Productions category + roles | 🟡 Label fit; data empty on real trips | Critical |
| Call sheet / day sheet export | ❌ Missing template | Critical |
| Broadcasts at 80 people | 🟠 Fanout INSERT risk | High |
| Role channels | ✅ If roster populated | Medium positive |
| Smart Import | ✅ Confirmations → calendar | Medium positive |

### E. Emotional Reaction

**Impressed** by invite preview and department-shaped role labels. **Frustrated** that StudioBinder export shape doesn't exist. **Would adopt partially** for crew chat + media; **would not** replace call sheets. Mixed — better than pure group text, not a production tool `[SIMULATED RISK]`.

### F. Conversion Scores

Activation 5 · Invite 6 · Day-7 3 · Paid 3 · NPS −20. **WTP:** Client-billable one-off ~$150/shoot if call-sheet export + reliable broadcasts.

### G. Top 5 Fixes

1. **Call sheet PDF template** (crew call, scenes, locations, contacts, parking).
2. **Wire roster/schedule to DB** — stop empty `tripConverter` arrays.
3. **Async notification fanout** — 80-person shoot must not block writes.
4. **Bulk join approval** for background cast.
5. **Self-serve Pro invoice-friendly checkout** (not mailto).

### H. Representative Quotes

> [SYNTHETIC QUOTE] "I don't need another group chat. I need a call sheet at 5:45 AM that 80 people can open without calling me."

> [SYNTHETIC QUOTE] "Your Productions category speaks my language until I open Team and it's empty. Did I miss a step or is the product missing?"

> [SYNTHETIC QUOTE] "If a weather delay broadcast hangs the database with 80 people on set, we're back to walkies only."

### I. Web vs Mobile

- **Desktop:** Call sheet building and bulk calendar edits — primary surface.
- **Mobile:** Crew consumption on set; responsive trip tabs exist [`MobileTripDetail.tsx`].
- **Friction:** Export and Smart Import review easier on desktop; mobile chat usable but small-screen calendar dense `[SIMULATED RISK]`.

### J. Real Beta Validation Questions

1. Replace one morning's PDF call sheet with Chravel for a single shoot day — what breaks?
2. Time to onboard 20 background actors via invite link during breakfast?
3. Does a schedule-change broadcast arrive before the crew bus leaves?

### K. Persona Verdict

**Segment fit:** Pro Productions — **weak today** (missing call-sheet artifact). **Highest leverage:** export template + notification scale. **Mixed recommendation** to peers until ops layer is real.

---

## Persona 18 — Alex Rivera (Corporate 150-Person Offsite)

> Extends **09-corporate-offsite** (Dana Okafor, 25-person). Same B2B fractures at enterprise scale.

### A. Profile

- **Role:** Head of People Ops, Fortune 500 division — 3-day Austin offsite, 150 employees, mixed remote/hybrid.
- **Tech / budget:** High; procurement scrutiny. Company card for $5k+ annual tools; **no sales call for <$10k** one-off.
- **Why adopt:** Single agenda link, anonymous polls, task delegation, photo pool.
- **Why reject:** No reimbursement model, orgs don't own trips, monthly seat sub for one event, mailto checkout, Slack integration vaporware.

### B. Jobs-to-be-Done

1. One link replacing Notion agenda + Slack #offsite + flight spreadsheet.
2. Parallel breakout sessions on agenda without confusion.
3. Company-paid dinners + employee fronted Ubers → finance-ready expense record.
4. Agenda in employees' Google Calendars.
5. Post-event photo archive for internal comms.

### C. Full User Journey (16 steps)

| # | Key finding | Evidence |
|---|-------------|----------|
| 1 | `/teams` promises Slack/QuickBooks; all CTAs `mailto:` | `ForTeams.tsx` [persona 09 verified] |
| 2 | Google OAuth OK; no SSO/SCIM | `ground-truth §3` |
| 3 | **Event trip** fits 150 better than Pro Work (`roles: []`) | `proCategories.ts:86`, `CreateTripModal` |
| 4 | Invite link in Slack; no bulk/domain invite; account wall | `ground-truth §5` |
| 5 | Flat calendar — overlapping breakouts unreadable | `[SIMULATED RISK]` |
| 6 | Concierge useful for group dinner venues | `ground-truth §6` |
| 7 | Basecamp = hotel — clean | `ground-truth §6` |
| 8 | Anonymous polls — **win** for workplace | `ground-truth §6` |
| 9 | Person-level tasks work; role layer empty on real Pro | `tripConverter.ts:117-130` |
| 10 | **Payments hard fail** — no reimburse concept; Venmo splits | grep `reimburs` → 0 matches [persona 09] |
| 11 | Media pool good; 500 MB free advisory-only | `ground-truth §7, §10.7` |
| 12 | Chat vs Slack — split brain without webhook bridge | no Slack in `src/` |
| 13 | Notifications: no batching; 150-person fanout risk | `ground-truth §10.4` |
| 14 | GCal sync + PDF export Explorer+ per-user | `ground-truth §7` |
| 15 | No trip template for next year; data on Alex's personal account | `[SIMULATED RISK]` |
| 16 | **Cannot pay** — mailto; org has no `organization_id` on `trips` | `types.ts:4396-4427` |

### D. Feature-by-Feature Findings

| Feature | Verdict | Severity |
|---------|---------|----------|
| Event at 150 | 🟡 Works mechanically; cap labels unenforced | Medium |
| Reimbursement / company payer | ❌ Missing | Critical |
| Organizations → trips | ❌ Disconnected | Critical |
| Self-serve purchase | ❌ mailto | Critical |
| Polls (anonymous) | ✅ Strong | Low positive |
| GCal distribution | 🟠 Per-user paywall | High |

### E. Emotional Reaction

**Initially hopeful** from `/teams` copy. **Impressed** by Smart Import + Basecamp moment. **Embarrassed** showing Venmo splits to VPs. **Abandons as company tool** at payments step; might keep personal agenda `[SIMULATED RISK]`.

### F. Conversion Scores

Activation 5 · Invite 6 · Day-7 3 · Paid 2 · NPS −25. **WTP:** One-off **Offsite Pass $99–199** / 50–200 seats / 30 days — not $49/mo seats.

### G. Top 5 Fixes

1. **Offsite Pass** SKU with self-serve Stripe (reuse Trip Pass rails).
2. **Company payer + CSV expense export** (reimbursement model).
3. **`organization_id` on trips** or hide `/organizations`.
4. **Organizer-paid GCal sync** for all attendees.
5. Remove unbuilt **Slack/QuickBooks** claims from `/teams`.

### H. Representative Quotes

> [SYNTHETIC QUOTE] "I clicked Start 14-Day Trial and Outlook opened an email to support. My procurement team thought it was phishing."

> [SYNTHETIC QUOTE] "You want my employees to Venmo each other for a company offsite? I'm not showing this to finance."

> [SYNTHETIC QUOTE] "The anonymous dinner poll actually worked — my juniors voted for BBQ without politics. That part I'd steal."

### I. Web vs Mobile

- **Desktop:** Agenda build, Smart Import, export — Alex's primary mode.
- **Mobile:** Employees consume agenda on phones; `MobileEventDetail` path exists.
- **Gap:** Organizer distribution (PDF/GCal) paywalled per-user; mobile employees hit consumer upsells `[SIMULATED RISK]`.

### J. Real Beta Validation Questions

1. Can finance reconcile offsite spend from a Chravel export without Venmo?
2. What % of 150 employees complete account creation from one Slack link?
3. Would you pay $149 once for this event if checkout were instant?

### K. Persona Verdict

**Segment fit:** Events/B2B — **poor today** despite feature breadth. **Blockers:** payments model + purchasability + org ownership. **Polls/Basecamp** are bright spots.

---

## Persona 19 — Claire Nguyen (Executive Assistant, Confidential Travel)

### A. Profile

- **Role:** EA to C-suite executive — discreet 4-day international trip for principal + spouse + 2 security, 8 total travelers.
- **Age / tech:** 30–45; expert in Concur, Amex GBT, encrypted email. Desktop-first; mobile for on-the-go changes.
- **Budget:** Enterprise procurement; security review mandatory. Price irrelevant if trust passes.
- **Why adopt:** Role-scoped channels, itinerary in one place, Smart Import of confirmations.
- **Why reject:** Unsigned media URLs, wildcard CORS on edge functions, no field-level privacy, consumer branding on exports, hardcoded anon key fallback.

### B. Jobs-to-be-Done

1. Keep principal's hotel/flight details visible to security team only.
2. Distribute sanitized itinerary to principal without chat noise.
3. Update gate changes in minutes without email chains.
4. Store passport copies and VIP preferences securely.
5. Produce client-ready PDF without "Group Chat Travel App" footer.

### C. Full User Journey (16 steps)

| # | Finding | Evidence |
|---|---------|----------|
| 1 | Landing reads consumer luxury, not executive | `HeroSection.tsx:57` |
| 2 | Google sign-up OK; no enterprise SSO | `ground-truth §3` |
| 3 | Pro Work trip (`roles: []`) or consumer — neither models security roles | `proCategories.ts:86` |
| 4 | Invite security + principal; **consumer_guest has zero access** | `permissionMatrix` `ground-truth §8` |
| 5 | Calendar holds full detail; **no per-event role visibility** | `pro.ts:42-59` mock-only |
| 6 | Concierge helpful for restaurant holds; AI writes need confirm card | `ground-truth §6` |
| 7 | Basecamp = principal hotel; visible trip-wide | `[SIMULATED RISK]` |
| 8 | Polls irrelevant | — |
| 9 | Tasks for visa deadlines — works | `ground-truth §6` |
| 10 | Payments N/A (corporate cards) | — |
| 11 | **Media passport uploads** — bucket not signed-URL enforced | `ground-truth §10.7` |
| 12 | Role channels could separate security vs principal — if roles assigned | `ground-truth §6` |
| 13 | Broadcasts for gate change — no per-recipient ack | prior persona verification |
| 14 | PDF export branded consumer; Explorer+ gate | `exportPdfClient.ts`, `ground-truth §7` |
| 15 | Security team asks for SOC2/DPA — not surfaced in-app | `[HYPOTHESIS]` |
| 16 | Enterprise tier mailto only | `ground-truth §7` |

### D. Feature-by-Feature Findings

| Feature | Verdict | Severity |
|---------|---------|----------|
| Field-level privacy | ❌ Missing | Critical (EA) |
| Media signed URLs | ❌ Advisory quotas only | Critical |
| White-label export | ❌ Consumer branding | High |
| Role channels | 🟡 Potential | Medium |
| Security posture docs | ❌ Not in-product | High (procurement) |

### E. Emotional Reaction

**Cautiously interested** in Smart Import + itinerary view. **Alarmed** by media storage posture and consumer PDF branding. **Would not** put principal's passport in Media without enterprise security pack. **Mixed** — personal EA might use consumer trip quietly; corporate IT would block `[SIMULATED RISK]`.

### F. Conversion Scores

Activation 6 · Invite 5 · Day-7 4 · Paid 2 · NPS −15. **WTP:** Enterprise custom with security pack + signed URLs + branded export.

### G. Top 5 Fixes

1. **Signed URLs + encryption posture** on media bucket.
2. **Per-item visibility** (roles allowlist) on events/basecamps.
3. **Neutral / white-label PDF** export.
4. **Security trust center** link in settings (SOC2, DPA).
5. **Private channel** default for executive trips.

### H. Representative Quotes

> [SYNTHETIC QUOTE] "I can't upload a passport scan to a bucket that doesn't enforce signed URLs. My principal's name isn't going in your photo grid."

> [SYNTHETIC QUOTE] "The security detail needs the hotel address. The principal's assistant does not need the security detail's room numbers. Your app shows everyone everything."

> [SYNTHETIC QUOTE] "If the PDF footer says 'Group Chat Travel App,' I can't hand it to a board member."

### I. Web vs Mobile

- **Desktop:** Claire's control center for itinerary edits and exports.
- **Mobile:** Gate-change edits on the move; principal may view read-only on phone.
- **Gap:** Security reviewers never see mobile-only assurances; desktop export is where branding fails `[OBSERVED]`.

### J. Real Beta Validation Questions

1. Would your IT security team approve media uploads for passport images today?
2. Can you hide the principal's hotel from non-security members?
3. What branding would be acceptable on an itinerary PDF sent to the principal?

### K. Persona Verdict

**Segment fit:** Pro/Enterprise confidential — **blocked by security + privacy gaps**. Feature depth exists; **trust layer missing**. Not launch-ready for executive travel without media + visibility fixes.

---

## Persona 20 — Helena Cross (Travel Concierge Company, Multi-Client)

### A. Profile

- **Role:** Owner, boutique concierge agency — 6 simultaneous client trips (2–8 travelers each), white-label expectation.
- **Age / tech:** 38–50; Travefy, Google Docs, WhatsApp with clients. Desktop-heavy.
- **Budget:** Would pay $200–500/mo agency plan if multi-client + branding.
- **Why adopt:** Smart Import, AI concierge, places, export to clients.
- **Why reject:** No client workspaces, no multi-tenant dashboard, consumer tiers, Chravel branding on ICS/PDF.

### B. Jobs-to-be-Done

1. Run 6 client trips without cross-contamination of chat/media.
2. Import confirmations into each client's itinerary fast.
3. Send client-facing PDF without Chravel marketing.
4. Reuse Provence template for repeat clients.
5. Bill clients per-trip coordination fee.

### C. Full User Journey (16 steps)

| # | Finding | Evidence |
|---|---------|----------|
| 1 | Marketing allows "organizing a group" broadly | `HeroSection.tsx:69` — not agency-specific |
| 2 | One account, multiple consumer trips — **3 active cap** | `tripService.ts:191`, `ground-truth §7` |
| 3 | No "workspace per client" — trips are flat on dashboard | `[OBSERVED absence]` |
| 4 | Per-client invite links work | `ground-truth §5` |
| 5 | Smart Import + concierge — **strongest pro moment** | `ground-truth §6` |
| 6 | Concierge 10 queries/user/trip on free tier | `ground-truth §7` |
| 7 | Multi-basecamp for multi-city clients | `baseCamps.ts` |
| 8 | Polls for client couples — fine | — |
| 9 | Tasks per client — works | — |
| 10 | Payments irrelevant (invoices clients separately) | — |
| 11 | Media per trip — OK at small groups | — |
| 12 | Chat per trip — OK; no agency inbox | — |
| 13 | Notifications across 6 trips — no global digest | `ground-truth §10.4` |
| 14 | PDF export; ICS titles prefixed `ChravelApp:` | `icsBranding.test.ts` |
| 15 | UpgradeModal mentions white-label on Enterprise | `UpgradeModal.tsx:346` — not self-serve |
| 16 | Hits 3-trip cap with 4th client — archive churn | `TRIP_LIMIT_REACHED` |

### D. Feature-by-Feature Findings

| Feature | Verdict | Severity |
|---------|---------|----------|
| Multi-client workspaces | ❌ Missing | Critical (agency) |
| 3 active trip cap | ❌ Wrong for agency | High |
| Smart Import + concierge | ✅ Strong | Positive |
| White-label export/ICS | ❌ Chravel branded | High |
| Trip template/duplicate | 🟡 Partial (activities only) | Medium |

### E. Emotional Reaction

**Impressed** by Smart Import speed and concierge confirm cards. **Frustrated** by trip cap and branding on deliverables. **Would use** for 2–3 clients on free tier as shadow tool; **would pay** for agency SKU with workspaces + white-label. Most positive NPS in this batch among pros `[persona-matrix: 0]`.

### F. Conversion Scores

Activation 6 · Invite 5 · Day-7 5 · Paid 4 · NPS 0. **WTP:** White-label agency plan $200–400/mo.

### G. Top 5 Fixes

1. **Client workspaces** (foldered trips, separate branding).
2. **White-label PDF + ICS** (remove `ChravelApp:` prefix option).
3. **Agency tier** — unlimited active trips / pooled AI quota.
4. **Trip duplicate/template** from prior client trip.
5. Self-serve agency checkout.

### H. Representative Quotes

> [SYNTHETIC QUOTE] "Smart Import just saved me twenty minutes on a client's hotel confirmation. Then the calendar export says ChravelApp on every event. I can't send that to a client paying me for discretion."

> [SYNTHETIC QUOTE] "I'm juggling six families and your free plan lets me keep three trips open. I archive trips for living — that's not an agency workflow."

> [SYNTHETIC QUOTE] "I'd pay real money for client workspaces. I'd pay zero for another consumer subscription with gold buttons."

### I. Web vs Mobile

- **Desktop:** Helena's daily driver — Smart Import, multi-trip switching, export.
- **Mobile:** Client updates on the go; usable but not primary.
- **Gap:** Trip cap error on desktop blocks agency workflow before mobile matters.

### J. Real Beta Validation Questions

1. How many simultaneous client trips do you run, and where does a 3-trip cap bite?
2. Would you send a Chravel-branded PDF to a paying client as-is?
3. What would a $299/mo agency plan need to include to switch from Travefy?

### K. Persona Verdict

**Segment fit:** Pro agency — **best raw feature fit** (import + concierge) **worst commercial fit** (cap + branding). Highest upside if multi-tenant ships.

---

## Persona 21 — Vanessa Ortiz (Wedding Planner, Multi-Vendor)

### A. Profile

- **Role:** Independent wedding planner — 200-guest destination weekend; coordinates couple, 12 vendors, wedding party.
- **Age / tech:** 29–38; Aisle Planner, Google Sheets, email threads. Mixed mobile/desktop.
- **Budget:** Client-billable; Event pass ~$75–150 acceptable if guest comms work.
- **Why adopt:** Tasks + calendar + guest broadcasts + media for couple.
- **Why reject:** No vendor role type, guest account wall, false attendee cap copy, celebrations category has `roles: []`.

### B. Jobs-to-be-Done

1. Centralize vendor deadlines (florist delivery, DJ setup, shuttle times).
2. Broadcast timeline changes to wedding party without SMS blast.
3. Give guests weekend schedule without building a full wedding website.
4. Collect guest photos in one pool for the couple.
5. Keep vendor contact info task-visible, not guest-visible.

### C. Full User Journey (16 steps)

| # | Finding | Evidence |
|---|---------|----------|
| 1 | Celebrations category exists | `proCategories.ts:155-183` |
| 2 | **Event trip** better for 200 guests; 3 lifetime free events | `ground-truth §4` |
| 3 | Attendee cap labels in billing **not enforced** | `billing/config.ts:87-89` |
| 4 | Invites — guests need accounts; guest role useless | `ground-truth §8` |
| 5 | Vendor tasks assignable by person — no Vendor role | `roles: []` celebrations |
| 6 | Concierge for local vendors/restaurants | `ground-truth §6` |
| 7 | Places for venue + hotels | works |
| 8 | Polls for brunch vs beach — works | works |
| 9 | Tasks with due dates — **core planner win** | `ground-truth §6` |
| 10 | Payments — couple pays vendors off-platform | splits irrelevant |
| 11 | Media — guest photo hub **strong** | `ground-truth §6` |
| 12 | Chat — vendors + party; risk of guest noise | — |
| 13 | Broadcasts for "shuttle leaves 4 PM" | scale OK at 200? fanout risk `[ground-truth §10.4]` |
| 14 | Agenda for guests — Event agenda tabs | `EventDetail.tsx`, `EnhancedAgendaTab.tsx` |
| 15 | Post-wedding archive for couple | trips archive |
| 16 | Trip Pass / Event pricing; cap copy scares at 200 | `billing/config.ts` comment |

### D. Feature-by-Feature Findings

| Feature | Verdict | Severity |
|---------|---------|----------|
| Tasks + calendar | ✅ Strong | Positive |
| Vendor role / visibility | ❌ Missing | High |
| Guest join friction | 🟠 Account required | Medium |
| Attendee cap marketing | 🟡 Misleading label | Medium |
| Media hub | ✅ Strong | Positive |
| Broadcasts at 200 | 🟠 Scale risk | Medium |

### E. Emotional Reaction

**Delighted** by tasks board and guest media loop. **Annoyed** that guests ask "why do I need an account for the shuttle time?" **Would recommend** to colleague planners for task/media layer; **not** as wedding website replacement. **Most positive consumer-adjacent score in batch** (NPS +5) `[persona-matrix]`.

### F. Conversion Scores

Activation 6 · Invite 5 · Day-7 5 · Paid 4 · NPS +5. **WTP:** Client-billable Event/Trip Pass $74.99–99.

### G. Top 5 Fixes

1. **Vendor role** with task-only visibility (not guest chat).
2. **Guest read-only itinerary** without full account (or lighter join).
3. Remove/fix **unenforced attendee cap** marketing copy.
4. **Wedding weekend Pass** SKU at event creation.
5. Broadcast scale test at 200+.

### H. Representative Quotes

> [SYNTHETIC QUOTE] "My florist doesn't need access to the guest photo wall. My guests don't need to see the florist's cell in tasks. Give me vendor lanes."

> [SYNTHETIC QUOTE] "The task board is better than the spreadsheet I've used for twelve years. I'd actually bill the couple for that piece."

> [SYNTHETIC QUOTE] "A guest texted me: 'Why am I creating a Chravel account to see when the shuttle leaves?' I didn't have a good answer."

### I. Web vs Mobile

- **Desktop:** Vanessa builds vendor task board and timeline.
- **Mobile:** Wedding party + guests on phones during weekend; Event mobile path [`MobileEventDetail`].
- **Gap:** Guest onboarding friction worse on mobile (email verify mid-venue) `[SIMULATED RISK]`.

### J. Real Beta Validation Questions

1. Can vendors complete their task list without seeing guest chat?
2. What % of 200 guests create accounts from one invite link?
3. Does "100 attendees" pricing copy stop you from recommending the product?

### K. Persona Verdict

**Segment fit:** Events/Celebrations — **good partial fit** (tasks, media, agenda). **Vendor + guest lanes** are the gap. **Willing payer** if pass is client-billable and guest friction drops.

---

## Persona 22 — Dr. Alan Pierce (1000-Person Conference Organizer)

### A. Profile

- **Role:** Program chair, annual industry conference — 1000 attendees, 3 days, multi-track agenda.
- **Age / tech:** 45–60; Cvent/Eventbrite veteran, skeptical of consumer tools.
- **Budget:** Enterprise; needs SLA, scale proof, sales relationship.
- **Why adopt:** RSVP, agenda, broadcasts, attendee roles in Events module.
- **Why reject:** Notification fanout blocks INSERT, no hot-trip isolation, broadcast reliability unproven at 1k.

### B. Jobs-to-be-Done

1. Push session room changes to all attendees in <60 seconds.
2. Multi-track agenda browsable by attendees.
3. Reliable RSVP + check-in story (even if lightweight).
4. Sponsor/exhibitor comms channel.
5. Post-conference photo/media archive.

### C. Full User Journey (16 steps)

| # | Finding | Evidence |
|---|---------|----------|
| 1 | Events module exists | `EventDetail.tsx`, `ground-truth §6` |
| 2 | Free tier 3 lifetime events | `entitlements.ts:296-302` |
| 3 | Create Event with timezone selector | `CreateTripModal.tsx:210-211, 613-615` |
| 4 | Invite 1000 — usage limit max 1000 preset | `InviteModal.tsx:23` |
| 5 | **Attendee caps not enforced on join** | `billing/config.ts:87-89` |
| 6 | Enhanced agenda / lineup components | `EnhancedAgendaTab.tsx`, `useEventLineup.ts` |
| 7 | Basecamp = convention center | works |
| 8 | Polls for lunch feedback — OK | — |
| 9 | Tasks for volunteer staff | works |
| 10 | Payments irrelevant | — |
| 11 | Media for attendee photos — storage/quota risk at scale | `ground-truth §10.7` |
| 12 | Chat at 1000 — unrealistic; broadcasts are the channel | — |
| 13 | **Notification fanout blocks INSERT** — 1000 members → thousands of rows sync | `ground-truth §10.4` |
| 14 | No hot-trip realtime isolation | `ground-truth §10.5` |
| 15 | Enterprise features mailto | `ground-truth §7` |
| 16 | Would require sales + SLA — self-serve insufficient | `[SIMULATED RISK]` |

### D. Feature-by-Feature Findings

| Feature | Verdict | Severity |
|---------|---------|----------|
| Events agenda UI | 🟡 Exists | Medium positive |
| Scale / notifications | ❌ Known architecture risk | Critical |
| Broadcast reliability | ❌ Unproven at 1k | Critical |
| Attendee cap enforcement | 🟡 Not enforced | Medium (honesty) |
| Chat at 1000 | ❌ Wrong tool | — |

### E. Emotional Reaction

**Skeptical from minute one** — tool reads friend-group travel. **Briefly interested** in agenda tab depth. **Alarmed** reading notification audit implications for 1000-person broadcast. **Would not pilot** without engineering scale review. **Hard no** for self-serve `[SIMULATED RISK]`.

### F. Conversion Scores

Activation 4 · Invite 5 · Day-7 2 · Paid 2 · NPS −30. **WTP:** Enterprise custom with SLA — not listed self-serve price.

### G. Top 5 Fixes

1. **Async notification fanout** + load test at 1k members.
2. **Hot-trip isolation** on realtime channels.
3. **Broadcast-only mode** for large events (disable chat default).
4. Honest **scale limits** in Event creation UX.
5. Enterprise **sales-led** onboarding with architecture doc.

### H. Representative Quotes

> [SYNTHETIC QUOTE] "I don't need chat for a thousand people. I need one room-change announcement that doesn't take down your database."

> [SYNTHETIC QUOTE] "Your pricing page mentions attendee caps that your own code says aren't enforced. That tells me you're not ready for my conference."

> [SYNTHETIC QUOTE] "Call me when you have a load test report, not when you have a gold onboarding carousel."

### I. Web vs Mobile

- **Desktop:** Alan builds multi-track agenda; primary organizer surface.
- **Mobile:** Attendee consumption — critical at conference scale.
- **Gap:** Scale failures are backend — platform-agnostic; mobile push storm compounds fanout `[OBSERVED §10.4]`.

### J. Real Beta Validation Questions

1. Load test: broadcast to 1000 members — p95 delivery time and DB impact?
2. Would you run a 200-person pilot before committing the full conference?
3. What SLA language would procurement require?

### K. Persona Verdict

**Segment fit:** Events at scale — **do not sell today**. Agenda UI is not the bottleneck; **notification/realtime architecture** is. Deprioritize until scale fixes ship.

---

## Persona 23 — Zoe Martinez (Music Festival Group Lead)

### A. Profile

- **Role:** Informal lead for 15 friends — 4-day festival (camping + hotels), split lodging, meetup points.
- **Age / tech:** 24–32; iOS-first; Splitwise, iMessage, Instagram.
- **Budget:** Trip Pass mindset ($39.99) for one festival; hates subscriptions.
- **Why adopt:** Places for meetups, polls for daily plans, Smart Import of Airbnb confirmations.
- **Why reject:** Festival lineup import, subscription upsells, iOS purchase dead-end.

### B. Jobs-to-be-Done

1. Collect Airbnb/Vrbo confirmations into one map.
2. Poll "which stage at 8 PM?" with live counts.
3. Pin "if lost, meet here" points per day.
4. Split gas + campsite costs fairly.
5. Shared photo dump without iCloud link rot.

### C. Full User Journey (16 steps)

| # | Finding | Evidence |
|---|---------|----------|
| 1 | Consumer trip default — correct fit | `CreateTripModal` |
| 2 | Sign-up + skip carousel | `ground-truth §3` |
| 3 | Trip dates span festival weekend; timezone defaults browser | `CreateTripModal.tsx:55` |
| 4 | Invite 15 via link — preview before auth **win** | `JoinTrip.tsx` |
| 5 | Smart Import links/PDFs for lodging | `ground-truth §6` |
| 6 | Concierge "food near campground" — 10 free queries/user/trip | `ground-truth §7` |
| 7 | **Places + multi-basecamp** for hotel vs camp nights | `baseCamps.ts` |
| 8 | Polls — **core social feature** | `ground-truth §6` |
| 9 | Tasks "who brings canopy" — light use | — |
| 10 | Payments splits + Venmo — 3 free splits/trip | `ground-truth §7` |
| 11 | Media grid — **strong** | `ground-truth §6` |
| 12 | Chat — may duplicate iMessage | `[SIMULATED RISK]` |
| 13 | Notifications — photo dump noise; mute behind feature flag | `MobileTripDetail.tsx:71`, `useTripNotificationMute.ts` |
| 14 | No festival lineup CSV import | `[OBSERVED absence]` |
| 15 | Trip Pass marketing exists; in-app wall reachability varies | `ground-truth §7` REPORT |
| 16 | `APPLE_IAP_ENABLED = false` — iOS says subscribe on web | `ground-truth §7` |

### D. Feature-by-Feature Findings

| Feature | Verdict | Severity |
|---------|---------|----------|
| Places + basecamp | ✅ Strong | Positive |
| Polls | ✅ Strong | Positive |
| Smart Import | ✅ Strong | Medium |
| Festival lineup import | ❌ Missing | Medium |
| Trip Pass at limit | 🟡 Hard to reach in-app | Medium |
| iOS checkout | ❌ Web only | Medium |

### E. Emotional Reaction

**Enthusiastic** about polls and meetup pins — "better than the group chat poll emoji war." **Mildly annoyed** by account wall for casual friends. **Would use again** next festival if Trip Pass is one tap. **Positive NPS (+5)** among consumer personas in this batch `[persona-matrix]`.

### F. Conversion Scores

Activation 7 · Invite 6 · Day-7 4 · Paid 3 · NPS +5. **WTP:** Trip Pass $39.99 for festival weekend.

### G. Top 5 Fixes

1. **Trip Pass at Smart Import / split limit** in-app.
2. **Festival lineup link** import (URL → calendar suggestions).
3. Surface **per-trip mute** by default for large friend groups.
4. Fix **iOS purchase path** or clear web-checkout handoff.
5. **Duplicate last trip** for annual festival return.

### H. Representative Quotes

> [SYNTHETIC QUOTE] "The poll for Saturday night sets actually got everyone off the fence. That's the whole app for me."

> [SYNTHETIC QUOTE] "I pasted the Airbnb email and it showed up on the map. I was ready to tell everyone to download it — then Jake couldn't pay for the pass on his iPhone."

> [SYNTHETIC QUOTE] "Nobody wants a subscription for one weekend in the desert. Sell me a pass for this trip only."

### I. Web vs Mobile

- **Mobile (iOS):** Zoe's primary — polls, places, photos on festival grounds.
- **Web:** Pre-trip planning and Smart Import review on laptop.
- **Gap:** iOS payment dead-end hits at peak intent on phone `[OBSERVED §7]`.

### J. Real Beta Validation Questions

1. Would you pay $39.99 once if the button appeared when you hit the split cap?
2. Did friends complete signup from the invite link at a festival pregame?
3. What would lineup import need to do to replace the screenshot in group chat?

### K. Persona Verdict

**Segment fit:** Consumer group trip — **strong fit**. Core loops work. **Monetization path** (Trip Pass + iOS) is the friction, not features.

---

## Persona 24 — Chris Delaney (Run Club Race Weekend)

> Extends **07-run-club** (Marcus Oyelaran). Focus: annual destination race weekend (18 runners), not weekly meetups.

### A. Profile

- **Role:** Eastside Pacers co-organizer — once-a-year destination race (e.g., Chicago Marathon weekend), 18 members.
- **Platform:** Android PWA; WhatsApp holdover.
- **Budget:** **Free only** — hobby club; $0 recurring.
- **Why adopt:** Race weekend lodging, group dinner poll, shared photos.
- **Why reject:** Weekly-trip model, 3 active trip cap, no duplicate trip, travel copy.

### B. Jobs-to-be-Done

1. Coordinate hotel blocks + Saturday race meetup + Sunday brunch in one trip.
2. Poll attendance for post-race dinner.
3. Share photos after the race.
4. Split hotel + van costs (few splits).
5. Reuse last year's trip structure.

### C. Full User Journey (16 steps)

| # | Finding | Evidence |
|---|---------|----------|
| 1 | Lands via invite — marketing irrelevant | — |
| 2 | Google sign-up; skips carousel | — |
| 3 | Consumer trip; start=end date for weekend | `CreateTripModal.tsx:495-597` |
| 4 | Invite 18 — preview works; account required | `ground-truth §5, §8` |
| 5 | Basecamp = race hotel; places for brunch | `ground-truth §6` |
| 6 | Concierge optional | — |
| 7 | No GPX/Strava route | grep empty [persona 07] |
| 8 | Polls — **high value** | — |
| 9 | Tasks light | — |
| 10 | 3 splits/trip free — enough for race weekend | `ground-truth §7` |
| 11 | Media — post-race loop | — |
| 12 | Chat — WhatsApp parallel | `[SIMULATED RISK]` |
| 13 | Notifications | `useTripNotificationMute` exists but flag-gated |
| 14 | **No duplicate trip** button in create flow | `[OBSERVED absence]` |
| 15 | If also runs weekly trips, **3 active cap** at week 4 | `tripService.ts:191` |
| 16 | Upgrade prompts feel hostile to $0 budget | `PricingSection.tsx:67` |

### D. Feature-by-Feature Findings

| Feature | Verdict | Severity |
|---------|---------|----------|
| Race weekend (one trip) | ✅ Works | Positive |
| Weekly recurrence pattern | ❌ Wrong model | High (persona 07) |
| Duplicate trip | ❌ Missing | High |
| 3-trip cap | 🟠 Churn for weekly use | Critical for recurring |
| Polls + media | ✅ Strong | Positive |

### E. Emotional Reaction

**Happy** for the annual race weekend — "this beats the WhatsApp poll." **Would not** use for weekly runs (wrong shape). **Annoyed** at re-entering the same hotel each year. **Free forever** stance — any paywall = delete `[SIMULATED RISK]`.

### F. Conversion Scores

Activation 5 · Invite 5 · Day-7 4 · Paid 1 · NPS −20. **WTP:** $0 (maybe $5 one-time if club votes).

### G. Top 5 Fixes

1. **Duplicate trip** preserving places/basecamp/poll templates.
2. **Recurring meetup** path (long-lived trip + RRULE) for weekly segment.
3. Don't count **past/archived** trips against cap for single-day clubs.
4. Strava/map link unfurl as route placeholder.
5. Default-on **per-trip mute** for notification storms.

### H. Representative Quotes

> [SYNTHETIC QUOTE] "For Chicago weekend this is great. For every Saturday at the park it's absurd — I'm not making a 'trip' called Saturday."

> [SYNTHETIC QUOTE] "Let me clone last year's race trip. I don't want to re-type the hotel address again."

> [SYNTHETIC QUOTE] "The moment you ask nine dollars a month for a free run club, we're gone."

### I. Web vs Mobile

- **Android PWA:** Chris organizes on phone at race expo; `NativeTabBar` mobile nav.
- **Web:** Acceptable for pre-trip setup on laptop.
- **Gap:** Weekly cadence pain is mobile-first chore; race weekend is fine on either `[SIMULATED RISK]`.

### J. Real Beta Validation Questions

1. For your annual race trip only — does Chravel beat WhatsApp + Splitwise?
2. Would a "duplicate last trip" button change year-over-year use?
3. At what price (if any) would the club treasury pay?

### K. Persona Verdict

**Segment fit:** Consumer recurring community — **weak**; **race weekend** — **moderate**. Mis-assembly not overbuild [persona 07 conclusion]. Free tier OK for annual event; weekly pattern churns.

---

## Persona 25 — Jake Morrison (Fraternity Rush Chair)

> Extends **06-fraternity-rush** (Tucker Maddox). Same 140-person rush week shape; updated for `max_uses` UI now shipping.

### A. Profile

- **Role:** Rush chair, large state school chapter — 60 brothers + ~80 rushees, 4–6 events/day for 7 days.
- **Platform:** iOS, 100% mobile, zero patience.
- **Budget:** $0 personal; chapter treasury might fund one-time pass.
- **Why adopt:** One link in GroupMe, live calendar, broadcasts.
- **Why reject:** Notification firehose, approval bottleneck, permission chaos, no chapter SKU.

### B. Jobs-to-be-Done

1. Publish 25+ events across 7 days fast.
2. One GroupMe link → schedule in <60 seconds for rushees.
3. Venue change push everyone actually sees.
4. Assign setup crews with accountability.
5. Contain prankster chaos in chat.

### C. Full User Journey (16 steps)

| # | Finding | Evidence |
|---|---------|----------|
| 1 | Demo preview lowers wall | `ground-truth §3` |
| 2 | Skips onboarding | — |
| 3 | **Event trip** correct; 3 lifetime events on free | `ground-truth §4` |
| 4 | Invite link; **usage limit presets now in UI** | `InviteModal.tsx:20-37, 55-59` |
| 5 | Approval default ON — chair approves ~140 | `InviteModal.tsx:48-51` |
| 6 | Calendar bulk entry | works |
| 7 | Places for event venues | works |
| 8 | Polls optional | — |
| 9 | Tasks for setup crews | works |
| 10 | Payment splits cap — chapter uses Venmo anyway | `ground-truth §7` |
| 11 | Media for rush photos | — |
| 12 | **consumer_member wildcard delete** on resources | `permissionMatrix` [persona 06] |
| 13 | Notifications — mute exists behind `per_trip_notification_mute` flag | `MobileTripDetail.tsx:71` |
| 14 | Broadcasts for venue change — delivery unproven at 140 | — |
| 15 | Join approval dashboard drift bug | `ground-truth §10.6` |
| 16 | No self-serve chapter Event Pass; mailto Pro | `ground-truth §7` |

### D. Feature-by-Feature Findings

| Feature | Verdict | Severity |
|---------|---------|----------|
| Invite + preview | ✅ Strong | Positive |
| max_uses UI | ✅ Now exists | Positive (fixed vs persona 06) |
| Approval bottleneck | 🟠 Chair-only | High |
| Member delete permissions | ❌ Too permissive | High |
| Per-trip mute | 🟡 Feature-flagged | Medium |
| Chapter billing SKU | ❌ Missing | Medium |

### E. Emotional Reaction

**Hyped** on night zero — calendar + link are "actually fire." **Destroyed** night one when notifications melt phones and venue change reaches half the chapter. **Would evangelize** the invite flow; **would warn** about chat permissions. Mixed → net NPS −10 `[persona-matrix]`.

### F. Conversion Scores

Activation 7 · Invite 8 · Day-7 3 · Paid 1 · NPS −10. **WTP:** Chapter one-time $50–100 Event Pass if self-serve.

### G. Top 5 Fixes

1. **Bulk approve** + optional auto-approve for rushees.
2. **Restricted delete mode** for consumer/event trips.
3. Ship **per-trip mute** GA (not flag-only).
4. **Announcement priority** bypassing mute for venue changes.
5. Self-serve **chapter Event Pass** SKU.

### H. Representative Quotes

> [SYNTHETIC QUOTE] "The invite link with the trip preview is legit — rushees actually clicked. That's rare."

> [SYNTHETIC QUOTE] "I approved join requests between classes for two days straight. There has to be a bulk button."

> [SYNTHETIC QUOTE] "Someone deleted the calendar event as a joke and the whole chapter saw it. GroupMe chaos moved inside your app."

### I. Web vs Mobile

- **iOS mobile only** for Jake; rush week is phone-native.
- **Desktop:** Irrelevant for chair workflow.
- **Gap:** Approval queue UX on small screen; notification settings buried in trip options sheet `[SIMULATED RISK]`.

### J. Real Beta Validation Questions

1. Night-one venue change — what % of members see it within 10 minutes?
2. Time to approve 50 join requests on mobile?
3. Would the chapter pay $75 for a one-week pass with admin lockdown?

### K. Persona Verdict

**Segment fit:** Events at 140 — **high viral potential**, **high operational risk**. Invite funnel is best-in-product; **permissions + notifications** determine survival past night one.

---

## Persona 26 — Pastor David Greene (Church Nonprofit Group Trip)

### A. Profile

- **Role:** Pastor coordinating 35-member youth + adult mission/service trip — buses, lodging, volunteer tasks.
- **Age / tech:** 50–60; moderate tech; email and text primary.
- **Budget:** Donation-funded; **free tier only**; sensitive to anything that looks like profit on backs of volunteers.
- **Why adopt:** Task lists for chaperones, shared calendar, prayer/media sharing.
- **Why reject:** Payments complexity, account friction for older volunteers, consumer travel branding.

### B. Jobs-to-be-Done

1. Publish bus departure times and daily service schedule.
2. Assign chaperone groups and meal duties.
3. Collect permission-sensitive info without public chat exposure.
4. Share trip photos with congregation after return.
5. Keep costs at $0 software.

### C. Full User Journey (16 steps)

| # | Finding | Evidence |
|---|---------|----------|
| 1 | Landing "group travel" broadly inclusive | `HeroSection.tsx:69` |
| 2 | Email sign-up; verification step slows elders | `ground-truth §3` |
| 3 | Consumer trip; School category exists on Pro but gated | `proCategories.ts:102-119` |
| 4 | Invite parents — account wall heavy for volunteers | `ground-truth §8` |
| 5 | Calendar for bus times — works | — |
| 6 | Concierge underused | — |
| 7 | Basecamp = lodging | works |
| 8 | Polls for meal prefs | works |
| 9 | **Tasks for chaperone duties — strong fit** | — |
| 10 | Payments — confusing for nonprofit ("who owes whom") | Venmo model wrong |
| 11 | Media for mission photos — positive | — |
| 12 | Chat — may need moderation; no volunteer-specific role on consumer | — |
| 13 | Notifications — older users may disable | `[SIMULATED RISK]` |
| 14 | PDF schedule export paywalled Explorer+ | `ground-truth §7` |
| 15 | Post-trip value = photo album | — |
| 16 | Any upgrade CTA feels wrong for church context | `[SIMULATED RISK]` |

### D. Feature-by-Feature Findings

| Feature | Verdict | Severity |
|---------|---------|----------|
| Tasks + calendar | ✅ Good | Positive |
| Payments tab | 🟠 Misleading for nonprofit | Medium |
| Invite/account friction | 🟠 High for elders | Medium |
| School/chaperone roles | 🟡 Pro-gated | Medium |
| Free tier sufficiency | ✅ OK for one trip | Positive |

### E. Emotional Reaction

**Grateful** for task assignments replacing email chains. **Overwhelmed** by tabs (Payments, Concierge) he doesn't need. **Worried** parents won't create accounts. **Would use free tier once**; won't upgrade. Neutral NPS `[persona-matrix: 0]`.

### F. Conversion Scores

Activation 5 · Invite 3 · Day-7 4 · Paid 1 · NPS 0. **WTP:** $0; donation optional.

### G. Top 5 Fixes

1. **Simplified trip mode** hiding Payments/Concierge for nonprofit template.
2. **Printable schedule** on free tier for churches.
3. Chaperone **role template** without Pro paywall.
4. Lighter **guest view** for parents (read-only schedule).
5. Clear **nonprofit pricing** page (free + donation).

### H. Representative Quotes

> [SYNTHETIC QUOTE] "The task list for chaperones saved my volunteer coordinator ten phone calls. That's ministry to me."

> [SYNTHETIC QUOTE] "Half our parents don't want another app account. They want a piece of paper on the bus."

> [SYNTHETIC QUOTE] "Why is there a Venmo button on a church mission trip? That feels… off."

### I. Web vs Mobile

- **Desktop:** Pastor prepares schedule on office computer.
- **Mobile:** Chaperones on buses; mixed Android/iOS.
- **Gap:** Older volunteers struggle on mobile signup; printable PDF gated `[SIMULATED RISK]`.

### J. Real Beta Validation Questions

1. What % of parent volunteers complete account creation?
2. Would a printable bus schedule on the free tier unlock adoption?
3. Should Payments be hidden by default for nonprofit trips?

### K. Persona Verdict

**Segment fit:** Consumer + optional School Pro — **moderate on free tier**. Tasks/calendar align; **payments branding and invite friction** misalign. Low revenue; high goodwill if simplified.

---

## Persona 27 — Ms. Linda Park (School Field Trip Coordinator)

### A. Profile

- **Role:** Middle-school teacher — 28 students + 4 parent chaperones, museum day trip.
- **Platform:** Desktop-first at school; parents on phones.
- **Budget:** ~$50–200/yr school budget if admin approves; otherwise free.
- **Why adopt:** Chaperone tasks, departure times, emergency contact organization.
- **Why reject:** Youth privacy (COPPA fears), parent account wall, no chaperone roles on consumer trip.

### B. Jobs-to-be-Done

1. Share departure/arrival times with parents.
2. Assign chaperone groups (7 students each).
3. Communicate bus delay without calling 28 families.
4. Collect trip photos for yearbook (with consent awareness).
5. Satisfy admin IT/privacy review.

### C. Full User Journey (16 steps)

| # | Finding | Evidence |
|---|---------|----------|
| 1 | School Pro category has Student/Chaperone/Teacher roles | `proCategories.ts:106-118` |
| 2 | Pro creation gated — likely uses consumer trip | `ground-truth §4` |
| 3 | **COPPA/privacy policy** not surfaced in trip flow | `[HYPOTHESIS]` |
| 4 | Parent invites — email verify friction | `ground-truth §3` |
| 5 | Calendar for museum schedule | works |
| 6 | Concierge unused | — |
| 7 | Basecamp = museum meeting point | works |
| 8 | Polls unnecessary | — |
| 9 | Tasks for chaperone assignments — **works** | — |
| 10 | Payments N/A (school handles fees) | — |
| 11 | Media — **minor consent concern** for student photos | `[SIMULATED RISK]` |
| 12 | Chat — teacher may not want parent free-for-all | — |
| 13 | Broadcasts for bus delay — useful if parents joined | — |
| 14 | Export schedule PDF Explorer+ | `ground-truth §7` |
| 15 | Admin IT asks about student data storage | Supabase RLS exists; not explained in UI |
| 16 | Team plan pricing vs school budget unclear | `ground-truth §7` |

### D. Feature-by-Feature Findings

| Feature | Verdict | Severity |
|---------|---------|----------|
| School roles | 🟡 Pro-gated | High |
| Parent onboarding | 🟠 Account wall | High |
| Tasks/chaperones | ✅ Works | Positive |
| Privacy/trust docs | ❌ Not in-flow | High (schools) |
| Free PDF export | ❌ Paywalled | Medium |

### E. Emotional Reaction

**Hopeful** seeing task assignments map to chaperone groups. **Anxious** about privacy — "can parents see other students' info?" **Blocked** by admin without DPA. **Would use** if district approves; **won't** fight parents through signup. NPS −5 `[persona-matrix]`.

### F. Conversion Scores

Activation 5 · Invite 4 · Day-7 4 · Paid 2 · NPS −5. **WTP:** School team plan if admin funds.

### G. Top 5 Fixes

1. **School trip template** with chaperone roles on consumer or cheap edu tier.
2. **Privacy FAQ** for educators (what parents/students can see).
3. **Free printable schedule** export.
4. Parent **read-only join** with minimal PII.
5. District **billing** path (PO invoice).

### H. Representative Quotes

> [SYNTHETIC QUOTE] "I need four chaperones to know which seven kids they're responsible for. Your tasks do that. Thank you."

> [SYNTHETIC QUOTE] "Our principal asked where student data lives. I couldn't answer from the app."

> [SYNTHETIC QUOTE] "I sent the link to parents and three of twenty-eight signed up. The rest asked for a paper handout."

### I. Web vs Mobile

- **Desktop:** Linda builds trip at school.
- **Mobile:** Parents need delay updates on phone — critical path.
- **Gap:** Parent signup friction worse on mobile; teacher needs desktop print/export `[SIMULATED RISK]`.

### J. Real Beta Validation Questions

1. Would your district IT approve Chravel without a DPA on file?
2. Parent signup completion rate from one field-trip link?
3. Are chaperone roles worth a Pro upgrade to your school?

### K. Persona Verdict

**Segment fit:** School — **latent fit** (roles defined in `proCategories.ts`) **blocked by gating + privacy narrative**. Product has pieces; **edu packaging missing**.

---

## Persona 28 — Mike Santoro (Price-Sensitive Bachelor Party)

### A. Profile

- **Role:** Best man — 14 guys, Vegas weekend, tight budgets, high banter tolerance.
- **Platform:** Android; Venmo native.
- **Budget:** **$0** for software; allergic to subscription CTAs.
- **Why adopt:** Polls for clubs, expense tracking, shared itinerary.
- **Why reject:** Any upgrade popup, split caps, travel-app pretension.

### B. Jobs-to-be-Done

1. Poll Saturday night plans without 200 text messages.
2. Track who paid for what (bottles, Uber, dinner).
3. Keep strip-club plans out of the visible itinerary (lol) — actually: separate dinner vs club groups.
4. Share photos without iCloud.
5. Spend $0 on the app.

### C. Full User Journey (16 steps)

| # | Finding | Evidence |
|---|---------|----------|
| 1 | "Upgrade when your trip gets serious" — off-putting | `PricingSection` [persona 07] |
| 2 | Quick Google sign-up | — |
| 3 | Consumer trip — correct | — |
| 4 | Invite 14 — bros resist account but comply | `[SIMULATED RISK]` |
| 5 | Calendar for dinner reservations | works |
| 6 | Concierge maybe once for steakhouse | 10 free queries |
| 7 | Places for meetup | works |
| 8 | **Polls — hero feature** | — |
| 9 | Tasks ignored | — |
| 10 | **Payments splits** — 3 free; Venmo deeplink OK for this crew | `ground-truth §6` |
| 11 | Media — debauched photos; storage cap theoretical | `ground-truth §10.7` |
| 12 | Chat — duplicates group text | — |
| 13 | PlusUpsellModal at limits — **annoying** | `ground-truth §7` |
| 14 | Trip Pass unreachable in-app per REPORT | `[OBSERVED REPORT §1]` |
| 15 | Weekend ends — uninstall | `[SIMULATED RISK]` |
| 16 | Would never subscribe | — |

### D. Feature-by-Feature Findings

| Feature | Verdict | Severity |
|---------|---------|----------|
| Polls | ✅ Strong | Positive |
| Payments (Venmo) | ✅ Adequate | Positive |
| Upgrade prompts | 🟠 Hostile | Medium |
| Trip Pass discoverability | 🟡 Poor | Low |
| Free tier sufficiency | ✅ Mostly | Positive |

### E. Emotional Reaction

**Laughs** at gold premium styling — "we're not Chravelers, we're drunk." **Uses polls and splits** seriously. **Rage-quits** if paywall mid-weekend. **Would recommend** polls-only use to other best men. NPS −5 (annoyed by upsells, likes polls) `[persona-matrix]`.

### F. Conversion Scores

Activation 6 · Invite 5 · Day-7 3 · Paid 1 · NPS −5. **WTP:** $0; maybe $5 one-time if forced.

### G. Top 5 Fixes

1. **Trip Pass at split cap** — one-time, not subscription framing.
2. Suppress **subscription upsells** during active trip dates.
3. Keep **3 splits** honest or show pass price upfront day one.
4. **Poll-first onboarding** for bachelor use case.
5. Android **web checkout** clarity for any pass.

### H. Representative Quotes

> [SYNTHETIC QUOTE] "The poll saved us an hour of 'where we going tonight' texts. That's the whole win."

> [SYNTHETIC QUOTE] "Bro don't make me start a free trial for a bachelor party. We're literally gone in seventy-two hours."

> [SYNTHETIC QUOTE] "Venmo split inside the app is fine. The gold luxury vibe is not us."

### I. Web vs Mobile

- **Android mobile:** Entire weekend on phone.
- **Web:** Rarely used.
- **Gap:** Upsell modals on mobile at bar tab time = maximum annoyance `[SIMULATED RISK]`.

### J. Real Beta Validation Questions

1. Would you pay $39.99 once if splits locked on night two?
2. Do upgrade prompts make you uninstall mid-trip?
3. Polls alone — enough to choose Chravel over group text?

### K. Persona Verdict

**Segment fit:** Consumer celebrations — **good free-tier fit** (polls + splits). **Monetization hostile** — one-time pass only. Low LTV; high word-of-mouth if upsells stay quiet.

---

## Persona 29 — Isabelle Fontaine (Luxury Travel Advisor)

### A. Profile

- **Role:** Independent advisor — 4 UHNW client families/year; white-glove PDF itineraries expected.
- **Platform:** Desktop-first; clients on iOS.
- **Budget:** Client-billable $30+ per client per trip; would pay for white-label.
- **Why adopt:** Places, concierge, Smart Import, itinerary view.
- **Why reject:** Consumer PDF branding, no white-label, guest account wall, 3-trip cap.

### B. Jobs-to-be-Done

1. Build multi-city itinerary with restaurant reservations and transfers.
2. Deliver client-ready PDF without Chravel marketing.
3. Import confirmations via Smart Import.
4. Keep client media and notes confidential.
5. Present as her brand, not Chravel.

### C. Full User Journey (16 steps)

| # | Finding | Evidence |
|---|---------|----------|
| 1 | Luxury positioning on landing partial | `HeroSection` gold gradient |
| 2 | Pro trial mailto | `ground-truth §7` |
| 3 | Consumer trip for client — 3 cap bites with 4 clients | `tripService.ts:191` |
| 4 | Client invite — account wall for UHNW clients | `[SIMULATED RISK]` |
| 5 | Itinerary view groups by day | `ItineraryView.tsx:19-66` |
| 6 | Concierge + confirm card — efficient for one-offs | — |
| 7 | Multi-basecamp for multi-city | `baseCamps.ts` |
| 8 | Polls irrelevant | — |
| 9 | Tasks for client prep | works |
| 10 | Payments N/A | — |
| 11 | Media for inspiration boards | unsigned URL concern |
| 12 | Chat with client — OK small party | — |
| 13 | Itinerary **Export PDF stub** on ItineraryView | `ItineraryView.tsx:68-70` [persona 01] |
| 14 | Real export via trip export modal; branded footer | `exportPdfClient.ts` |
| 15 | ICS `ChravelApp:` prefix | `icsBranding.test.ts` |
| 16 | Enterprise white-label mailto only | `UpgradeModal.tsx:346` |

### D. Feature-by-Feature Findings

| Feature | Verdict | Severity |
|---------|---------|----------|
| Smart Import + itinerary | ✅ Strong | Positive |
| White-label export | ❌ Missing | Critical |
| ItineraryView PDF stub | ❌ Dead button | Critical |
| 3-trip cap | 🟠 Agency conflict | High |
| Client guest access | 🟠 Account wall | High |

### E. Emotional Reaction

**Impressed** by import + day-grouped itinerary — "closest to how I think." **Horrified** by dead Export PDF on itinerary screen and consumer footer on real export. **Would pay** for white-label tomorrow. **Highest paid conversion score in batch (5/10)** `[persona-matrix]`. NPS +10.

### F. Conversion Scores

Activation 6 · Invite 5 · Day-7 6 · Paid 5 · NPS +10. **WTP:** $30–50/client white-label export or $200/mo advisor plan.

### G. Top 5 Fixes

1. **White-label PDF + ICS** (logo, no Chravel footer).
2. **Wire ItineraryView Export PDF** to real pipeline or remove stub.
3. **Advisor tier** — unlimited trips + pooled AI.
4. **Client read-only magic link** without full signup.
5. Self-serve advisor checkout.

### H. Representative Quotes

> [SYNTHETIC QUOTE] "Smart Import understood my client's Amex confirmation better than I expected. Then I exported and it said Group Chat Travel App. I cannot send that to a family paying six figures for the trip."

> [SYNTHETIC QUOTE] "I clicked Export PDF on the itinerary screen and nothing happened. I thought my browser was broken."

> [SYNTHETIC QUOTE] "Charge me per client for a PDF with my logo. Stop trying to sell me a consumer subscription."

### I. Web vs Mobile

- **Desktop:** Isabelle's atelier — import, itinerary polish, export.
- **Mobile:** Clients consume on phone; join friction on iOS.
- **Gap:** Dead export button on desktop itinerary view is especially damaging for this persona `[OBSERVED ItineraryView.tsx:68-70]`.

### J. Real Beta Validation Questions

1. Would you deliver a Chravel export to a UHNW client without reformatting in Word?
2. What white-label elements are minimum (logo, colors, footer removal)?
3. Per-client fee vs monthly advisor subscription preference?

### K. Persona Verdict

**Segment fit:** Luxury advisor — **feature-strong, deliverable-weak**. Fix export/branding → **highest near-term revenue** among personas 16–30.

---

## Persona 30 — Amara Osei (International Group Organizer, Multilingual/Timezone)

### A. Profile

- **Role:** Diaspora community lead — 12 friends, London + Accra + NYC, staggered timezones, English/French/Twi chat.
- **Platform:** Mixed iOS/Android; UK-based organizer.
- **Budget:** $15–30/mo Explorer if timezone/i18n solid.
- **Why adopt:** Timezone on event create, shared calendar, group coordination across continents.
- **Why reject:** No i18n, US-centric copy, consumer trip timezone only on Event type.

### B. Jobs-to-be-Done

1. Create trip with correct default timezone for destination.
2. Show each member local times for calls and flights.
3. Coordinate WhatsApp-fatigue across three countries.
4. Import international flight confirmations.
5. Use app in English; some friends prefer French UI.

### C. Full User Journey (16 steps)

| # | Finding | Evidence |
|---|---------|----------|
| 1 | US English throughout; no i18n framework | grep `i18n|useTranslation` → no app i18n |
| 2 | Sign-up standard | — |
| 3 | Consumer trip — **timezone selector only on Event type** | `CreateTripModal.tsx:210-211, 609` |
| 4 | Browser tz default may be Europe/London — OK for Amara | `CreateTripModal.tsx:55` |
| 5 | Calendar events store times — cross-timezone display depends on event tz | `[HYPOTHESIS]` |
| 6 | Smart Import international flights | should work — ICS/PDF |
| 7 | Basecamp resolves with timezone param | `baseCamps.ts:3-14, 28-32` |
| 8 | Polls across timezones — async OK | — |
| 9 | Tasks with due dates — tz ambiguity risk | `[SIMULATED RISK]` |
| 10 | Payments multi-currency? — likely USD-centric | `[HYPOTHESIS]` |
| 11 | Media works | — |
| 12 | Chat English-only UI | — |
| 13 | Notifications at wrong local hour | `[SIMULATED RISK]` |
| 14 | GCal sync Explorer+ helps timezone offsets | `ground-truth §7` |
| 15 | Voice dictation locale hints in `useWebSpeechVoice.ts` | partial |
| 16 | Explorer $9.99 for GCal sync value | `ground-truth §7` |

### D. Feature-by-Feature Findings

| Feature | Verdict | Severity |
|---------|---------|----------|
| Trip-level timezone (consumer) | 🟠 Event-only selector | High |
| Basecamp date in tz | ✅ `toDateOnly` with tz | Positive |
| i18n / multilingual UI | ❌ Absent | High |
| Smart Import flights | ✅ Likely works | Positive |
| US-centric copy | 🟠 Friction | Medium |

### E. Emotional Reaction

**Relieved** that basecamp date math accepts timezone [`baseCamps.ts`]. **Frustrated** that consumer trips don't expose timezone picker — "I had to use Event type for a friends trip?" **Wishes** French UI for Accra relatives. **Would pay** Explorer for GCal sync if time display trustworthy. Positive-leaning NPS +5 `[persona-matrix]`.

### F. Conversion Scores

Activation 6 · Invite 5 · Day-7 5 · Paid 4 · NPS +5. **WTP:** $15–30/mo Explorer for sync + tz clarity.

### G. Top 5 Fixes

1. **Timezone selector on all trip types** (not Event-only).
2. **Per-user local time display** on calendar events.
3. **i18n roadmap** — at minimum French.
4. Multi-currency clarity in payments (or hide for intl trips).
5. Fix **limit copy drift** (queries/month vs per trip).

### H. Representative Quotes

> [SYNTHETIC QUOTE] "Half my group is in Ghana. When you say 'tomorrow' in the calendar, whose tomorrow?"

> [SYNTHETIC QUOTE] "I used Event mode just to get a timezone dropdown for a friends reunion. That can't be right."

> [SYNTHETIC QUOTE] "If Google Calendar sync shows everyone their local time, I'll pay ten a month. If not, we're staying on WhatsApp."

### I. Web vs Mobile

- **Mixed devices** across UK/Ghana/US — both matter equally.
- **Mobile:** WhatsApp replacement hope; tz confusion worse on small screens.
- **Web:** Easier timezone verification when planning on laptop.

### J. Real Beta Validation Questions

1. Do calendar events display correctly for members in GMT, EST, and GMT+0 Accra?
2. Would French UI unlock adoption for part of your group?
3. Is Explorer worth it solely for GCal sync with timezone offsets?

### K. Persona Verdict

**Segment fit:** International consumer — **partial**. Basecamp tz handling is promising; **trip-level tz + i18n** are gaps. Worthy Explorer buyer if sync delivers local times.

---

## Cross-Persona Synthesis (16–30)

| Theme | Personas hit | Evidence anchor |
|-------|----------------|-----------------|
| Stubbed Pro ops (`tripConverter` empty arrays) | 16, 17, 18, 19 | `tripConverter.ts:117-130` |
| mailto / no self-serve Pro checkout | 16, 17, 18, 22, 29 | `ground-truth §7` |
| Day sheet / call sheet export gap | 16, 17 | `exportPdfClient.ts` |
| Notification scale risk | 17, 18, 21, 22, 25 | `ground-truth §10.4` |
| White-label / branding | 19, 20, 29 | `icsBranding`, `ItineraryView.tsx:68-70` |
| Guest/account wall | 18, 21, 26, 27, 29 | `ground-truth §8` |
| Consumer wins (polls/places/media) | 23, 24, 28, 30 | `ground-truth §6` |
| Trip Pass / iOS purchase friction | 23, 28 | `ground-truth §7`, REPORT §1 |
| Per-trip mute (partial fix) | 25, 26, 16 | `useTripNotificationMute.ts`, feature flag |
| max_uses invite UI (improved vs persona 06) | 25, 22 | `InviteModal.tsx:20-37` |

**Mixed reactions by design:** Personas 21, 23, 29, 30 lean positive on core loops; 16, 18, 22 lean negative on Pro/scale; 24, 26, 28 are free-tier pragmatists.

---

*End of Part 2 (Personas 16–30). Part 1 covers Personas 1–15. Synthetic data — not customer validation.*

---
