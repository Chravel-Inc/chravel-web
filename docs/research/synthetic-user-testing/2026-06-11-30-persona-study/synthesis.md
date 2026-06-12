# ChravelApp 30-Persona Synthetic User Testing — Synthesis

> ⚠️ **Synthetic research.** Aggregated from 30 simulated persona reports (see
> `30-persona-full-report.md`). Labels: [OBSERVED] = grounded in UI/code/docs/screenshots;
> [SIMULATED RISK] = plausible reaction inferred from observed behavior; [HYPOTHESIS] = needs real
> users. Scores are synthetic estimates, not measurements. Method + limits: `README.md`,
> `evidence-delta.md`.

Synthetic conversion averages: Consumer (n=12) activation 7.1, paid 5.0, NPS +17 · Pro (n=11)
activation 4.7, paid 4.4, NPS +3 · Events (n=7) activation 6.3, paid 3.3, NPS +6. The shape, not
the numbers, is the finding: **consumers activate but monetize at the wrong moments; pros want to
pay but hit capability and checkout walls; events personas love the surfaces and can't make the
SKU fit their payer.**

---

## 1. Executive Summary

### 10 strongest signals

1. **The demo-first landing converts attention into product understanding.** Unauthenticated `/`
   drops visitors into a working dashboard; 90 seconds to evaluate, no email gate. Tech-fluent
   personas (7, 23, 25) called it the best first impression they'd seen. [OBSERVED `desktop-01`]
2. **Payments ledger UX is praised across segments** — You Owe / You're Owed / Net, pending vs
   settled, Venmo deeplink (3, 4, 9, 28). [OBSERVED `mobile2-05`]
3. **Polls-with-deadlines hits the universal "group decides nothing" pain** (3, 4, 7, 9, 24);
   average severity 1.6, the lowest-friction feature in the study. [OBSERVED]
4. **Broadcasts/Channels/Messages architecture is the pro comms doctrine, productized.** NBA ops
   (12) called the broadcast tab "my entire job in one screen." [OBSERVED `desktop2-19/20`]
5. **The dark/gold design system reads premium and disciplined** end-to-end (8, 20, 29).
   [OBSERVED screenshots]
6. **Event agenda surfaces feel built by someone who runs events** (21, 22, 23, 25). [OBSERVED]
7. **Invite controls (approval, expiry, max-uses) earn trust with safety-conscious organizers**
   (1, 2, 19, 27). [OBSERVED `desktop2-11`]
8. **The 2026-06-10 fix wave (`3cd1c2a`) closed most of the prior study's monetization chain** —
   split-cap enforcement, usage meter, Trip Pass at limit walls, JoinTrip copy, per-trip mute,
   real PDF export. The product is measurably more sellable than 48h ago. [OBSERVED delta D1–D14]
9. **PDF Recap privacy defaults ("emails and phone numbers hidden") read like enterprise care**
   (13, 19, 20, 29). [OBSERVED `desktop2-21`]
10. **PostHog telemetry is now live** (D12) — the funnel claims in this study can be replaced by
    real numbers within weeks. [OBSERVED]

### 10 biggest risks

1. **The guest wall is the single largest growth blocker.** `consumer_guest` has zero resource
   access (`permissionMatrix.generated.ts:44-50`); 19 of 30 personas independently named
   "people I invite can't see anything without an account" as their abandonment trigger.
   [OBSERVED + SIMULATED RISK]
2. **Pro sells a demo it can't deliver.** Real Pro trips initialize roster/rooms/schedule/
   settlement/medical/compliance empty (`tripConverter.ts:118-130`). Every pro persona (11–17, 29)
   hit the gap; NFL coordinator: "the most convincing brochure in team travel." [OBSERVED D7]
3. **Notification fanout cannot survive the events being sold.** Synchronous fanout inside the
   INSERT path at 1,000+ attendees, no batching, no priority lane that bypasses mute (22, 25, 18).
   [OBSERVED ground truth §10.4]
4. **Advertised attendee caps (100/200) have no enforcement call sites** — a billing-integrity
   and trust finding ("don't put '200 attendees' on a pricing page your code doesn't enforce" — 22).
   [OBSERVED ground truth §4]
5. **Free caps fire mid-trip and convert to churn, not upgrade.** The 3-split wall lands at the
   steakhouse (28), the storage wall mid-photo-flood (6, 23). Mistimed paywalls send groups back
   to Splitwise "in 90 seconds." [OBSERVED caps + SIMULATED RISK on behavior]
6. **Pro purchase intent dead-ends in Mail.app.** mailto: trial CTAs at the conversion moment
   (12: "I had the card out"). Self-serve Pro checkout is still pending (D9). [OBSERVED]
7. **Two live render defects undermine the premium claim**: mobile duplicate-key storm
   (`MobileGroupCalendar.tsx:525`, fires on every mobile trip surface) and a desktop consumer-trip
   setState loop (R2). The aesthetic-evaluator persona (8) feels this as jank. [OBSERVED R1/R2]
8. **Smart Import replay can duplicate shared data** — for ops/money documents this is trust
   death ("a wrong call time has a dollar figure" — 17). [OBSERVED TEST_GAPS + SIMULATED RISK]
9. **One brand cannot greet both spring break and a $90,000 commission.** "The Group Chat Travel
   App" actively repels luxury/enterprise personas (29, 19, 11) absent white-label. [OBSERVED copy]
10. **Demo mode calls the real backend** (roles, payment methods, Stream, realtime) — console
    noise, wasted load, error states inside the sales demo ("Couldn't load trip members" — 11),
    and a contamination risk vector. [OBSERVED R5]

### 10 fastest wins

1. Fix `MobileGroupCalendar.tsx:525` weekday keys + unmount inactive tab content (R1) — likely
   hours, removes thousands of wasted re-renders on every mobile session.
2. Replace "Failed to send a request to the Edge Function" with human copy on `DemoTripGate` (R3).
3. Allowlist (or self-host) demo imagery blocked by CSP (R4) — broken tiles in the aesthetic pitch.
4. Point the concierge limit wall at checkout with tier preselected instead of `/settings`
   (`useConciergeUsage.ts:368`).
5. Warn at split 2-of-3 *before* the trip starts; never let the first cap notice be mid-dinner.
6. Bulk-approve queue for join requests (rush chair approves 120 one-by-one today).
7. Pin active polls as a persistent chat banner until closed (the decision must live where the
   arguing happens).
8. Surface light mode + text size in onboarding for self-identified 55+ users; respect OS font
   scale (6).
9. Reconcile "1 free Pro trial" doc copy vs `pro_trip_creation.free: 0` in code (2 caught it).
10. Add a scroll affordance (or wrap) to the mobile tab strip — Tasks/Polls are invisible off-screen
    to the exact personas who need them (1, 23, 25). [OBSERVED `mobile2-01`]

### 5 strategic product bets

1. **Guest Access Layer** — tokenized read-only itinerary/agenda/places view + RSVP-light voting at
   the invite link, account optional, convert later. Unlocks the viral loop for consumer, family,
   events, school, and church segments simultaneously. The single highest-leverage build in the study.
2. **Smart Import as the Pro wedge** — venue advances, charter manifests, rooming lists, league
   ICS → populated real-trip ops surfaces, with idempotent commits. This converts the demo promise
   (D7) into the product and is the stated buy trigger for personas 12, 15, 16, 17.
3. **The Receipts Layer** — "seen by N" on broadcasts, pins, and plans + task auto-reminders with
   escalation. The non-responder problem is the deepest cross-segment JTBD (2, 4, 10, 12, 16, 21,
   22, 24, 25); nobody currently owns "proof your group saw the plan."
4. **SKU restructure around payer shape, not usage volume** — Event Pass (one-time), weekend pass
   (~$12), club/org plan (one payer, many members), Pro per-leg/tour pass, white-label tier.
   The study's WTP failures are almost all shape mismatches, not price objections.
5. **Pro ops data layer before more Pro marketing** — real roster/schedule/rooms entities with
   CSV/PDF import and export. Until then, label demo surfaces as concept previews (11's ask).

### 5 things NOT to build yet

1. **In-app money movement** — Venmo deeplink + manual settle is accepted by every consumer
   persona; custody/compliance cost is not justified by any observed demand.
2. **Full compliance suite (per-diem engines, QuickBooks, audit workflows)** — sell-side wants it
   (13), but it's Enterprise-only demand sitting on an empty data layer; build the data layer first.
3. **Native Android app** — Android personas (2, 24, 30) need a *credible PWA story*, not a Play
   Store build, this quarter.
4. **Realtime voice concierge** — architecture blocker documented (D8); dictation honestly labeled
   is acceptable; no persona ranked voice in their top 5.
5. **Conference-scale registration/badging** (22) — a different product; win his 50-person board
   retreats instead, on existing surfaces.

---

## 2. Persona Segment Matrix

(Full per-persona data: `persona-matrix.csv`. Scores are synthetic 1–10; NPS −100..+100.)

| # | Persona | Segment | Mode | Platform | Group | Primary pain | Loved most | Hated most | Use | WTP | Best SKU |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Denise Walker, soccer mom | Consumer | Regular | iOS | 14 fam | Schedule changes buried in GroupMe | Calendar day view; invite approval | Tasks hidden off-screen; account wall | Med | Free | Free |
| 2 | Marcus Tran, AAU parent | Consumer | Regular | Android | 11 fam | Who saw the 7:45 court change? | Invite gatekeeping; confirm-first AI | No Android story; broadcasts Pro-gated | Med | Per-trip | Trip Pass |
| 3 | Jessica Romano, bachelorette MOH | Consumer | Regular | iOS | 9 | Chasing 8 Venmos ×3 deposits | Payments ledger; live itinerary | 3-split cap pre-trip; broken demo images | High | Per-trip | Trip Pass |
| 4 | Derek Okafor, golf trip | Consumer | Regular | iOS | 8 | Nobody responds or decides | Who-owes-who ledger; deadline polls | Cap mid-collection; monthly billing | Med | Per-trip | Trip Pass |
| 5 | Brooks couple, dest. wedding | Consumer | Events | Mixed | 60 | 60 guests, 5 questions ×60 | Event surfaces = "welcome packet, alive" | Guest account wall | Med | $30+ once | Event pass |
| 6 | Gloria Jenkins, family reunion | Consumer | Regular | Android/desk | 35 | She is the information desk | Polls; basecamp directions; demo landing | Dark low-contrast text; elder account wall | Med | Free | Free |
| 7 | Tyler Nguyen, spring break | Consumer | Regular | iOS | 12 | 4 ghosts, dead Airbnb links | No-signup landing; auto-close polls | Any wall for friends; split cap | High | Free | Free |
| 8 | Priya Sharma, luxury girls' trip | Consumer | Regular | iOS | 6 | Curation nobody engages with | Design discipline; basecamp | Perceived jank (R1/R2); generic AI risk | High | $15–30/mo | Frequent Chraveler |
| 9 | Delgados, 4 couples | Consumer | Regular | Mixed | 8 | Deadlock + couple-money math | Deadline polls; Trip Pass model | Per-person-only splits | High | Per-trip | Trip Pass |
| 10 | Sam Rivera, solo organizer | Consumer | Regular | iOS/desk | 5–10 | He chases everyone, always | Whole organizer toolkit | Tasks never re-remind; invite funnel | High | $15–30/mo | Frequent Chraveler |
| 11 | Dan Kowalski, NFL logistics | Pro | Pro | Desk | 180 | Manifest churn + proof-of-notify | Pro IA: roster/channels/broadcasts | Empty ops on real trips; no SSO | Low | Team plan | Enterprise |
| 12 | Alicia Burch, NBA ops | Pro | Pro | iOS/desk | 45 | Schedule-change ripples ×41 games | Broadcast/channel separation; mute | mailto at checkout; demo backend errors | Med | Team plan | Pro Growth |
| 13 | Marcus Webb, Duke basketball | Pro | Pro | iOS | 25 | Compliance/per-diem records | Team tab; recap privacy line | `compliance: []` vs Enterprise card | Low | Team plan | Enterprise |
| 14 | Linda Park, HS athletics | Pro | Pro/Reg | Desk | 8×20 | Parents miss bus changes | Broadcasts ("Remind inside the schedule") | Priced like a rock band; no school SKU | Low | Free | Free* |
| 15 | Jamie Sutton, comedian TM | Pro | Pro | iOS | 6 | Re-typing venue PDFs nightly | Demo fluency ("your demo is my Tuesday") | `schedule: []`; mailto trial | Med | Per-leg | Pro Starter |
| 16 | Rosa Delgado-Smith, music TM | Pro | Pro | iOS/iPad | 80 | Rooming churn; settlement night | Role broadcasts; recap defaults | Empty real ops; half-built settlement | Med | Team plan | Pro Growth |
| 17 | Ben Châu, film production | Pro | Pro | Mac/iOS | 60 | 11pm call-sheet revisions | Import preview/cherry-pick; Productions category | Import duplication risk; no offline pin | Med | Team plan | Pro Starter |
| 18 | Stephanie Müller, corp offsite | Pro | Pro | Desk | 150 | Structured intake from 150 people | Real retreat demo; delivery tracking | No forms; no SSO (fine with invoices!) | Med | Team plan | Enterprise |
| 19 | Victoria Ashford-Lee, EA | Pro | Pro | Desk/iOS | 2–8 | Itinerary leaks; version drift | Containment defaults (guest zero-access!) | Link previews; AI on by default | Low | Client-billable | Pro Starter |
| 20 | Carlos Mendoza, concierge co. | Pro | Pro | Desk | 15 trips | His brand, not the tool's | Real PDF pipeline; aesthetic | No white-label; 3-trip eval cap | Med | Team plan | White-label* |
| 21 | Megan O'Brien, wedding planner | Events | Events | iOS/Mac | 100–200 | Vendors don't read email | Agenda = live run sheet | 3 lifetime events for a 12-wedding pro | Med | Client-billable | Pro Starter |
| 22 | Raj Patel, conference 1,000 | Events | Events | Desk | 1,000 | Session-change comms at scale | Agenda model; Upload Schedule | Fanout architecture vs his scale; fake caps | Med | Team plan | Pro Growth |
| 23 | Zoe Carter, festival lead | Events | Events | iOS | 15 | "Where ARE you guys" | Lineup tab; agenda cards; media pool | Friends need accounts to see van time | High | Free/pass | Event pass |
| 24 | Dana Whitfield, run club | Events | Events | Android/desk | 40–120 | Race-morning chaos ×40 askers | Hero copy names clubs; calendar export | $19.99 personal sub for a volunteer | High | $5–15 club | Event pass |
| 25 | Hunter Davis, rush chair | Events | Events | iOS | 200 | Who saw the venue change? | Agenda cards; the frat demo trip | No read counts; mute-spiral risk | High | Per-event | Event pass |
| 26 | Pastor Hill, church trips | Events | Regular | Android/desk | 45 | Forms/waivers; low-tech members | Calendar of record; approval invites | Account wall; no forms | Med | Free | Free |
| 27 | Angela Torres, school field trip | Events | Regular | Desk | 128 | One-way to 120 parents, no student PII | Tasks+calendar = chaperone binder | Broadcasts unbuyable at school budget | Med | Free | Free |
| 28 | Jake Morrison, bachelor party | Consumer | Regular | iOS | 11 | Deposits + the guy who never pays | Payments tab, exactly | $39.99 escape hatch at the steakhouse | High | Per-trip | Trip Pass* |
| 29 | Eleanor Vance, luxury advisor | Pro | Pro | Desk/iOS | 2–12 | Brand mismatch with her clientele | Recap privacy engineering | No white-label anywhere | Low | Client-billable | White-label* |
| 30 | Yuki Tanaka-Osei, international | Consumer | Regular | Android/desk | 18 | Timezones × languages × currencies | Date/currency engineering care | No i18n layer at all | Med | Per-trip | Trip Pass |

\* = SKU does not exist today (school/community plan, white-label tier, weekend-priced pass) — see §6.

## 3. Feature Heatmap

Ratings: **++** strong pull · **+** moderate · **0** neutral · **−** low pull · **✗** negative/bloat.
(Derived from 469 feature findings in `feature-findings.csv`; conflicts shown as splits.)

| Feature | Consumer (n=12) | Pro (n=11) | Events (n=7) | Notes |
|---|---|---|---|---|
| Chat | ++ | + | + | Table stakes done well; system messages (expense-in-chat) praised; "would we really leave iMessage?" is the [HYPOTHESIS] |
| Broadcast | + (want it, Pro-gated) | ++ | ++ | The #1 cross-segment pull — but consumer/school personas can't buy it; needs read counts |
| Calendar | ++ | ++ (empty on real trips) | ++ | Highest dual rating: top retention driver AND top defect site (R1 storm, D7 emptiness) |
| Places/Basecamp | + | + | + | Quietly liked (avg sev 1.7); needs per-place notes for curators |
| Polls | ++ | 0 | ++ | Lowest-friction feature in study; pin-to-chat requested |
| Tasks | ++ | + | + | Loved by organizers; "pings once then silence" — needs reminders/escalation |
| Smart Import | + | ++ (the wedge) | + | Highest expectation-to-trust gap; idempotency must precede marketing |
| AI Concierge | + (split: 8,10 ++ / 4,6 −) | 0 | 0 | Confirm-before-write design praised; answer quality is the open [HYPOTHESIS]; nobody's purchase driver |
| Payments | ++ | − (wrong model: per-diem/settlement) | + | Best consumer surface; couple-splits + installments missing; pro money UI must never be stubbed |
| Media | + (split: 3,23 ++ / 1,4 ✗) | 0 | ++ | Acquisition for festival/bachelorette; bloat for golf/soccer personas with iCloud albums — keep, don't center |
| PDF export/Recap | + | ++ | + | Privacy defaults = differentiator; white-label is the unlock for advisors |
| Invite links | ++ (controls) / ✗ (guest wall) | + | ✗ at scale | The paradox: best-designed modal, worst-performing funnel (D15) |
| Roles/permissions | 0 | ++ concept / − reality | + (sub-roles missing) | Pro roles sold but data empty; event vendor/PNM sub-roles requested ×4 |
| Notifications | + (mute shipped) | + | ✗ at scale | Fanout architecture + no priority lane = events trust-breaker |
| Mobile navigation | − | − | − | Tab-strip overflow hides Tasks/Polls; no bottom nav on mobile web; unanimous friction |
| Pricing/upgrade | − (timing) | ✗ (mailto, SKU gaps) | ✗ (payer mismatch) | Highest hiRev concentration (23/30 high-revenue-impact rows) |

## 4. Web vs Mobile Synthesis

(Dedicated deep-dive: `web-mobile-comparison.md`.)

- **Web strengths:** full marketing scroll with pricing/FAQ; densest surfaces (Team, agenda,
  payments) read well at 1440px; demo walkthrough flawless across 24 desktop captures. [OBSERVED]
- **Web issues:** consumer-trip setState loop (R2, worst on chat-Pinned); upgrade walls routing to
  `/settings`; "For Teams" nav appears only after scrolling into marketing content. [OBSERVED]
- **Mobile strengths:** payments and agenda cards are genuinely thumb-first (full-width CTA,
  color-coded summary); chat input with mention/voice affordances; demo parity with desktop —
  nothing was missing on mobile, only harder to find. [OBSERVED `mobile2-*`]
- **Mobile issues:** R1 render storm on every trip surface (calendar mounted on all tabs);
  horizontal tab strip hides Tasks/Polls/Media off-screen; header truncates trip names ("Spring
  Break Cancun 2…"); input placeholder clips; no bottom nav on mobile web despite a native-style
  app expectation. [OBSERVED]
- **PWA/native-wrapper risks:** Android personas (2, 24, 30) found no Play Store presence and no
  in-product PWA install story; push reliability on Android PWA is their stated adoption gate
  [HYPOTHESIS — needs device testing]. Offline guarantees for on-set/race-day use are unverified
  (17, 24) [HYPOTHESIS].
- **Mobile-first fixes:** R1 + unmount strategy; tab-strip wrap/affordance; bottom nav for the big
  4 (Chat/Calendar/Payments/More); reminder/notification reliability work.
- **Desktop/admin fixes:** R2 loop; multi-trip portfolio dashboard (20); CSV import/export
  everywhere a pro persona touches data.

## 5. Onboarding + Survey Synthesis

- **The emotional hook works before signup, not after.** The interactive landing is the onboarding
  for evaluators (7: "the most respect a website has ever shown me"). The 10-screen carousel
  (D13) is tolerated by enthusiasts, skipped by pros, and a barrier for invitees. [OBSERVED + SIMULATED RISK]
- **Who skips:** all Pro personas (11–20) and impatient consumers (7, 25, 28) skip immediately;
  low-tech personas (6, 26) *can't find* skip confidence — "Skip demo" on every screen (D13) helps
  but invite-link arrivals should bypass the carousel entirely (persona 6's top fix).
- **Useful segmentation questions:** group size, trip type (consumer/pro/event), role
  (organizer/participant), platform. These predict SKU fit almost deterministically in this study.
- **Too long / low value:** anything asking participants (not organizers) about planning habits;
  feature-tour questions duplicating what the demo already shows.
- **Ask before demo:** "Are you planning or joining?" + trip type — two taps, routes the demo trip
  to the right mock (the pro mock did more selling than any copy in this study).
- **Ask after demo (or at first wall):** group size, current tools, willingness for a follow-up call.
- **Recommended length:** ≤4 questions pre-demo, ≤3 post-demo. Everything else is observable via
  the now-live PostHog telemetry (D12).

## 6. Pricing + Monetization Synthesis

The dominant finding: **WTP failures are shape mismatches, not price objections.** Per-trip people
are offered subscriptions; org-payer people are offered personal plans; pros with budget are
offered a mailto link.

| Segment | Preferred model | Likely range | Trigger moment | Objection | Fix |
|---|---|---|---|---|---|
| Tournament/team parents (1, 2) | Per-season pass | $15–40/season | Split/trip caps in-season | Personal monthly sub for a volunteer role | Seasonal pass; org-payable |
| Party trips (3, 4, 28) | Trip Pass | $12–40/trip | Split cap **at planning time** | $39.99 for one weekend; cap fires mid-trip | Weekend pass ~$12–15; warn at split 2/3; offer at trip setup |
| Weddings/celebrations (5, 21) | Event pass | $79–149/event | PDF export + guest scale | "Frequent Chraveler" framing for a once-ever event | Event Pass SKU + events-business plan for planners |
| Power organizers (8, 10) | Subscription | $15–25/mo | 4th active trip; AI ceiling during curation | Limit wall routes to `/settings` | Direct checkout at wall, tier preselected |
| Free-forever (6, 7, 14, 26, 27) | Free | $0 | None — caps trigger churn/workarounds | Any card prompt | Keep generous; monetize the org payer (school/club/church SKU) where one exists |
| Clubs/communities (24, 25, 26) | Org plan, one payer | $5–15/mo or $25–60/yr | 4th lifetime event | "Who pays?" unanswered | Club/community SKU payable by treasury |
| Pro teams/tours (12, 15, 16, 17) | Team plan / per-leg | $49–199/mo or ~$99/leg | Channels/roster need at pilot | mailto:; empty real-trip ops | Self-serve Pro checkout (D9) + ops import |
| Enterprise (11, 13, 18) | Invoice + procurement | $5k–50k/yr | Capability, not caps | No SSO/security docs/POs | Sales motion with security page; don't force self-serve |
| Client-facing advisors (20, 29) | White-label tier | $99–249/mo | A capability (branding), not a cap | SKU doesn't exist | White-label: logo/colors/footer/custom invite domain |
| Conferences (22) | Per-event | $500+/event | Enforced caps — if real | Caps advertised but unenforced | Enforce caps with grace UX; publish scale limits |

- **Trip Pass viability:** strongest single SKU (10 of 30 personas' natural purchase) but needs a
  weekend-priced rung and placement at trip *setup* for date-bounded trips.
- **Best upgrade trigger in the study:** 4th active trip (10) — clean, legitimate, pre-trip.
- **Worst:** any wall mid-trip, mid-collection, or visible to invited guests (8, 10: "never upsell
  my friends").

## 7. Product Priority Matrix

(Engineering-ready detail with owners and effort: `top-priority-fixes.md`.)

**P0 — trust-breaking (fix before any growth push)**
R1 mobile render storm (`MobileGroupCalendar.tsx:525`) · R2 desktop setState loop · notification
fanout made async/batched + priority class (§10.4) · enforce or un-advertise attendee caps ·
remove/finish stubbed settlement money UI on Pro (16) · Smart Import idempotency keys ·
demo mode must stop calling the real backend (R5) · raw error copy at conversion moments (R3).

**P1 — revenue unlocks**
Self-serve Pro checkout (D9) · tokenized guest read-only view + RSVP-light (D15 — also the viral
unlock) · SKU additions: Event Pass, weekend pass, club/org plan, white-label tier · split-cap
warning timing + Trip Pass at trip setup · concierge wall → checkout (`useConciergeUsage.ts:368`) ·
Pro ops import (roster/schedule/rooms CSV/ICS/PDF) — the build that makes Pro real (D7).

**P2 — retention**
"Seen by N" on broadcasts/pins · task reminders with escalation (T-7/3/1 + overdue) · bulk-approve
joins · couple/household split grouping (9) · per-place notes (8) · CSP demo imagery (R4) ·
light-mode/text-size surfacing (6) · poll pinned-banner · invite-funnel visibility for organizers
("5 of 8 joined" — 10).

**P3 — polish**
Mobile tab-strip wrap/affordance + bottom nav · header/placeholder truncation · pro-trial copy
drift ("1 free trial" vs `free: 0`) · "For Teams"/Pricing nav discoverability pre-scroll.

**Later / not yet**
i18n (real demand from 30, but sequenced after guest access since her group hits that wall first) ·
forms/waivers engine (18, 26, 27 — validate with real users first; it's a new product surface) ·
SSO/SCIM (when Enterprise pipeline is real) · in-app money movement (don't) · native Android ·
realtime voice (architecture-blocked, D8) · conference registration/badging.

## 8. Top 20 User Quotes

**All quotes are [SYNTHETIC QUOTE] — fabricated persona voice, not real users.** Full set in the
persona reports; selection criteria: distinct insight per quote.

| # | Quote (abridged) | Persona | Area | Insight |
|---|---|---|---|---|
| 1 | "We'd pay $100 tonight — if my aunt can tap the link and see the shuttle time without creating an account. She can't, so we can't." | 5, wedding couple | Invite/guest | The guest wall is a revenue wall, not just a growth wall |
| 2 | "You built the most convincing brochure in team travel. Now build the product in the brochure." | 11, NFL | Pro reality | Demo-vs-real gap named precisely |
| 3 | "Your demo is my Tuesday. Your product is my Tuesday with all the times deleted." | 15, comedian TM | Pro/Import | Same gap, from the buyer who'd self-serve |
| 4 | "You wrote `compliance: []` in the code and 'compliance' on the Enterprise price card. In my office, that's called a finding." | 13, Duke | Pricing integrity | Capability claims are audited by enterprise buyers |
| 5 | "If it hits me with a paywall at split number four on a Friday night, I will simply die, and then post about it." | 3, bachelorette | Monetization timing | Mid-trip walls create public churn |
| 6 | "This app understands my job better than my groomsmen do — then it charges forty bucks at the exact moment I'm holding a $1,340 steakhouse bill." | 28, bachelor party | SKU shape | Right wall, wrong price + moment |
| 7 | "The landing page just let me use the whole app with zero signup — the most respect a website has ever shown me. Now make the invite link work the same way." | 7, spring break | Landing/guest | The landing already proves the guest-access pattern works |
| 8 | "I sent eleven 'did you book your flight?' texts last trip. Build the version where the app sends them and I'll pay before you finish the sentence." | 10, solo organizer | Tasks/reminders | The receipts layer is a purchase driver |
| 9 | "I don't need the app to be magic. I need it to tell me which four families haven't seen the 7:45 AM court change." | 2, AAU parent | Broadcasts/read counts | Seen-by > AI for coordinators |
| 10 | "The broadcast tab is my entire job in one screen. Now… take my department card — without making me email your support address." | 12, NBA ops | Pro checkout | mailto: blocks a ready buyer |
| 11 | "If it pings everyone for every meme, the whole chapter mutes it by Wednesday and I'm back to triple-texting like an animal." | 25, rush chair | Notifications | Mute-spiral: volume control IS the feature |
| 12 | "Don't put '200 attendees' on a pricing page your code doesn't enforce." | 22, conference | Billing integrity | Scale claims get fact-checked |
| 13 | "It's a beautiful app, baby, but my family doesn't need beautiful — they need big print, one link, and no passwords." | 6, family reunion | Accessibility | Readability/guest access for the 55+ half of group travel |
| 14 | "If Maddie has to create an account to see what time the van leaves, Maddie is not creating an account, and then we're back in iMessage." | 23, festival | Guest wall | Adoption is decided by the least-motivated member |
| 15 | "This is the first travel app that dresses the way I plan — now it has to walk in the heels: no stutter, no gray-box images." | 8, luxury trip | Perf/polish | Premium positioning makes jank expensive |
| 16 | "Everyone else complains the guest role can't do anything. That's the first thing this product got right for me." | 19, EA | Privacy | Containment is a feature for a segment — make guest access opt-in per trip |
| 17 | "The bones are luxury; the wrapping is spring break. Put my name on it and I'll put my clients in it." | 29, luxury advisor | White-label | Brand flexibility is the advisor SKU |
| 18 | "Everyone's mad there's no checkout button for Pro. I don't want a checkout button — I want a security questionnaire answered and an invoice." | 18, corp offsite | Enterprise motion | Two different Pro buyers need two different paths |
| 19 | "Fix the math so my wife and I are one wallet, the way we've been since 1999." | 9, couples | Payments model | Households are a data-model gap |
| 20 | "It asks for my timezone and my currency — genuinely rare — and then speaks to my family in one language." | 30, international | i18n | Engineering care exists; the language layer doesn't |

## 9. Top 20 Real Beta Interview Questions

(Methodology + per-question targeting: `real-beta-interview-questions.md`.) The study's biggest
uncertainties → what to ask actual humans, prioritized:

1. Send your three least-responsive friends this invite link right now — what do they do, and what do they text back? *(guest wall, #1 uncertainty)*
2. Show me your Venmo request history for your last group trip — at which exact moment would you have paid $40 to make it stop? *(WTP moment)*
3. You're at dinner and the app says 3-of-3 free splits used — what do you do in the next two minutes? *(cap timing)*
4. Here are five real venue advance PDFs from your last leg — watch Chravel import them: how many corrections before you'd trust it, and what would you pay per leg? *(Smart Import value)*
5. If broadcasts, channels, and roster import worked today but per-diem didn't, would you run one road trip alongside your current stack? *(Pro minimum viable wedge)*
6. Walk me through the last schedule change after 8 PM — every app and every individually-texted person. *(core JTBD validation)*
7. How did you confirm each family actually SAW the change — what would "confirmed" look like in an app? *(receipts layer)*
8. What percentage of your over-55 guests make it past a sign-up screen without calling you? *(guest wall, demographic edge)*
9. Ask the concierge for a restaurant in a city you know deeply — at what moment in its answer do you trust or dismiss it? *(AI quality, the big [HYPOTHESIS])*
10. Open your last trip's expenses — how should $2,400 of shared costs appear if the app understood "couples"? *(payments model)*
11. What evidence would procurement need to approve an attendee-facing app — and who produced it for your current vendor? *(enterprise motion)*
12. What's the minimum branding control that would let you put a client inside a third-party trip app? *(white-label scope)*
13. If parents could see schedules without accounts and it cost the boosters $12/mo for eight teams, what's still missing? *(school/club SKU)*
14. Show me last year's retreat intake form — which columns must Chravel own before you delete the sheet? *(forms gap sizing)*
15. Here's a viewer-role login — spend ten minutes trying to learn things you shouldn't. *(privacy/role trust, adversarial)*
16. Your cousin in Kyoto added "Dinner 19:00" — what time do you believe that dinner is, and how confident are you? *(timezone trust)*
17. What would you need to see at the FIRST race weekend to call a $60/year club plan worth it — and what would make you cancel? *(org-payer SKU)*
18. Walk me through the last time you got a relative over 70 onto a new app — at which exact step did they call you instead? *(low-tech onboarding)*
19. How many nags did you send last trip, to whom, and which single one would you most want the app to send for you? *(task reminders)*
20. At what message did your last group-trip chat stall, and what would have had to happen for all 12 people to tap one link and vote? *(polls/guest voting loop)*

## 10. Founder / Investor Readout

**What synthetic testing suggests is working.** The consolidation thesis lands: every persona
recognized their fragmentation pain in the product, and the try-before-signup landing is a
genuinely differentiated acquisition motion [OBSERVED]. The consumer core loop — chat + calendar +
polls + the best-reviewed payments ledger in the study — is coherent and demo-provable on both
viewports. The June 10 fix wave closed most of the monetization plumbing the prior study flagged;
this is a faster-moving codebase than the average diligence target.

**What is likely blocking activation.** For consumers: nothing in the product — it's the *group*
that fails to activate, because invited members hit an account wall before seeing any value
(consumer_guest zero access, [OBSERVED]). For pros: the demo-to-real cliff — rich mock ops
surfaces, empty real trips ([OBSERVED `tripConverter.ts:118-130`]). Both are decisions, not
mysteries.

**What is likely blocking monetization.** Shape, timing, and plumbing — not price. Per-trip buyers
are offered subscriptions; org payers are offered personal plans; ready Pro buyers get a mailto
link; free caps fire mid-trip where they convert to churn [OBSERVED caps + SIMULATED RISK
behavior]. The missing SKUs (Event Pass, club plan, weekend pass, white-label) map one-to-one onto
persona payer shapes.

**What is likely blocking viral loops.** One permission row. The invite modal is excellent; the
invite *outcome* is a registration gate. 19 of 30 personas named it. Fixing guest read-access
converts every trip into a landing page — the same pattern the marketing site already proves works.

**What must be validated with real users before fundraising claims.** All conversion/NPS/WTP
numbers herein are synthetic — none are evidence. Specifically validate before claiming: real
invite→join rates (PostHog is now live, D12), AI answer quality against persona standards
([HYPOTHESIS]), actual WTP at the proposed pass price points, Android PWA push reliability, and
notification behavior at >500-member scale. Do not cite this study's scores externally.

**What would impress an investor if fixed in the next 2 weeks.** (1) Guest read-only invite view —
demoable viral loop; (2) self-serve Pro checkout — revenue motion exists end-to-end; (3) R1/R2
perf fixes — the premium claim survives a hands-on demo; (4) split-cap warning moved pre-trip +
a weekend pass A/B — shows pricing is instrumented, not guessed; (5) live PostHog funnel dashboard
replacing synthetic numbers with real ones. All five are S/M-effort items already specified in
`top-priority-fixes.md`.
