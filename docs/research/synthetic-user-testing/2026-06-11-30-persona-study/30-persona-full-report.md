# ChravelApp 30-Persona Full Synthetic User Testing Report

> Evidence discipline: every defect or UI claim is labeled [OBSERVED], [SIMULATED RISK], or [HYPOTHESIS]. Persona quotes are synthetic only.

## Persona 1: Tanya Brooks — Youth soccer team mom / Weekend tournament parent organizer

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Tanya Brooks |
| Age range | 39-45 |
| Location/timezone | Columbus, OH / ET |
| Industry / role | Youth sports / Weekend tournament parent organizer |
| Tech comfort | medium |
| Platform | iOS |
| Group size | 24 |
| Planning style | Weekend tournament parent organizer; current stack iMessage, TeamSnap, Google Sheets, Venmo, Apple Photos |
| Current tools | iMessage, TeamSnap, Google Sheets, Venmo, Apple Photos |
| Main pain points | parents miss updates |
| Budget sensitivity | medium |
| Why adopt Chravel | One link that replaces the parent text thread and spreadsheet |
| Why reject Chravel | Parents must all create accounts before seeing schedule |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am coordinating parents during a tournament weekend, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 24 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 4+ |
| typicalGroupSize | 16+ |
| mainTools | iMessage; TeamSnap; Google Sheets; Venmo; Apple Photos |
| primaryPlanningDevice | iOS |
| wouldDo45MinuteCall | Yes |
| roleInGroup | Primary planner |
| proOpsResponsibility | Shared responsibility |

### D. Full Survey Answers

**About you.** Tanya Brooks (persona-01@example.invalid; not provided (synthetic placeholder)) works in Youth sports from Columbus, OH / ET. Primary use case: Coordinate tournament weekend logistics for parents and players. Platform: iOS. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because Weekend tournament parent organizer needed to coordinate tournament weekend logistics for parents and players. Involved: About 24 people; Weekend tournament parent organizer drove planning with some helpers. Most frustrating: parents miss updates. Surprisingly well: iMessage kept the core group reachable, but not organized. Tools: iMessage, TeamSnap, Google Sheets, Venmo, Apple Photos. Total apps: about 7. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in iMessage, details move to TeamSnap, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Tanya sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Money / payments.** Handling today: Currently uses Venmo plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly iMessage plus TeamSnap.

**Willingness to pay.** Choice: per-trip. Explanation: Tanya Brooks prefers per-trip because medium budget sensitivity and parents miss updates. Likely WTP: $39.99 trip pass split by parents.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 4; clarity: 4; perceived time saved: 4; trust in AI concierge: 3; would invite group: 3; mobile usability: 4; web usability: 4; pricing fit: 3; overall NPS-style sentiment: 20.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if per-trip mute + broadcast read receipts works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Yes.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] Youth soccer team mom needs the Regular Trips path and per-trip mute + broadcast read receipts framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Tanya Brooks tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Regular Trips creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Regular Trips is right for Coordinate tournament weekend logistics for parents and players.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Trip Pass is the best-fit SKU; [SIMULATED RISK] Tanya Brooks reacts negatively to paywalls before group commitment.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For iOS users, mobile success depends on invite link clarity, readable schedule, and fast access to per-trip mute + broadcast read receipts.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for Youth soccer team mom | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Tanya Brooks understands the anti-fragmentation premise quickly. | [SIMULATED RISK] Youth soccer team mom needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen Youth soccer team mom proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 24-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Regular Trips workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Regular trip is likely enough, but mode naming may be unclear. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Regular Trips is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 24-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Move trip-specific chatter away from generic group chat | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Trip-specific chat is useful once structured objects also live there. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Chat alone does not beat existing group chat. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Use chat as context around itinerary decisions, not as the main replacement claim. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for parents miss updates. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for Weekend tournament parent organizer when responsibility is visible. | [SIMULATED RISK] Can feel overkill for casual participants. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] No per-trip mute/batching would drive notification opt-out. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Keep guests/members clear without overcomplication | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Simpler member/guest roles reduce confusion for small groups. | [SIMULATED RISK] Guest role gives too little pre-signup value. | Guest pre-value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Add safe read-only guest preview. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Trip Pass is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: paywall before group is committed. | Trip Pass must appear at the in-product limit moment, not only marketing. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Trip Pass at the moment per-trip mute + broadcast read receipts creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: calendar plus tasks. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Regular Trips and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: account wall for busy parents. [SIMULATED RISK]
- Would abandon when: notification spam or invite friction. [SIMULATED RISK]
- Would invite others? Yes, cautiously because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “If my group can see the schedule before signing up, I would actually send this link.”

### I. Conversion Scores

- Activation: 7/10 — strong organizer value.
- Invite likelihood: 6/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 6/10 — depends on whether per-trip mute + broadcast read receipts keeps being useful after setup.
- Paid conversion likelihood: 5/10 — best-fit model is Trip Pass.
- NPS-style sentiment: 20.
- Would they pay? Yes / conditional.
- What would they pay? $39.99 trip pass split by parents.
- What feature creates willingness to pay? per-trip mute + broadcast read receipts.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A subscription wall before invitees join or the trip has value.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Tanya Brooks scenario scenario failed at getting 24 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix per-trip mute + broadcast read receipts because the synthetic the synthetic Youth soccer team mom scenario scenario failed at parents miss updates, causing organizer burnout and lower retention.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Trip Pass because Tanya Brooks reached the likely willingness-to-pay moment but needs $39.99 trip pass split by parents, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Tanya Brooks scenario scenario failed at keeping updates useful for 24 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Tanya Brooks needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether Youth soccer team mom accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next coordinate tournament weekend logistics for parents and players, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 2: Monica Reyes — AAU volleyball parent coordinator / Multi-city parent coordinator

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Monica Reyes |
| Age range | 42-50 |
| Location/timezone | Dallas, TX / CT |
| Industry / role | Youth sports / Multi-city parent coordinator |
| Tech comfort | medium |
| Platform | Android |
| Group size | 32 |
| Planning style | Multi-city parent coordinator; current stack GroupMe, SportsEngine, Google Sheets, Email threads, Cash App |
| Current tools | GroupMe, SportsEngine, Google Sheets, Email threads, Cash App |
| Main pain points | schedule changes across venues |
| Budget sensitivity | medium-high |
| Why adopt Chravel | Smart Import from tournament schedule PDFs |
| Why reject Chravel | If mobile Android feels second-class |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am managing a multi-city tournament schedule, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 32 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 4+ |
| typicalGroupSize | 16+ |
| mainTools | GroupMe; SportsEngine; Google Sheets; Email threads; Cash App |
| primaryPlanningDevice | Android |
| wouldDo45MinuteCall | Maybe |
| roleInGroup | Primary planner |
| proOpsResponsibility | Shared responsibility |

### D. Full Survey Answers

**About you.** Monica Reyes (persona-02@example.invalid; not provided (synthetic placeholder)) works in Youth sports from Dallas, TX / CT. Primary use case: Coordinate AAU volleyball travel across tournament cities. Platform: Android. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because Multi-city parent coordinator needed to coordinate aau volleyball travel across tournament cities. Involved: About 32 people; Multi-city parent coordinator drove planning with some helpers. Most frustrating: schedule changes across venues. Surprisingly well: GroupMe kept the core group reachable, but not organized. Tools: GroupMe, SportsEngine, Google Sheets, Email threads, Cash App. Total apps: about 7. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in GroupMe, details move to SportsEngine, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Monica sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Money / payments.** Handling today: Currently uses Cash App plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly GroupMe plus SportsEngine.

**Willingness to pay.** Choice: per-trip. Explanation: Monica Reyes prefers per-trip because medium-high budget sensitivity and schedule changes across venues. Likely WTP: $39.99-$74.99 per season weekend.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 4; clarity: 4; perceived time saved: 3; trust in AI concierge: 3; would invite group: 3; mobile usability: 4; web usability: 4; pricing fit: 3; overall NPS-style sentiment: 10.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if PDF schedule import works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Maybe.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] AAU volleyball parent coordinator needs the Regular Trips path and PDF schedule import framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Monica Reyes tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Regular Trips creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Regular Trips is right for Coordinate AAU volleyball travel across tournament cities.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Trip Pass is the best-fit SKU; [SIMULATED RISK] Monica Reyes reacts negatively to paywalls before group commitment.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For Android users, mobile success depends on invite link clarity, readable schedule, and fast access to PDF schedule import.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for AAU volleyball parent coordinator | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Monica Reyes understands the anti-fragmentation premise quickly. | [SIMULATED RISK] AAU volleyball parent coordinator needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen AAU volleyball parent coordinator proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 32-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Regular Trips workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Regular trip is likely enough, but mode naming may be unclear. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Regular Trips is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 32-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Move trip-specific chatter away from generic group chat | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Trip-specific chat is useful once structured objects also live there. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Chat alone does not beat existing group chat. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Use chat as context around itinerary decisions, not as the main replacement claim. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for schedule changes across venues. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for Multi-city parent coordinator when responsibility is visible. | [SIMULATED RISK] Needs role/bulk assignment at larger group sizes. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] No per-trip mute/batching would drive notification opt-out. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Keep guests/members clear without overcomplication | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Simpler member/guest roles reduce confusion for small groups. | [SIMULATED RISK] Guest role gives too little pre-signup value. | Guest pre-value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Add safe read-only guest preview. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Trip Pass is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: paywall before group is committed. | Trip Pass must appear at the in-product limit moment, not only marketing. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Trip Pass at the moment PDF schedule import creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: Smart Import potential. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Regular Trips and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: payments trust gaps. [SIMULATED RISK]
- Would abandon when: wrong gym address or noisy chat. [SIMULATED RISK]
- Would invite others? Maybe/no until invite friction is reduced because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “The idea is strong, but one wrong money or timing mistake and I am back to my spreadsheet.”

### I. Conversion Scores

- Activation: 6/10 — partial value with notable trust/setup friction.
- Invite likelihood: 5/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 6/10 — depends on whether PDF schedule import keeps being useful after setup.
- Paid conversion likelihood: 5/10 — best-fit model is Trip Pass.
- NPS-style sentiment: 10.
- Would they pay? Yes / conditional.
- What would they pay? $39.99-$74.99 per season weekend.
- What feature creates willingness to pay? PDF schedule import.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A subscription wall before invitees join or the trip has value.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Monica Reyes scenario scenario failed at getting 32 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix PDF schedule import because the synthetic the synthetic AAU volleyball parent coordinator scenario scenario failed at schedule changes across venues, causing organizer burnout and lower retention.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Trip Pass because Monica Reyes reached the likely willingness-to-pay moment but needs $39.99-$74.99 per season weekend, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Monica Reyes scenario scenario failed at keeping updates useful for 32 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Monica Reyes needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether AAU volleyball parent coordinator accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next coordinate aau volleyball travel across tournament cities, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 3: Brianna Cole — Bachelorette maid of honor / Maid of honor planning Nashville

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Brianna Cole |
| Age range | 27-34 |
| Location/timezone | Charlotte, NC / ET |
| Industry / role | Consumer travel / Maid of honor planning Nashville |
| Tech comfort | high |
| Platform | iOS |
| Group size | 11 |
| Planning style | Maid of honor planning Nashville; current stack iMessage, Instagram, Google Docs, OpenTable, Venmo, TikTok |
| Current tools | iMessage, Instagram, Google Docs, OpenTable, Venmo, TikTok |
| Main pain points | chasing bridesmaids |
| Budget sensitivity | medium |
| Why adopt Chravel | Polls + payments + one beautiful itinerary |
| Why reject Chravel | If friends hit signup friction or media is worse than iCloud |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am trying to keep bridesmaids aligned without killing the vibe, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 11 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 2–3 |
| typicalGroupSize | 9–15 |
| mainTools | iMessage; Instagram; Google Docs; OpenTable; Venmo; TikTok |
| primaryPlanningDevice | iOS |
| wouldDo45MinuteCall | Yes |
| roleInGroup | Co-planner |
| proOpsResponsibility | No |

### D. Full Survey Answers

**About you.** Brianna Cole (persona-03@example.invalid; not provided (synthetic placeholder)) works in Consumer travel from Charlotte, NC / ET. Primary use case: Plan a Nashville bachelorette weekend with decisions and payments. Platform: iOS. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because Maid of honor planning Nashville needed to coordinate plan a nashville bachelorette weekend with decisions and payments. Involved: About 11 people; Maid of honor planning Nashville drove planning with some helpers. Most frustrating: chasing bridesmaids. Surprisingly well: iMessage kept the core group reachable, but not organized. Tools: iMessage, Instagram, Google Docs, OpenTable, Venmo, TikTok. Total apps: about 8. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in iMessage, details move to Instagram, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Brianna sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Money / payments.** Handling today: Currently uses Venmo plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly iMessage plus Instagram.

**Willingness to pay.** Choice: per-trip. Explanation: Brianna Cole prefers per-trip because medium budget sensitivity and chasing bridesmaids. Likely WTP: $39.99 trip pass.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 5; clarity: 4; perceived time saved: 4; trust in AI concierge: 3; would invite group: 4; mobile usability: 4; web usability: 4; pricing fit: 4; overall NPS-style sentiment: 30.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if trip-level unlock works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Yes.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] Bachelorette maid of honor needs the Regular Trips path and trip-level unlock framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Brianna Cole tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Regular Trips creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Regular Trips is right for Plan a Nashville bachelorette weekend with decisions and payments.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Trip Pass is the best-fit SKU; [SIMULATED RISK] Brianna Cole reacts negatively to paywalls before group commitment.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For iOS users, mobile success depends on invite link clarity, readable schedule, and fast access to trip-level unlock.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for Bachelorette maid of honor | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Brianna Cole understands the anti-fragmentation premise quickly. | [SIMULATED RISK] Bachelorette maid of honor needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen Bachelorette maid of honor proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 11-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Regular Trips workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Regular trip is likely enough, but mode naming may be unclear. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Regular Trips is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 11-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Move trip-specific chatter away from generic group chat | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Trip-specific chat is useful once structured objects also live there. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Chat alone does not beat existing group chat. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Use chat as context around itinerary decisions, not as the main replacement claim. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for chasing bridesmaids. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for Maid of honor planning Nashville when responsibility is visible. | [SIMULATED RISK] Can feel overkill for casual participants. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Centralized memories are a delight moment. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] Defaults matter because invitees will not configure settings. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Keep guests/members clear without overcomplication | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Simpler member/guest roles reduce confusion for small groups. | [SIMULATED RISK] Guest role gives too little pre-signup value. | Guest pre-value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Add safe read-only guest preview. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Trip Pass is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: paywall before group is committed. | Trip Pass must appear at the in-product limit moment, not only marketing. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Trip Pass at the moment trip-level unlock creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: polls and itinerary. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Regular Trips and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: media cap semantics. [SIMULATED RISK]
- Would abandon when: friends stay in iMessage. [SIMULATED RISK]
- Would invite others? Yes, cautiously because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “This feels useful for me as the planner; I am less sure my people will follow me into it.”

### I. Conversion Scores

- Activation: 8/10 — strong organizer value.
- Invite likelihood: 7/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 6/10 — depends on whether trip-level unlock keeps being useful after setup.
- Paid conversion likelihood: 7/10 — best-fit model is Trip Pass.
- NPS-style sentiment: 30.
- Would they pay? Yes / conditional.
- What would they pay? $39.99 trip pass.
- What feature creates willingness to pay? trip-level unlock.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A subscription wall before invitees join or the trip has value.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Brianna Cole scenario scenario failed at getting 11 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix trip-level unlock because the synthetic the synthetic Bachelorette maid of honor scenario scenario failed at chasing bridesmaids, causing organizer burnout and lower retention.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Trip Pass because Brianna Cole reached the likely willingness-to-pay moment but needs $39.99 trip pass, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Brianna Cole scenario scenario failed at keeping updates useful for 11 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Brianna Cole needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether Bachelorette maid of honor accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next plan a nashville bachelorette weekend with decisions and payments, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 4: Derrick Price — Guys birthday golf trip planner / Golf birthday trip organizer

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Derrick Price |
| Age range | 35-44 |
| Location/timezone | Phoenix, AZ / MT |
| Industry / role | Consumer travel / Golf birthday trip organizer |
| Tech comfort | medium |
| Platform | iOS |
| Group size | 8 |
| Planning style | Golf birthday trip organizer; current stack iMessage, Google Maps, GolfNow, Airbnb, Venmo |
| Current tools | iMessage, Google Maps, GolfNow, Airbnb, Venmo |
| Main pain points | money and tee time coordination |
| Budget sensitivity | medium-high |
| Why adopt Chravel | Payments and calendar in one place |
| Why reject Chravel | If Venmo handoff feels risky or too much setup |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am lining up tee times, lodging, and shared costs, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 8 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 2–3 |
| typicalGroupSize | 5–8 |
| mainTools | iMessage; Google Maps; GolfNow; Airbnb; Venmo |
| primaryPlanningDevice | iOS |
| wouldDo45MinuteCall | Maybe |
| roleInGroup | Primary planner |
| proOpsResponsibility | No |

### D. Full Survey Answers

**About you.** Derrick Price (persona-04@example.invalid; not provided (synthetic placeholder)) works in Consumer travel from Phoenix, AZ / MT. Primary use case: Organize Scottsdale golf weekend with tee times and shared costs. Platform: iOS. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because Golf birthday trip organizer needed to coordinate organize scottsdale golf weekend with tee times and shared costs. Involved: About 8 people; Golf birthday trip organizer drove planning with some helpers. Most frustrating: money and tee time coordination. Surprisingly well: iMessage kept the core group reachable, but not organized. Tools: iMessage, Google Maps, GolfNow, Airbnb, Venmo. Total apps: about 7. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in iMessage, details move to Google Maps, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Derrick sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Money / payments.** Handling today: Currently uses Venmo plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly iMessage plus Google Maps.

**Willingness to pay.** Choice: per-trip. Explanation: Derrick Price prefers per-trip because medium-high budget sensitivity and money and tee time coordination. Likely WTP: $39.99 if payment tracking works.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 4; clarity: 4; perceived time saved: 4; trust in AI concierge: 3; would invite group: 3; mobile usability: 4; web usability: 4; pricing fit: 3; overall NPS-style sentiment: 15.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if trusted split ledger works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Maybe.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] Guys birthday golf trip planner needs the Regular Trips path and trusted split ledger framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Derrick Price tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Regular Trips creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Regular Trips is right for Organize Scottsdale golf weekend with tee times and shared costs.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Trip Pass is the best-fit SKU; [SIMULATED RISK] Derrick Price reacts negatively to paywalls before group commitment.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For iOS users, mobile success depends on invite link clarity, readable schedule, and fast access to trusted split ledger.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for Guys birthday golf trip planner | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Derrick Price understands the anti-fragmentation premise quickly. | [SIMULATED RISK] Guys birthday golf trip planner needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen Guys birthday golf trip planner proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 8-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Regular Trips workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Regular trip is likely enough, but mode naming may be unclear. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Regular Trips is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 8-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Move trip-specific chatter away from generic group chat | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Trip-specific chat is useful once structured objects also live there. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Chat alone does not beat existing group chat. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Use chat as context around itinerary decisions, not as the main replacement claim. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for money and tee time coordination. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for Golf birthday trip organizer when responsibility is visible. | [SIMULATED RISK] Can feel overkill for casual participants. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] Defaults matter because invitees will not configure settings. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Keep guests/members clear without overcomplication | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Simpler member/guest roles reduce confusion for small groups. | [SIMULATED RISK] Guest role gives too little pre-signup value. | Guest pre-value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Add safe read-only guest preview. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Trip Pass is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: paywall before group is committed. | Trip Pass must appear at the in-product limit moment, not only marketing. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Trip Pass at the moment trusted split ledger creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: simple itinerary. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Regular Trips and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: subscription framing. [SIMULATED RISK]
- Would abandon when: money mistake. [SIMULATED RISK]
- Would invite others? Yes, cautiously because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “I would pay when it saves me chasing people, not before I know the group will use it.”

### I. Conversion Scores

- Activation: 7/10 — strong organizer value.
- Invite likelihood: 6/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 5/10 — depends on whether trusted split ledger keeps being useful after setup.
- Paid conversion likelihood: 6/10 — best-fit model is Trip Pass.
- NPS-style sentiment: 15.
- Would they pay? Yes / conditional.
- What would they pay? $39.99 if payment tracking works.
- What feature creates willingness to pay? trusted split ledger.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A subscription wall before invitees join or the trip has value.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Derrick Price scenario scenario failed at getting 8 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix trusted split ledger because the synthetic the synthetic Guys birthday golf trip planner scenario scenario failed at money and tee time coordination, causing organizer burnout and lower retention.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Trip Pass because Derrick Price reached the likely willingness-to-pay moment but needs $39.99 if payment tracking works, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Derrick Price scenario scenario failed at keeping updates useful for 8 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Derrick Price needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether Guys birthday golf trip planner accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next organize scottsdale golf weekend with tee times and shared costs, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 5: Priya Shah — Destination wedding couple / Bride coordinating wedding weekend

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Priya Shah |
| Age range | 30-38 |
| Location/timezone | New York, NY / ET |
| Industry / role | Wedding / consumer event / Bride coordinating wedding weekend |
| Tech comfort | high |
| Platform | mixed |
| Group size | 85 |
| Planning style | Bride coordinating wedding weekend; current stack Zola, WhatsApp, Google Sheets, Email, Instagram, Google Calendar |
| Current tools | Zola, WhatsApp, Google Sheets, Email, Instagram, Google Calendar |
| Main pain points | guest communication |
| Budget sensitivity | low-medium |
| Why adopt Chravel | Event pass with guest-friendly itinerary |
| Why reject Chravel | If it looks like replacing the wedding website but worse |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am getting guests through a wedding weekend smoothly, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 85 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 1 |
| typicalGroupSize | 16+ |
| mainTools | Zola; WhatsApp; Google Sheets; Email; Instagram; Google Calendar |
| primaryPlanningDevice | Both |
| wouldDo45MinuteCall | Maybe |
| roleInGroup | Co-planner |
| proOpsResponsibility | Shared responsibility |

### D. Full Survey Answers

**About you.** Priya Shah (persona-05@example.invalid; not provided (synthetic placeholder)) works in Wedding / consumer event from New York, NY / ET. Primary use case: Coordinate wedding-weekend guest logistics. Platform: mixed. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because Bride coordinating wedding weekend needed to coordinate wedding-weekend guest logistics. Involved: About 85 people; Bride coordinating wedding weekend drove planning with some helpers. Most frustrating: guest communication. Surprisingly well: Zola kept the core group reachable, but not organized. Tools: Zola, WhatsApp, Google Sheets, Email, Instagram, Google Calendar. Total apps: about 8. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in Zola, details move to WhatsApp, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Priya sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Pro Trips / Events branch.** Professional-grade means: For Destination wedding couple, professional-grade means role visibility, reliable notifications, auditability, and no demo-only promises. More control: Roles, invite approvals, broadcast recipients, privacy, schedule edit rights, and media/docs access. Desired automation: Import schedules, send reminders, summarize updates, and produce exportable recaps. Trust creators: Per-recipient logs, clear permissions, security posture, and tested mobile reliability.

**Money / payments.** Handling today: Currently uses manual tracking plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly Zola plus WhatsApp.

**Willingness to pay.** Choice: per-trip. Explanation: Priya Shah prefers per-trip because low-medium budget sensitivity and guest communication. Likely WTP: $74.99-$199 event pass.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 4; clarity: 3; perceived time saved: 3; trust in AI concierge: 3; would invite group: 3; mobile usability: 4; web usability: 4; pricing fit: 3; overall NPS-style sentiment: 10.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if read-only guest itinerary works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Maybe.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] Destination wedding couple needs the Events path and read-only guest itinerary framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Priya Shah tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Events creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Events is right for Coordinate wedding-weekend guest logistics.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Event pass is the best-fit SKU; [SIMULATED RISK] Priya Shah reacts negatively to paywalls before group commitment.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For mixed users, mobile success depends on invite link clarity, readable schedule, and fast access to read-only guest itinerary.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for Destination wedding couple | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Priya Shah understands the anti-fragmentation premise quickly. | [SIMULATED RISK] Destination wedding couple needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen Destination wedding couple proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 85-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Events workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Event mode fits scale but cap/role semantics need clearer explanation. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Events is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 85-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Send role-appropriate urgent updates and reduce side-channel chaos | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Broadcast/channel promise is strongly relevant. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Broadcast targeting/acknowledgment trust is a recurring high-risk area from prior code-grounded research. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Make role-targeted broadcasts server-enforced with per-recipient read/ack rosters. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for guest communication. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for Bride coordinating wedding weekend when responsibility is visible. | [SIMULATED RISK] Needs role/bulk assignment at larger group sizes. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] No per-trip mute/batching would drive notification opt-out. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Separate guests, staff, vendors, players, or attendees safely | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Roles are central to professional/event trust. | [SIMULATED RISK] Role promises must be enforced end-to-end, including broadcasts/media/docs. | Some Pro ops/role surfaces are incomplete or hidden on real trips. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Unify roles across invites, broadcasts, media, tasks, and itinerary visibility. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Event pass is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: paywall before group is committed. | Trip Pass must appear at the in-product limit moment, not only marketing. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Event pass at the moment read-only guest itinerary creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: event itinerary and broadcasts. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Events and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: attendee cap ambiguity. [SIMULATED RISK]
- Would abandon when: guest account wall. [SIMULATED RISK]
- Would invite others? Maybe/no until invite friction is reduced because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “For a group this big, the guest view and notification controls matter more than another planning feature.”

### I. Conversion Scores

- Activation: 6/10 — partial value with notable trust/setup friction.
- Invite likelihood: 5/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 5/10 — depends on whether read-only guest itinerary keeps being useful after setup.
- Paid conversion likelihood: 6/10 — best-fit model is Event pass.
- NPS-style sentiment: 10.
- Would they pay? Yes / conditional.
- What would they pay? $74.99-$199 event pass.
- What feature creates willingness to pay? read-only guest itinerary.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A subscription wall before invitees join or the trip has value.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Priya Shah scenario scenario failed at getting 85 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix read-only guest itinerary because the synthetic the synthetic Destination wedding couple scenario scenario failed at guest communication, causing organizer burnout and lower retention.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Event pass because Priya Shah reached the likely willingness-to-pay moment but needs $74.99-$199 event pass, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Priya Shah scenario scenario failed at keeping updates useful for 85 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Priya Shah needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether Destination wedding couple accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next coordinate wedding-weekend guest logistics, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 6: Linda Watkins — Family reunion planner / Family reunion coordinator

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Linda Watkins |
| Age range | 58-66 |
| Location/timezone | Atlanta, GA / ET |
| Industry / role | Family travel / Family reunion coordinator |
| Tech comfort | low |
| Platform | mixed |
| Group size | 45 |
| Planning style | Family reunion coordinator; current stack Facebook Groups, Email threads, Phone calls, Google Docs, Zelle |
| Current tools | Facebook Groups, Email threads, Phone calls, Google Docs, Zelle |
| Main pain points | older relatives missing info |
| Budget sensitivity | high |
| Why adopt Chravel | Printable itinerary and simple guest view |
| Why reject Chravel | If account setup or app download is mandatory |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am handling older relatives missing info, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 45 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 1 |
| typicalGroupSize | 16+ |
| mainTools | Facebook Groups; Email threads; Phone calls; Google Docs; Zelle |
| primaryPlanningDevice | Both |
| wouldDo45MinuteCall | Yes |
| roleInGroup | Primary planner |
| proOpsResponsibility | Shared responsibility |

### D. Full Survey Answers

**About you.** Linda Watkins (persona-06@example.invalid; not provided (synthetic placeholder)) works in Family travel from Atlanta, GA / ET. Primary use case: Coordinate a multigenerational reunion weekend. Platform: mixed. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because Family reunion coordinator needed to coordinate a multigenerational reunion weekend. Involved: About 45 people; Family reunion coordinator drove planning with some helpers. Most frustrating: older relatives missing info. Surprisingly well: Facebook Groups kept the core group reachable, but not organized. Tools: Facebook Groups, Email threads, Phone calls, Google Docs, Zelle. Total apps: about 7. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in Facebook Groups, details move to Email threads, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Linda sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful if it explains itself and never silently changes plans. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Pro Trips / Events branch.** Professional-grade means: For Family reunion planner, professional-grade means role visibility, reliable notifications, auditability, and no demo-only promises. More control: Roles, invite approvals, broadcast recipients, privacy, schedule edit rights, and media/docs access. Desired automation: Import schedules, send reminders, summarize updates, and produce exportable recaps. Trust creators: Per-recipient logs, clear permissions, security posture, and tested mobile reliability.

**Money / payments.** Handling today: Currently uses Zelle plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly Facebook Groups plus Email threads.

**Willingness to pay.** Choice: per-trip. Explanation: Linda Watkins prefers per-trip because high budget sensitivity and older relatives missing info. Likely WTP: $39.99-$74.99 if family can view without accounts.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 3; clarity: 3; perceived time saved: 3; trust in AI concierge: 3; would invite group: 2; mobile usability: 4; web usability: 4; pricing fit: 3; overall NPS-style sentiment: 0.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if account-light guest view works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Yes.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] Family reunion planner needs the Events path and account-light guest view framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Linda Watkins tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Events creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Events is right for Coordinate a multigenerational reunion weekend.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Event pass is the best-fit SKU; [SIMULATED RISK] Linda Watkins reacts negatively to paywalls before group commitment.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For mixed users, mobile success depends on invite link clarity, readable schedule, and fast access to account-light guest view.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for Family reunion planner | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Linda Watkins understands the anti-fragmentation premise quickly. | [SIMULATED RISK] Family reunion planner needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen Family reunion planner proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 45-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Events workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Event mode fits scale but cap/role semantics need clearer explanation. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Events is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 45-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Send role-appropriate urgent updates and reduce side-channel chaos | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Broadcast/channel promise is strongly relevant. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Broadcast targeting/acknowledgment trust is a recurring high-risk area from prior code-grounded research. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Make role-targeted broadcasts server-enforced with per-recipient read/ack rosters. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for older relatives missing info. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for Family reunion coordinator when responsibility is visible. | [SIMULATED RISK] Needs role/bulk assignment at larger group sizes. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] AI may help if presented as assistant, not autopilot. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Centralized memories are a delight moment. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] No per-trip mute/batching would drive notification opt-out. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Separate guests, staff, vendors, players, or attendees safely | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Roles are central to professional/event trust. | [SIMULATED RISK] Role promises must be enforced end-to-end, including broadcasts/media/docs. | Some Pro ops/role surfaces are incomplete or hidden on real trips. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Unify roles across invites, broadcasts, media, tasks, and itinerary visibility. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Event pass is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: paywall before group is committed. | Trip Pass must appear at the in-product limit moment, not only marketing. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Event pass at the moment account-light guest view creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: central schedule. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Events and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: account creation. [SIMULATED RISK]
- Would abandon when: too much app complexity. [SIMULATED RISK]
- Would invite others? Maybe/no until invite friction is reduced because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “For a group this big, the guest view and notification controls matter more than another planning feature.”

### I. Conversion Scores

- Activation: 5/10 — partial value with notable trust/setup friction.
- Invite likelihood: 4/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 5/10 — depends on whether account-light guest view keeps being useful after setup.
- Paid conversion likelihood: 4/10 — best-fit model is Event pass.
- NPS-style sentiment: 0.
- Would they pay? Unlikely without major fit changes.
- What would they pay? $39.99-$74.99 if family can view without accounts.
- What feature creates willingness to pay? account-light guest view.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A subscription wall before invitees join or the trip has value.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Linda Watkins scenario scenario failed at getting 45 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix account-light guest view because the synthetic the synthetic Family reunion planner scenario scenario failed at older relatives missing info, causing organizer burnout and lower retention.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Event pass because Linda Watkins reached the likely willingness-to-pay moment but needs $39.99-$74.99 if family can view without accounts, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Linda Watkins scenario scenario failed at keeping updates useful for 45 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Linda Watkins needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether Family reunion planner accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next coordinate a multigenerational reunion weekend, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 7: Jordan Miller — College spring break group planner / Spring break group lead

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Jordan Miller |
| Age range | 20-23 |
| Location/timezone | Tallahassee, FL / ET |
| Industry / role | Student travel / Spring break group lead |
| Tech comfort | high |
| Platform | iOS |
| Group size | 14 |
| Planning style | Spring break group lead; current stack Snapchat, iMessage, Google Docs, Venmo, TikTok |
| Current tools | Snapchat, iMessage, Google Docs, Venmo, TikTok |
| Main pain points | people flake and do not pay |
| Budget sensitivity | very high |
| Why adopt Chravel | Free polls + payment reminders |
| Why reject Chravel | Anything paid before friends are committed |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am handling people flake and do not pay, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 14 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 2–3 |
| typicalGroupSize | 9–15 |
| mainTools | Snapchat; iMessage; Google Docs; Venmo; TikTok |
| primaryPlanningDevice | iOS |
| wouldDo45MinuteCall | No |
| roleInGroup | Primary planner |
| proOpsResponsibility | No |

### D. Full Survey Answers

**About you.** Jordan Miller (persona-07@example.invalid; not provided (synthetic placeholder)) works in Student travel from Tallahassee, FL / ET. Primary use case: Plan a budget-sensitive Panama City spring break trip. Platform: iOS. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because Spring break group lead needed to coordinate plan a budget-sensitive panama city spring break trip. Involved: About 14 people; Spring break group lead drove planning with some helpers. Most frustrating: people flake and do not pay. Surprisingly well: Snapchat kept the core group reachable, but not organized. Tools: Snapchat, iMessage, Google Docs, Venmo, TikTok. Total apps: about 7. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in Snapchat, details move to iMessage, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Jordan sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Money / payments.** Handling today: Currently uses Venmo plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly Snapchat plus iMessage.

**Willingness to pay.** Choice: free only. Explanation: Jordan Miller prefers free only because very high budget sensitivity and people flake and do not pay. Likely WTP: Free only; maybe $1-$5/mo if everyone uses it.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 4; clarity: 4; perceived time saved: 3; trust in AI concierge: 3; would invite group: 3; mobile usability: 4; web usability: 4; pricing fit: 2; overall NPS-style sentiment: 5.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if deposit tracker works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: No.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] College spring break group planner needs the Regular Trips path and deposit tracker framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Jordan Miller tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Regular Trips creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Regular Trips is right for Plan a budget-sensitive Panama City spring break trip.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Free is the best-fit SKU; [SIMULATED RISK] Jordan Miller reacts negatively to paywalls before group commitment.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For iOS users, mobile success depends on invite link clarity, readable schedule, and fast access to deposit tracker.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for College spring break group planner | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Jordan Miller understands the anti-fragmentation premise quickly. | [SIMULATED RISK] College spring break group planner needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen College spring break group planner proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 14-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Regular Trips workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Regular trip is likely enough, but mode naming may be unclear. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Regular Trips is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 14-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Move trip-specific chatter away from generic group chat | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Trip-specific chat is useful once structured objects also live there. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Chat alone does not beat existing group chat. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Use chat as context around itinerary decisions, not as the main replacement claim. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for people flake and do not pay. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for Spring break group lead when responsibility is visible. | [SIMULATED RISK] Can feel overkill for casual participants. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Payment tracking may still reduce awkward reminders. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] Defaults matter because invitees will not configure settings. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Keep guests/members clear without overcomplication | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Simpler member/guest roles reduce confusion for small groups. | [SIMULATED RISK] Guest role gives too little pre-signup value. | Guest pre-value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Add safe read-only guest preview. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Free is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: paywall before group is committed. | Trip Pass must appear at the in-product limit moment, not only marketing. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Free at the moment deposit tracker creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: polls. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Regular Trips and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: paywall and signup. [SIMULATED RISK]
- Would abandon when: friends refuse another app. [SIMULATED RISK]
- Would invite others? Maybe/no until invite friction is reduced because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “The idea is strong, but one wrong money or timing mistake and I am back to my spreadsheet.”

### I. Conversion Scores

- Activation: 6/10 — partial value with notable trust/setup friction.
- Invite likelihood: 5/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 4/10 — depends on whether deposit tracker keeps being useful after setup.
- Paid conversion likelihood: 2/10 — best-fit model is Free.
- NPS-style sentiment: 5.
- Would they pay? Unlikely without major fit changes.
- What would they pay? Free only; maybe $1-$5/mo if everyone uses it.
- What feature creates willingness to pay? deposit tracker.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A subscription wall before invitees join or the trip has value.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Jordan Miller scenario scenario failed at getting 14 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix deposit tracker because the synthetic the synthetic College spring break group planner scenario scenario failed at people flake and do not pay, causing organizer burnout and lower retention.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Free because Jordan Miller reached the likely willingness-to-pay moment but needs Free only; maybe $1-$5/mo if everyone uses it, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Jordan Miller scenario scenario failed at keeping updates useful for 14 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Jordan Miller needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether College spring break group planner accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next plan a budget-sensitive panama city spring break trip, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 8: Sofia Laurent — Girls luxury trip planner / Luxury friend-trip planner

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Sofia Laurent |
| Age range | 32-40 |
| Location/timezone | Los Angeles, CA / PT |
| Industry / role | Consumer luxury travel / Luxury friend-trip planner |
| Tech comfort | high |
| Platform | iOS |
| Group size | 6 |
| Planning style | Luxury friend-trip planner; current stack Instagram, TikTok, Resy, Google Maps, Notion, iCloud Photos |
| Current tools | Instagram, TikTok, Resy, Google Maps, Notion, iCloud Photos |
| Main pain points | curation scattered across apps |
| Budget sensitivity | low |
| Why adopt Chravel | Concierge plus Places that feel prettier than Maps |
| Why reject Chravel | If UI feels generic or media loses to iCloud |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am handling curation scattered across apps, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 6 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 4+ |
| typicalGroupSize | 5–8 |
| mainTools | Instagram; TikTok; Resy; Google Maps; Notion; iCloud Photos |
| primaryPlanningDevice | iOS |
| wouldDo45MinuteCall | Yes |
| roleInGroup | Primary planner |
| proOpsResponsibility | No |

### D. Full Survey Answers

**About you.** Sofia Laurent (persona-08@example.invalid; not provided (synthetic placeholder)) works in Consumer luxury travel from Los Angeles, CA / PT. Primary use case: Plan a polished girls trip with high restaurant/aesthetic standards. Platform: iOS. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because Luxury friend-trip planner needed to coordinate plan a polished girls trip with high restaurant/aesthetic standards. Involved: About 6 people; Luxury friend-trip planner drove planning with some helpers. Most frustrating: curation scattered across apps. Surprisingly well: Instagram kept the core group reachable, but not organized. Tools: Instagram, TikTok, Resy, Google Maps, Notion, iCloud Photos. Total apps: about 8. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in Instagram, details move to TikTok, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Sofia sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Money / payments.** Handling today: Currently uses manual tracking plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly Instagram plus TikTok.

**Willingness to pay.** Choice: subscription. Explanation: Sofia Laurent prefers subscription because low budget sensitivity and curation scattered across apps. Likely WTP: $9.99/mo if design/export feels premium.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 5; clarity: 4; perceived time saved: 4; trust in AI concierge: 3; would invite group: 3; mobile usability: 4; web usability: 4; pricing fit: 4; overall NPS-style sentiment: 35.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if premium places board works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Yes.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] Girls luxury trip planner needs the Regular Trips path and premium places board framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Sofia Laurent tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Regular Trips creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Regular Trips is right for Plan a polished girls trip with high restaurant/aesthetic standards.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Explorer is the best-fit SKU; [SIMULATED RISK] Sofia Laurent reacts negatively to paywalls before group commitment.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For iOS users, mobile success depends on invite link clarity, readable schedule, and fast access to premium places board.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for Girls luxury trip planner | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Sofia Laurent understands the anti-fragmentation premise quickly. | [SIMULATED RISK] Girls luxury trip planner needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen Girls luxury trip planner proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 6-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Regular Trips workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Regular trip is likely enough, but mode naming may be unclear. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Regular Trips is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 6-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Move trip-specific chatter away from generic group chat | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Trip-specific chat is useful once structured objects also live there. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Chat alone does not beat existing group chat. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Use chat as context around itinerary decisions, not as the main replacement claim. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for curation scattered across apps. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for Luxury friend-trip planner when responsibility is visible. | [SIMULATED RISK] Can feel overkill for casual participants. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Existing shared albums may win unless trip context is unique. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] Defaults matter because invitees will not configure settings. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Keep guests/members clear without overcomplication | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Simpler member/guest roles reduce confusion for small groups. | [SIMULATED RISK] Guest role gives too little pre-signup value. | Guest pre-value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Add safe read-only guest preview. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Explorer is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: monthly subscription before trip value. | Trip Pass must appear at the in-product limit moment, not only marketing. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Explorer at the moment premium places board creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: AI recs and places. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Regular Trips and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: non-white-label exports. [SIMULATED RISK]
- Would abandon when: aesthetic mismatch. [SIMULATED RISK]
- Would invite others? Yes, cautiously because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “This feels useful for me as the planner; I am less sure my people will follow me into it.”

### I. Conversion Scores

- Activation: 8/10 — strong organizer value.
- Invite likelihood: 6/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 7/10 — depends on whether premium places board keeps being useful after setup.
- Paid conversion likelihood: 7/10 — best-fit model is Explorer.
- NPS-style sentiment: 35.
- Would they pay? Yes / conditional.
- What would they pay? $9.99/mo if design/export feels premium.
- What feature creates willingness to pay? premium places board.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A subscription wall before invitees join or the trip has value.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Sofia Laurent scenario scenario failed at getting 6 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix premium places board because the synthetic the synthetic Girls luxury trip planner scenario scenario failed at curation scattered across apps, causing organizer burnout and lower retention.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Explorer because Sofia Laurent reached the likely willingness-to-pay moment but needs $9.99/mo if design/export feels premium, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Sofia Laurent scenario scenario failed at keeping updates useful for 6 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Sofia Laurent needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether Girls luxury trip planner accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next plan a polished girls trip with high restaurant/aesthetic standards, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 9: Evan and Claire Kim — Couples group trip planner / One couple coordinating four couples

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Evan and Claire Kim |
| Age range | 34-42 |
| Location/timezone | Seattle, WA / PT |
| Industry / role | Consumer travel / One couple coordinating four couples |
| Tech comfort | medium |
| Platform | mixed |
| Group size | 8 |
| Planning style | One couple coordinating four couples; current stack WhatsApp, Google Calendar, Google Sheets, Splitwise, Google Maps |
| Current tools | WhatsApp, Google Calendar, Google Sheets, Splitwise, Google Maps |
| Main pain points | calendar and decision alignment |
| Budget sensitivity | medium |
| Why adopt Chravel | Shared calendar + polls |
| Why reject Chravel | If spouses do not join or payments are less trusted than Splitwise |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am handling calendar and decision alignment, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 8 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 2–3 |
| typicalGroupSize | 5–8 |
| mainTools | WhatsApp; Google Calendar; Google Sheets; Splitwise; Google Maps |
| primaryPlanningDevice | Both |
| wouldDo45MinuteCall | Maybe |
| roleInGroup | Co-planner |
| proOpsResponsibility | No |

### D. Full Survey Answers

**About you.** Evan and Claire Kim (persona-09@example.invalid; not provided (synthetic placeholder)) works in Consumer travel from Seattle, WA / PT. Primary use case: Plan a four-couple wine-country weekend. Platform: mixed. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because One couple coordinating four couples needed to coordinate plan a four-couple wine-country weekend. Involved: About 8 people; One couple coordinating four couples drove planning with some helpers. Most frustrating: calendar and decision alignment. Surprisingly well: WhatsApp kept the core group reachable, but not organized. Tools: WhatsApp, Google Calendar, Google Sheets, Splitwise, Google Maps. Total apps: about 7. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in WhatsApp, details move to Google Calendar, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Evan sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Money / payments.** Handling today: Currently uses Splitwise plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly WhatsApp plus Google Calendar.

**Willingness to pay.** Choice: per-trip. Explanation: Evan and Claire Kim prefers per-trip because medium budget sensitivity and calendar and decision alignment. Likely WTP: $39.99 if one couple pays.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 4; clarity: 4; perceived time saved: 4; trust in AI concierge: 3; would invite group: 3; mobile usability: 4; web usability: 4; pricing fit: 3; overall NPS-style sentiment: 25.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if calendar export works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Maybe.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] Couples group trip planner needs the Regular Trips path and calendar export framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Evan and Claire Kim tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Regular Trips creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Regular Trips is right for Plan a four-couple wine-country weekend.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Trip Pass is the best-fit SKU; [SIMULATED RISK] Evan and Claire Kim reacts negatively to paywalls before group commitment.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For mixed users, mobile success depends on invite link clarity, readable schedule, and fast access to calendar export.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for Couples group trip planner | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Evan and Claire Kim understands the anti-fragmentation premise quickly. | [SIMULATED RISK] Couples group trip planner needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen Couples group trip planner proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 8-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Regular Trips workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Regular trip is likely enough, but mode naming may be unclear. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Regular Trips is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 8-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Move trip-specific chatter away from generic group chat | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Trip-specific chat is useful once structured objects also live there. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Chat alone does not beat existing group chat. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Use chat as context around itinerary decisions, not as the main replacement claim. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for calendar and decision alignment. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for One couple coordinating four couples when responsibility is visible. | [SIMULATED RISK] Can feel overkill for casual participants. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] Defaults matter because invitees will not configure settings. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Keep guests/members clear without overcomplication | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Simpler member/guest roles reduce confusion for small groups. | [SIMULATED RISK] Guest role gives too little pre-signup value. | Guest pre-value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Add safe read-only guest preview. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Trip Pass is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: paywall before group is committed. | Trip Pass must appear at the in-product limit moment, not only marketing. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Trip Pass at the moment calendar export creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: polls and schedule. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Regular Trips and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: another chat channel. [SIMULATED RISK]
- Would abandon when: low group adoption. [SIMULATED RISK]
- Would invite others? Yes, cautiously because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “I would pay when it saves me chasing people, not before I know the group will use it.”

### I. Conversion Scores

- Activation: 7/10 — strong organizer value.
- Invite likelihood: 6/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 6/10 — depends on whether calendar export keeps being useful after setup.
- Paid conversion likelihood: 5/10 — best-fit model is Trip Pass.
- NPS-style sentiment: 25.
- Would they pay? Yes / conditional.
- What would they pay? $39.99 if one couple pays.
- What feature creates willingness to pay? calendar export.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A subscription wall before invitees join or the trip has value.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Evan and Claire Kim scenario scenario failed at getting 8 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix calendar export because the synthetic the synthetic Couples group trip planner scenario scenario failed at calendar and decision alignment, causing organizer burnout and lower retention.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Trip Pass because Evan and Claire Kim reached the likely willingness-to-pay moment but needs $39.99 if one couple pays, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Evan and Claire Kim scenario scenario failed at keeping updates useful for 8 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Evan and Claire Kim needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether Couples group trip planner accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next plan a four-couple wine-country weekend, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 10: Marcus Lee — Solo organizer friend-trip planner / Friend who always plans

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Marcus Lee |
| Age range | 29-37 |
| Location/timezone | Chicago, IL / CT |
| Industry / role | Consumer travel / Friend who always plans |
| Tech comfort | high |
| Platform | Android |
| Group size | 9 |
| Planning style | Friend who always plans; current stack Google Docs, GroupMe, Maps, Venmo, ChatGPT |
| Current tools | Google Docs, GroupMe, Maps, Venmo, ChatGPT |
| Main pain points | planner burnout |
| Budget sensitivity | medium |
| Why adopt Chravel | AI that turns chaos into structured itinerary |
| Why reject Chravel | If he still has to copy everything back to GroupMe |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am handling planner burnout, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 9 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 4+ |
| typicalGroupSize | 9–15 |
| mainTools | Google Docs; GroupMe; Maps; Venmo; ChatGPT |
| primaryPlanningDevice | Android |
| wouldDo45MinuteCall | Yes |
| roleInGroup | Co-planner |
| proOpsResponsibility | No |

### D. Full Survey Answers

**About you.** Marcus Lee (persona-10@example.invalid; not provided (synthetic placeholder)) works in Consumer travel from Chicago, IL / CT. Primary use case: Stop being the human router for every friend trip. Platform: Android. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because Friend who always plans needed to coordinate stop being the human router for every friend trip. Involved: About 9 people; Friend who always plans drove planning with some helpers. Most frustrating: planner burnout. Surprisingly well: Google Docs kept the core group reachable, but not organized. Tools: Google Docs, GroupMe, Maps, Venmo, ChatGPT. Total apps: about 7. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in Google Docs, details move to GroupMe, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Marcus sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Money / payments.** Handling today: Currently uses Venmo plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly Google Docs plus GroupMe.

**Willingness to pay.** Choice: subscription. Explanation: Marcus Lee prefers subscription because medium budget sensitivity and planner burnout. Likely WTP: $9.99/mo if repeated trips.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 5; clarity: 4; perceived time saved: 4; trust in AI concierge: 3; would invite group: 3; mobile usability: 4; web usability: 4; pricing fit: 3; overall NPS-style sentiment: 30.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if AI pending actions works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Yes.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] Solo organizer friend-trip planner needs the Regular Trips path and AI pending actions framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Marcus Lee tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Regular Trips creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Regular Trips is right for Stop being the human router for every friend trip.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Explorer is the best-fit SKU; [SIMULATED RISK] Marcus Lee reacts negatively to paywalls before group commitment.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For Android users, mobile success depends on invite link clarity, readable schedule, and fast access to AI pending actions.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for Solo organizer friend-trip planner | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Marcus Lee understands the anti-fragmentation premise quickly. | [SIMULATED RISK] Solo organizer friend-trip planner needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen Solo organizer friend-trip planner proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 9-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Regular Trips workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Regular trip is likely enough, but mode naming may be unclear. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Regular Trips is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 9-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Move trip-specific chatter away from generic group chat | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Trip-specific chat is useful once structured objects also live there. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Chat alone does not beat existing group chat. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Use chat as context around itinerary decisions, not as the main replacement claim. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for planner burnout. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for Friend who always plans when responsibility is visible. | [SIMULATED RISK] Can feel overkill for casual participants. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] Defaults matter because invitees will not configure settings. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Keep guests/members clear without overcomplication | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Simpler member/guest roles reduce confusion for small groups. | [SIMULATED RISK] Guest role gives too little pre-signup value. | Guest pre-value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Add safe read-only guest preview. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Explorer is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: monthly subscription before trip value. | Trip Pass must appear at the in-product limit moment, not only marketing. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Explorer at the moment AI pending actions creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: concierge and itinerary. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Regular Trips and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: invite funnel. [SIMULATED RISK]
- Would abandon when: friends never join. [SIMULATED RISK]
- Would invite others? Maybe/no until invite friction is reduced because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “I do not need another chat app; I need the plan to stop leaking across five places.”

### I. Conversion Scores

- Activation: 8/10 — strong organizer value.
- Invite likelihood: 5/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 7/10 — depends on whether AI pending actions keeps being useful after setup.
- Paid conversion likelihood: 6/10 — best-fit model is Explorer.
- NPS-style sentiment: 30.
- Would they pay? Yes / conditional.
- What would they pay? $9.99/mo if repeated trips.
- What feature creates willingness to pay? AI pending actions.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A subscription wall before invitees join or the trip has value.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Marcus Lee scenario scenario failed at getting 9 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix AI pending actions because the synthetic the synthetic Solo organizer friend-trip planner scenario scenario failed at planner burnout, causing organizer burnout and lower retention.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Explorer because Marcus Lee reached the likely willingness-to-pay moment but needs $9.99/mo if repeated trips, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Marcus Lee scenario scenario failed at keeping updates useful for 9 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Marcus Lee needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether Solo organizer friend-trip planner accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next stop being the human router for every friend trip, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 11: Dana Okafor — NFL travel logistics coordinator / NFL team travel logistics lead

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Dana Okafor |
| Age range | 38-48 |
| Location/timezone | Charlotte, NC / ET |
| Industry / role | Professional sports / NFL team travel logistics lead |
| Tech comfort | high |
| Platform | desktop-first |
| Group size | 95 |
| Planning style | NFL team travel logistics lead; current stack Teamworks, Excel, SMS trees, Concur, Email |
| Current tools | Teamworks, Excel, SMS trees, Concur, Email |
| Main pain points | high-stakes updates |
| Budget sensitivity | low |
| Why adopt Chravel | Role-scoped broadcasts with per-person acknowledgment |
| Why reject Chravel | Stubbed ops tabs or no security posture |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am handling high-stakes updates, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 95 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 4+ |
| typicalGroupSize | 16+ |
| mainTools | Teamworks; Excel; SMS trees; Concur; Email |
| primaryPlanningDevice | Desktop-first |
| wouldDo45MinuteCall | Yes |
| roleInGroup | Primary planner |
| proOpsResponsibility | Yes, I own logistics |

### D. Full Survey Answers

**About you.** Dana Okafor (persona-11@example.invalid; not provided (synthetic placeholder)) works in Professional sports from Charlotte, NC / ET. Primary use case: Manage game-week travel operations for an NFL road game. Platform: desktop-first. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because NFL team travel logistics lead needed to coordinate manage game-week travel operations for an nfl road game. Involved: About 95 people; NFL team travel logistics lead drove planning with some helpers. Most frustrating: high-stakes updates. Surprisingly well: Teamworks kept the core group reachable, but not organized. Tools: Teamworks, Excel, SMS trees, Concur, Email. Total apps: about 7. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in Teamworks, details move to Excel, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Dana sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Pro Trips / Events branch.** Professional-grade means: For NFL travel logistics coordinator, professional-grade means role visibility, reliable notifications, auditability, and no demo-only promises. More control: Roles, invite approvals, broadcast recipients, privacy, schedule edit rights, and media/docs access. Desired automation: Import schedules, send reminders, summarize updates, and produce exportable recaps. Trust creators: Per-recipient logs, clear permissions, security posture, and tested mobile reliability.

**Money / payments.** Handling today: Currently uses Concur plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly Teamworks plus Excel.

**Willingness to pay.** Choice: enterprise. Explanation: Dana Okafor prefers enterprise because low budget sensitivity and high-stakes updates. Likely WTP: Enterprise contract; $500+/mo if real.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 3; clarity: 3; perceived time saved: 3; trust in AI concierge: 3; would invite group: 3; mobile usability: 3; web usability: 4; pricing fit: 2; overall NPS-style sentiment: -35.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if broadcast ack roster works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Yes.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] NFL travel logistics coordinator needs the Pro Trips path and broadcast ack roster framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Dana Okafor tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Pro Trips creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Pro Trips is right for Manage game-week travel operations for an NFL road game.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Enterprise is the best-fit SKU; [SIMULATED RISK] Dana Okafor reacts negatively to mailto-only Pro purchase and unproven ops value.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For desktop-first users, mobile success depends on invite link clarity, readable schedule, and fast access to broadcast ack roster.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for NFL travel logistics coordinator | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Dana Okafor understands the anti-fragmentation premise quickly. | [SIMULATED RISK] NFL travel logistics coordinator needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen NFL travel logistics coordinator proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 95-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Pro Trips workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Pro label matches the job, but paid/gated surfaces must prove ops value immediately. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Pro Trips is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 95-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Send role-appropriate urgent updates and reduce side-channel chaos | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Broadcast/channel promise is strongly relevant. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Broadcast targeting/acknowledgment trust is a recurring high-risk area from prior code-grounded research. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 5 | Medium | Medium | Make role-targeted broadcasts server-enforced with per-recipient read/ack rosters. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for high-stakes updates. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for NFL team travel logistics lead when responsibility is visible. | [SIMULATED RISK] Needs role/bulk assignment at larger group sizes. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] No per-trip mute/batching would drive notification opt-out. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Separate guests, staff, vendors, players, or attendees safely | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Roles are central to professional/event trust. | [SIMULATED RISK] Role promises must be enforced end-to-end, including broadcasts/media/docs. | Some Pro ops/role surfaces are incomplete or hidden on real trips. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Unify roles across invites, broadcasts, media, tasks, and itinerary visibility. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Enterprise is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: mailto/sales before proving ops value. | Self-serve Pro checkout is weak/mailto-oriented; voice/ops value must be honest. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Enterprise at the moment broadcast ack roster creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: role model skeleton. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Pro Trips and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: placeholder logistics. [SIMULATED RISK]
- Would abandon when: broadcast or rooming failure. [SIMULATED RISK]
- Would invite others? Yes, cautiously because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “If you sell me operations, I need operations I can trust at 11 p.m., not a pretty demo tab.”

### I. Conversion Scores

- Activation: 5/10 — partial value with notable trust/setup friction.
- Invite likelihood: 6/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 3/10 — depends on whether broadcast ack roster keeps being useful after setup.
- Paid conversion likelihood: 3/10 — best-fit model is Enterprise.
- NPS-style sentiment: -35.
- Would they pay? Unlikely without major fit changes.
- What would they pay? Enterprise contract; $500+/mo if real.
- What feature creates willingness to pay? broadcast ack roster.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A mailto-only Pro CTA before a working ops demo.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Dana Okafor scenario scenario failed at getting 95 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix broadcast ack roster because the synthetic the synthetic NFL travel logistics coordinator scenario scenario failed at high-stakes updates, causing high-WTP professional churn.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Enterprise because Dana Okafor reached the likely willingness-to-pay moment but needs Enterprise contract; $500+/mo if real, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Dana Okafor scenario scenario failed at keeping updates useful for 95 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Dana Okafor needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether NFL travel logistics coordinator accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next manage game-week travel operations for an nfl road game, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 12: Alicia Grant — NBA team travel operations coordinator / NBA travel ops coordinator

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Alicia Grant |
| Age range | 35-44 |
| Location/timezone | San Francisco, CA / PT |
| Industry / role | Professional sports / NBA travel ops coordinator |
| Tech comfort | high |
| Platform | mixed |
| Group size | 62 |
| Planning style | NBA travel ops coordinator; current stack Teamworks, Google Sheets, Text trees, Airline portals, Concur |
| Current tools | Teamworks, Google Sheets, Text trees, Airline portals, Concur |
| Main pain points | delivery certainty |
| Budget sensitivity | low |
| Why adopt Chravel | Reliable day sheet + roles + broadcasts |
| Why reject Chravel | If demo data exceeds real trip functionality |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am handling delivery certainty, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 62 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 4+ |
| typicalGroupSize | 16+ |
| mainTools | Teamworks; Google Sheets; Text trees; Airline portals; Concur |
| primaryPlanningDevice | Both |
| wouldDo45MinuteCall | Yes |
| roleInGroup | Primary planner |
| proOpsResponsibility | Yes, I own logistics |

### D. Full Survey Answers

**About you.** Alicia Grant (persona-12@example.invalid; not provided (synthetic placeholder)) works in Professional sports from San Francisco, CA / PT. Primary use case: Coordinate NBA road trip logistics and urgent changes. Platform: mixed. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because NBA travel ops coordinator needed to coordinate nba road trip logistics and urgent changes. Involved: About 62 people; NBA travel ops coordinator drove planning with some helpers. Most frustrating: delivery certainty. Surprisingly well: Teamworks kept the core group reachable, but not organized. Tools: Teamworks, Google Sheets, Text trees, Airline portals, Concur. Total apps: about 7. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in Teamworks, details move to Google Sheets, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Alicia sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Pro Trips / Events branch.** Professional-grade means: For NBA team travel operations coordinator, professional-grade means role visibility, reliable notifications, auditability, and no demo-only promises. More control: Roles, invite approvals, broadcast recipients, privacy, schedule edit rights, and media/docs access. Desired automation: Import schedules, send reminders, summarize updates, and produce exportable recaps. Trust creators: Per-recipient logs, clear permissions, security posture, and tested mobile reliability.

**Money / payments.** Handling today: Currently uses Concur plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly Teamworks plus Google Sheets.

**Willingness to pay.** Choice: team plan. Explanation: Alicia Grant prefers team plan because low budget sensitivity and delivery certainty. Likely WTP: $99-$499/mo team plan after pilot.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 3; clarity: 3; perceived time saved: 3; trust in AI concierge: 3; would invite group: 4; mobile usability: 4; web usability: 4; pricing fit: 2; overall NPS-style sentiment: -30.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if day sheet works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Yes.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] NBA team travel operations coordinator needs the Pro Trips path and day sheet framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Alicia Grant tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Pro Trips creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Pro Trips is right for Coordinate NBA road trip logistics and urgent changes.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Pro Growth is the best-fit SKU; [SIMULATED RISK] Alicia Grant reacts negatively to mailto-only Pro purchase and unproven ops value.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For mixed users, mobile success depends on invite link clarity, readable schedule, and fast access to day sheet.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for NBA team travel operations coordinator | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Alicia Grant understands the anti-fragmentation premise quickly. | [SIMULATED RISK] NBA team travel operations coordinator needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen NBA team travel operations coordinator proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 62-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Pro Trips workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Pro label matches the job, but paid/gated surfaces must prove ops value immediately. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Pro Trips is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 62-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Send role-appropriate urgent updates and reduce side-channel chaos | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Broadcast/channel promise is strongly relevant. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Broadcast targeting/acknowledgment trust is a recurring high-risk area from prior code-grounded research. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 5 | Medium | Medium | Make role-targeted broadcasts server-enforced with per-recipient read/ack rosters. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for delivery certainty. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for NBA travel ops coordinator when responsibility is visible. | [SIMULATED RISK] Needs role/bulk assignment at larger group sizes. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] No per-trip mute/batching would drive notification opt-out. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Separate guests, staff, vendors, players, or attendees safely | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Roles are central to professional/event trust. | [SIMULATED RISK] Role promises must be enforced end-to-end, including broadcasts/media/docs. | Some Pro ops/role surfaces are incomplete or hidden on real trips. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Unify roles across invites, broadcasts, media, tasks, and itinerary visibility. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Pro Growth is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: mailto/sales before proving ops value. | Self-serve Pro checkout is weak/mailto-oriented; voice/ops value must be honest. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Pro Growth at the moment day sheet creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: sports category roles. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Pro Trips and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: per-diem/compliance stubs. [SIMULATED RISK]
- Would abandon when: ops data empty. [SIMULATED RISK]
- Would invite others? Yes, cautiously because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “If you sell me operations, I need operations I can trust at 11 p.m., not a pretty demo tab.”

### I. Conversion Scores

- Activation: 5/10 — partial value with notable trust/setup friction.
- Invite likelihood: 7/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 3/10 — depends on whether day sheet keeps being useful after setup.
- Paid conversion likelihood: 3/10 — best-fit model is Pro Growth.
- NPS-style sentiment: -30.
- Would they pay? Unlikely without major fit changes.
- What would they pay? $99-$499/mo team plan after pilot.
- What feature creates willingness to pay? day sheet.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A mailto-only Pro CTA before a working ops demo.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Alicia Grant scenario scenario failed at getting 62 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix day sheet because the synthetic the synthetic NBA team travel operations coordinator scenario scenario failed at delivery certainty, causing high-WTP professional churn.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Pro Growth because Alicia Grant reached the likely willingness-to-pay moment but needs $99-$499/mo team plan after pilot, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Alicia Grant scenario scenario failed at keeping updates useful for 62 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Alicia Grant needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether NBA team travel operations coordinator accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next coordinate nba road trip logistics and urgent changes, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 13: Keisha Freeman — Duke University basketball travel coordinator / D1 basketball ops coordinator

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Keisha Freeman |
| Age range | 32-42 |
| Location/timezone | Durham, NC / ET |
| Industry / role | College athletics / D1 basketball ops coordinator |
| Tech comfort | high |
| Platform | iOS |
| Group size | 48 |
| Planning style | D1 basketball ops coordinator; current stack Teamworks, Email, Excel, GroupMe, Google Drive |
| Current tools | Teamworks, Email, Excel, GroupMe, Google Drive |
| Main pain points | compliance plus communication |
| Budget sensitivity | low-medium |
| Why adopt Chravel | Student-athlete roles and broadcast confirmations |
| Why reject Chravel | No compliance or role-audit credibility |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am handling compliance plus communication, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 48 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 4+ |
| typicalGroupSize | 16+ |
| mainTools | Teamworks; Email; Excel; GroupMe; Google Drive |
| primaryPlanningDevice | iOS |
| wouldDo45MinuteCall | Yes |
| roleInGroup | Primary planner |
| proOpsResponsibility | Yes, I own logistics |

### D. Full Survey Answers

**About you.** Keisha Freeman (persona-13@example.invalid; not provided (synthetic placeholder)) works in College athletics from Durham, NC / ET. Primary use case: Coordinate team travel while protecting student-athlete privacy. Platform: iOS. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because D1 basketball ops coordinator needed to coordinate team travel while protecting student-athlete privacy. Involved: About 48 people; D1 basketball ops coordinator drove planning with some helpers. Most frustrating: compliance plus communication. Surprisingly well: Teamworks kept the core group reachable, but not organized. Tools: Teamworks, Email, Excel, GroupMe, Google Drive. Total apps: about 7. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in Teamworks, details move to Email, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Keisha sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Pro Trips / Events branch.** Professional-grade means: For Duke University basketball travel coordinator, professional-grade means role visibility, reliable notifications, auditability, and no demo-only promises. More control: Roles, invite approvals, broadcast recipients, privacy, schedule edit rights, and media/docs access. Desired automation: Import schedules, send reminders, summarize updates, and produce exportable recaps. Trust creators: Per-recipient logs, clear permissions, security posture, and tested mobile reliability.

**Money / payments.** Handling today: Currently uses manual tracking plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly Teamworks plus Email.

**Willingness to pay.** Choice: team plan. Explanation: Keisha Freeman prefers team plan because low-medium budget sensitivity and compliance plus communication. Likely WTP: Department-paid $49-$99/mo if FERPA-safe.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 4; clarity: 3; perceived time saved: 3; trust in AI concierge: 3; would invite group: 3; mobile usability: 4; web usability: 4; pricing fit: 3; overall NPS-style sentiment: -20.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if role-scoped itinerary works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Yes.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] Duke University basketball travel coordinator needs the Pro Trips path and role-scoped itinerary framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Keisha Freeman tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Pro Trips creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Pro Trips is right for Coordinate team travel while protecting student-athlete privacy.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Pro Starter/Growth is the best-fit SKU; [SIMULATED RISK] Keisha Freeman reacts negatively to mailto-only Pro purchase and unproven ops value.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For iOS users, mobile success depends on invite link clarity, readable schedule, and fast access to role-scoped itinerary.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for Duke University basketball travel coordinator | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Keisha Freeman understands the anti-fragmentation premise quickly. | [SIMULATED RISK] Duke University basketball travel coordinator needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen Duke University basketball travel coordinator proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 48-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Pro Trips workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Pro label matches the job, but paid/gated surfaces must prove ops value immediately. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Pro Trips is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 48-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Send role-appropriate urgent updates and reduce side-channel chaos | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Broadcast/channel promise is strongly relevant. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Broadcast targeting/acknowledgment trust is a recurring high-risk area from prior code-grounded research. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 5 | Medium | Medium | Make role-targeted broadcasts server-enforced with per-recipient read/ack rosters. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for compliance plus communication. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for D1 basketball ops coordinator when responsibility is visible. | [SIMULATED RISK] Needs role/bulk assignment at larger group sizes. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] No per-trip mute/batching would drive notification opt-out. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Separate guests, staff, vendors, players, or attendees safely | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Roles are central to professional/event trust. | [SIMULATED RISK] Role promises must be enforced end-to-end, including broadcasts/media/docs. | Some Pro ops/role surfaces are incomplete or hidden on real trips. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Unify roles across invites, broadcasts, media, tasks, and itinerary visibility. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Pro Starter/Growth is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: mailto/sales before proving ops value. | Self-serve Pro checkout is weak/mailto-oriented; voice/ops value must be honest. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Pro Starter/Growth at the moment role-scoped itinerary creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: approval and roles concept. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Pro Trips and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: marketing overclaims compliance. [SIMULATED RISK]
- Would abandon when: privacy concerns. [SIMULATED RISK]
- Would invite others? Yes, cautiously because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “If you sell me operations, I need operations I can trust at 11 p.m., not a pretty demo tab.”

### I. Conversion Scores

- Activation: 6/10 — partial value with notable trust/setup friction.
- Invite likelihood: 6/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 4/10 — depends on whether role-scoped itinerary keeps being useful after setup.
- Paid conversion likelihood: 4/10 — best-fit model is Pro Starter/Growth.
- NPS-style sentiment: -20.
- Would they pay? Unlikely without major fit changes.
- What would they pay? Department-paid $49-$99/mo if FERPA-safe.
- What feature creates willingness to pay? role-scoped itinerary.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A mailto-only Pro CTA before a working ops demo.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Keisha Freeman scenario scenario failed at getting 48 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix role-scoped itinerary because the synthetic the synthetic Duke University basketball travel coordinator scenario scenario failed at compliance plus communication, causing high-WTP professional churn.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Pro Starter/Growth because Keisha Freeman reached the likely willingness-to-pay moment but needs Department-paid $49-$99/mo if FERPA-safe, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Keisha Freeman scenario scenario failed at keeping updates useful for 48 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Keisha Freeman needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether Duke University basketball travel coordinator accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next coordinate team travel while protecting student-athlete privacy, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 14: Robert Chen — Middle/high school athletic director / Athletic director coordinating teams

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Robert Chen |
| Age range | 45-58 |
| Location/timezone | Raleigh, NC / ET |
| Industry / role | K-12 athletics / Athletic director coordinating teams |
| Tech comfort | medium |
| Platform | desktop-first |
| Group size | 180 |
| Planning style | Athletic director coordinating teams; current stack FinalForms, Google Sheets, Email, Remind, School website |
| Current tools | FinalForms, Google Sheets, Email, Remind, School website |
| Main pain points | multi-team sprawl |
| Budget sensitivity | high |
| Why adopt Chravel | Team templates and broadcasts by sport |
| Why reject Chravel | No multi-team admin or school privacy controls |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am handling multi-team sprawl, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 180 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 4+ |
| typicalGroupSize | 16+ |
| mainTools | FinalForms; Google Sheets; Email; Remind; School website |
| primaryPlanningDevice | Desktop-first |
| wouldDo45MinuteCall | Maybe |
| roleInGroup | Co-planner |
| proOpsResponsibility | Yes, I own logistics |

### D. Full Survey Answers

**About you.** Robert Chen (persona-14@example.invalid; not provided (synthetic placeholder)) works in K-12 athletics from Raleigh, NC / ET. Primary use case: Coordinate multiple school sports trips and parent comms. Platform: desktop-first. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because Athletic director coordinating teams needed to coordinate multiple school sports trips and parent comms. Involved: About 180 people; Athletic director coordinating teams drove planning with some helpers. Most frustrating: multi-team sprawl. Surprisingly well: FinalForms kept the core group reachable, but not organized. Tools: FinalForms, Google Sheets, Email, Remind, School website. Total apps: about 7. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in FinalForms, details move to Google Sheets, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Robert sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Pro Trips / Events branch.** Professional-grade means: For Middle/high school athletic director, professional-grade means role visibility, reliable notifications, auditability, and no demo-only promises. More control: Roles, invite approvals, broadcast recipients, privacy, schedule edit rights, and media/docs access. Desired automation: Import schedules, send reminders, summarize updates, and produce exportable recaps. Trust creators: Per-recipient logs, clear permissions, security posture, and tested mobile reliability.

**Money / payments.** Handling today: Currently uses manual tracking plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly FinalForms plus Google Sheets.

**Willingness to pay.** Choice: team plan. Explanation: Robert Chen prefers team plan because high budget sensitivity and multi-team sprawl. Likely WTP: School-paid annual plan if compliant.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 3; clarity: 3; perceived time saved: 3; trust in AI concierge: 3; would invite group: 3; mobile usability: 3; web usability: 4; pricing fit: 3; overall NPS-style sentiment: -5.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if team templates works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Maybe.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] Middle/high school athletic director needs the Pro Trips path and team templates framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Robert Chen tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Pro Trips creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Pro Trips is right for Coordinate multiple school sports trips and parent comms.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Enterprise is the best-fit SKU; [SIMULATED RISK] Robert Chen reacts negatively to mailto-only Pro purchase and unproven ops value.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For desktop-first users, mobile success depends on invite link clarity, readable schedule, and fast access to team templates.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for Middle/high school athletic director | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Robert Chen understands the anti-fragmentation premise quickly. | [SIMULATED RISK] Middle/high school athletic director needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen Middle/high school athletic director proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 180-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Pro Trips workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Pro label matches the job, but paid/gated surfaces must prove ops value immediately. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Pro Trips is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 180-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Send role-appropriate urgent updates and reduce side-channel chaos | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Broadcast/channel promise is strongly relevant. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Broadcast targeting/acknowledgment trust is a recurring high-risk area from prior code-grounded research. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 5 | Medium | Medium | Make role-targeted broadcasts server-enforced with per-recipient read/ack rosters. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for multi-team sprawl. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Single-basecamp mental model can strain multi-city trips. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for Athletic director coordinating teams when responsibility is visible. | [SIMULATED RISK] Needs role/bulk assignment at larger group sizes. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] No per-trip mute/batching would drive notification opt-out. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Separate guests, staff, vendors, players, or attendees safely | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Roles are central to professional/event trust. | [SIMULATED RISK] Role promises must be enforced end-to-end, including broadcasts/media/docs. | Some Pro ops/role surfaces are incomplete or hidden on real trips. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Unify roles across invites, broadcasts, media, tasks, and itinerary visibility. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Enterprise is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: mailto/sales before proving ops value. | Self-serve Pro checkout is weak/mailto-oriented; voice/ops value must be honest. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Enterprise at the moment team templates creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: centralized sports coordination vision. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Pro Trips and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: single-trip container strain. [SIMULATED RISK]
- Would abandon when: too much manual setup. [SIMULATED RISK]
- Would invite others? Maybe/no until invite friction is reduced because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “If you sell me operations, I need operations I can trust at 11 p.m., not a pretty demo tab.”

### I. Conversion Scores

- Activation: 5/10 — partial value with notable trust/setup friction.
- Invite likelihood: 5/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 4/10 — depends on whether team templates keeps being useful after setup.
- Paid conversion likelihood: 4/10 — best-fit model is Enterprise.
- NPS-style sentiment: -5.
- Would they pay? Unlikely without major fit changes.
- What would they pay? School-paid annual plan if compliant.
- What feature creates willingness to pay? team templates.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A mailto-only Pro CTA before a working ops demo.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Robert Chen scenario scenario failed at getting 180 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix team templates because the synthetic the synthetic Middle/high school athletic director scenario scenario failed at multi-team sprawl, causing high-WTP professional churn.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Enterprise because Robert Chen reached the likely willingness-to-pay moment but needs School-paid annual plan if compliant, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Robert Chen scenario scenario failed at keeping updates useful for 180 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Robert Chen needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether Middle/high school athletic director accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next coordinate multiple school sports trips and parent comms, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 15: Nate Alvarez — Touring comedian tour manager / Tour manager for comedian

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Nate Alvarez |
| Age range | 36-46 |
| Location/timezone | Austin, TX / CT |
| Industry / role | Live entertainment / Tour manager for comedian |
| Tech comfort | high |
| Platform | iOS |
| Group size | 9 |
| Planning style | Tour manager for comedian; current stack Google Calendar, Dropbox, WhatsApp, Master Tour, Email PDFs |
| Current tools | Google Calendar, Dropbox, WhatsApp, Master Tour, Email PDFs |
| Main pain points | day-of ops |
| Budget sensitivity | low |
| Why adopt Chravel | Multi-city basecamps and Smart Import |
| Why reject Chravel | If no day sheet or settlement export |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am handling day-of ops, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 9 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 4+ |
| typicalGroupSize | 5–8 |
| mainTools | Google Calendar; Dropbox; WhatsApp; Master Tour; Email PDFs |
| primaryPlanningDevice | iOS |
| wouldDo45MinuteCall | Yes |
| roleInGroup | Co-planner |
| proOpsResponsibility | Yes, I own logistics |

### D. Full Survey Answers

**About you.** Nate Alvarez (persona-15@example.invalid; not provided (synthetic placeholder)) works in Live entertainment from Austin, TX / CT. Primary use case: Run a 12-city comedy tour with small crew. Platform: iOS. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because Tour manager for comedian needed to coordinate run a 12-city comedy tour with small crew. Involved: About 9 people; Tour manager for comedian drove planning with some helpers. Most frustrating: day-of ops. Surprisingly well: Google Calendar kept the core group reachable, but not organized. Tools: Google Calendar, Dropbox, WhatsApp, Master Tour, Email PDFs. Total apps: about 7. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in Google Calendar, details move to Dropbox, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Nate sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Pro Trips / Events branch.** Professional-grade means: For Touring comedian tour manager, professional-grade means role visibility, reliable notifications, auditability, and no demo-only promises. More control: Roles, invite approvals, broadcast recipients, privacy, schedule edit rights, and media/docs access. Desired automation: Import schedules, send reminders, summarize updates, and produce exportable recaps. Trust creators: Per-recipient logs, clear permissions, security posture, and tested mobile reliability.

**Money / payments.** Handling today: Currently uses manual tracking plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly Google Calendar plus Dropbox.

**Willingness to pay.** Choice: subscription. Explanation: Nate Alvarez prefers subscription because low budget sensitivity and day-of ops. Likely WTP: $49/mo if day sheet real.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 4; clarity: 3; perceived time saved: 3; trust in AI concierge: 3; would invite group: 3; mobile usability: 4; web usability: 4; pricing fit: 3; overall NPS-style sentiment: -15.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if tour day sheet works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Yes.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] Touring comedian tour manager needs the Pro Trips path and tour day sheet framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Nate Alvarez tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Pro Trips creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Pro Trips is right for Run a 12-city comedy tour with small crew.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Pro Starter is the best-fit SKU; [SIMULATED RISK] Nate Alvarez reacts negatively to mailto-only Pro purchase and unproven ops value.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For iOS users, mobile success depends on invite link clarity, readable schedule, and fast access to tour day sheet.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for Touring comedian tour manager | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Nate Alvarez understands the anti-fragmentation premise quickly. | [SIMULATED RISK] Touring comedian tour manager needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen Touring comedian tour manager proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 9-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Pro Trips workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Pro label matches the job, but paid/gated surfaces must prove ops value immediately. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Pro Trips is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 9-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Send role-appropriate urgent updates and reduce side-channel chaos | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Broadcast/channel promise is strongly relevant. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Broadcast targeting/acknowledgment trust is a recurring high-risk area from prior code-grounded research. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 5 | Medium | Medium | Make role-targeted broadcasts server-enforced with per-recipient read/ack rosters. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for day-of ops. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Single-basecamp mental model can strain multi-city trips. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for Tour manager for comedian when responsibility is visible. | [SIMULATED RISK] Can feel overkill for casual participants. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] Defaults matter because invitees will not configure settings. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Separate guests, staff, vendors, players, or attendees safely | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Roles are central to professional/event trust. | [SIMULATED RISK] Role promises must be enforced end-to-end, including broadcasts/media/docs. | Some Pro ops/role surfaces are incomplete or hidden on real trips. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Unify roles across invites, broadcasts, media, tasks, and itinerary visibility. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Pro Starter is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: mailto/sales before proving ops value. | Self-serve Pro checkout is weak/mailto-oriented; voice/ops value must be honest. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Pro Starter at the moment tour day sheet creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: multi-city places potential. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Pro Trips and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: stubbed finance/day-sheet. [SIMULATED RISK]
- Would abandon when: back to PDFs. [SIMULATED RISK]
- Would invite others? Yes, cautiously because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “If you sell me operations, I need operations I can trust at 11 p.m., not a pretty demo tab.”

### I. Conversion Scores

- Activation: 6/10 — partial value with notable trust/setup friction.
- Invite likelihood: 6/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 4/10 — depends on whether tour day sheet keeps being useful after setup.
- Paid conversion likelihood: 4/10 — best-fit model is Pro Starter.
- NPS-style sentiment: -15.
- Would they pay? Unlikely without major fit changes.
- What would they pay? $49/mo if day sheet real.
- What feature creates willingness to pay? tour day sheet.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A mailto-only Pro CTA before a working ops demo.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Nate Alvarez scenario scenario failed at getting 9 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix tour day sheet because the synthetic the synthetic Touring comedian tour manager scenario scenario failed at day-of ops, causing high-WTP professional churn.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Pro Starter because Nate Alvarez reached the likely willingness-to-pay moment but needs $49/mo if day sheet real, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Nate Alvarez scenario scenario failed at keeping updates useful for 9 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Nate Alvarez needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether Touring comedian tour manager accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next run a 12-city comedy tour with small crew, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 16: Maya Bell — Music artist tour manager / Tour manager for 25-city run

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Maya Bell |
| Age range | 40-52 |
| Location/timezone | Nashville, TN / CT |
| Industry / role | Music touring / Tour manager for 25-city run |
| Tech comfort | high |
| Platform | mixed |
| Group size | 38 |
| Planning style | Tour manager for 25-city run; current stack Master Tour, WhatsApp, Dropbox, Google Drive, Excel |
| Current tools | Master Tour, WhatsApp, Dropbox, Google Drive, Excel |
| Main pain points | tour document sprawl |
| Budget sensitivity | low |
| Why adopt Chravel | Smart Import + role channels + tour itinerary |
| Why reject Chravel | No offline reliability or settlement/rider workflow |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am handling tour document sprawl, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 38 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 4+ |
| typicalGroupSize | 16+ |
| mainTools | Master Tour; WhatsApp; Dropbox; Google Drive; Excel |
| primaryPlanningDevice | Both |
| wouldDo45MinuteCall | Yes |
| roleInGroup | Co-planner |
| proOpsResponsibility | Yes, I own logistics |

### D. Full Survey Answers

**About you.** Maya Bell (persona-16@example.invalid; not provided (synthetic placeholder)) works in Music touring from Nashville, TN / CT. Primary use case: Coordinate a music artist tour across 25 cities. Platform: mixed. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because Tour manager for 25-city run needed to coordinate a music artist tour across 25 cities. Involved: About 38 people; Tour manager for 25-city run drove planning with some helpers. Most frustrating: tour document sprawl. Surprisingly well: Master Tour kept the core group reachable, but not organized. Tools: Master Tour, WhatsApp, Dropbox, Google Drive, Excel. Total apps: about 7. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in Master Tour, details move to WhatsApp, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Maya sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Pro Trips / Events branch.** Professional-grade means: For Music artist tour manager, professional-grade means role visibility, reliable notifications, auditability, and no demo-only promises. More control: Roles, invite approvals, broadcast recipients, privacy, schedule edit rights, and media/docs access. Desired automation: Import schedules, send reminders, summarize updates, and produce exportable recaps. Trust creators: Per-recipient logs, clear permissions, security posture, and tested mobile reliability.

**Money / payments.** Handling today: Currently uses manual tracking plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly Master Tour plus WhatsApp.

**Willingness to pay.** Choice: team plan. Explanation: Maya Bell prefers team plan because low budget sensitivity and tour document sprawl. Likely WTP: $99-$299/mo if tour-grade.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 3; clarity: 3; perceived time saved: 3; trust in AI concierge: 3; would invite group: 3; mobile usability: 4; web usability: 4; pricing fit: 2; overall NPS-style sentiment: -25.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if multi-city import works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Yes.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] Music artist tour manager needs the Pro Trips path and multi-city import framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Maya Bell tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Pro Trips creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Pro Trips is right for Coordinate a music artist tour across 25 cities.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Pro Growth is the best-fit SKU; [SIMULATED RISK] Maya Bell reacts negatively to mailto-only Pro purchase and unproven ops value.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For mixed users, mobile success depends on invite link clarity, readable schedule, and fast access to multi-city import.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for Music artist tour manager | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Maya Bell understands the anti-fragmentation premise quickly. | [SIMULATED RISK] Music artist tour manager needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen Music artist tour manager proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 38-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Pro Trips workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Pro label matches the job, but paid/gated surfaces must prove ops value immediately. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Pro Trips is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 38-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Send role-appropriate urgent updates and reduce side-channel chaos | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Broadcast/channel promise is strongly relevant. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Broadcast targeting/acknowledgment trust is a recurring high-risk area from prior code-grounded research. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 5 | Medium | Medium | Make role-targeted broadcasts server-enforced with per-recipient read/ack rosters. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for tour document sprawl. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for Tour manager for 25-city run when responsibility is visible. | [SIMULATED RISK] Needs role/bulk assignment at larger group sizes. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] No per-trip mute/batching would drive notification opt-out. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Separate guests, staff, vendors, players, or attendees safely | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Roles are central to professional/event trust. | [SIMULATED RISK] Role promises must be enforced end-to-end, including broadcasts/media/docs. | Some Pro ops/role surfaces are incomplete or hidden on real trips. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Unify roles across invites, broadcasts, media, tasks, and itinerary visibility. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Pro Growth is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: mailto/sales before proving ops value. | Self-serve Pro checkout is weak/mailto-oriented; voice/ops value must be honest. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Pro Growth at the moment multi-city import creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: role channels concept. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Pro Trips and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: voice/dictation overpromise. [SIMULATED RISK]
- Would abandon when: offline or stubbed ops. [SIMULATED RISK]
- Would invite others? Yes, cautiously because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “If you sell me operations, I need operations I can trust at 11 p.m., not a pretty demo tab.”

### I. Conversion Scores

- Activation: 5/10 — partial value with notable trust/setup friction.
- Invite likelihood: 6/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 3/10 — depends on whether multi-city import keeps being useful after setup.
- Paid conversion likelihood: 3/10 — best-fit model is Pro Growth.
- NPS-style sentiment: -25.
- Would they pay? Unlikely without major fit changes.
- What would they pay? $99-$299/mo if tour-grade.
- What feature creates willingness to pay? multi-city import.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A mailto-only Pro CTA before a working ops demo.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Maya Bell scenario scenario failed at getting 38 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix multi-city import because the synthetic the synthetic Music artist tour manager scenario scenario failed at tour document sprawl, causing high-WTP professional churn.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Pro Growth because Maya Bell reached the likely willingness-to-pay moment but needs $99-$299/mo if tour-grade, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Maya Bell scenario scenario failed at keeping updates useful for 38 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Maya Bell needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether Music artist tour manager accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next coordinate a music artist tour across 25 cities, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 17: Luis Ortega — Production coordinator film shoot / Film production coordinator

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Luis Ortega |
| Age range | 30-39 |
| Location/timezone | Los Angeles, CA / PT |
| Industry / role | Film / production / Film production coordinator |
| Tech comfort | high |
| Platform | desktop-first |
| Group size | 55 |
| Planning style | Film production coordinator; current stack StudioBinder, Google Drive, Email, Slack, PDF call sheets |
| Current tools | StudioBinder, Google Drive, Email, Slack, PDF call sheets |
| Main pain points | last-minute call sheet changes |
| Budget sensitivity | low-medium |
| Why adopt Chravel | Role-based channels + location map |
| Why reject Chravel | If it cannot replace call-sheet workflow |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am handling last-minute call sheet changes, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 55 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 4+ |
| typicalGroupSize | 16+ |
| mainTools | StudioBinder; Google Drive; Email; Slack; PDF call sheets |
| primaryPlanningDevice | Desktop-first |
| wouldDo45MinuteCall | Maybe |
| roleInGroup | Primary planner |
| proOpsResponsibility | Yes, I own logistics |

### D. Full Survey Answers

**About you.** Luis Ortega (persona-17@example.invalid; not provided (synthetic placeholder)) works in Film / production from Los Angeles, CA / PT. Primary use case: Coordinate travel/logistics for location shoot. Platform: desktop-first. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because Film production coordinator needed to coordinate travel/logistics for location shoot. Involved: About 55 people; Film production coordinator drove planning with some helpers. Most frustrating: last-minute call sheet changes. Surprisingly well: StudioBinder kept the core group reachable, but not organized. Tools: StudioBinder, Google Drive, Email, Slack, PDF call sheets. Total apps: about 7. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in StudioBinder, details move to Google Drive, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Luis sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Pro Trips / Events branch.** Professional-grade means: For Production coordinator film shoot, professional-grade means role visibility, reliable notifications, auditability, and no demo-only promises. More control: Roles, invite approvals, broadcast recipients, privacy, schedule edit rights, and media/docs access. Desired automation: Import schedules, send reminders, summarize updates, and produce exportable recaps. Trust creators: Per-recipient logs, clear permissions, security posture, and tested mobile reliability.

**Money / payments.** Handling today: Currently uses manual tracking plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly StudioBinder plus Google Drive.

**Willingness to pay.** Choice: client-billable. Explanation: Luis Ortega prefers client-billable because low-medium budget sensitivity and last-minute call sheet changes. Likely WTP: Client-billable per production.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 3; clarity: 3; perceived time saved: 3; trust in AI concierge: 3; would invite group: 3; mobile usability: 3; web usability: 4; pricing fit: 3; overall NPS-style sentiment: -10.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if PDF/call-sheet import/export works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Maybe.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] Production coordinator film shoot needs the Pro Trips path and PDF/call-sheet import/export framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Luis Ortega tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Pro Trips creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Pro Trips is right for Coordinate travel/logistics for location shoot.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: White-label/client plan is the best-fit SKU; [SIMULATED RISK] Luis Ortega reacts negatively to mailto-only Pro purchase and unproven ops value.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For desktop-first users, mobile success depends on invite link clarity, readable schedule, and fast access to PDF/call-sheet import/export.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for Production coordinator film shoot | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Luis Ortega understands the anti-fragmentation premise quickly. | [SIMULATED RISK] Production coordinator film shoot needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen Production coordinator film shoot proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 55-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Pro Trips workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Pro label matches the job, but paid/gated surfaces must prove ops value immediately. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Pro Trips is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 55-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Send role-appropriate urgent updates and reduce side-channel chaos | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Broadcast/channel promise is strongly relevant. | [SIMULATED RISK] Slack remains primary unless Chravel sends structured updates back. | Broadcast targeting/acknowledgment trust is a recurring high-risk area from prior code-grounded research. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 5 | Medium | Medium | Make role-targeted broadcasts server-enforced with per-recipient read/ack rosters. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for last-minute call sheet changes. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for Film production coordinator when responsibility is visible. | [SIMULATED RISK] Needs role/bulk assignment at larger group sizes. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] No per-trip mute/batching would drive notification opt-out. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Separate guests, staff, vendors, players, or attendees safely | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Roles are central to professional/event trust. | [SIMULATED RISK] Role promises must be enforced end-to-end, including broadcasts/media/docs. | Some Pro ops/role surfaces are incomplete or hidden on real trips. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Unify roles across invites, broadcasts, media, tasks, and itinerary visibility. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] White-label/client plan is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: mailto/sales before proving ops value. | Self-serve Pro checkout is weak/mailto-oriented; voice/ops value must be honest. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer White-label/client plan at the moment PDF/call-sheet import/export creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: places and roles concept. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Pro Trips and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: no call sheet export. [SIMULATED RISK]
- Would abandon when: no production vocabulary. [SIMULATED RISK]
- Would invite others? Maybe/no until invite friction is reduced because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “If you sell me operations, I need operations I can trust at 11 p.m., not a pretty demo tab.”

### I. Conversion Scores

- Activation: 5/10 — partial value with notable trust/setup friction.
- Invite likelihood: 5/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 4/10 — depends on whether PDF/call-sheet import/export keeps being useful after setup.
- Paid conversion likelihood: 4/10 — best-fit model is White-label/client plan.
- NPS-style sentiment: -10.
- Would they pay? Unlikely without major fit changes.
- What would they pay? Client-billable per production.
- What feature creates willingness to pay? PDF/call-sheet import/export.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A mailto-only Pro CTA before a working ops demo.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Luis Ortega scenario scenario failed at getting 55 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix PDF/call-sheet import/export because the synthetic the synthetic Production coordinator film shoot scenario scenario failed at last-minute call sheet changes, causing high-WTP professional churn.”
3. “[SIMULATED RISK] Fix pricing CTA placement for White-label/client plan because Luis Ortega reached the likely willingness-to-pay moment but needs Client-billable per production, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Luis Ortega scenario scenario failed at keeping updates useful for 55 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Luis Ortega needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether Production coordinator film shoot accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next coordinate travel/logistics for location shoot, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 18: Dana Ellis — Corporate offsite planner / People ops lead planning 150-person retreat

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Dana Ellis |
| Age range | 33-41 |
| Location/timezone | Boston, MA / ET |
| Industry / role | Corporate / HR / People ops lead planning 150-person retreat |
| Tech comfort | high |
| Platform | desktop-first |
| Group size | 150 |
| Planning style | People ops lead planning 150-person retreat; current stack Notion, Slack, Google Calendar, Luma, Brex, Sheets |
| Current tools | Notion, Slack, Google Calendar, Luma, Brex, Sheets |
| Main pain points | corporate event sprawl |
| Budget sensitivity | low-medium |
| Why adopt Chravel | Event agenda + broadcasts + GCal export |
| Why reject Chravel | No org ownership, SSO, or reimbursement model |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am handling corporate event sprawl, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 150 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 2–3 |
| typicalGroupSize | 16+ |
| mainTools | Notion; Slack; Google Calendar; Luma; Brex; Sheets |
| primaryPlanningDevice | Desktop-first |
| wouldDo45MinuteCall | Yes |
| roleInGroup | Primary planner |
| proOpsResponsibility | Yes, I own logistics |

### D. Full Survey Answers

**About you.** Dana Ellis (persona-18@example.invalid; not provided (synthetic placeholder)) works in Corporate / HR from Boston, MA / ET. Primary use case: Plan a 150-person company retreat. Platform: desktop-first. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because People ops lead planning 150-person retreat needed to coordinate plan a 150-person company retreat. Involved: About 150 people; People ops lead planning 150-person retreat drove planning with some helpers. Most frustrating: corporate event sprawl. Surprisingly well: Notion kept the core group reachable, but not organized. Tools: Notion, Slack, Google Calendar, Luma, Brex, Sheets. Total apps: about 8. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in Notion, details move to Slack, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Dana sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Pro Trips / Events branch.** Professional-grade means: For Corporate offsite planner, professional-grade means role visibility, reliable notifications, auditability, and no demo-only promises. More control: Roles, invite approvals, broadcast recipients, privacy, schedule edit rights, and media/docs access. Desired automation: Import schedules, send reminders, summarize updates, and produce exportable recaps. Trust creators: Per-recipient logs, clear permissions, security posture, and tested mobile reliability.

**Money / payments.** Handling today: Currently uses Brex plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly Notion plus Slack.

**Willingness to pay.** Choice: client-billable. Explanation: Dana Ellis prefers client-billable because low-medium budget sensitivity and corporate event sprawl. Likely WTP: $199-$499 event pass.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 3; clarity: 3; perceived time saved: 3; trust in AI concierge: 3; would invite group: 3; mobile usability: 3; web usability: 4; pricing fit: 3; overall NPS-style sentiment: -15.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if organizer-paid unlock works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Yes.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] Corporate offsite planner needs the Events path and organizer-paid unlock framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Dana Ellis tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Events creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Events is right for Plan a 150-person company retreat.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Event pass is the best-fit SKU; [SIMULATED RISK] Dana Ellis reacts negatively to paywalls before group commitment.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For desktop-first users, mobile success depends on invite link clarity, readable schedule, and fast access to organizer-paid unlock.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for Corporate offsite planner | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Dana Ellis understands the anti-fragmentation premise quickly. | [SIMULATED RISK] Corporate offsite planner needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen Corporate offsite planner proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 150-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Events workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Event mode fits scale but cap/role semantics need clearer explanation. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Events is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 150-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Send role-appropriate urgent updates and reduce side-channel chaos | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Broadcast/channel promise is strongly relevant. | [SIMULATED RISK] Slack remains primary unless Chravel sends structured updates back. | Broadcast targeting/acknowledgment trust is a recurring high-risk area from prior code-grounded research. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Make role-targeted broadcasts server-enforced with per-recipient read/ack rosters. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for corporate event sprawl. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for People ops lead planning 150-person retreat when responsibility is visible. | [SIMULATED RISK] Needs role/bulk assignment at larger group sizes. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Peer-to-peer split model does not fit reimbursement/company-paid workflows. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add company-payer/reimbursement/export model and atomic settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] No per-trip mute/batching would drive notification opt-out. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Separate guests, staff, vendors, players, or attendees safely | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Roles are central to professional/event trust. | [SIMULATED RISK] Role promises must be enforced end-to-end, including broadcasts/media/docs. | Some Pro ops/role surfaces are incomplete or hidden on real trips. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Unify roles across invites, broadcasts, media, tasks, and itinerary visibility. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Event pass is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: paywall before group is committed. | Trip Pass must appear at the in-product limit moment, not only marketing. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Event pass at the moment organizer-paid unlock creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: agenda and polls. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Events and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: consumer payment model. [SIMULATED RISK]
- Would abandon when: Slack split-brain. [SIMULATED RISK]
- Would invite others? Maybe/no until invite friction is reduced because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “For a group this big, the guest view and notification controls matter more than another planning feature.”

### I. Conversion Scores

- Activation: 5/10 — partial value with notable trust/setup friction.
- Invite likelihood: 5/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 3/10 — depends on whether organizer-paid unlock keeps being useful after setup.
- Paid conversion likelihood: 4/10 — best-fit model is Event pass.
- NPS-style sentiment: -15.
- Would they pay? Unlikely without major fit changes.
- What would they pay? $199-$499 event pass.
- What feature creates willingness to pay? organizer-paid unlock.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A subscription wall before invitees join or the trip has value.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Dana Ellis scenario scenario failed at getting 150 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix organizer-paid unlock because the synthetic the synthetic Corporate offsite planner scenario scenario failed at corporate event sprawl, causing organizer burnout and lower retention.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Event pass because Dana Ellis reached the likely willingness-to-pay moment but needs $199-$499 event pass, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Dana Ellis scenario scenario failed at keeping updates useful for 150 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Dana Ellis needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether Corporate offsite planner accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next plan a 150-person company retreat, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 19: Elaine Park — Executive assistant confidential travel / Executive assistant

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Elaine Park |
| Age range | 42-55 |
| Location/timezone | New York, NY / ET |
| Industry / role | Executive operations / Executive assistant |
| Tech comfort | high |
| Platform | desktop-first |
| Group size | 5 |
| Planning style | Executive assistant; current stack Outlook, Concur, TripIt Pro, Excel, Encrypted email |
| Current tools | Outlook, Concur, TripIt Pro, Excel, Encrypted email |
| Main pain points | confidentiality |
| Budget sensitivity | low |
| Why adopt Chravel | Private itinerary + assistant roles + export |
| Why reject Chravel | Any privacy ambiguity or public link anxiety |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am handling confidentiality, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 5 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 4+ |
| typicalGroupSize | 2–4 |
| mainTools | Outlook; Concur; TripIt Pro; Excel; Encrypted email |
| primaryPlanningDevice | Desktop-first |
| wouldDo45MinuteCall | Maybe |
| roleInGroup | Co-planner |
| proOpsResponsibility | Yes, I own logistics |

### D. Full Survey Answers

**About you.** Elaine Park (persona-19@example.invalid; not provided (synthetic placeholder)) works in Executive operations from New York, NY / ET. Primary use case: Coordinate confidential executive travel and small entourage. Platform: desktop-first. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because Executive assistant needed to coordinate confidential executive travel and small entourage. Involved: About 5 people; Executive assistant drove planning with some helpers. Most frustrating: confidentiality. Surprisingly well: Outlook kept the core group reachable, but not organized. Tools: Outlook, Concur, TripIt Pro, Excel, Encrypted email. Total apps: about 7. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in Outlook, details move to Concur, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Elaine sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Pro Trips / Events branch.** Professional-grade means: For Executive assistant confidential travel, professional-grade means role visibility, reliable notifications, auditability, and no demo-only promises. More control: Roles, invite approvals, broadcast recipients, privacy, schedule edit rights, and media/docs access. Desired automation: Import schedules, send reminders, summarize updates, and produce exportable recaps. Trust creators: Per-recipient logs, clear permissions, security posture, and tested mobile reliability.

**Money / payments.** Handling today: Currently uses Concur plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly Outlook plus Concur.

**Willingness to pay.** Choice: enterprise. Explanation: Elaine Park prefers enterprise because low budget sensitivity and confidentiality. Likely WTP: Enterprise/team plan only if security reviewed.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 3; clarity: 3; perceived time saved: 3; trust in AI concierge: 2; would invite group: 2; mobile usability: 3; web usability: 4; pricing fit: 3; overall NPS-style sentiment: -5.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if private guest roles works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Maybe.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] Executive assistant confidential travel needs the Pro Trips path and private guest roles framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Elaine Park tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Pro Trips creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Pro Trips is right for Coordinate confidential executive travel and small entourage.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Enterprise is the best-fit SKU; [SIMULATED RISK] Elaine Park reacts negatively to mailto-only Pro purchase and unproven ops value.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For desktop-first users, mobile success depends on invite link clarity, readable schedule, and fast access to private guest roles.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for Executive assistant confidential travel | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Elaine Park understands the anti-fragmentation premise quickly. | [SIMULATED RISK] Executive assistant confidential travel needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen Executive assistant confidential travel proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 5-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Pro Trips workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Pro label matches the job, but paid/gated surfaces must prove ops value immediately. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Pro Trips is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 5-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Send role-appropriate urgent updates and reduce side-channel chaos | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Broadcast/channel promise is strongly relevant. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Broadcast targeting/acknowledgment trust is a recurring high-risk area from prior code-grounded research. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 5 | Medium | Medium | Make role-targeted broadcasts server-enforced with per-recipient read/ack rosters. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for confidentiality. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for Executive assistant when responsibility is visible. | [SIMULATED RISK] Can feel overkill for casual participants. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Hallucination/privacy concerns are severe for client/VIP workflows. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Peer-to-peer split model does not fit reimbursement/company-paid workflows. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] Defaults matter because invitees will not configure settings. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Separate guests, staff, vendors, players, or attendees safely | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Roles are central to professional/event trust. | [SIMULATED RISK] Role promises must be enforced end-to-end, including broadcasts/media/docs. | Some Pro ops/role surfaces are incomplete or hidden on real trips. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Unify roles across invites, broadcasts, media, tasks, and itinerary visibility. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Enterprise is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: mailto/sales before proving ops value. | Self-serve Pro checkout is weak/mailto-oriented; voice/ops value must be honest. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Enterprise at the moment private guest roles creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: roles and itinerary. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Pro Trips and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: consumer/public-link feel. [SIMULATED RISK]
- Would abandon when: privacy or AI trust concern. [SIMULATED RISK]
- Would invite others? Maybe/no until invite friction is reduced because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “If you sell me operations, I need operations I can trust at 11 p.m., not a pretty demo tab.”

### I. Conversion Scores

- Activation: 5/10 — partial value with notable trust/setup friction.
- Invite likelihood: 4/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 4/10 — depends on whether private guest roles keeps being useful after setup.
- Paid conversion likelihood: 4/10 — best-fit model is Enterprise.
- NPS-style sentiment: -5.
- Would they pay? Unlikely without major fit changes.
- What would they pay? Enterprise/team plan only if security reviewed.
- What feature creates willingness to pay? private guest roles.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A mailto-only Pro CTA before a working ops demo.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Elaine Park scenario scenario failed at getting 5 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix private guest roles because the synthetic the synthetic Executive assistant confidential travel scenario scenario failed at confidentiality, causing high-WTP professional churn.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Enterprise because Elaine Park reached the likely willingness-to-pay moment but needs Enterprise/team plan only if security reviewed, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Elaine Park scenario scenario failed at keeping updates useful for 5 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Elaine Park needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether Executive assistant confidential travel accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next coordinate confidential executive travel and small entourage, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 20: Camille Dubois — Travel concierge company / Owner of client travel concierge firm

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Camille Dubois |
| Age range | 38-50 |
| Location/timezone | Miami, FL / ET |
| Industry / role | Luxury travel services / Owner of client travel concierge firm |
| Tech comfort | high |
| Platform | desktop-first |
| Group size | 12 |
| Planning style | Owner of client travel concierge firm; current stack AXUS, TravelJoy, WhatsApp, Canva, Google Drive |
| Current tools | AXUS, TravelJoy, WhatsApp, Canva, Google Drive |
| Main pain points | client deliverables |
| Budget sensitivity | low |
| Why adopt Chravel | Smart Import + white-label export |
| Why reject Chravel | Consumer branding or no client-safe guest access |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am handling client deliverables, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 12 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 4+ |
| typicalGroupSize | 9–15 |
| mainTools | AXUS; TravelJoy; WhatsApp; Canva; Google Drive |
| primaryPlanningDevice | Desktop-first |
| wouldDo45MinuteCall | Yes |
| roleInGroup | Co-planner |
| proOpsResponsibility | Yes, I own logistics |

### D. Full Survey Answers

**About you.** Camille Dubois (persona-20@example.invalid; not provided (synthetic placeholder)) works in Luxury travel services from Miami, FL / ET. Primary use case: Organize multiple client itineraries and deliver polished client links. Platform: desktop-first. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because Owner of client travel concierge firm needed to coordinate organize multiple client itineraries and deliver polished client links. Involved: About 12 people; Owner of client travel concierge firm drove planning with some helpers. Most frustrating: client deliverables. Surprisingly well: AXUS kept the core group reachable, but not organized. Tools: AXUS, TravelJoy, WhatsApp, Canva, Google Drive. Total apps: about 7. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in AXUS, details move to TravelJoy, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Camille sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Pro Trips / Events branch.** Professional-grade means: For Travel concierge company, professional-grade means role visibility, reliable notifications, auditability, and no demo-only promises. More control: Roles, invite approvals, broadcast recipients, privacy, schedule edit rights, and media/docs access. Desired automation: Import schedules, send reminders, summarize updates, and produce exportable recaps. Trust creators: Per-recipient logs, clear permissions, security posture, and tested mobile reliability.

**Money / payments.** Handling today: Currently uses manual tracking plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly AXUS plus TravelJoy.

**Willingness to pay.** Choice: subscription. Explanation: Camille Dubois prefers subscription because low budget sensitivity and client deliverables. Likely WTP: $49-$149/mo if white-label.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 4; clarity: 3; perceived time saved: 3; trust in AI concierge: 3; would invite group: 3; mobile usability: 3; web usability: 4; pricing fit: 3; overall NPS-style sentiment: 5.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if white-label PDF/client view works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Yes.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] Travel concierge company needs the Pro Trips path and white-label PDF/client view framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Camille Dubois tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Pro Trips creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Pro Trips is right for Organize multiple client itineraries and deliver polished client links.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: White-label/client plan is the best-fit SKU; [SIMULATED RISK] Camille Dubois reacts negatively to mailto-only Pro purchase and unproven ops value.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For desktop-first users, mobile success depends on invite link clarity, readable schedule, and fast access to white-label PDF/client view.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for Travel concierge company | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Camille Dubois understands the anti-fragmentation premise quickly. | [SIMULATED RISK] Travel concierge company needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen Travel concierge company proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 12-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Pro Trips workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Pro label matches the job, but paid/gated surfaces must prove ops value immediately. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Pro Trips is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 12-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Send role-appropriate urgent updates and reduce side-channel chaos | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Broadcast/channel promise is strongly relevant. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Broadcast targeting/acknowledgment trust is a recurring high-risk area from prior code-grounded research. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 5 | Medium | Medium | Make role-targeted broadcasts server-enforced with per-recipient read/ack rosters. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for client deliverables. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for Owner of client travel concierge firm when responsibility is visible. | [SIMULATED RISK] Can feel overkill for casual participants. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] Defaults matter because invitees will not configure settings. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Separate guests, staff, vendors, players, or attendees safely | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Roles are central to professional/event trust. | [SIMULATED RISK] Role promises must be enforced end-to-end, including broadcasts/media/docs. | Some Pro ops/role surfaces are incomplete or hidden on real trips. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Unify roles across invites, broadcasts, media, tasks, and itinerary visibility. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] White-label/client plan is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: mailto/sales before proving ops value. | Self-serve Pro checkout is weak/mailto-oriented; voice/ops value must be honest. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer White-label/client plan at the moment white-label PDF/client view creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: Smart Import scope. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Pro Trips and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: export branding/account wall. [SIMULATED RISK]
- Would abandon when: looks like consumer app. [SIMULATED RISK]
- Would invite others? Maybe/no until invite friction is reduced because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “If you sell me operations, I need operations I can trust at 11 p.m., not a pretty demo tab.”

### I. Conversion Scores

- Activation: 6/10 — partial value with notable trust/setup friction.
- Invite likelihood: 5/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 5/10 — depends on whether white-label PDF/client view keeps being useful after setup.
- Paid conversion likelihood: 6/10 — best-fit model is White-label/client plan.
- NPS-style sentiment: 5.
- Would they pay? Yes / conditional.
- What would they pay? $49-$149/mo if white-label.
- What feature creates willingness to pay? white-label PDF/client view.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A mailto-only Pro CTA before a working ops demo.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Camille Dubois scenario scenario failed at getting 12 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix white-label PDF/client view because the synthetic the synthetic Travel concierge company scenario scenario failed at client deliverables, causing high-WTP professional churn.”
3. “[SIMULATED RISK] Fix pricing CTA placement for White-label/client plan because Camille Dubois reached the likely willingness-to-pay moment but needs $49-$149/mo if white-label, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Camille Dubois scenario scenario failed at keeping updates useful for 12 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Camille Dubois needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether Travel concierge company accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next organize multiple client itineraries and deliver polished client links, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 21: Harper Sloan — Wedding planner managing vendors and guests / Professional wedding planner

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Harper Sloan |
| Age range | 34-46 |
| Location/timezone | Charleston, SC / ET |
| Industry / role | Weddings / events / Professional wedding planner |
| Tech comfort | high |
| Platform | iOS |
| Group size | 120 |
| Planning style | Professional wedding planner; current stack Aisle Planner, Google Sheets, Email, Text, Pinterest |
| Current tools | Aisle Planner, Google Sheets, Email, Text, Pinterest |
| Main pain points | separate vendor/guest comms |
| Budget sensitivity | low |
| Why adopt Chravel | Role-specific event broadcasts + guest itinerary |
| Why reject Chravel | If guests need accounts or vendors see guest chatter |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am handling separate vendor/guest comms, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 120 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 4+ |
| typicalGroupSize | 16+ |
| mainTools | Aisle Planner; Google Sheets; Email; Text; Pinterest |
| primaryPlanningDevice | iOS |
| wouldDo45MinuteCall | Maybe |
| roleInGroup | Primary planner |
| proOpsResponsibility | Yes, I own logistics |

### D. Full Survey Answers

**About you.** Harper Sloan (persona-21@example.invalid; not provided (synthetic placeholder)) works in Weddings / events from Charleston, SC / ET. Primary use case: Manage wedding weekend logistics for vendors and guests. Platform: iOS. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because Professional wedding planner needed to coordinate manage wedding weekend logistics for vendors and guests. Involved: About 120 people; Professional wedding planner drove planning with some helpers. Most frustrating: separate vendor/guest comms. Surprisingly well: Aisle Planner kept the core group reachable, but not organized. Tools: Aisle Planner, Google Sheets, Email, Text, Pinterest. Total apps: about 7. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in Aisle Planner, details move to Google Sheets, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Harper sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Pro Trips / Events branch.** Professional-grade means: For Wedding planner managing vendors and guests, professional-grade means role visibility, reliable notifications, auditability, and no demo-only promises. More control: Roles, invite approvals, broadcast recipients, privacy, schedule edit rights, and media/docs access. Desired automation: Import schedules, send reminders, summarize updates, and produce exportable recaps. Trust creators: Per-recipient logs, clear permissions, security posture, and tested mobile reliability.

**Money / payments.** Handling today: Currently uses manual tracking plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly Aisle Planner plus Google Sheets.

**Willingness to pay.** Choice: client-billable. Explanation: Harper Sloan prefers client-billable because low budget sensitivity and separate vendor/guest comms. Likely WTP: Client-billable $199/event.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 4; clarity: 3; perceived time saved: 3; trust in AI concierge: 3; would invite group: 3; mobile usability: 4; web usability: 4; pricing fit: 3; overall NPS-style sentiment: 5.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if vendor/guest permission split works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Maybe.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] Wedding planner managing vendors and guests needs the Events path and vendor/guest permission split framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Harper Sloan tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Events creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Events is right for Manage wedding weekend logistics for vendors and guests.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Event pass is the best-fit SKU; [SIMULATED RISK] Harper Sloan reacts negatively to paywalls before group commitment.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For iOS users, mobile success depends on invite link clarity, readable schedule, and fast access to vendor/guest permission split.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for Wedding planner managing vendors and guests | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Harper Sloan understands the anti-fragmentation premise quickly. | [SIMULATED RISK] Wedding planner managing vendors and guests needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen Wedding planner managing vendors and guests proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 120-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Events workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Event mode fits scale but cap/role semantics need clearer explanation. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Events is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 120-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Send role-appropriate urgent updates and reduce side-channel chaos | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Broadcast/channel promise is strongly relevant. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Broadcast targeting/acknowledgment trust is a recurring high-risk area from prior code-grounded research. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Make role-targeted broadcasts server-enforced with per-recipient read/ack rosters. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for separate vendor/guest comms. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for Professional wedding planner when responsibility is visible. | [SIMULATED RISK] Needs role/bulk assignment at larger group sizes. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] No per-trip mute/batching would drive notification opt-out. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Separate guests, staff, vendors, players, or attendees safely | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Roles are central to professional/event trust. | [SIMULATED RISK] Role promises must be enforced end-to-end, including broadcasts/media/docs. | Some Pro ops/role surfaces are incomplete or hidden on real trips. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Unify roles across invites, broadcasts, media, tasks, and itinerary visibility. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Event pass is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: paywall before group is committed. | Trip Pass must appear at the in-product limit moment, not only marketing. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Event pass at the moment vendor/guest permission split creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: event communication concept. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Events and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: roles/guest access uncertainty. [SIMULATED RISK]
- Would abandon when: public-link privacy. [SIMULATED RISK]
- Would invite others? Maybe/no until invite friction is reduced because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “For a group this big, the guest view and notification controls matter more than another planning feature.”

### I. Conversion Scores

- Activation: 6/10 — partial value with notable trust/setup friction.
- Invite likelihood: 5/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 5/10 — depends on whether vendor/guest permission split keeps being useful after setup.
- Paid conversion likelihood: 6/10 — best-fit model is Event pass.
- NPS-style sentiment: 5.
- Would they pay? Yes / conditional.
- What would they pay? Client-billable $199/event.
- What feature creates willingness to pay? vendor/guest permission split.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A subscription wall before invitees join or the trip has value.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Harper Sloan scenario scenario failed at getting 120 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix vendor/guest permission split because the synthetic the synthetic Wedding planner managing vendors and guests scenario scenario failed at separate vendor/guest comms, causing organizer burnout and lower retention.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Event pass because Harper Sloan reached the likely willingness-to-pay moment but needs Client-billable $199/event, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Harper Sloan scenario scenario failed at keeping updates useful for 120 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Harper Sloan needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether Wedding planner managing vendors and guests accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next manage wedding weekend logistics for vendors and guests, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 22: Owen Patel — Conference organizer / Professional conference organizer

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Owen Patel |
| Age range | 37-49 |
| Location/timezone | San Jose, CA / PT |
| Industry / role | Events / Professional conference organizer |
| Tech comfort | high |
| Platform | desktop-first |
| Group size | 1000 |
| Planning style | Professional conference organizer; current stack Cvent, Eventbrite, Slack, Google Sheets, Sched |
| Current tools | Cvent, Eventbrite, Slack, Google Sheets, Sched |
| Main pain points | scale and segmentation |
| Budget sensitivity | low |
| Why adopt Chravel | If Chravel complements event app with group coordination |
| Why reject Chravel | Not built for 1,000-person attendee scale |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am handling scale and segmentation, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 1000 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 4+ |
| typicalGroupSize | 16+ |
| mainTools | Cvent; Eventbrite; Slack; Google Sheets; Sched |
| primaryPlanningDevice | Desktop-first |
| wouldDo45MinuteCall | No |
| roleInGroup | Primary planner |
| proOpsResponsibility | Yes, I own logistics |

### D. Full Survey Answers

**About you.** Owen Patel (persona-22@example.invalid; not provided (synthetic placeholder)) works in Events from San Jose, CA / PT. Primary use case: Coordinate a 1,000-person professional event. Platform: desktop-first. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because Professional conference organizer needed to coordinate a 1,000-person professional event. Involved: About 1000 people; Professional conference organizer drove planning with some helpers. Most frustrating: scale and segmentation. Surprisingly well: Cvent kept the core group reachable, but not organized. Tools: Cvent, Eventbrite, Slack, Google Sheets, Sched. Total apps: about 7. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in Cvent, details move to Eventbrite, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Owen sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Pro Trips / Events branch.** Professional-grade means: For Conference organizer, professional-grade means role visibility, reliable notifications, auditability, and no demo-only promises. More control: Roles, invite approvals, broadcast recipients, privacy, schedule edit rights, and media/docs access. Desired automation: Import schedules, send reminders, summarize updates, and produce exportable recaps. Trust creators: Per-recipient logs, clear permissions, security posture, and tested mobile reliability.

**Money / payments.** Handling today: Currently uses manual tracking plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly Cvent plus Eventbrite.

**Willingness to pay.** Choice: enterprise. Explanation: Owen Patel prefers enterprise because low budget sensitivity and scale and segmentation. Likely WTP: Enterprise/event contract.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 3; clarity: 3; perceived time saved: 3; trust in AI concierge: 3; would invite group: 2; mobile usability: 3; web usability: 4; pricing fit: 2; overall NPS-style sentiment: -30.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if event broadcast segmentation works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: No.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] Conference organizer needs the Events path and event broadcast segmentation framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Owen Patel tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Events creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Events is right for Coordinate a 1,000-person professional event.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Enterprise is the best-fit SKU; [SIMULATED RISK] Owen Patel reacts negatively to paywalls before group commitment.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For desktop-first users, mobile success depends on invite link clarity, readable schedule, and fast access to event broadcast segmentation.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for Conference organizer | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Owen Patel understands the anti-fragmentation premise quickly. | [SIMULATED RISK] Conference organizer needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen Conference organizer proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 1000-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Events workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Event mode fits scale but cap/role semantics need clearer explanation. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Events is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 1000-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Send role-appropriate urgent updates and reduce side-channel chaos | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Broadcast/channel promise is strongly relevant. | [SIMULATED RISK] Slack remains primary unless Chravel sends structured updates back. | Broadcast targeting/acknowledgment trust is a recurring high-risk area from prior code-grounded research. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Make role-targeted broadcasts server-enforced with per-recipient read/ack rosters. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for scale and segmentation. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for Professional conference organizer when responsibility is visible. | [SIMULATED RISK] Needs role/bulk assignment at larger group sizes. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] No per-trip mute/batching would drive notification opt-out. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Separate guests, staff, vendors, players, or attendees safely | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Roles are central to professional/event trust. | [SIMULATED RISK] Role promises must be enforced end-to-end, including broadcasts/media/docs. | Some Pro ops/role surfaces are incomplete or hidden on real trips. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Unify roles across invites, broadcasts, media, tasks, and itinerary visibility. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Enterprise is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: paywall before group is committed. | Trip Pass must appear at the in-product limit moment, not only marketing. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Enterprise at the moment event broadcast segmentation creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: staff coordination primitives. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Events and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: consumer trip frame. [SIMULATED RISK]
- Would abandon when: scale/performance risk. [SIMULATED RISK]
- Would invite others? Maybe/no until invite friction is reduced because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “For a group this big, the guest view and notification controls matter more than another planning feature.”

### I. Conversion Scores

- Activation: 3/10 — partial value with notable trust/setup friction.
- Invite likelihood: 3/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 2/10 — depends on whether event broadcast segmentation keeps being useful after setup.
- Paid conversion likelihood: 2/10 — best-fit model is Enterprise.
- NPS-style sentiment: -30.
- Would they pay? Unlikely without major fit changes.
- What would they pay? Enterprise/event contract.
- What feature creates willingness to pay? event broadcast segmentation.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A subscription wall before invitees join or the trip has value.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Owen Patel scenario scenario failed at getting 1000 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix event broadcast segmentation because the synthetic the synthetic Conference organizer scenario scenario failed at scale and segmentation, causing organizer burnout and lower retention.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Enterprise because Owen Patel reached the likely willingness-to-pay moment but needs Enterprise/event contract, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Owen Patel scenario scenario failed at keeping updates useful for 1000 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Owen Patel needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether Conference organizer accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next coordinate a 1,000-person professional event, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 23: Kenzie Hart — Music festival attendee group lead / Friend-group festival organizer

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Kenzie Hart |
| Age range | 24-31 |
| Location/timezone | Denver, CO / MT |
| Industry / role | Consumer events / Friend-group festival organizer |
| Tech comfort | high |
| Platform | iOS |
| Group size | 12 |
| Planning style | Friend-group festival organizer; current stack Instagram, GroupMe, Festival app, Google Maps, Venmo, iCloud Photos |
| Current tools | Instagram, GroupMe, Festival app, Google Maps, Venmo, iCloud Photos |
| Main pain points | keeping group aligned at festival |
| Budget sensitivity | high |
| Why adopt Chravel | Schedule + map + media in one mobile-first space |
| Why reject Chravel | If app depends on constant connectivity |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am handling keeping group aligned at festival, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 12 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 2–3 |
| typicalGroupSize | 9–15 |
| mainTools | Instagram; GroupMe; Festival app; Google Maps; Venmo; iCloud Photos |
| primaryPlanningDevice | iOS |
| wouldDo45MinuteCall | Maybe |
| roleInGroup | Primary planner |
| proOpsResponsibility | No |

### D. Full Survey Answers

**About you.** Kenzie Hart (persona-23@example.invalid; not provided (synthetic placeholder)) works in Consumer events from Denver, CO / MT. Primary use case: Coordinate a festival crew weekend. Platform: iOS. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because Friend-group festival organizer needed to coordinate a festival crew weekend. Involved: About 12 people; Friend-group festival organizer drove planning with some helpers. Most frustrating: keeping group aligned at festival. Surprisingly well: Instagram kept the core group reachable, but not organized. Tools: Instagram, GroupMe, Festival app, Google Maps, Venmo, iCloud Photos. Total apps: about 8. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in Instagram, details move to GroupMe, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Kenzie sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Money / payments.** Handling today: Currently uses Venmo plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly Instagram plus GroupMe.

**Willingness to pay.** Choice: per-trip. Explanation: Kenzie Hart prefers per-trip because high budget sensitivity and keeping group aligned at festival. Likely WTP: $39.99 if group buys in.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 4; clarity: 4; perceived time saved: 4; trust in AI concierge: 3; would invite group: 3; mobile usability: 4; web usability: 4; pricing fit: 3; overall NPS-style sentiment: 20.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if offline schedule snapshot works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Maybe.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] Music festival attendee group lead needs the Regular Trips path and offline schedule snapshot framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Kenzie Hart tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Regular Trips creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Regular Trips is right for Coordinate a festival crew weekend.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Trip Pass is the best-fit SKU; [SIMULATED RISK] Kenzie Hart reacts negatively to paywalls before group commitment.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For iOS users, mobile success depends on invite link clarity, readable schedule, and fast access to offline schedule snapshot.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for Music festival attendee group lead | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Kenzie Hart understands the anti-fragmentation premise quickly. | [SIMULATED RISK] Music festival attendee group lead needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen Music festival attendee group lead proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 12-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Regular Trips workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Regular trip is likely enough, but mode naming may be unclear. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Regular Trips is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 12-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Move trip-specific chatter away from generic group chat | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Trip-specific chat is useful once structured objects also live there. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Chat alone does not beat existing group chat. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Use chat as context around itinerary decisions, not as the main replacement claim. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for keeping group aligned at festival. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for Friend-group festival organizer when responsibility is visible. | [SIMULATED RISK] Can feel overkill for casual participants. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Centralized memories are a delight moment. | [SIMULATED RISK] Existing shared albums may win unless trip context is unique. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] Defaults matter because invitees will not configure settings. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Keep guests/members clear without overcomplication | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Simpler member/guest roles reduce confusion for small groups. | [SIMULATED RISK] Guest role gives too little pre-signup value. | Guest pre-value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Add safe read-only guest preview. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Trip Pass is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: paywall before group is committed. | Trip Pass must appear at the in-product limit moment, not only marketing. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Trip Pass at the moment offline schedule snapshot creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: media and polls. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Regular Trips and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: offline uncertainty. [SIMULATED RISK]
- Would abandon when: festival app already enough. [SIMULATED RISK]
- Would invite others? Yes, cautiously because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “This feels useful for me as the planner; I am less sure my people will follow me into it.”

### I. Conversion Scores

- Activation: 7/10 — strong organizer value.
- Invite likelihood: 6/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 5/10 — depends on whether offline schedule snapshot keeps being useful after setup.
- Paid conversion likelihood: 4/10 — best-fit model is Trip Pass.
- NPS-style sentiment: 20.
- Would they pay? Unlikely without major fit changes.
- What would they pay? $39.99 if group buys in.
- What feature creates willingness to pay? offline schedule snapshot.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A subscription wall before invitees join or the trip has value.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Kenzie Hart scenario scenario failed at getting 12 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix offline schedule snapshot because the synthetic the synthetic Music festival attendee group lead scenario scenario failed at keeping group aligned at festival, causing organizer burnout and lower retention.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Trip Pass because Kenzie Hart reached the likely willingness-to-pay moment but needs $39.99 if group buys in, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Kenzie Hart scenario scenario failed at keeping updates useful for 12 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Kenzie Hart needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether Music festival attendee group lead accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next coordinate a festival crew weekend, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 24: Miles Johnson — Run club race weekend organizer / Run club race weekend lead

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Miles Johnson |
| Age range | 29-41 |
| Location/timezone | Brooklyn, NY / ET |
| Industry / role | Community / fitness / Run club race weekend lead |
| Tech comfort | medium |
| Platform | Android |
| Group size | 28 |
| Planning style | Run club race weekend lead; current stack Strava, WhatsApp, Google Sheets, Eventbrite, Google Photos |
| Current tools | Strava, WhatsApp, Google Sheets, Eventbrite, Google Photos |
| Main pain points | repeat event setup |
| Budget sensitivity | high |
| Why adopt Chravel | Tasks + schedule + media |
| Why reject Chravel | If recurring club events require rebuilding every time |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am handling repeat event setup, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 28 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 4+ |
| typicalGroupSize | 16+ |
| mainTools | Strava; WhatsApp; Google Sheets; Eventbrite; Google Photos |
| primaryPlanningDevice | Android |
| wouldDo45MinuteCall | Maybe |
| roleInGroup | Primary planner |
| proOpsResponsibility | Shared responsibility |

### D. Full Survey Answers

**About you.** Miles Johnson (persona-24@example.invalid; not provided (synthetic placeholder)) works in Community / fitness from Brooklyn, NY / ET. Primary use case: Plan a race weekend for run club members. Platform: Android. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because Run club race weekend lead needed to coordinate plan a race weekend for run club members. Involved: About 28 people; Run club race weekend lead drove planning with some helpers. Most frustrating: repeat event setup. Surprisingly well: Strava kept the core group reachable, but not organized. Tools: Strava, WhatsApp, Google Sheets, Eventbrite, Google Photos. Total apps: about 7. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in Strava, details move to WhatsApp, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Miles sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Pro Trips / Events branch.** Professional-grade means: For Run club race weekend organizer, professional-grade means role visibility, reliable notifications, auditability, and no demo-only promises. More control: Roles, invite approvals, broadcast recipients, privacy, schedule edit rights, and media/docs access. Desired automation: Import schedules, send reminders, summarize updates, and produce exportable recaps. Trust creators: Per-recipient logs, clear permissions, security posture, and tested mobile reliability.

**Money / payments.** Handling today: Currently uses manual tracking plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly Strava plus WhatsApp.

**Willingness to pay.** Choice: free only. Explanation: Miles Johnson prefers free only because high budget sensitivity and repeat event setup. Likely WTP: Free; club might pay $39/event.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 3; clarity: 3; perceived time saved: 3; trust in AI concierge: 3; would invite group: 3; mobile usability: 4; web usability: 4; pricing fit: 2; overall NPS-style sentiment: 0.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if duplicate event/template works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Maybe.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] Run club race weekend organizer needs the Events path and duplicate event/template framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Miles Johnson tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Events creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Events is right for Plan a race weekend for run club members.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Free/Event pass maybe is the best-fit SKU; [SIMULATED RISK] Miles Johnson reacts negatively to paywalls before group commitment.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For Android users, mobile success depends on invite link clarity, readable schedule, and fast access to duplicate event/template.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for Run club race weekend organizer | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Miles Johnson understands the anti-fragmentation premise quickly. | [SIMULATED RISK] Run club race weekend organizer needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen Run club race weekend organizer proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 28-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Events workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Event mode fits scale but cap/role semantics need clearer explanation. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Events is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 28-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Send role-appropriate urgent updates and reduce side-channel chaos | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Broadcast/channel promise is strongly relevant. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Broadcast targeting/acknowledgment trust is a recurring high-risk area from prior code-grounded research. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Make role-targeted broadcasts server-enforced with per-recipient read/ack rosters. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for repeat event setup. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for Run club race weekend lead when responsibility is visible. | [SIMULATED RISK] Can feel overkill for casual participants. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Payment tracking may still reduce awkward reminders. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Centralized memories are a delight moment. | [SIMULATED RISK] Existing shared albums may win unless trip context is unique. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] No per-trip mute/batching would drive notification opt-out. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Separate guests, staff, vendors, players, or attendees safely | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Roles are central to professional/event trust. | [SIMULATED RISK] Role promises must be enforced end-to-end, including broadcasts/media/docs. | Some Pro ops/role surfaces are incomplete or hidden on real trips. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Unify roles across invites, broadcasts, media, tasks, and itinerary visibility. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Free/Event pass maybe is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: paywall before group is committed. | Trip Pass must appear at the in-product limit moment, not only marketing. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Free/Event pass maybe at the moment duplicate event/template creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: tasks for carpools. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Events and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: no recurring template. [SIMULATED RISK]
- Would abandon when: one-off trip model. [SIMULATED RISK]
- Would invite others? Maybe/no until invite friction is reduced because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “For a group this big, the guest view and notification controls matter more than another planning feature.”

### I. Conversion Scores

- Activation: 5/10 — partial value with notable trust/setup friction.
- Invite likelihood: 5/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 4/10 — depends on whether duplicate event/template keeps being useful after setup.
- Paid conversion likelihood: 2/10 — best-fit model is Free/Event pass maybe.
- NPS-style sentiment: 0.
- Would they pay? Unlikely without major fit changes.
- What would they pay? Free; club might pay $39/event.
- What feature creates willingness to pay? duplicate event/template.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A subscription wall before invitees join or the trip has value.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Miles Johnson scenario scenario failed at getting 28 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix duplicate event/template because the synthetic the synthetic Run club race weekend organizer scenario scenario failed at repeat event setup, causing organizer burnout and lower retention.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Free/Event pass maybe because Miles Johnson reached the likely willingness-to-pay moment but needs Free; club might pay $39/event, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Miles Johnson scenario scenario failed at keeping updates useful for 28 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Miles Johnson needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether Run club race weekend organizer accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next plan a race weekend for run club members, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 25: Tyler Washington — Fraternity rush chair / Rush chair coordinating daily events

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Tyler Washington |
| Age range | 20-23 |
| Location/timezone | Athens, GA / ET |
| Industry / role | Student org / Rush chair coordinating daily events |
| Tech comfort | high |
| Platform | iOS |
| Group size | 140 |
| Planning style | Rush chair coordinating daily events; current stack GroupMe, Google Sheets, Instagram, Snapchat, Venmo |
| Current tools | GroupMe, Google Sheets, Instagram, Snapchat, Venmo |
| Main pain points | chaos and permissions |
| Budget sensitivity | high |
| Why adopt Chravel | Role channels + daily schedule |
| Why reject Chravel | If any member can delete or leak info |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am handling chaos and permissions, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 140 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 4+ |
| typicalGroupSize | 16+ |
| mainTools | GroupMe; Google Sheets; Instagram; Snapchat; Venmo |
| primaryPlanningDevice | iOS |
| wouldDo45MinuteCall | No |
| roleInGroup | Co-planner |
| proOpsResponsibility | Yes, I own logistics |

### D. Full Survey Answers

**About you.** Tyler Washington (persona-25@example.invalid; not provided (synthetic placeholder)) works in Student org from Athens, GA / ET. Primary use case: Coordinate rush week events and committee tasks. Platform: iOS. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because Rush chair coordinating daily events needed to coordinate rush week events and committee tasks. Involved: About 140 people; Rush chair coordinating daily events drove planning with some helpers. Most frustrating: chaos and permissions. Surprisingly well: GroupMe kept the core group reachable, but not organized. Tools: GroupMe, Google Sheets, Instagram, Snapchat, Venmo. Total apps: about 7. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in GroupMe, details move to Google Sheets, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Tyler sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Pro Trips / Events branch.** Professional-grade means: For Fraternity rush chair, professional-grade means role visibility, reliable notifications, auditability, and no demo-only promises. More control: Roles, invite approvals, broadcast recipients, privacy, schedule edit rights, and media/docs access. Desired automation: Import schedules, send reminders, summarize updates, and produce exportable recaps. Trust creators: Per-recipient logs, clear permissions, security posture, and tested mobile reliability.

**Money / payments.** Handling today: Currently uses Venmo plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly GroupMe plus Google Sheets.

**Willingness to pay.** Choice: team plan. Explanation: Tyler Washington prefers team plan because high budget sensitivity and chaos and permissions. Likely WTP: Chapter-paid $99/season if permissions lock down.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 4; clarity: 3; perceived time saved: 3; trust in AI concierge: 3; would invite group: 4; mobile usability: 4; web usability: 4; pricing fit: 2; overall NPS-style sentiment: -5.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if admin-only destructive actions works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: No.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] Fraternity rush chair needs the Events path and admin-only destructive actions framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Tyler Washington tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Events creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Events is right for Coordinate rush week events and committee tasks.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Event/season pass is the best-fit SKU; [SIMULATED RISK] Tyler Washington reacts negatively to paywalls before group commitment.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For iOS users, mobile success depends on invite link clarity, readable schedule, and fast access to admin-only destructive actions.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for Fraternity rush chair | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Tyler Washington understands the anti-fragmentation premise quickly. | [SIMULATED RISK] Fraternity rush chair needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen Fraternity rush chair proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 140-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Events workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Event mode fits scale but cap/role semantics need clearer explanation. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Events is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 140-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Send role-appropriate urgent updates and reduce side-channel chaos | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Broadcast/channel promise is strongly relevant. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Broadcast targeting/acknowledgment trust is a recurring high-risk area from prior code-grounded research. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Make role-targeted broadcasts server-enforced with per-recipient read/ack rosters. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for chaos and permissions. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for Rush chair coordinating daily events when responsibility is visible. | [SIMULATED RISK] Needs role/bulk assignment at larger group sizes. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] No per-trip mute/batching would drive notification opt-out. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Separate guests, staff, vendors, players, or attendees safely | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Roles are central to professional/event trust. | [SIMULATED RISK] Role promises must be enforced end-to-end, including broadcasts/media/docs. | Some Pro ops/role surfaces are incomplete or hidden on real trips. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Unify roles across invites, broadcasts, media, tasks, and itinerary visibility. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Event/season pass is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: paywall before group is committed. | Trip Pass must appear at the in-product limit moment, not only marketing. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Event/season pass at the moment admin-only destructive actions creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: role channels idea. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Events and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: permissions risk. [SIMULATED RISK]
- Would abandon when: leak/delete incident. [SIMULATED RISK]
- Would invite others? Yes, cautiously because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “For a group this big, the guest view and notification controls matter more than another planning feature.”

### I. Conversion Scores

- Activation: 6/10 — partial value with notable trust/setup friction.
- Invite likelihood: 7/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 4/10 — depends on whether admin-only destructive actions keeps being useful after setup.
- Paid conversion likelihood: 3/10 — best-fit model is Event/season pass.
- NPS-style sentiment: -5.
- Would they pay? Unlikely without major fit changes.
- What would they pay? Chapter-paid $99/season if permissions lock down.
- What feature creates willingness to pay? admin-only destructive actions.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A subscription wall before invitees join or the trip has value.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Tyler Washington scenario scenario failed at getting 140 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix admin-only destructive actions because the synthetic the synthetic Fraternity rush chair scenario scenario failed at chaos and permissions, causing organizer burnout and lower retention.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Event/season pass because Tyler Washington reached the likely willingness-to-pay moment but needs Chapter-paid $99/season if permissions lock down, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Tyler Washington scenario scenario failed at keeping updates useful for 140 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Tyler Washington needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether Fraternity rush chair accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next coordinate rush week events and committee tasks, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 26: Ruth Miller — Church / nonprofit group trip organizer / Mission trip coordinator

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Ruth Miller |
| Age range | 52-64 |
| Location/timezone | Kansas City, MO / CT |
| Industry / role | Nonprofit / faith / Mission trip coordinator |
| Tech comfort | low |
| Platform | mixed |
| Group size | 36 |
| Planning style | Mission trip coordinator; current stack Email, Church app, Google Sheets, WhatsApp, Paper forms |
| Current tools | Email, Church app, Google Sheets, WhatsApp, Paper forms |
| Main pain points | volunteer follow-through |
| Budget sensitivity | very high |
| Why adopt Chravel | Printable schedule + tasks + privacy |
| Why reject Chravel | Too consumer, too expensive, or unclear youth privacy |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am handling volunteer follow-through, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 36 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 1 |
| typicalGroupSize | 16+ |
| mainTools | Email; Church app; Google Sheets; WhatsApp; Paper forms |
| primaryPlanningDevice | Both |
| wouldDo45MinuteCall | Yes |
| roleInGroup | Primary planner |
| proOpsResponsibility | Shared responsibility |

### D. Full Survey Answers

**About you.** Ruth Miller (persona-26@example.invalid; not provided (synthetic placeholder)) works in Nonprofit / faith from Kansas City, MO / CT. Primary use case: Coordinate nonprofit mission trip volunteers. Platform: mixed. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because Mission trip coordinator needed to coordinate nonprofit mission trip volunteers. Involved: About 36 people; Mission trip coordinator drove planning with some helpers. Most frustrating: volunteer follow-through. Surprisingly well: Email kept the core group reachable, but not organized. Tools: Email, Church app, Google Sheets, WhatsApp, Paper forms. Total apps: about 7. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in Email, details move to Church app, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Ruth sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful if it explains itself and never silently changes plans. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Pro Trips / Events branch.** Professional-grade means: For Church / nonprofit group trip organizer, professional-grade means role visibility, reliable notifications, auditability, and no demo-only promises. More control: Roles, invite approvals, broadcast recipients, privacy, schedule edit rights, and media/docs access. Desired automation: Import schedules, send reminders, summarize updates, and produce exportable recaps. Trust creators: Per-recipient logs, clear permissions, security posture, and tested mobile reliability.

**Money / payments.** Handling today: Currently uses manual tracking plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly Email plus Church app.

**Willingness to pay.** Choice: free only. Explanation: Ruth Miller prefers free only because very high budget sensitivity and volunteer follow-through. Likely WTP: Free/discounted nonprofit plan.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 3; clarity: 3; perceived time saved: 3; trust in AI concierge: 3; would invite group: 2; mobile usability: 4; web usability: 4; pricing fit: 2; overall NPS-style sentiment: 5.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if guardian-safe invite works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Yes.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] Church / nonprofit group trip organizer needs the Events path and guardian-safe invite framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Ruth Miller tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Events creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Events is right for Coordinate nonprofit mission trip volunteers.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Nonprofit/event pass is the best-fit SKU; [SIMULATED RISK] Ruth Miller reacts negatively to paywalls before group commitment.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For mixed users, mobile success depends on invite link clarity, readable schedule, and fast access to guardian-safe invite.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for Church / nonprofit group trip organizer | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Ruth Miller understands the anti-fragmentation premise quickly. | [SIMULATED RISK] Church / nonprofit group trip organizer needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen Church / nonprofit group trip organizer proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 36-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Events workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Event mode fits scale but cap/role semantics need clearer explanation. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Events is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 36-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Send role-appropriate urgent updates and reduce side-channel chaos | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Broadcast/channel promise is strongly relevant. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Broadcast targeting/acknowledgment trust is a recurring high-risk area from prior code-grounded research. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Make role-targeted broadcasts server-enforced with per-recipient read/ack rosters. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for volunteer follow-through. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for Mission trip coordinator when responsibility is visible. | [SIMULATED RISK] Needs role/bulk assignment at larger group sizes. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] AI may help if presented as assistant, not autopilot. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Payment tracking may still reduce awkward reminders. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] No per-trip mute/batching would drive notification opt-out. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Separate guests, staff, vendors, players, or attendees safely | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Roles are central to professional/event trust. | [SIMULATED RISK] Role promises must be enforced end-to-end, including broadcasts/media/docs. | Some Pro ops/role surfaces are incomplete or hidden on real trips. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Unify roles across invites, broadcasts, media, tasks, and itinerary visibility. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Nonprofit/event pass is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: paywall before group is committed. | Trip Pass must appear at the in-product limit moment, not only marketing. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Nonprofit/event pass at the moment guardian-safe invite creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: tasks and schedule. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Events and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: pricing and account friction. [SIMULATED RISK]
- Would abandon when: trust/privacy concerns. [SIMULATED RISK]
- Would invite others? Maybe/no until invite friction is reduced because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “For a group this big, the guest view and notification controls matter more than another planning feature.”

### I. Conversion Scores

- Activation: 5/10 — partial value with notable trust/setup friction.
- Invite likelihood: 4/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 5/10 — depends on whether guardian-safe invite keeps being useful after setup.
- Paid conversion likelihood: 2/10 — best-fit model is Nonprofit/event pass.
- NPS-style sentiment: 5.
- Would they pay? Unlikely without major fit changes.
- What would they pay? Free/discounted nonprofit plan.
- What feature creates willingness to pay? guardian-safe invite.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A subscription wall before invitees join or the trip has value.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Ruth Miller scenario scenario failed at getting 36 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix guardian-safe invite because the synthetic the synthetic Church / nonprofit group trip organizer scenario scenario failed at volunteer follow-through, causing organizer burnout and lower retention.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Nonprofit/event pass because Ruth Miller reached the likely willingness-to-pay moment but needs Free/discounted nonprofit plan, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Ruth Miller scenario scenario failed at keeping updates useful for 36 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Ruth Miller needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether Church / nonprofit group trip organizer accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next coordinate nonprofit mission trip volunteers, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 27: Janet Kim — School field trip coordinator / Teacher field trip coordinator

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Janet Kim |
| Age range | 44-56 |
| Location/timezone | San Diego, CA / PT |
| Industry / role | Education / Teacher field trip coordinator |
| Tech comfort | medium |
| Platform | desktop-first |
| Group size | 72 |
| Planning style | Teacher field trip coordinator; current stack School email, Permission slips, Google Sheets, Remind, District forms |
| Current tools | School email, Permission slips, Google Sheets, Remind, District forms |
| Main pain points | student safety and parent comms |
| Budget sensitivity | very high |
| Why adopt Chravel | Chaperone tasks and parent schedule view |
| Why reject Chravel | No FERPA/COPPA posture or account-light parent view |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am handling student safety and parent comms, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 72 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 1 |
| typicalGroupSize | 16+ |
| mainTools | School email; Permission slips; Google Sheets; Remind; District forms |
| primaryPlanningDevice | Desktop-first |
| wouldDo45MinuteCall | Maybe |
| roleInGroup | Primary planner |
| proOpsResponsibility | Yes, I own logistics |

### D. Full Survey Answers

**About you.** Janet Kim (persona-27@example.invalid; not provided (synthetic placeholder)) works in Education from San Diego, CA / PT. Primary use case: Coordinate school field trip logistics. Platform: desktop-first. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because Teacher field trip coordinator needed to coordinate school field trip logistics. Involved: About 72 people; Teacher field trip coordinator drove planning with some helpers. Most frustrating: student safety and parent comms. Surprisingly well: School email kept the core group reachable, but not organized. Tools: School email, Permission slips, Google Sheets, Remind, District forms. Total apps: about 7. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in School email, details move to Permission slips, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Janet sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Pro Trips / Events branch.** Professional-grade means: For School field trip coordinator, professional-grade means role visibility, reliable notifications, auditability, and no demo-only promises. More control: Roles, invite approvals, broadcast recipients, privacy, schedule edit rights, and media/docs access. Desired automation: Import schedules, send reminders, summarize updates, and produce exportable recaps. Trust creators: Per-recipient logs, clear permissions, security posture, and tested mobile reliability.

**Money / payments.** Handling today: Currently uses manual tracking plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly School email plus Permission slips.

**Willingness to pay.** Choice: team plan. Explanation: Janet Kim prefers team plan because very high budget sensitivity and student safety and parent comms. Likely WTP: District-paid only.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 3; clarity: 3; perceived time saved: 3; trust in AI concierge: 3; would invite group: 2; mobile usability: 3; web usability: 4; pricing fit: 2; overall NPS-style sentiment: -10.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if parent/chaperone roles works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Maybe.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] School field trip coordinator needs the Events path and parent/chaperone roles framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Janet Kim tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Events creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Events is right for Coordinate school field trip logistics.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Enterprise/nonprofit is the best-fit SKU; [SIMULATED RISK] Janet Kim reacts negatively to paywalls before group commitment.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For desktop-first users, mobile success depends on invite link clarity, readable schedule, and fast access to parent/chaperone roles.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for School field trip coordinator | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Janet Kim understands the anti-fragmentation premise quickly. | [SIMULATED RISK] School field trip coordinator needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen School field trip coordinator proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 72-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Events workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Event mode fits scale but cap/role semantics need clearer explanation. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Events is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 72-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Send role-appropriate urgent updates and reduce side-channel chaos | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Broadcast/channel promise is strongly relevant. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Broadcast targeting/acknowledgment trust is a recurring high-risk area from prior code-grounded research. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Make role-targeted broadcasts server-enforced with per-recipient read/ack rosters. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for student safety and parent comms. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for Teacher field trip coordinator when responsibility is visible. | [SIMULATED RISK] Needs role/bulk assignment at larger group sizes. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Peer-to-peer split model does not fit reimbursement/company-paid workflows. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] No per-trip mute/batching would drive notification opt-out. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Separate guests, staff, vendors, players, or attendees safely | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Roles are central to professional/event trust. | [SIMULATED RISK] Role promises must be enforced end-to-end, including broadcasts/media/docs. | Some Pro ops/role surfaces are incomplete or hidden on real trips. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Unify roles across invites, broadcasts, media, tasks, and itinerary visibility. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Enterprise/nonprofit is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: paywall before group is committed. | Trip Pass must appear at the in-product limit moment, not only marketing. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Enterprise/nonprofit at the moment parent/chaperone roles creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: tasks and roles. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Events and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: student privacy ambiguity. [SIMULATED RISK]
- Would abandon when: district compliance blocker. [SIMULATED RISK]
- Would invite others? Maybe/no until invite friction is reduced because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “For a group this big, the guest view and notification controls matter more than another planning feature.”

### I. Conversion Scores

- Activation: 4/10 — partial value with notable trust/setup friction.
- Invite likelihood: 3/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 3/10 — depends on whether parent/chaperone roles keeps being useful after setup.
- Paid conversion likelihood: 2/10 — best-fit model is Enterprise/nonprofit.
- NPS-style sentiment: -10.
- Would they pay? Unlikely without major fit changes.
- What would they pay? District-paid only.
- What feature creates willingness to pay? parent/chaperone roles.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A subscription wall before invitees join or the trip has value.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Janet Kim scenario scenario failed at getting 72 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix parent/chaperone roles because the synthetic the synthetic School field trip coordinator scenario scenario failed at student safety and parent comms, causing organizer burnout and lower retention.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Enterprise/nonprofit because Janet Kim reached the likely willingness-to-pay moment but needs District-paid only, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Janet Kim scenario scenario failed at keeping updates useful for 72 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Janet Kim needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether School field trip coordinator accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next coordinate school field trip logistics, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 28: Anthony Russo — Price-sensitive bachelor party planner / Bachelor party best man

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Anthony Russo |
| Age range | 28-36 |
| Location/timezone | Philadelphia, PA / ET |
| Industry / role | Consumer travel / Bachelor party best man |
| Tech comfort | medium |
| Platform | Android |
| Group size | 15 |
| Planning style | Bachelor party best man; current stack GroupMe, Venmo, Google Sheets, Airbnb, DraftKings chats |
| Current tools | GroupMe, Venmo, Google Sheets, Airbnb, DraftKings chats |
| Main pain points | collecting money |
| Budget sensitivity | very high |
| Why adopt Chravel | Payment tracker and polls |
| Why reject Chravel | Any subscription or paywall before friends pay him back |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am handling collecting money, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 15 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 2–3 |
| typicalGroupSize | 9–15 |
| mainTools | GroupMe; Venmo; Google Sheets; Airbnb; DraftKings chats |
| primaryPlanningDevice | Android |
| wouldDo45MinuteCall | No |
| roleInGroup | Co-planner |
| proOpsResponsibility | No |

### D. Full Survey Answers

**About you.** Anthony Russo (persona-28@example.invalid; not provided (synthetic placeholder)) works in Consumer travel from Philadelphia, PA / ET. Primary use case: Plan a bachelor party where people are slow to pay. Platform: Android. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because Bachelor party best man needed to coordinate plan a bachelor party where people are slow to pay. Involved: About 15 people; Bachelor party best man drove planning with some helpers. Most frustrating: collecting money. Surprisingly well: GroupMe kept the core group reachable, but not organized. Tools: GroupMe, Venmo, Google Sheets, Airbnb, DraftKings chats. Total apps: about 7. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in GroupMe, details move to Venmo, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Anthony sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Money / payments.** Handling today: Currently uses Venmo plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly GroupMe plus Venmo.

**Willingness to pay.** Choice: per-trip. Explanation: Anthony Russo prefers per-trip because very high budget sensitivity and collecting money. Likely WTP: Only if trip pass is under $40 and saves money fights.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 4; clarity: 4; perceived time saved: 3; trust in AI concierge: 3; would invite group: 3; mobile usability: 4; web usability: 4; pricing fit: 2; overall NPS-style sentiment: 5.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if deposit tracker + reminders works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: No.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] Price-sensitive bachelor party planner needs the Regular Trips path and deposit tracker + reminders framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Anthony Russo tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Regular Trips creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Regular Trips is right for Plan a bachelor party where people are slow to pay.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Trip Pass is the best-fit SKU; [SIMULATED RISK] Anthony Russo reacts negatively to paywalls before group commitment.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For Android users, mobile success depends on invite link clarity, readable schedule, and fast access to deposit tracker + reminders.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for Price-sensitive bachelor party planner | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Anthony Russo understands the anti-fragmentation premise quickly. | [SIMULATED RISK] Price-sensitive bachelor party planner needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen Price-sensitive bachelor party planner proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 15-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Regular Trips workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Regular trip is likely enough, but mode naming may be unclear. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Regular Trips is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 15-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Move trip-specific chatter away from generic group chat | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Trip-specific chat is useful once structured objects also live there. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Chat alone does not beat existing group chat. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Use chat as context around itinerary decisions, not as the main replacement claim. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for collecting money. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for Bachelor party best man when responsibility is visible. | [SIMULATED RISK] Can feel overkill for casual participants. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] Defaults matter because invitees will not configure settings. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Keep guests/members clear without overcomplication | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Simpler member/guest roles reduce confusion for small groups. | [SIMULATED RISK] Guest role gives too little pre-signup value. | Guest pre-value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Add safe read-only guest preview. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Trip Pass is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: paywall before group is committed. | Trip Pass must appear at the in-product limit moment, not only marketing. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Trip Pass at the moment deposit tracker + reminders creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: payment visibility. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Regular Trips and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: monthly subscription. [SIMULATED RISK]
- Would abandon when: Venmo still required and app costs extra. [SIMULATED RISK]
- Would invite others? Maybe/no until invite friction is reduced because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “This feels useful for me as the planner; I am less sure my people will follow me into it.”

### I. Conversion Scores

- Activation: 6/10 — partial value with notable trust/setup friction.
- Invite likelihood: 5/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 4/10 — depends on whether deposit tracker + reminders keeps being useful after setup.
- Paid conversion likelihood: 3/10 — best-fit model is Trip Pass.
- NPS-style sentiment: 5.
- Would they pay? Unlikely without major fit changes.
- What would they pay? Only if trip pass is under $40 and saves money fights.
- What feature creates willingness to pay? deposit tracker + reminders.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A subscription wall before invitees join or the trip has value.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Anthony Russo scenario scenario failed at getting 15 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix deposit tracker + reminders because the synthetic the synthetic Price-sensitive bachelor party planner scenario scenario failed at collecting money, causing organizer burnout and lower retention.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Trip Pass because Anthony Russo reached the likely willingness-to-pay moment but needs Only if trip pass is under $40 and saves money fights, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Anthony Russo scenario scenario failed at keeping updates useful for 15 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Anthony Russo needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether Price-sensitive bachelor party planner accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next plan a bachelor party where people are slow to pay, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 29: Vivienne Stone — Luxury travel advisor / Luxury travel advisor serving affluent clients

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Vivienne Stone |
| Age range | 45-57 |
| Location/timezone | Palm Beach, FL / ET |
| Industry / role | Luxury travel / Luxury travel advisor serving affluent clients |
| Tech comfort | medium |
| Platform | desktop-first |
| Group size | 6 |
| Planning style | Luxury travel advisor serving affluent clients; current stack Axus, Travefy, WhatsApp, Email PDFs, Canva |
| Current tools | Axus, Travefy, WhatsApp, Email PDFs, Canva |
| Main pain points | client polish |
| Budget sensitivity | low |
| Why adopt Chravel | White-label export + import |
| Why reject Chravel | AI trust, client account wall, consumer branding |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am handling client polish, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 6 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 4+ |
| typicalGroupSize | 5–8 |
| mainTools | Axus; Travefy; WhatsApp; Email PDFs; Canva |
| primaryPlanningDevice | Desktop-first |
| wouldDo45MinuteCall | Yes |
| roleInGroup | Co-planner |
| proOpsResponsibility | Yes, I own logistics |

### D. Full Survey Answers

**About you.** Vivienne Stone (persona-29@example.invalid; not provided (synthetic placeholder)) works in Luxury travel from Palm Beach, FL / ET. Primary use case: Deliver elegant client itineraries and live updates. Platform: desktop-first. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because Luxury travel advisor serving affluent clients needed to coordinate deliver elegant client itineraries and live updates. Involved: About 6 people; Luxury travel advisor serving affluent clients drove planning with some helpers. Most frustrating: client polish. Surprisingly well: Axus kept the core group reachable, but not organized. Tools: Axus, Travefy, WhatsApp, Email PDFs, Canva. Total apps: about 7. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in Axus, details move to Travefy, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Vivienne sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Pro Trips / Events branch.** Professional-grade means: For Luxury travel advisor, professional-grade means role visibility, reliable notifications, auditability, and no demo-only promises. More control: Roles, invite approvals, broadcast recipients, privacy, schedule edit rights, and media/docs access. Desired automation: Import schedules, send reminders, summarize updates, and produce exportable recaps. Trust creators: Per-recipient logs, clear permissions, security posture, and tested mobile reliability.

**Money / payments.** Handling today: Currently uses manual tracking plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly Axus plus Travefy.

**Willingness to pay.** Choice: subscription. Explanation: Vivienne Stone prefers subscription because low budget sensitivity and client polish. Likely WTP: $49-$149/mo if client-ready.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 4; clarity: 3; perceived time saved: 3; trust in AI concierge: 2; would invite group: 2; mobile usability: 3; web usability: 4; pricing fit: 3; overall NPS-style sentiment: 0.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if white-label read-only link works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Yes.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] Luxury travel advisor needs the Pro Trips path and white-label read-only link framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Vivienne Stone tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Pro Trips creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Pro Trips is right for Deliver elegant client itineraries and live updates.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: White-label/client plan is the best-fit SKU; [SIMULATED RISK] Vivienne Stone reacts negatively to mailto-only Pro purchase and unproven ops value.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For desktop-first users, mobile success depends on invite link clarity, readable schedule, and fast access to white-label read-only link.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for Luxury travel advisor | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Vivienne Stone understands the anti-fragmentation premise quickly. | [SIMULATED RISK] Luxury travel advisor needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen Luxury travel advisor proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 6-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Pro Trips workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Pro label matches the job, but paid/gated surfaces must prove ops value immediately. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Pro Trips is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 6-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Send role-appropriate urgent updates and reduce side-channel chaos | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Broadcast/channel promise is strongly relevant. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Broadcast targeting/acknowledgment trust is a recurring high-risk area from prior code-grounded research. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 5 | Medium | Medium | Make role-targeted broadcasts server-enforced with per-recipient read/ack rosters. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for client polish. | [SIMULATED RISK] Schedule changes need push/broadcast confidence, not just editable events. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Must beat Google Maps saved lists. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for Luxury travel advisor serving affluent clients when responsibility is visible. | [SIMULATED RISK] Can feel overkill for casual participants. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Hallucination/privacy concerns are severe for client/VIP workflows. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] Defaults matter because invitees will not configure settings. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Separate guests, staff, vendors, players, or attendees safely | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Roles are central to professional/event trust. | [SIMULATED RISK] Role promises must be enforced end-to-end, including broadcasts/media/docs. | Some Pro ops/role surfaces are incomplete or hidden on real trips. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Unify roles across invites, broadcasts, media, tasks, and itinerary visibility. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] White-label/client plan is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: mailto/sales before proving ops value. | Self-serve Pro checkout is weak/mailto-oriented; voice/ops value must be honest. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer White-label/client plan at the moment white-label read-only link creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: AI/import promise. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Pro Trips and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: trust/branding gaps. [SIMULATED RISK]
- Would abandon when: one client embarrassment. [SIMULATED RISK]
- Would invite others? Maybe/no until invite friction is reduced because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “If you sell me operations, I need operations I can trust at 11 p.m., not a pretty demo tab.”

### I. Conversion Scores

- Activation: 6/10 — partial value with notable trust/setup friction.
- Invite likelihood: 4/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 5/10 — depends on whether white-label read-only link keeps being useful after setup.
- Paid conversion likelihood: 6/10 — best-fit model is White-label/client plan.
- NPS-style sentiment: 0.
- Would they pay? Yes / conditional.
- What would they pay? $49-$149/mo if client-ready.
- What feature creates willingness to pay? white-label read-only link.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A mailto-only Pro CTA before a working ops demo.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Vivienne Stone scenario scenario failed at getting 6 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix white-label read-only link because the synthetic the synthetic Luxury travel advisor scenario scenario failed at client polish, causing high-WTP professional churn.”
3. “[SIMULATED RISK] Fix pricing CTA placement for White-label/client plan because Vivienne Stone reached the likely willingness-to-pay moment but needs $49-$149/mo if client-ready, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Vivienne Stone scenario scenario failed at keeping updates useful for 6 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Vivienne Stone needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether Luxury travel advisor accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next deliver elegant client itineraries and live updates, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”


---

## Persona 30: Amara Mensah — International multilingual/timezone group organizer / Organizer of international friend/family trip

### A. Profile

| Field | Answer |
| --- | --- |
| Name | Amara Mensah |
| Age range | 31-43 |
| Location/timezone | London, UK / GMT |
| Industry / role | Consumer international travel / Organizer of international friend/family trip |
| Tech comfort | high |
| Platform | mixed |
| Group size | 18 |
| Planning style | Organizer of international friend/family trip; current stack WhatsApp, Google Translate, Google Sheets, Wise, Google Calendar, Airline emails |
| Current tools | WhatsApp, Google Translate, Google Sheets, Wise, Google Calendar, Airline emails |
| Main pain points | timezone and language confusion |
| Budget sensitivity | medium |
| Why adopt Chravel | Timezone-aware itinerary and import |
| Why reject Chravel | If times/currencies/language support feels US-centric |

### B. Jobs-to-Be-Done

- [SYNTHETIC JTBD] “When I am handling timezone and language confusion, I want to keep the itinerary, addresses, and decisions in one shared place, so I can stop answering the same question repeatedly.”
- [SYNTHETIC JTBD] “When I am inviting 18 people, I want them to see value before creating an account, so I can avoid losing the group at the first tap.”
- [SYNTHETIC JTBD] “When plans change, I want the update to reach the right people clearly, so I can avoid stale screenshots and side-channel confusion.”
- [SYNTHETIC JTBD] “When responsibilities or payments are involved, I want ownership to be visible, so I can stop privately chasing non-responders.”
- [SYNTHETIC JTBD] “When I hit a limit or paid feature, I want the offer to match this trip, so I can decide quickly whether Chravel is worth paying for.”
- [SYNTHETIC JTBD] “When AI or import changes shared trip data, I want confirmation and source context, so I can trust what gets added.”

### C. Screener Answers

| Question | Answer |
| --- | --- |
| groupTripsLast12Months | 2–3 |
| typicalGroupSize | 16+ |
| mainTools | WhatsApp; Google Translate; Google Sheets; Wise; Google Calendar; Airline emails |
| primaryPlanningDevice | Both |
| wouldDo45MinuteCall | Maybe |
| roleInGroup | Co-planner |
| proOpsResponsibility | Shared responsibility |

### D. Full Survey Answers

**About you.** Amara Mensah (persona-30@example.invalid; not provided (synthetic placeholder)) works in Consumer international travel from London, UK / GMT. Primary use case: Coordinate a multilingual Portugal trip across timezones. Platform: mixed. Used Chravel before: Not yet.

**Most recent / next group trip.** It kicked off because Organizer of international friend/family trip needed to coordinate a multilingual portugal trip across timezones. Involved: About 18 people; Organizer of international friend/family trip drove planning with some helpers. Most frustrating: timezone and language confusion. Surprisingly well: WhatsApp kept the core group reachable, but not organized. Tools: WhatsApp, Google Translate, Google Sheets, Wise, Google Calendar, Airline emails. Total apps: about 8. Right after first plan: The first plan was screenshotted, forwarded, revised in chat, then partially copied into a sheet or calendar.

**Planning workflow.** Idea starts in WhatsApp, details move to Google Translate, confirmations arrive by email/link/PDF, decisions happen in chat, and the organizer manually reconciles final plan during the trip. Decisions get stuck when non-responders or budget-sensitive participants avoid committing. If someone does not respond, Amara sends a direct message or tags them in the main thread. [SYNTHETIC EXAMPLE THREAD] Example thread: “Can everyone confirm dinner by tonight? I need final count / deposit / bus timing before I book.”

**Feature areas.** Create / Invite: Easier mode selection, fewer required steps before value, and invitees seeing itinerary preview before signup. Places: Save lodging/venues/restaurants from Google Maps, links, screenshots, or AI suggestions; Basecamp works best for single-city trips. Calendar / Itinerary: Needs local-time clarity, schedule-change confidence, and export/share options. Polls / Decisions: Used for restaurants, lodging, activities, times, or event choices; votes currently live in chat reactions or spreadsheets. Tasks / Responsibilities: Useful when ownership matters; overkill if casual unless templates make it light. Smart Import: Most wanted imports: confirmations, PDFs, screenshots, event schedules, flight info, hotel links, and long chat threads. AI Concierge: Helpful for recommendations and turning messy input into structured itinerary/actions. AI Trust: Would not trust hallucinated hours/prices, missing source links, private data exposure, or AI writing without confirmation. Settings: Notification controls, privacy, guest/member roles, link visibility, and data-sharing settings matter most.

**Money / payments.** Handling today: Currently uses manual tracking plus spreadsheets/messages. Easiest reimbursement discussion: Discuss reimbursement with clear item, owner, due date, amount, and payment rail. Plan changes: Posts update in chat/email and edits the source doc/calendar if remembered. One planner: Yes, one person usually does most planning. Decisions: Hotels/restaurants/activities are decided by chat consensus, polls, budget constraints, or planner choice. Conversation location: Mostly WhatsApp plus Google Translate.

**Willingness to pay.** Choice: per-trip. Explanation: Amara Mensah prefers per-trip because medium budget sensitivity and timezone and language confusion. Likely WTP: $39.99 if timezone/currency works.

**Ratings (1-5 unless NPS-style).** Likelihood to use: 4; clarity: 4; perceived time saved: 3; trust in AI concierge: 3; would invite group: 3; mobile usability: 4; web usability: 4; pricing fit: 3; overall NPS-style sentiment: 15.

**Wrap-up.** One change: Make the first invited person immediately understand and trust the shared plan. Recommend trigger: Would recommend if timezone/currency clarity works and invite friction is low. Anything else: Synthetic reaction only; needs real beta validation. Open to beta follow-up: Maybe.

### E. Web Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] Discovery: landing communicates “The Group Chat Travel App,” broad use cases, pricing, and login/signup. [SIMULATED RISK] International multilingual/timezone group organizer needs the Regular Trips path and timezone/currency clarity framed sooner.
- [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx] Signup/onboarding: auth modal offers Google/Apple/email and can be closed; onboarding is skippable in source. [SIMULATED RISK] Amara Mensah tolerates setup only after seeing concrete trip value.
- [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] Creation: Regular Trips creation is supported by code paths. [SIMULATED RISK] Mode selection must explain why Regular Trips is right for Coordinate a multilingual Portugal trip across timezones.
- [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] Feature usage: tabs/primitives cover the main workflow; browser demo showed dashboard/cards but not full interactive trip interior. [OBSERVED] Demo limitation reduced direct task execution depth.
- [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] Pricing: Trip Pass is the best-fit SKU; [SIMULATED RISK] Amara Mensah reacts negatively to paywalls before group commitment.
- Web positives: broad feature inventory, pricing visibility, desktop dashboard readability. Web pain points: mode clarity, demo-to-real trust, and invitee-first value.

### F. Mobile / PWA Flow Walkthrough

- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] First impression: iPhone-sized landing remains readable with hamburger nav and visible Login/Signup. [OBSERVED]
- [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] Navigation: source shows native bottom nav and trip-type switcher; browser pass did not reach live in-trip bottom tabs. [OBSERVED]
- [SIMULATED RISK] For mixed users, mobile success depends on invite link clarity, readable schedule, and fast access to timezone/currency clarity.
- [SIMULATED RISK] Chat input/forms/modals must avoid “desktop squeezed down” behavior; large groups need mute/batch controls on mobile.
- [OBSERVED — browser walkthrough 2026-06-28 DevTools console] Performance/perceived speed: browser console showed CSP/PostHog fetch errors and retry logs in local test; not proven user-facing, but it is instrumentation/trust noise to clean up.
- Mobile positives: responsive hero, clear CTA, adequate visible tap targets. Mobile pain points: direct in-trip workflow was not reachable in demo walkthrough; invite and bottom-tab behavior require additional live authenticated testing.

### G. Feature-by-Feature Findings Table

| Feature | Expected goal | Tried | What happened | Positive reaction | Friction | Bug / UX issue | Evidence label | Severity 1-5 | Revenue impact | Retention impact | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing / positioning | Immediately understand Chravel as useful for International multilingual/timezone group organizer | Scenario walked through against live landing/demo where available and current source paths. | Landing observed with “The Group Chat Travel App,” use-case cards, pricing, and login/signup CTA. | [SIMULATED RISK] Amara Mensah understands the anti-fragmentation premise quickly. | [SIMULATED RISK] International multilingual/timezone group organizer needs more specific proof than broad group-trip copy. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/landing/FullPageLanding.tsx; HeroSection.tsx] | 3 | Medium | Medium | Add/use-case deepen International multilingual/timezone group organizer proof points and mode-specific CTAs. |
| Signup / onboarding | Start without losing momentum or being forced through irrelevant setup | Scenario walked through against live landing/demo where available and current source paths. | Auth modal observed with Google, Apple, email/password, forgot password, and close control; onboarding is skippable in code. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Account creation before invitee value is a major adoption risk for 18-person groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — browser walkthrough 2026-06-28; src/components/AuthModal.tsx]; [OBSERVED — src/components/onboarding/OnboardingCarousel.tsx; src/pages/Index.tsx] | 3 | Medium | Medium | Show value/preview before account commitment and keep skip controls prominent. |
| Create trip/event/pro trip | Create the right Regular Trips workspace with dates, location, and context | Scenario walked through against live landing/demo where available and current source paths. | CreateTripModal supports Group, Pro, and Event with required title/dates/timezone and gated Pro/Event logic. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] Regular trip is likely enough, but mode naming may be unclear. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/CreateTripModal.tsx; supabase/functions/create-trip/index.ts; supabase/functions/_shared/tripEntitlementPolicy.ts] | 3 | Medium | Medium | Clarify why Regular Trips is the right starting mode and avoid setup-before-value. |
| Invite / join | Invite the group and let invitees see value before account friction | Scenario walked through against live landing/demo where available and current source paths. | Join routes show pre-auth preview and typed error states; browser demo surfaced Invite/Share buttons on trip cards. | Clear product intent and enough primitives to test the job. | [SIMULATED RISK] 18-person group adoption can fail if invitees must create accounts before seeing itinerary value. | consumer_guest has no resource access, so account-light guest value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts] | 5 | High | High | Add account-light read-only itinerary preview and conditional approval copy. |
| Chat / Broadcast | Move trip-specific chatter away from generic group chat | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Chat; Stream chat and Pro role/broadcast concepts exist in source. | [SIMULATED RISK] Trip-specific chat is useful once structured objects also live there. | [SIMULATED RISK] Users may keep iMessage/WhatsApp unless invite conversion is excellent. | Chat alone does not beat existing group chat. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Use chat as context around itinerary decisions, not as the main replacement claim. |
| Calendar / Itinerary | Create and read a shared schedule under change pressure | Scenario walked through against live landing/demo where available and current source paths. | TripTabs includes Calendar; marketing/demo screenshots showed shared calendar/itinerary concepts. | [SIMULATED RISK] Calendar is a strong fit for timezone and language confusion. | [SIMULATED RISK] Timezone/currency clarity must be explicit for international groups. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Surface itinerary overview, local timezone, change history, and export/share affordances. |
| Places / Basecamp | Save lodging, venues, restaurants, and map context in one place | Scenario walked through against live landing/demo where available and current source paths. | Places/Basecamp is a core tab; source supports Basecamp and Explore patterns. | [SIMULATED RISK] Saved places reduce Maps/Yelp/DM scatter. | [SIMULATED RISK] Single-basecamp mental model can strain multi-city trips. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Support per-leg/per-date basecamps and richer saved-link context. |
| Polls | Turn group decisions into visible outcomes | Scenario walked through against live landing/demo where available and current source paths. | Polls are a core tab and marketing/demo screenshots show voting UI. | [SIMULATED RISK] Decision clarity is one of the most universally understandable wins. | [SIMULATED RISK] Polls only replace chat votes if results lead to a clear next action. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add “turn winner into calendar/place/task” next-step CTA. |
| Tasks | Assign responsibilities with due dates and completion clarity | Scenario walked through against live landing/demo where available and current source paths. | Tasks are a core tab; source supports task surfaces. | [SIMULATED RISK] Useful for Organizer of international friend/family trip when responsibility is visible. | [SIMULATED RISK] Can feel overkill for casual participants. | None observed in direct browser pass; source/audit gaps noted where applicable. | [OBSERVED — src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/MobileTripDetail.tsx] | 3 | Medium | Medium | Add role/bulk assignment and lighter checklist templates. |
| Smart Import | Paste or upload existing confirmations/schedules into structured trip data | Scenario walked through against live landing/demo where available and current source paths. | Smart Import pipeline exists; current code includes one free import taste before paywall. | [SIMULATED RISK] Import is the clearest “magic moment” for artifacts already living elsewhere. | [SIMULATED RISK] Duplicate/accuracy errors would be trust-breaking because imported data looks authoritative. | Prior research flags idempotency/duplicate-risk gaps; should be validated with real artifacts. | [OBSERVED — src/features/smart-import/; src/hooks/useSmartImportTaste.ts; src/features/calendar/components/MobileGroupCalendar.tsx] | 3 | High | Medium | Make preview/cherry-pick and duplicate detection highly visible; preserve one free taste. |
| AI Concierge | Get trip-aware help without losing trust or control | Scenario walked through against live landing/demo where available and current source paths. | AI query limits are code-aligned at Free 3, Explorer 25, paid unlimited; voice path is dictation-only. | [SIMULATED RISK] Trip-aware suggestions are compelling when they create structured actions. | [SIMULATED RISK] Free 3-query limit can interrupt evaluation before habit forms. | Voice concierge entitlement overpromises relative to dictation-only path. | [OBSERVED — src/lib/conciergeTripQueryLimits.ts; src/components/AIConciergeChat.tsx; supabase/functions/lovable-concierge/index.ts; supabase/functions/_shared/voiceProductPath.ts] | 3 | High | Medium | Label voice honestly, show source/confirmation, and expose usage meter/upgrade at natural moments. |
| Payments | Track shared costs or reimbursements without creating money mistakes | Scenario walked through against live landing/demo where available and current source paths. | Payments surface exists for expenses/splits; no in-app money movement; settlement risk noted in prior code-grounded docs. | [SIMULATED RISK] Ledger visibility can reduce organizer burden. | [SIMULATED RISK] Must be more trustworthy than Venmo/Splitwise. | Money errors are severe; prior docs flag settlement atomicity/idempotency risk. | [OBSERVED — src/components/payments/; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 5 | High | High | Add deposit tracker, clear Venmo/Cash App handoff, and idempotent settlement. |
| Media | Collect trip photos/files if it beats existing albums | Scenario walked through against live landing/demo where available and current source paths. | Media hub exists; demo/marketing shows photo/video grid. | [SIMULATED RISK] Useful as retention if it complements the itinerary. | [SIMULATED RISK] Storage/privacy limits must be understandable. | Prior docs flag advisory storage quota / signed URL concerns. | [OBSERVED — src/components/UnifiedMediaHub.tsx; docs/research/synthetic-user-testing/evidence/product-ground-truth.md §10] | 3 | Medium | Medium | Frame media as trip-context album; make storage ownership and privacy explicit. |
| Settings / notifications | Control noise, privacy, sharing, and trip-level alerts | Scenario walked through against live landing/demo where available and current source paths. | Notification/settings surfaces exist in source; browser console showed PostHog/CSP noise during local walkthrough. | [SIMULATED RISK] Granular controls would increase trust. | [SIMULATED RISK] Defaults matter because invitees will not configure settings. | No per-trip mute/batching is a recurring observed gap in product docs. | [OBSERVED — browser walkthrough 2026-06-28; src/components/native/NativeTabBar.tsx; src/components/native/NativeTripTypeSwitcher.tsx; src/pages/MobileTripDetail.tsx] | 4 | Medium | High | Add per-trip/channel mute, digest batching, privacy summary, and role visibility controls. |
| Permissions / roles | Keep guests/members clear without overcomplication | Scenario walked through against live landing/demo where available and current source paths. | Permission matrix distinguishes members/guests/pro roles; consumer_guest has no resource access. | [SIMULATED RISK] Simpler member/guest roles reduce confusion for small groups. | [SIMULATED RISK] Guest role gives too little pre-signup value. | Guest pre-value is constrained. | [OBSERVED — src/pages/JoinTrip.tsx; src/components/invite/InviteModal.tsx; src/types/inviteErrors.ts; src/types/permissionMatrix.generated.ts]; [OBSERVED — src/components/pro/ProTabsConfig.tsx; src/utils/tripConverter.ts; src/types/proCategories.ts] | 5 | High | High | Add safe read-only guest preview. |
| Pricing / upgrade | Meet a relevant paid offer at a natural value moment | Scenario walked through against live landing/demo where available and current source paths. | Pricing observed on landing with Free/Explorer/Frequent Chraveler and Trip Pass/Pro CTAs; Pro remains mailto-oriented in source. | [SIMULATED RISK] Trip Pass is a plausible model for this persona. | [SIMULATED RISK] Worst CTA: paywall before group is committed. | Trip Pass must appear at the in-product limit moment, not only marketing. | [OBSERVED — src/billing/config.ts; src/billing/entitlements.ts; src/components/conversion/PricingSection.tsx; src/components/billing/TripPassModal.tsx] | 5 | High | Medium | Offer Trip Pass at the moment timezone/currency clarity creates value, with clear limits and no bait-and-switch. |

### H. Emotional Reaction

- Impressed by: shared itinerary. [SIMULATED RISK]
- Confused by: mode/role/pricing boundaries when Regular Trips and paid tiers overlap. [SIMULATED RISK]
- Annoyed by: currency/language gaps. [SIMULATED RISK]
- Would abandon when: wrong local time. [SIMULATED RISK]
- Would invite others? Maybe/no until invite friction is reduced because group adoption is the core risk. [SIMULATED RISK]
- [SYNTHETIC QUOTE] “I do not need another chat app; I need the plan to stop leaking across five places.”

### I. Conversion Scores

- Activation: 6/10 — partial value with notable trust/setup friction.
- Invite likelihood: 5/10 — invitee value and account friction drive the score.
- Day-7 retention likelihood: 5/10 — depends on whether timezone/currency clarity keeps being useful after setup.
- Paid conversion likelihood: 5/10 — best-fit model is Trip Pass.
- NPS-style sentiment: 15.
- Would they pay? Yes / conditional.
- What would they pay? $39.99 if timezone/currency works.
- What feature creates willingness to pay? timezone/currency clarity.
- What limit or CTA would trigger upgrade? A trip-level limit hit immediately after visible value.
- What CTA would annoy them? A subscription wall before invitees join or the trip has value.

### J. Top 5 Fixes for This Persona

1. “[SIMULATED RISK] Replace account-first invite behavior with an account-light read-only itinerary preview because the synthetic the synthetic Amara Mensah scenario scenario failed at getting 18 people to see value before signup, causing invite-loop drop-off and lower viral conversion.”
2. “[SIMULATED RISK] Add/fix timezone/currency clarity because the synthetic the synthetic International multilingual/timezone group organizer scenario scenario failed at timezone and language confusion, causing organizer burnout and lower retention.”
3. “[SIMULATED RISK] Fix pricing CTA placement for Trip Pass because Amara Mensah reached the likely willingness-to-pay moment but needs $39.99 if timezone/currency works, causing revenue leakage when the offer is absent or mismatched.”
4. “[SIMULATED RISK] Replace generic notification defaults with per-trip/channel mute and digest controls because the synthetic the synthetic Amara Mensah scenario scenario failed at keeping updates useful for 18 people, causing opt-outs before urgent messages.”
5. “[SIMULATED RISK] Add stronger AI/import trust UI with source preview, duplicate detection, and confirm-before-write because Amara Mensah needs structured automation without hallucinated or duplicated trip data, causing trust loss if automation is opaque.”

### K. Confidence

- Confidence level: Medium.
- What was directly observed: landing, auth modal, demo dashboard/cards, pricing, mobile landing viewport, console errors, and source paths cited above.
- What needs real user validation: willingness to pay, invite completion, AI answer quality, Smart Import accuracy, payment trust, and whether International multilingual/timezone group organizer accepts the mode/SKU framing.
- Suggested real beta interview question: “For your next coordinate a multilingual portugal trip across timezones, what would make you trust Chravel enough to invite the whole group, and what would make you abandon it immediately?”
