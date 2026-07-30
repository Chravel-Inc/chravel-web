# Top Priority Fixes — 30-Persona Study (Refreshed 2026-07-26)

**Source:** Re-verification after rebase onto `main` · `REBASE-REFRESH-2026-07-26.md` · July product audits  
**Evidence labels:** `[OBSERVED]` · `[SIMULATED RISK]` · `[HYPOTHESIS]`

Items marked ✅ were P0/P1 in the June 11 package and are **closed** — do not re-ticket.

---

## ✅ Closed since June 11 study

| Was | Fix landed | Citation |
|-----|------------|----------|
| iOS “Subscribe on web” dead-end | `APPLE_IAP_ENABLED: true` | `src/billing/config.ts:260` |
| Trip Pass unreachable in-app | `PlusUpsellModal` + Concierge + `ConsumerBillingSection` | `PlusUpsellModal.tsx:266-282` |
| Pro placeholder tabs on real trips | `filterPlaceholderTabs` / `PLACEHOLDER_PRO_TAB_IDS` | `ProTabsConfig.tsx:50-67` |
| Pro roster always empty | Live overlay from `useTripMembers` | `ProTripDetailDesktop.tsx` |
| Payment split cap theater | `checkPaymentSplitLimit` enforced | `paymentService.ts` |
| Settlement double-credit race | Atomic RPCs | `20260610100000_atomic_settlement_rpcs.sql` |
| Broadcast fanout schema drift | Fix migration | `20260610090000_fix_broadcast_notification_fanout_table.sql` |
| Invite `max_uses` dead | Persisted + join check + capacity RPC | `useInviteLink.ts`, `join-trip` |
| Smart Import 100% paywalled | 1 free taste / trip | `useSmartImportTaste.ts` |
| Join “wrong default” framing | **Product is always-approval** (intentional) | `JoinTrip.tsx:115-121`, `join-trip/index.ts:330-334` |
| In-app Pro checkout missing | `ProUpgradeModal` + `billing/checkout.ts` | Stripe path exists |

---

## P0 — Ship before scaling acquisition or Pro sales

### P0-1: Guest read-only itinerary (pre-auth or light-auth)

| Field | Detail |
|-------|--------|
| **Problem** | `consumer_guest` has NO access. Invitee must create account + wait for approval before seeing calendar/polls. Invite avg **4.9/10** after refresh. |
| **Personas** | 2, 7, 10, 21, 26, 27 (sports mom, reunion, friends, wedding planner, church, school) |
| **Code refs** | `src/types/permissionMatrix.generated.ts` · `src/pages/JoinTrip.tsx` · `/trip/:id/preview` is **not** guest itinerary (`TripPreview.tsx`) |
| **Fix** | Token-scoped read of calendar + open polls on join preview (or `consumer_guest` read grants for those resources only). Chat/write stay gated. |
| **Evidence** | `[OBSERVED]` permission matrix · July product audit §2 (invite is sole growth path) |
| **Acceptance** | Active invite link shows next 7 days of schedule + open polls without signup |

---

### P0-2: Growth fallback — add member by email / repair org invites

| Field | Detail |
|-------|--------|
| **Problem** | Invite link is the **only** join path for real trips. No admin add-by-email. Org invite UI says “Invitation sent” but email never sends (stale domain). |
| **Personas** | All; especially Pro/Events (11–22) |
| **Code refs** | July audit `CHRAVEL_PRODUCT_AUDIT_2026-07-25.md:14-25,91-96` · `useInviteLink.resendInvite` mailto-only |
| **Fix** | (a) Organizer “Add member by email” for existing accounts; (b) fix org-invite email send + accept domain |
| **Evidence** | `[OBSERVED — July product audit]` |
| **Acceptance** | Broken/expired invite is recoverable without support; org invite delivers email |

---

### P0-3: Enable PostHog **product** funnel events

| Field | Detail |
|-------|--------|
| **Problem** | Autocapture trickle exists (project `464040`); **zero** custom product events (`trip_joined`, `upgrade_*`). Funnel still dark. |
| **Personas** | All (decision quality) |
| **Code refs** | `src/telemetry/types.ts` · `src/telemetry/service.ts` · `docs/ops/posthog-key-rotation-vercel.md` |
| **Fix** | Confirm Vercel key; emit 5 events: `trip_join_started`, `trip_joined`, `upgrade_prompt_shown`, `upgrade_started`, `upgrade_completed` |
| **Evidence** | `[OBSERVED — PostHog MCP 2026-07-26]` |
| **Acceptance** | Custom events visible in PostHog within 48h of deploy |

---

### P0-4: Finish Trip Pass at **all** limit walls

| Field | Detail |
|-------|--------|
| **Problem** | Concierge/trip upsell fixed; Smart Import calendar + generic `featurePaywall` gates still → `/settings?section=billing`. Split-cap error has no Trip Pass CTA. |
| **Personas** | 2–4, 9–10, 23 (Trip Pass fit) |
| **Code refs** | `src/components/subscription/featurePaywall.ts` · `CalendarImportModal.tsx:728-735` · `paymentService` limit errors |
| **Fix** | Route Smart Import / trip-cap / split-cap walls through `PlusUpsellModal` / `TripPassModal` |
| **Evidence** | `[OBSERVED]` |
| **Acceptance** | Free user hitting import #2 or split #4 sees Trip Pass checkout without Settings detour |

---

## P1 — Ship within 2 weeks of P0

### P1-1: Replace ForTeams / marketing Pro mailto with self-serve + demo booking

| Field | Detail |
|-------|--------|
| **Problem** | In-app `ProUpgradeModal` can Stripe-checkout; `/teams` and marketing Pro cards still `mailto:` |
| **Personas** | 11–17, 19–20 |
| **Code refs** | `ForTeams.tsx` · `PricingSection.tsx` Pro cards · `ProUpgradeModal.tsx` · `billing/checkout.ts` |
| **Fix** | Wire marketing CTAs to same checkout / Calendly; keep Enterprise as sales |
| **Evidence** | `[OBSERVED]` |

---

### P1-2: Pro ops CRUD or honest “coming soon” roadmap (not empty converter)

| Field | Detail |
|-------|--------|
| **Problem** | Placeholder tabs hidden (good); `tripConverter` still hardcodes schedule/settlement/medical/compliance `[]`. No day sheet. |
| **Personas** | 11–17 |
| **Code refs** | `tripConverter.ts:92-104` · `types/pro.ts` |
| **Fix** | Ship typed schedule + rooming MVP **or** publish “not yet” on `/teams` claims |
| **Evidence** | `[OBSERVED]` |

---

### P1-3: Cut onboarding to ≤4 screens for invite arrivals

| Field | Detail |
|-------|--------|
| **Problem** | Still 10 screens (`OnboardingCarousel.tsx:54-121`). Invitees already have a destination. |
| **Personas** | 2, 7, 8, 25, 26 |
| **Fix** | Skip or 2-screen path when `invite` context present |
| **Evidence** | `[OBSERVED]` + `[SIMULATED RISK]` |

---

### P1-4: Honest voice labeling + flag gate

| Field | Detail |
|-------|--------|
| **Problem** | Product path dictation-only; realtime behind `concierge_realtime_voice` default OFF. Frequent Chraveler marketing still implies live voice. |
| **Code refs** | `voiceProductPath.ts` · `docs/voice-product-path.md` · `AIConciergeChat.tsx` |
| **Fix** | Pricing/copy = “voice dictation”; live voice only when flag on |
| **Evidence** | `[OBSERVED]` |

---

### P1-5: Upload quota fail-closed

| Field | Detail |
|-------|--------|
| **Problem** | UI quota fixed; upload still fails open on usage lookup errors (`uploadService.ts:70-73`) |
| **Fix** | Fail closed with retry; never allow unlimited on error |
| **Evidence** | `[OBSERVED — post-drift audit]` |

---

## P2 — Retention / polish

| ID | Fix | Personas |
|----|-----|----------|
| P2-1 | Per-trip notification mute + digest | 2, 6, 22, 25 |
| P2-2 | Branded / white-label PDF export | 1, 29 |
| P2-3 | Duplicate-trip / season template for run club | 24 |
| P2-4 | Event-specific pricing copy on event create | 6, 18, 21, 22 |
| P2-5 | Timezone + i18n honesty for international | 30 |

---

## P3 — Later / do not build yet

- In-app payment processor (Venmo settle is enough) `[HYPOTHESIS]`
- Full OTA booking aggregation `[OBSERVED — AGENTS.md]`
- Agency multi-tenant white-label before Pro ops CRUD `[SIMULATED RISK]`
- Live Gemini voice rebuild before labeling honesty `[OBSERVED]`

---

## Dependency order

```
P0-3 PostHog product events ─────────────► measures all other fixes
P0-1 Guest itinerary ──► invite scores
P0-2 Growth fallback ──► scale risk from July audit
P0-4 Trip Pass remaining walls ──► paid conversion
P1-1 Marketing Pro checkout parity
P1-2 Pro ops MVP or claim removal
```

---

*Synthetic scores are hypotheses until PostHog product events + real interviews confirm. See `real-beta-interview-questions.md`.*
