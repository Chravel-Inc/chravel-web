# 30-Persona Study — Rebase Refresh (2026-07-26)

**Action:** Rebased `cursor/30-persona-synthetic-study-9c54` onto latest `main`, then re-verified every P0/P1 claim against current code + July product audits.

**Not a new synthetic swarm.** This is an evidence refresh of the June 11 package. Persona voices in `30-persona-full-report.md` still stand as synthetic interviews; **scores, priorities, and OBSERVED claims** in synthesis / CSVs / fixes are updated here.

**Companion audits:**

- `docs/audits/CHRAVEL_PRODUCT_AUDIT_2026-07-25.md`
- `docs/audits/POST_DRIFT_FEATURE_AUDIT_2026-07-25.md`
- `docs/research/synthetic-user-testing/evidence/product-ground-truth.md` (delta header)

---

## Scoreboard: June → July (synthetic averages)

| Metric | June 11 study | July 26 refresh | Direction |
|--------|---------------|------------------|-----------|
| Activation | 6.1 | **6.0** | ~flat |
| Invite | 5.1 | **4.9** | slightly worse (always-approval is now explicit policy) |
| Paid conversion | 2.7 | **3.5** | **+0.8** — Trip Pass + IAP + split enforcement |
| NPS (avg) | ~−10 | **−5.8** | improved; Pro still drag |

Source: `persona-matrix.csv` after score adjustments documented below.

---

## What got fixed (do not re-cite as open bugs)

| Item | Evidence | Impact on personas |
|------|----------|-------------------|
| **Apple IAP enabled** | `APPLE_IAP_ENABLED: true` — `src/billing/config.ts:260` | iOS-primary consumers (17/30) can purchase natively — was a hard dead-end |
| **Trip Pass at concierge/upsell** | `PlusUpsellModal` mounts `TripPassModal`; opened from `AIConciergeChat` + trip modals | Regular Trip-Pass-fit personas: paid +1.5–2.5 |
| **In-app Trip Pass billing** | `ConsumerBillingSection` Trip Pass accordion | Discoverable without marketing page |
| **Pro placeholder tabs hidden on real trips** | `ProTabsConfig.PLACEHOLDER_PRO_TAB_IDS` + `filterPlaceholderTabs` | Stops demo-bait for finance/medical/compliance/sponsors |
| **Live Pro roster** | `ProTripDetailDesktop` overlays `useTripMembers` | Team tab is real for roster, not empty array |
| **Payment split cap enforced** | `paymentService.checkPaymentSplitLimit` + tests | Cap is real; UX still lacks Trip Pass CTA at wall |
| **Settlement race fixed** | migration `20260610100000_atomic_settlement_rpcs.sql` | Money-trust P0 closed |
| **Broadcast fanout fixed** | migration `20260610090000_fix_broadcast_notification_fanout_table.sql` | Schema drift closed; scale load test still open |
| **Invite max_uses + capacity** | `useInviteLink` + `join-trip` + `is_trip_at_member_capacity` | Honest capacity for Pro/Event |
| **Smart Import free taste** | `useSmartImportTaste` — 1 free import/trip | Free users can sample the differentiator |
| **Media load errors surfaced** | `useStorageQuota` / `UnifiedMediaHub` | No longer fails open to empty |
| **In-app Pro Stripe checkout** | `ProUpgradeModal` + `src/billing/checkout.ts` | B2B can pay in-app (marketing still mailto) |
| **Join approval = intentional product** | `getJoinActionPresentation` always request framing; edge hardcodes approval | Reframe: not a copy bug — it's growth friction by design |

---

## What is still open (updated P0/P1)

| Priority | Item | Evidence | Personas hit |
|----------|------|----------|--------------|
| **P0** | Guest / pre-auth itinerary still impossible | `consumer_guest` all-false in `permissionMatrix.generated.ts` | Sports parents, reunions, school, church, wedding guests |
| **P0** | Growth single-threaded on invite link | July product audit §2 — no phone/email add; org invite email broken | All segments |
| **P0** | Product PostHog funnel still dark | Project `464040`: autocapture only; 0 custom events | Founder decisions |
| **P1** | `featurePaywall` still routes Smart Import / some caps → `/settings` not Trip Pass | `featurePaywall.ts`, `CalendarImportModal.tsx` | Free→paid Regular |
| **P1** | Split-cap wall has no Trip Pass CTA | Service enforces; UI is toast/error | Sports mom, bachelor, golf |
| **P1** | Marketing Pro CTAs still `mailto:` | `ForTeams.tsx`, marketing `PricingSection` | NFL/NBA/touring discovery |
| **P1** | Pro ops CRUD still missing | `tripConverter.ts` still empties schedule/settlement/medical/compliance | All Pro |
| **P2** | Onboarding still 10 screens | `OnboardingCarousel.tsx` | College, frat, time-poor parents |
| **P2** | Voice still dictation-only (realtime flag off) | `voiceProductPath.ts` | Frequent Chraveler buyers |
| **P2** | Upload quota still fails open on lookup errors | `uploadService.ts` | Media-heavy groups |
| **P2** | Always-approval + no guest value = invite leak | Join always Request to Join | Invite scores 4.9 avg |

---

## Framing shifts (important)

### 1. Invite is no longer a “copy bug”

June study treated “Request to Join when approval is off” as a defect. July product:
approval is **always on** for real trips. Synthesis now treats this as a **product choice with growth cost**, not a UI bug. Guest read-only itinerary remains the unlock.

### 2. Monetization is no longer “seven broken links”

Several links closed (IAP, Trip Pass at concierge, split enforcement, settlement). Remaining chain:

1. Some walls → settings not Trip Pass  
2. Guest wall blocks viral loop that creates paid organizers  
3. Marketing Pro path still mailto while in-app checkout works  
4. No product analytics to measure conversion  

### 3. Pro is less dishonest, still unfinished

Hiding placeholder tabs + live roster removes the worst bait-and-switch. Day sheet / settlement / per-diem CRUD still absent — Pro NPS improves but stays negative in synthetic scores.

---

## New surfaces to exercise in any live re-test

1. Concierge limit → PlusUpsell → Trip Pass (web + iOS IAP)  
2. `ConsumerBillingSection` Trip Pass purchase  
3. `ProUpgradeModal` Stripe vs `/teams` mailto  
4. Always “Request to Join” + Requests home cards  
5. Smart Import 1-free taste then settings paywall  
6. Pro Team tab with live roster (no finance/compliance tabs on real trips)  
7. Media “Couldn't load media” error state  
8. Split #4 enforcement toast  
9. Gradual flags: `gmail_smart_import`, GCal sync, `concierge_realtime_voice`  
10. `/trip/:id/preview` — confirm it does **not** substitute for guest itinerary  

---

## Score adjustment rules applied to `persona-matrix.csv`

| Segment | Paid Δ | Invite Δ | NPS Δ | Rationale |
|---------|--------|----------|-------|-----------|
| Regular Trip-Pass fit (1,2,3,4,9,10,23) | +1 to +2 | 0 to −1 | +5 to +10 | Trip Pass + IAP; always-approval hurts invite |
| iOS-primary consumers | included above | — | — | IAP unblock |
| Pro sports/touring (11–16) | +1 | 0 | +8 to +10 | Tabs hidden + live roster |
| Events (6,18,21,22,25) | 0 to +1 | 0 to −1 | 0 to +5 | Capacity honesty; approval friction |
| Free-only (8,24,26,28) | 0 | 0 to −1 | 0 | Unchanged WTP |

---

## Recommended next implementation tickets (post-refresh)

1. Guest read-only calendar/polls for active invite tokens  
2. Wire remaining `featurePaywall` destinations to Trip Pass modal  
3. Trip Pass CTA on payment split limit error  
4. Replace ForTeams mailto with Calendly + self-serve Stripe (price IDs exist)  
5. Enable PostHog product events (`trip_joined`, `upgrade_prompt_shown`, `upgrade_completed`)  
6. Admin “add member by email” fallback (July audit #1)  

See updated `top-priority-fixes.md`.
