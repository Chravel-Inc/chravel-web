# Top Priority Fixes — 30-Persona Synthetic Study

**Date:** 2026-06-11  
**Source:** `feature-findings.csv`, `persona-matrix.csv`, `../evidence/product-ground-truth.md`, codebase verification  
**Evidence labels:** `[OBSERVED]` · `[SIMULATED RISK]` · `[HYPOTHESIS]`

---

## P0 — Ship before scaling acquisition or Pro sales

### P0-1: Surface Trip Pass at in-app limit walls

| Field | Detail |
|-------|--------|
| **Problem** | Trip Pass ($39.99 / $74.99) is the preferred SKU for 14/30 personas but only purchasable from marketing `PricingSection.tsx`. Limit walls route to `/settings?section=billing` with subscription copy. |
| **Personas** | 2–4, 6, 9–10, 23, 28 (all Trip Pass–fit Regular) |
| **Code refs** | `src/components/conversion/TripPassModal.tsx` (checkout works) · `src/components/subscription/featurePaywall.ts` (no Trip Pass destination) · `src/components/conversion/PricingSection.tsx:596-597` (only mount site) · `src/constants/stripe.ts` (Trip Pass products) |
| **Fix** | Add `trip_pass` gate to `FeaturePaywallGate`; render `TripPassModal` from concierge, Smart Import, media, and split walls; A/B Trip Pass primary vs Explorer sub. |
| **Evidence** | `[OBSERVED]` — 30/30 rows in `feature-findings.csv` pricing row |
| **Acceptance** | User at concierge limit sees Trip Pass CTA → Stripe checkout without visiting landing page |

---

### P0-2: Guest read-only itinerary (pre-auth or light-auth)

| Field | Detail |
|-------|--------|
| **Problem** | `consumer_guest` has NO access to any resource. Invitee must create account before seeing calendar/polls. Invite scores avg 5.1/10. |
| **Personas** | 2, 7, 10, 21, 26, 27 (sports mom, reunion, school, church, wedding planner) |
| **Code refs** | `src/types/permissionMatrix.generated.ts` (`consumer_guest` all `false`) · `src/pages/JoinTrip.tsx` (preview card exists, no itinerary) · `src/hooks/useMutationPermissions.ts:77` (role resolution) |
| **Fix** | New `consumer_guest` read grants for `calendar:read`, `polls:read` (or token-scoped public preview route `/trip/:id/preview` without membership) |
| **Evidence** | `[OBSERVED]` permission matrix · `[SIMULATED RISK]` parent/elder abandonment |
| **Acceptance** | Invite link shows next 7 days of calendar + open polls without signup; chat/write still gated |

---

### P0-3: Enable PostHog production telemetry

| Field | Detail |
|-------|--------|
| **Problem** | Zero Chravel events ingested ever. Cannot measure invite, activation, or monetization fixes. |
| **Personas** | All (founder/investor decision quality) |
| **Code refs** | `src/telemetry/providers/posthog.ts:22` (init gated on apiKey) · `src/telemetry/service.ts` · `src/telemetry/types.ts` (full event map) · `../evidence/posthog-funnel.md` |
| **Fix** | Set `VITE_POSTHOG_API_KEY` in Vercel production; verify `upgrade_prompt_shown`, `trip_joined`, `onboarding_completed` |
| **Evidence** | `[OBSERVED]` |
| **Acceptance** | PostHog `ingested_event: true`; 5 funnel events firing within 48h of deploy |

---

### P0-4: Hide or ship Pro ops tabs (stop selling placeholders)

| Field | Detail |
|-------|--------|
| **Problem** | `tripConverter.ts` hardcodes `roster`, `roomAssignments`, `schedule`, `settlement`, `perDiem`, `medical`, `compliance` to empty arrays for all real Pro trips. Demo mocks populate them. |
| **Personas** | 11–17, 19–20, 29 (all Pro; NPS −15 to −40) |
| **Code refs** | `src/utils/tripConverter.ts:117-130` · `src/components/pro/admin/` (ProTabContent placeholders) · `src/components/pro/ProTabsConfig.tsx` |
| **Fix** | **Option A (fast):** Hide tabs without backend data. **Option B:** Wire roster/schedule to Supabase tables with CRUD. |
| **Evidence** | `[OBSERVED]` |
| **Acceptance** | Real Pro trip shows no empty "Settlement" or "Compliance" tabs unless data exists |

---

### P0-5: Join page approval framing default

| Field | Detail |
|-------|--------|
| **Problem** | `require_approval ?? true` defaults to approval UI ("Member Approval") even for open invites. Improved since 10-persona study (conditional `getJoinActionPresentation`) but default still wrong when flag missing. |
| **Personas** | 7, 10, 21 (family, friends, wedding) |
| **Code refs** | `src/pages/JoinTrip.tsx:857-859, 995-999` · `getJoinActionPresentation()` |
| **Fix** | Default `require_approval` to `false` when invite payload omits flag; only show approval banner when `true` |
| **Evidence** | `[OBSERVED]` |
| **Acceptance** | Open invite shows "Join Trip" without approval messaging |

---

## P1 — Ship within 2 weeks of P0

### P1-1: iOS consumer monetization path

| Field | Detail |
|-------|--------|
| **Problem** | `APPLE_IAP_ENABLED = false` → "Subscribe on web" with no actionable deep link. 17/30 personas primary iOS. |
| **Personas** | 2, 4, 8, 9, 15, 23, 25, 28 |
| **Code refs** | `src/billing/config.ts` · `src/constants/revenuecat.ts` · `src/components/consumer/ConsumerGeneralSettings.tsx` (subscription management) |
| **Fix** | Either enable RevenueCat IAP for Trip Pass + Explorer, or compliant external checkout link to `chravel.app/settings?checkout=trip-pass` |
| **Evidence** | `[OBSERVED]` product-ground-truth §7 |
| **Acceptance** | iOS user completes Trip Pass purchase without support email |

---

### P1-2: Events pricing visibility

| Field | Detail |
|-------|--------|
| **Problem** | Landing explains consumer tiers; Events creation doesn't surface Event pass / attendee economics. Personas 6, 18, 21, 22 confused by "100 attendee" label. |
| **Personas** | 6, 18, 21, 22, 25 |
| **Code refs** | `src/pages/EventDetail.tsx` · `src/components/CreateTripModal.tsx` (event type) · `src/billing/entitlements.ts:296-302` (3 lifetime events) · `src/components/landing/FullPageLanding.tsx` |
| **Fix** | Events-specific pricing block on create + event settings; clarify cap is tier label not hard block (or enforce consistently) |
| **Evidence** | `[OBSERVED]` cap unenforced · `[SIMULATED RISK]` wedding scare |
| **Acceptance** | Event organizer sees per-event cost before publishing invite |

---

### P1-3: Enforce or remove payment split cap

| Field | Detail |
|-------|--------|
| **Problem** | Free tier advertises 3 splits/trip; no enforcement in UI or edge functions. Trust erosion when eventually enforced. |
| **Personas** | 2, 4, 5, 9, 28 |
| **Code refs** | `src/billing/entitlements.ts` · `src/components/payments/` · `src/billing/featureTiers.ts` |
| **Fix** | Add split count check before `createExpense`; show Trip Pass wall at split 4 |
| **Evidence** | `[OBSERVED]` 10-persona REPORT §5 C1 |
| **Acceptance** | Free user blocked on 4th split with Trip Pass CTA |

---

### P1-4: Self-serve Pro checkout (replace mailto)

| Field | Detail |
|-------|--------|
| **Problem** | Pro trial CTAs are `mailto:support@` / `mailto:billing@`. B2B buyers cannot expense via email link. |
| **Personas** | 11–14, 18, 19 |
| **Code refs** | `src/components/conversion/PricingSection.tsx:140-173` · `src/constants/stripe.ts` (Pro products) |
| **Fix** | Stripe Checkout for Pro Starter/Growth trials; keep mailto only for Enterprise |
| **Evidence** | `[OBSERVED]` |
| **Acceptance** | Pro Starter 14-day trial starts without leaving app |

---

### P1-5: Broadcast fanout production validation

| Field | Detail |
|-------|--------|
| **Problem** | Schema drift (`trip_broadcasts` vs `broadcasts`, `title`/`content` vs `message`) caused fanout failures. Migration fixed 2026-06-10; not load-tested. |
| **Personas** | 22, 25, 14 (conference, frat, HS athletic) |
| **Code refs** | `supabase/migrations/20260610090000_fix_broadcast_notification_fanout_table.sql` · `src/services/broadcastService.ts` · `src/services/unifiedMessagingService.ts` |
| **Fix** | Deploy migration; load test 500-member broadcast; monitor INSERT duration |
| **Evidence** | `[OBSERVED]` |
| **Acceptance** | Broadcast to 500 members completes <5s; notifications appear for recipients |

---

## P2 — Important but not blocking first revenue

### P2-1: Per-trip notification mute

| **Personas** | 25, 22, 14  
| **Code refs** | `src/components/home/NotificationsDialog.tsx` · NOTIFICATION_AUDIT.md  
| **Evidence** | `[OBSERVED]` no mute · `[SIMULATED RISK]` frat notification firehose  

### P2-2: Onboarding length reduction (10 → 4 screens)

| **Personas** | 8, 25, 28  
| **Code refs** | `src/components/onboarding/OnboardingCarousel.tsx:54-118` (10 screens)  
| **Evidence** | `[OBSERVED]` screen count · `[SIMULATED RISK]` college/frat drop-off  

### P2-3: Mobile day sheet for Pro/touring

| **Personas** | 15, 16, 17  
| **Code refs** | `src/pages/ProTripDetailDesktop.tsx` · `src/pages/MobileTripDetail.tsx`  
| **Evidence** | `[SIMULATED RISK]`  

### P2-4: Honest voice concierge labeling

| **Personas** | FC-tier consumers, 15  
| **Code refs** | `supabase/functions/_shared/voiceProductPath.ts` (`VOICE_PRODUCT_PATH = 'dictation-only'`)  
| **Evidence** | `[OBSERVED]`  

### P2-5: Invite CTA prominence on mobile

| **Personas** | 10, 23  
| **Code refs** | `src/components/share/ShareTripModal.tsx` · mobile `NativeTabBar` / More menu  
| **Evidence** | `[SIMULATED RISK]` invite buried  

### P2-6: PDF export + branding for luxury/advisor

| **Personas** | 1, 29  
| **Code refs** | `src/components/trip/TripExportModal.tsx` · `_usageStatus` discarded at line 116  
| **Evidence** | `[OBSERVED]` export usage computed · `[SIMULATED RISK]` dead button reports  

---

## P3 — Defer until P0–P2 validated with real users

### P3-1: Duplicate / recurring trip template

| **Personas** | 24 (run club)  
| **Code refs** | `src/components/CreateTripModal.tsx`  
| **Evidence** | `[SIMULATED RISK]` — WTP $0  

### P3-2: Corporate reimbursement mode

| **Personas** | 18  
| **Code refs** | `src/components/payments/`  
| **Evidence** | `[SIMULATED RISK]`  

### P3-3: White-label / client workspaces

| **Personas** | 20, 29  
| **Code refs** | Org model `src/pages/organizations`  
| **Evidence** | `[SIMULATED RISK]`  

### P3-4: i18n and US-centric copy pass

| **Personas** | 30  
| **Code refs** | Trip create timezone (works); broader copy audit  
| **Evidence** | `[SIMULATED RISK]`  

### P3-5: Multi-trip Pro dashboard

| **Personas** | 14 (HS athletic director)  
| **Code refs** | `src/pages/Index.tsx`  
| **Evidence** | `[SIMULATED RISK]`  

---

## Fix dependency graph

```
P0-3 PostHog ─────────────────────────────► measures all other fixes
P0-1 Trip Pass walls ──► P1-1 iOS checkout
P0-2 Guest read-only ──► invite score improvement
P0-4 Pro stub hide ────► P1-4 Pro checkout (don't sell empty tabs)
P0-5 Join framing ─────► independent
P1-3 Split enforce ────► uses P0-1 Trip Pass modal
P1-5 Broadcast validate ► independent (backend)
```

---

## Persona segment → P0 mapping

| Segment | P0 fixes (priority order) |
|---------|---------------------------|
| Regular friend/social | P0-1, P0-2, P0-5 |
| Sports/youth parent | P0-2, P0-1, P1-3 |
| Events/wedding | P0-1, P1-2, P0-5 |
| Pro sports/touring | P0-4, P1-4, P1-5 |
| Enterprise/scale | P0-3, P1-5, P0-4 |

---

*Next step: convert P0 items to implementation tickets. Synthetic scores are hypotheses until PostHog + real interviews confirm.*
