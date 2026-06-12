# Top Priority Fixes — 30-Persona Study (2026-06-11)

> Derived from 469 synthetic feature findings (`feature-findings.csv`) + the live-harvest defects
> (`evidence-delta.md` R1–R6). Evidence labels per README. Effort: S (<1 day) / M (days) / L
> (weeks). "Personas" = study IDs affected.

## P0 — Trust-breaking (fix before any growth push)

| # | Fix | Problem | Personas | Evidence | Sev | Rev | Effort | Owner | Next action |
|---|---|---|---|---|---|---|---|---|---|
| P0-1 | Fix duplicate React keys in `MobileGroupCalendar.tsx:525` (`compact-${day}` over S·M·T·W·T·F·S) and stop mounting calendar content under inactive tabs | Continuous render storm on EVERY mobile trip surface — ~150 warnings/step, 2,528 during pro chat, 5,940 in one session; perceived jank on mid-tier devices | 1, 2, 8, 23 + all mobile | [OBSERVED] live harvest R1 + file:line | 4 | Med | S (keys) + M (unmount) | Frontend | Key fix is a one-liner (`key={`compact-${index}`}` exists 25 lines below as the pattern); then audit `MobileTripTabs` mount strategy |
| P0-2 | Diagnose and fix "Maximum update depth exceeded" loop on desktop consumer trip (worst on chat **Pinned** subview, 34×) | setState loop on the highest-traffic desktop surface | 3, 8, 9 | [OBSERVED] R2, `desktop-harvest2-log.json` steps 3–13 | 4 | Med | M | Frontend | Reproduce via tab walk in dev tools; fires on interaction, not load |
| P0-3 | Make notification fanout async/batched and add a priority broadcast class that bypasses per-trip mute | Synchronous fanout inside INSERT at event scale; mute-spiral silences critical room changes | 5, 18, 22, 25 | [OBSERVED] ground truth §10.4 (open) | 5 | High | L | Backend | Queue-based fanout; `priority` flag on broadcasts honored by mute filter |
| P0-4 | Enforce advertised attendee caps (100/200) or remove them from pricing copy | Billing-integrity gap: caps on price cards have zero enforcement call sites | 22, 21, 25 | [OBSERVED] ground truth §4 | 4 | High | M | Backend + Product | Decide policy first; enforce with grace-period UX, never mid-event |
| P0-5 | Finish or hide the partially-stubbed Pro settlement/per-diem money surfaces | Half-built money UI on real Pro trips destroys ops trust ("never stub money UI") | 13, 16 | [OBSERVED] D7, `tripConverter.ts:118-130` | 5 | High | M (hide) / L (build) | Product + Frontend | Hide behind capability flag until the data layer exists (extends the 3cd1c2a "honest surfaces" pass) |
| P0-6 | Add idempotency keys to Smart Import commits | Retry can duplicate/corrupt shared trip data — fatal for venue/charter/money documents | 11–13, 15–17, 22 | [OBSERVED] TEST_GAPS / ground truth §10.8 | 5 | High | M | Backend | Key on artifact hash + target entity; add replay test corpus (venue PDFs, manifests) |
| P0-7 | Stop demo mode from calling the real backend (roles, payment methods, Stream token, realtime, PDF-usage) | Error states inside the sales demo ("Couldn't load trip members"); contamination vector; console noise | 11, all demo evaluators | [OBSERVED] R5 harvest logs | 3 | Med | M | Frontend | Gate data hooks on `isDemoMode` before fetch (cf. CLAUDE.md zero-tolerance demo contamination) |
| P0-8 | Replace raw technical error copy at conversion moments ("Failed to send a request to the Edge Function" on DemoTripGate) | Engineer-speak shown at a signup moment on flaky networks | 4, 11 | [OBSERVED] R3, `desktop-07` | 3 | Med | S | Frontend | Human copy + retry affordance |

## P1 — Revenue unlocks

| # | Fix | Problem | Personas | Evidence | Rev | Effort | Owner | Next action |
|---|---|---|---|---|---|---|---|---|
| P1-1 | Tokenized read-only guest view (itinerary/agenda/places) at the invite link + RSVP-light poll voting; account optional, convert later | `consumer_guest` = zero access; 19/30 personas named the guest wall as the abandonment trigger; also the viral unlock | 1, 5, 6, 7, 14, 23, 24, 26, 27 + 10 more | [OBSERVED] D15 `permissionMatrix.generated.ts:44-50` | High | L | Product + Backend (RLS) + Frontend | Scope read-only token grants carefully against RLS (trip existence ≠ access); make it per-trip opt-in so confidential-trip personas (19) keep containment |
| P1-2 | Self-serve Pro checkout (replace mailto: trial CTAs) | Ready buyers dead-end in Mail.app at peak intent | 12, 15, 16, 17, 20, 29 | [OBSERVED] D9, `PricingSection.tsx:140,158` | High | M | Frontend + Payments | Already "ship next" in 3cd1c2a notes; keep the invoice/sales path for enterprise personas (18) |
| P1-3 | SKU additions: Event Pass (one-time, ~$79–149), weekend pass (~$12–15), club/org plan (one payer, ~$5–15/mo), white-label tier (~$99–249/mo) | WTP failures are shape mismatches: per-trip buyers offered subscriptions, org payers offered personal plans | 5, 21, 24, 25, 26, 28, 20, 29 | [SIMULATED RISK] + pricing-insights.csv | High | M (billing config) + L (white-label surfaces) | Product + Payments | Start with weekend pass A/B (smallest change, clearest test) |
| P1-4 | Move split-cap awareness pre-trip: show cap status at first split, warn at 2/3, offer Trip Pass at trip setup for date-bounded trips | Cap fires mid-trip (the steakhouse moment) where it converts to churn, not upgrade | 3, 4, 7, 28 | [OBSERVED] cap D3 + [SIMULATED RISK] timing | High | S–M | Frontend + Growth | Copy + placement change on the existing enforcement |
| P1-5 | Route concierge limit wall to checkout with tier preselected (not `/settings`) | Peak-intent fumble for the highest-WTP consumers | 8, 10 | [OBSERVED] `useConciergeUsage.ts:368` | Med | S | Frontend | One URL + checkout deep-link |
| P1-6 | Pro ops import: roster/rooming CSV, schedule ICS/PDF (venue advance, charter manifest) populating real Pro trip surfaces | The demo-vs-real gap (D7) is the stated buy blocker for the entire Pro segment | 11–17 | [OBSERVED] `tripConverter.ts:118-130` | High | L | Backend + AI + Frontend | Sequence: rooming CSV (16) → schedule ICS (12) → venue PDF via Smart Import (15, 17, after P0-6) |

## P2 — Retention

| # | Fix | Problem | Personas | Evidence | Effort | Owner |
|---|---|---|---|---|---|---|
| P2-1 | "Seen by N" read counts on broadcasts/pins/plans | The non-responder problem is the deepest cross-segment JTBD; chat read-receipt infra exists, no surface for plans | 2, 4, 10, 12, 16, 21, 22, 24, 25 | [OBSERVED] infra + [SIMULATED RISK] need | M | Frontend + Backend |
| P2-2 | Task auto-reminders (T-7/T-3/T-1) + overdue escalation to assignee | Tasks ping once at assignment then go silent; no `task_due` notification type exists | 10, 1, 27 | [OBSERVED] no scheduler in `src/components/todo/` or notification types | M | Backend |
| P2-3 | Bulk-approve queue for join requests | Rush chair approves 120 PNMs one-by-one | 25, 22 | [OBSERVED] approval flow | S–M | Frontend |
| P2-4 | Household/couple grouping for payment splits | Per-person-only model; "4 ways across 8 people" impossible | 9, 5 | [OBSERVED] split participants model | M | Backend + Frontend |
| P2-5 | Per-place notes ("why I picked this") on saved places | Curation without annotation is bookmarking | 8, 29 | [SIMULATED RISK] | S–M | Frontend |
| P2-6 | Fix CSP blocking demo imagery (unsplash hosts) or self-host mock images | Broken tiles in the aesthetic evaluator's first session | 3, 8 | [OBSERVED] R4 | S | Frontend |
| P2-7 | Surface light mode + text size in onboarding; respect OS font scale | Dark low-contrast default excludes older users; theme switch buried | 6, 26 | [OBSERVED] `useTheme.ts:15-16` default + [SIMULATED RISK] | S–M | Design + Frontend |
| P2-8 | Pin active polls as persistent chat banner until closed | Decisions scroll away from where the arguing happens | 3, 4, 9 | [SIMULATED RISK] | S–M | Frontend |
| P2-9 | Organizer invite-funnel visibility ("5 of 8 joined") | The organizer chases people INTO the tool blind | 10, 4 | [SIMULATED RISK]; PostHog now live for the data | M | Frontend + Growth |
| P2-10 | Organizer-only announcement mode on consumer trips | Broadcasts are Pro-gated but school/church/team segments need one-way announce | 14, 26, 27, 2 | [OBSERVED] gating | M | Product decision + Frontend |

## P3 — UX polish

- Mobile tab strip: wrap, reorder per trip type, or add scroll affordance — Tasks/Polls/Media are
  invisible off-screen (1, 23, 25; [OBSERVED `mobile2-01`]). Consider bottom nav for Chat/Calendar/
  Payments/More on mobile web. — Design + Frontend, M
- Trip-name truncation in mobile header ("Spring Break Cancun 2…") and clipped input placeholder
  ("Type @ to…") ([OBSERVED `mobile2-01`]). — Frontend, S
- Reconcile "1 free Pro trial" doc/marketing copy vs `pro_trip_creation.free: 0` in
  `src/billing/entitlements.ts` (2, 12 caught the drift; [OBSERVED]). — Product, S
- "For Teams" / "Pricing" nav links only appear after scrolling into marketing content; surface
  them in the initial header state ([OBSERVED `desktop-22` vs `desktop-01`]). — Frontend, S
- Auto-skip the onboarding carousel for invite-link arrivals (6; [SIMULATED RISK]). — Frontend, S

## Later / explicitly not yet

- **i18n layer** (30) — real gap [OBSERVED: no i18n framework], but sequenced after P1-1 since
  invited internationals hit the guest wall before the language wall.
- **Forms/waivers engine** (18, 26, 27, 14) — recurring gap across org segments; validate with real
  users before building a new product surface (beta question #14).
- **SSO/SCIM + security documentation page** (11, 18, 19) — build when the Enterprise pipeline is
  real; the security-findings remediation (ground truth §10.3) should precede any security page.
- **In-app money movement** — no observed demand justifies custody; Venmo deeplink is accepted.
- **Native Android build** — needs a credible PWA install + push story first (2, 24, 30).
- **Realtime voice concierge** — architecture-blocked (D8); keep honest "voice input" labeling.
- **Conference registration/badging** (22) — out of scope; target his side events instead.
