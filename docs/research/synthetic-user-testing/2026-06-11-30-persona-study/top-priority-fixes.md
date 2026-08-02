# Top Priority Fixes — 30-Persona Study (Refreshed 2026-08-02)

**Source:** Evidence refresh after PR #867 + related landings · `REBASE-REFRESH-2026-08-02.md`  
**Evidence labels:** `[OBSERVED]` · `[SIMULATED RISK]` · `[HYPOTHESIS]`

Items marked ✅ are **closed** — do not re-ticket.

---

## ✅ Closed since June 11 (includes July + August landings)

| Was | Fix landed | Citation |
|-----|------------|----------|
| iOS “Subscribe on web” dead-end | `APPLE_IAP_ENABLED: true` | `src/billing/config.ts:260` |
| Trip Pass unreachable in-app | `PlusUpsellModal` + Concierge + `ConsumerBillingSection` | `PlusUpsellModal.tsx` |
| Pro placeholder tabs on real trips | `filterPlaceholderTabs` / `PLACEHOLDER_PRO_TAB_IDS` | `ProTabsConfig.tsx:50-67` |
| Pro roster always empty | Live overlay from `useTripMembers` | `ProTripDetailDesktop.tsx` |
| Payment split cap theater | `checkPaymentSplitLimit` enforced | `paymentService.ts` |
| Settlement double-credit race | Atomic RPCs | `20260610100000_atomic_settlement_rpcs.sql` |
| Broadcast fanout schema drift | Fix migration | `20260610090000_…` |
| Invite `max_uses` dead | Persisted + join check + capacity RPC | `useInviteLink.ts`, `join-trip` |
| Smart Import 100% paywalled | Free taste (now **5 account-wide**) | `useSmartImportTaste.ts` |
| Join “wrong default” framing | **Product is always-approval** (intentional) | `JoinTrip.tsx`, `join-trip` |
| In-app Pro checkout missing | `ProUpgradeModal` + `billing/checkout.ts` | Stripe path |
| No add-by-email growth fallback | `add-trip-member-by-contact` + `AddExistingMemberSection` | **Aug 2 — existing accounts only** |
| No broadcast per-person ack | `get_broadcast_viewers` + Seen-by sheet | `BroadcastViewersSheet.tsx` |
| No Pro day sheet | `ProDaySheet` from live `trip_events` | `mapCalendarToProSchedule.ts` |
| featurePaywall Settings dead-end | Settings opens `PlusUpsellModal` on `?gate=` | `SettingsPage.tsx` |
| ForTeams trial = mailto only | Hero trial → `startProCheckout` | `ForTeams.tsx`, `startProCheckout.ts` |
| Payments chase only via Venmo | Remind button on unpaid balances | `PersonBalanceCard.tsx` |

---

## P0 — Ship before scaling acquisition or Pro sales

### P0-1: Guest read-only itinerary (pre-auth or light-auth)

| Field | Detail |
|-------|--------|
| **Problem** | `consumer_guest` has NO access. Invitee must create account + wait for approval before seeing calendar/polls. Invite avg **5.3/10** after add-by-contact — cold invitees still leak. |
| **Personas** | 2, 7, 10, 21, 26, 27 (sports mom, reunion, friends, wedding planner, church, school) |
| **Code refs** | `src/types/permissionMatrix.generated.ts` · `src/pages/JoinTrip.tsx` · `/trip/:id/preview` is **not** guest itinerary |
| **Fix** | Token-scoped read of calendar + open polls on join preview (or `consumer_guest` read grants for those resources only). Chat/write stay gated. |
| **Evidence** | `[OBSERVED]` permission matrix |
| **Acceptance** | Active invite link shows next 7 days of schedule + open polls without signup |
| **Effort / Owner** | L · Core + Auth |
| **Impact** | Revenue High · Retention High |

---

### P0-2: Emit + verify PostHog product funnel events

| Field | Detail |
|-------|--------|
| **Problem** | Typed events exist (`trip_joined`, `upgrade_prompt_shown`, …) but production funnel is not proven; few upgrade surfaces call `upgradePromptShown`. |
| **Personas** | All (decision quality) |
| **Code refs** | `src/telemetry/events.ts` · `src/telemetry/service.ts` · `docs/ops/posthog-key-rotation-vercel.md` |
| **Fix** | Wire emit at join + paywall surfaces; confirm Vercel key; verify 5 events in PostHog within 48h |
| **Evidence** | `[OBSERVED — code]` · `[HYPOTHESIS — prod ingestion]` |
| **Acceptance** | Custom events visible in PostHog project after staging exercise |
| **Effort / Owner** | S · Platform / Growth |

---

### P0-3: Trip Pass at remaining limit walls (no Settings hop)

| Field | Detail |
|-------|--------|
| **Problem** | Concierge/PlusUpsell fixed; `featurePaywall` still navigates to `/settings` (upsell opens — extra hop). Split-cap error has no Trip Pass CTA. |
| **Personas** | 2–4, 9–10, 23 (Trip Pass fit) |
| **Code refs** | `src/components/subscription/featurePaywall.ts` · `paymentService` limit errors · `CalendarImportModal` |
| **Fix** | Open `TripPassModal` / `PlusUpsellModal` in-place at Smart Import #6+, split #4, trip cap |
| **Evidence** | `[OBSERVED]` |
| **Acceptance** | Free user hitting import overage or split #4 sees Trip Pass checkout without Settings |
| **Effort / Owner** | M · Growth + Billing |
| **Impact** | Revenue High |

---

## P1 — Ship within 2 weeks of P0

### P1-1: Unify ForTeams demo CTAs + set Calendly

| Field | Detail |
|-------|--------|
| **Problem** | Hero uses `openProDemoScheduler()`; footer still hardcodes mailto. Without `VITE_CALENDLY_DEMO_URL`, demo falls back to mailto (confirmed live). |
| **Personas** | 11–17, 19–20 |
| **Code refs** | `ForTeams.tsx:119-130` vs `:402-410` · `billing/startProCheckout.ts` |
| **Fix** | Footer → `openProDemoScheduler`; set Calendly env in Vercel |
| **Evidence** | `[OBSERVED — live /teams 2026-08-02]` |
| **Effort / Owner** | S · Growth |

---

### P1-2: Pro ops beyond day-sheet (settlement / rooming honesty)

| Field | Detail |
|-------|--------|
| **Problem** | Day-sheet MVP ships today’s calendar. `tripConverter` still hardcodes settlement/medical/compliance/roomAssignments `[]`. |
| **Personas** | 11–17 |
| **Code refs** | `tripConverter.ts:92-104` · `ProDaySheet.tsx` |
| **Fix** | Extend day sheet (multi-day) + rooming MVP **or** publish “not yet” on `/teams` claims for settlement/medical |
| **Evidence** | `[OBSERVED]` |
| **Effort / Owner** | L · Pro |

---

### P1-3: Cut onboarding to ≤4 screens for invite arrivals

| Field | Detail |
|-------|--------|
| **Problem** | Still 10 screens (`OnboardingCarousel.tsx`). Invitees already have a destination. |
| **Personas** | 2, 7, 8, 25, 26 |
| **Fix** | Skip or 2-screen path when `invite` context present |
| **Evidence** | `[OBSERVED]` + `[SIMULATED RISK]` |
| **Effort / Owner** | M · Growth |

---

### P1-4: Honest voice labeling + flag gate

| Field | Detail |
|-------|--------|
| **Problem** | Product path dictation-only; realtime behind `concierge_realtime_voice` default OFF. |
| **Code refs** | `voiceProductPath.ts` · `docs/voice-product-path.md` |
| **Fix** | Pricing/copy = “voice dictation”; live voice only when flag on |
| **Evidence** | `[OBSERVED]` |
| **Effort / Owner** | S · AI / Growth |

---

### P1-5: Upload quota fail-closed

| Field | Detail |
|-------|--------|
| **Problem** | Upload still fails open on usage lookup errors (`uploadService.ts:72-75`) |
| **Fix** | Fail closed with retry; never allow unlimited on error |
| **Evidence** | `[OBSERVED]` |
| **Effort / Owner** | S · Backend |

---

### P1-6: Prove org-invite email delivery

| Field | Detail |
|-------|--------|
| **Problem** | `InviteMemberModal` toasts “Invitation sent” via `invite-organization-member` — July audit flagged silent non-delivery; not re-proven fixed. |
| **Personas** | 18–20, 22 |
| **Fix** | End-to-end send test + fix domain/template if still broken |
| **Evidence** | `[HYPOTHESIS — needs live email proof]` (July `[OBSERVED]` unpaid debt) |
| **Effort / Owner** | M · Backend |

---

## P2 — Retention / polish

| ID | Fix | Personas |
|----|-----|----------|
| P2-1 | Per-trip notification mute + digest | 2, 6, 22, 25 |
| P2-2 | Branded / white-label PDF export | 1, 29 |
| P2-3 | Duplicate-trip / season template for run club | 24 |
| P2-4 | Event-specific pricing copy on event create | 6, 18, 21, 22 |
| P2-5 | Timezone + i18n honesty for international | 30 |
| P2-6 | Multi-day Pro day sheet (not today-only) | 15, 16 |
| P2-7 | Align free AI quota copy with **3**/trip | All free |

---

## P3 — Later / do not build yet

- In-app payment processor (Venmo settle + Remind is enough) `[HYPOTHESIS]`
- Full OTA booking aggregation `[OBSERVED — AGENTS.md]`
- Agency multi-tenant white-label before Pro settlement/rooming `[SIMULATED RISK]`
- Live Gemini voice rebuild before labeling honesty `[OBSERVED]`
- Add-by-contact for users who do **not** yet have accounts (that’s guest/invite — don’t invent a second signup path)

---

## Dependency order

```
P0-2 PostHog product events ─────────────► measures all other fixes
P0-1 Guest itinerary ──► invite scores for cold users
P0-3 Trip Pass remaining walls ──► paid conversion
P1-1 ForTeams CTA consistency + Calendly env
P1-2 Pro ops beyond day-sheet OR claim purge
P1-3 Invitee onboarding short path
```

---

*Synthetic scores are hypotheses until PostHog product events + real interviews confirm. See `real-beta-interview-questions.md`.*
