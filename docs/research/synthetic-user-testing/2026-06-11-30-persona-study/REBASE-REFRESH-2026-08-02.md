# 30-Persona Study — Evidence Refresh (2026-08-02)

**Action:** Weekly cron refresh of the June 11 package against current `main` after PR #867 (`cursor/synthetic-study-p0-fixes-9c54`) and related landings. Re-verified open P0/P1 claims in code + live browser (desktop 1280×800 + mobile 390×844).

**Not a new synthetic swarm.** Persona voices in `30-persona-full-report.md` remain the June synthetic interviews. **Scores, priorities, and OBSERVED claims** are updated here and in companion files. Prefer this folder over inventing a new dated package (automation memory).

**Companions:**

- Prior refresh: `REBASE-REFRESH-2026-07-26.md`
- Ground truth delta: `../evidence/product-ground-truth.md` (Aug 2 header)
- Live UI sample: localhost Vite `8080` on 2026-08-02 (landing, pricing, `/teams`, demo cards; demo trip interior blocked by Stream/Supabase CORS in this environment)

---

## Scoreboard: July 26 → August 2 (synthetic averages)

| Metric | June 11 | July 26 | **August 2** | Direction |
|--------|---------|----------|--------------|-----------|
| Activation | 6.1 | 6.0 | **6.0** | flat |
| Invite | 5.1 | 4.9 | **5.3** | **+0.4** — add-by-contact for existing users |
| Paid conversion | 2.7 | 3.5 | **3.7** | **+0.2** — Settings→PlusUpsell + Pro checkout on `/teams` |
| NPS (avg) | ~−10 | −5.8 | **−1.6** | improved; Pro day-sheet MVP + less mailto |

Source: `persona-matrix.csv` after score adjustments below.

---

## What got fixed since July 26 (do not re-cite as open)

| Item | Evidence | Impact on personas |
|------|----------|-------------------|
| **Add member by email/phone** | Edge `add-trip-member-by-contact` + `AddExistingMemberSection` in `InviteModal`; FAQ documents path | Growth no longer **solely** invite-link — but only for people who already have Chravel accounts |
| **Invite seat preview** | `get-invite-preview` surfaces `TRIP_FULL` / capacity; InviteModal shows seats filled | Events/Pro honesty |
| **Broadcast “Seen by N” roster** | `get_broadcast_viewers` RPC + `BroadcastViewersSheet` | Pro sports / conference ack need |
| **Pro day-sheet MVP** | `ProDaySheet.tsx` + `mapCalendarToProSchedule.ts` reads live `trip_events` | Touring/sports day-sheet was hollow — now calendar-backed for today |
| **Payments Remind** | `PersonBalanceCard` Remind → in-app nudge | Sports/bachelor reimbursement chase |
| **featurePaywall → Settings opens upsell** | `SettingsPage.tsx` opens `PlusUpsellModal` when `?gate=` / `modal=upgrade` | Settings detour less deadly; still not direct Trip Pass at wall |
| **Smart Import free taste expanded** | `FREE_SMART_IMPORT_TASTE_LIMIT = 5` account-wide (`useSmartImportTaste.ts`) | Was 1/trip in July wording |
| **ForTeams primary trial CTA** | `startProCheckout` / Stripe via `billing/startProCheckout.ts`; hero “Start 14-Day Trial” | Marketing Pro path partially self-serve |
| **ForTeams demo scheduler helper** | `openProDemoScheduler()` → Calendly if `VITE_CALENDLY_DEMO_URL`, else mailto | Demo CTA still mailto when Calendly unset `[OBSERVED — live /teams]` |
| **Pro finance honesty copy** | Placeholder tabs remain hidden; Payments tab honesty copy | Trust |

---

## Still open (updated P0/P1)

| Priority | Item | Evidence | Personas hit |
|----------|------|----------|--------------|
| **P0** | Guest / pre-auth itinerary still impossible | `consumer_guest` all-false in `permissionMatrix.generated.ts` | Sports parents, reunions, school, church, wedding guests |
| **P0** | Product PostHog funnel still dark / under-wired | Typed events exist (`trip_joined`, `upgrade_prompt_shown`); few call sites emit; production funnel not proven | Founder decisions |
| **P0** | Remaining Trip Pass surfacing gaps | `featurePaywall.ts` still routes → `/settings` (upsell opens, but extra hop); split-cap error has no Trip Pass CTA | Free→paid Regular |
| **P1** | ForTeams footer “Schedule a Demo” still hardcodes mailto | `ForTeams.tsx:402-410` (hero uses `openProDemoScheduler`) | NFL/NBA/touring discovery |
| **P1** | Calendly env often unset → demo mailto fallback | `startProCheckout.ts:22-28`; live test opened mail client | Pro discovery |
| **P1** | Pro ops beyond day-sheet still empty in converter | `tripConverter.ts` still `settlement/medical/compliance/roomAssignments: []` | All Pro |
| **P1** | Add-by-contact does **not** replace invite for new users | Account must already exist; cold invitees still hit guest wall | Consumer viral loop |
| **P1** | Org invite email path still toast-optimistic | `InviteMemberModal` “Invitation sent” via `invite-organization-member` — delivery not re-proven this refresh | Enterprise |
| **P2** | Onboarding still 10 screens | `OnboardingCarousel.tsx` `screens.length === 10` | College, frat, time-poor parents |
| **P2** | Voice still dictation-only (realtime flag off) | `voiceProductPath.ts` | Frequent Chraveler buyers |
| **P2** | Upload quota still fails open on lookup errors | `uploadService.ts:72-75` | Media-heavy groups |
| **P2** | Free AI quota is **3**/user/trip (not 10) | `entitlements.ts` free: 3 — June report text sometimes said 10 | All free users |

---

## Live UI sample (2026-08-02) `[OBSERVED]`

### Desktop (1280×800)

- Landing hero: brand **ChravelApp**, kicker “Less Chaos · More Coordination”, h1 aria **“The Group Chat Travel App”** (`HeroSection.tsx`)
- Feature pitch: “ONE APP, NOT TWELVE” + 8 tabs named
- Pricing tabs: ChravelApp Plus · ChravelApp Pro · Trip Passes
  - Explorer $9.99/mo · FC $19.99/mo · Trip Pass $39.99/45d · FC Pass $74.99/90d
  - Pro Starter $49 · Growth $99 · Enterprise Contact Sales
- `/teams`: hero **Start 14-Day Trial** invokes checkout edge (failed in this env: Edge Function fetch) — code path is Stripe, not mailto; footer Schedule Demo still mailto
- Console: React Router v7 future-flag warnings only on landing; demo trip detail blocked (Stream/Supabase CORS)

### Mobile (390×844)

- First viewport: brand + headline + “Get Started — It's Free” above the fold
- `/teams` responsive; same CTA pair
- Demo trip interior not entered (same backend block)

---

## Framing shifts (August)

### 1. Growth is dual-path for *existing* users, still single-path for cold invites

July said “invite link is the only join path.” August: organizers can add existing accounts by email/phone. Cold invitees (majority of consumer viral loops) still need the link + account + always-approval. Guest read-only remains the unlock.

### 2. Marketing Pro is no longer “all mailto”

Hero trial → Stripe checkout helper. Demo → Calendly-or-mailto. Footer CTA still a hard-coded mailto inconsistency. Treat as **polish + env config**, not “no self-serve.”

### 3. Pro day sheet is real-but-thin

Today’s calendar events render in Pro. Settlement/medical/compliance still converter stubs. Touring NPS improves; enterprise still blocked on compliance/settlement.

### 4. Free AI = 3

Any narrative citing 10 free concierge queries is stale. Canonical: `FREEMIUM_LIMITS` free `ai_queries_*` = **3**.

---

## Score adjustment rules applied to `persona-matrix.csv`

| Segment | Paid Δ | Invite Δ | NPS Δ | Rationale |
|---------|--------|----------|-------|-----------|
| Regular Trip-Pass fit (1,2,3,4,9,10,23) | +0 to +1 | 0 | +0 to +5 | Settings upsell; guest wall unchanged |
| Pro sports/touring (11–16) | +0 to +1 | +1 | +5 to +10 | Day sheet MVP + add-by-contact + Seen-by roster |
| Events (6,18,21,22,25) | 0 to +1 | 0 to +1 | +0 to +5 | Capacity + Remind; guest wall remains |
| Free-only (8,24,26,28) | 0 | 0 | 0 | Unchanged WTP |
| Advisor / EA (19,20,29) | 0 to +1 | 0 to +1 | +0 to +5 | Checkout path; white-label still missing |

---

## Recommended next implementation tickets

1. Guest read-only calendar/polls for active invite tokens  
2. Emit + verify PostHog product events (`trip_joined`, `upgrade_prompt_shown/started/completed`)  
3. Trip Pass CTA on payment split limit + open TripPassModal without Settings hop  
4. Unify ForTeams footer demo CTA to `openProDemoScheduler`; set `VITE_CALENDLY_DEMO_URL` in Vercel  
5. Expand Pro day sheet beyond “today” + settle/rooming honesty  
6. Short invitee onboarding (≤2 screens when invite context present)

See updated `top-priority-fixes.md`.
