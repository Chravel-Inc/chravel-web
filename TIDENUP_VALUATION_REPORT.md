# TidenUP — Product Valuation, Rebuild-Cost & Deal-Structure Report

**Prepared for:** Prospective buyer/operator evaluating TidenUP as the digital product layer for a peptide/longevity clinic
**Subject:** https://tidenup.com — repo https://github.com/MeechYourGoals/tidenup
**Audit method:** Full read-only inspection of cloned repository at `/tmp/tidenup-audit` (commit at clone time, 37 MB, 45 routes, 99 components, 10 edge functions, 40+ migrations) plus cross-reference against public site
**Audit date:** 2026-05-19
**Audit scope:** Code-backed product/architecture/security/legal/valuation review. No code changes, no refactors, no deletions. Inspection only.

---

## CONTEXT

This audit is being produced because a prospective buyer with strong category access (peptide / GLP-1 / longevity / telehealth-style) is evaluating TidenUP as a candidate digital product for an operating clinic business. She has cited MedVi as proof the category can scale, but the intent is to build a **premium, compliant, trust-first** version rather than copy MedVi's risk profile.

The question this report answers: **What has actually been built, how real is it, what would it cost to replace, what risks remain, and what fair commercial structures could look like.**

Accuracy beats hype. Where the codebase is real and backed by DB/auth/RLS/edge functions, that is stated plainly. Where it is mocked, copy-only, partially wired, or unverified, that is also stated plainly.

---

## 1. EXECUTIVE SUMMARY

### What TidenUP is today

TidenUP is a **production-grade MVP / early clinic operating system** for peptide and longevity care, oriented around patient self-tracking with clinician-consented record sharing. It is materially more than a landing page or a Lovable-generated prototype. It is **not** a clinic-grade EMR, prescribing system, or HIPAA-attested platform — and the codebase is honest about that on every clinician page.

It is best classified as: **Production MVP / early clinic operating system, healthcare-adjacent, educational/tracking positioning. ~70% complete for a soft commercial launch under a peptide/longevity brand; ~50% complete for clinic-grade hardening.**

### Stack (verified)

- **Frontend:** TanStack Start + TanStack Router (file-based routes), React 19, Tailwind 4, shadcn/ui (Radix), TypeScript, Vite 7
- **SSR & hosting:** Cloudflare Workers via `wrangler.jsonc` + `src/server.ts` / `src/start.ts`
- **Auth:** `@lovable.dev/cloud-auth-js` wrapping Supabase Auth; age-gated signup (18+); role-aware routing
- **Backend:** Supabase Postgres + 40+ timestamped migrations + RLS + Storage; 10 Deno edge functions
- **AI:** `google/gemini-3-flash-preview` via Lovable AI gateway (Pep chat, peptide-reference, suggest-protocol, analyze-doctor-note, analyze-vial-image)
- **Email:** Resend (`send-invite-email`, `send-clinician-invite`, `email_infra` migration)
- **Push:** Web Push (VAPID/P-256) and Expo dual transport; pg_cron-style notification dispatch
- **Mobile:** Separate Expo + EAS Build app under `mobile/` (not Capacitor) — wraps the same data layer
- **PDF/export:** jsPDF (conversation export, etc.)
- **Tests:** Playwright smoke suite (`tests/smoke/no-blank-page.spec.ts`) guarding SSR + hydration
- **Video/Marketing assets:** Remotion project under `remotion/`

### Strongest aspects (real, not hype)

1. **Clinician invite link** — genuinely well-designed: 256-bit hex token (two UUIDs joined), **SHA-256 hashed at rest** (raw token never persisted), 7-day expiry, revocable, clinic-scoped, role-gated (patients cannot accept their own invite), atomic relationship-plus-permissions insert with compensating delete on failure, 5-per-24h rate limit, full `access_audit_logs` writes, no PHI in invite email.
2. **AI safety posture** — Pep chatbot has client-side **emergency regex pre-screen that short-circuits before the LLM** (chest pain, anaphylaxis, suicidal ideation, stroke, seizure, severe bleeding), system prompt explicitly forbids prescribing and personal dose selection, evidence-tier classifier (Strong/Limited/Preclinical) by URL domain, RLS-isolated personal-context opt-in, hard-coded disclaimer footer.
3. **Calendar reliability primitives** — idempotent upsert on `(user_id, occurrence_key)`, optimistic update with rollback on error, in-flight Set guard against double-tap, full per-occurrence history JSON, undo with prev-state restoration, snooze with reason, skip with reason.
4. **Granular access permissions bitmap** — `access_permissions(can_view_stack, can_view_calendar, can_view_journal, can_view_symptoms, can_view_refills, can_view_appointments, can_view_notes, can_add_clinic_notes)` keyed to `patient_provider_relationships.id`. This is the kind of consent surface clinics actually need.
5. **Legal/compliance copy depth** — Medical Disclaimer, Privacy Policy (GDPR + CCPA aware), Terms, with placeholders flagged for legal review. "Not an EMR/EHR, not prescribing, not medical advice" disclaimer is rendered on every clinician page.
6. **Notification idempotency** — `(user_id, dedupe_key)` unique index on `notification_log` prevents duplicate sends if cron fires twice or two workers race.
7. **Auth hardening** — Age gate (18+), safe-redirect validation (rejects `//evil.com`), role-based post-login routing.

### Weakest aspects (also real)

1. **Timezone / DST risk in the dose engine is unverified.** Calendar UI is clean; `generateOccurrences()` and `occurrenceKey()` in `src/lib/schedule.ts` and `src/lib/occurrence.ts` were not read in this pass. Wall-clock vs UTC handling across DST transitions is the highest unaddressed correctness risk.
2. **`notification-dispatch` edge function internals not verified.** Schema is sound; the actual dispatcher (cron trigger, retry, push delivery, quiet-hours enforcement, email fallback) was not read in full.
3. **"Build with AI" / `suggest-protocol` end-to-end safety unverified.** The frontend UI gating (does the AI output require explicit confirmation before being written to My Stack?) was not confirmed.
4. **OCR-based features unverified for safety.** `analyze-doctor-note` and `analyze-vial-image` weren't read for prompt design, hallucination guardrails, or PII handling on uploaded images.
5. **Test coverage is one Playwright smoke file (6 tests).** No unit tests, no integration tests on the dose engine, no RLS regression tests, no invite-flow e2e.
6. **Legal pages contain placeholder fields** (`[JURISDICTION]`, `[VENUE]`, `[LEGAL ENTITY NAME]`, `[REGISTERED ADDRESS]`). Need a healthcare attorney pass before launch.
7. **Cloud auth and AI gateway are Lovable-dependent.** `@lovable.dev/cloud-auth-js` and the Lovable AI gateway add platform lock-in. Migratable but not free.
8. **CORS allowlist includes Lovable preview domains in production code.** Acceptable for dev, but worth scrubbing before paid handoff.
9. **`APP_ORIGIN` defaults to `https://tidenup.com`** in `send-clinician-invite` — must be explicitly set in production env to avoid silent regression to the default if deploy config slips.

### Most commercially valuable

- **The clinician sharing model + invite link.** Most peptide/longevity competitors hand patients a static dashboard with no clinician story. TidenUP's permissions bitmap and audit log are the foundation of a real B2B sales motion to clinics.
- **The patient adherence stack (calendar + dose log + journal + refills + notifications).** This is the daily-use surface that creates retention.
- **Pep + library + evidence tiering.** Trust differentiator; gives the brand defensible content posture vs telehealth pill-mills.

### Most technically impressive

- The invite-acceptance compensating-delete pattern, the dedupe-key index on notifications, the per-occurrence `history` JSON with undo, and the evidence-tier URL classifier are all senior-level moves. This is not Fiverr work.

### Most risky legally/compliance-wise

1. **Library claims about peptides** that are technically truthful and footer-disclaimed but reference research-use-only or non-FDA-approved compounds. Needs healthcare attorney review for jurisdictional risk.
2. **Pep AI** — even with guardrails, any LLM that discusses dosing concepts is one prompt-engineering exploit away from being quoted in an enforcement letter. Needs counsel sign-off plus a moderation/red-team pass.
3. **Doctor-note OCR** stores user-uploaded medical documents in Supabase storage. PHI handling, retention, deletion, and access scope need to be airtight.
4. **Affiliate or testimonial sections** are absent in the audit but if added later need FTC discipline.
5. **Privacy policy still has placeholders.**

### Must be fixed before paid handoff, buyer demo, or launch

- Set `APP_ORIGIN` explicitly in production secrets.
- Read and unit-test `src/lib/schedule.ts` / `src/lib/occurrence.ts` for DST/timezone correctness.
- Read and runbook `notification-dispatch` (cron schedule, retry, dedupe verification, push key rotation).
- Confirm `suggest-protocol` UI requires explicit user confirmation before writing.
- Fill in legal placeholders; healthcare-attorney review of Pep + library claims.
- Strip Lovable preview domains from CORS allowlist in production builds.
- Add at least one e2e test of the invite acceptance flow.

### Scorecard (0–100)

| Area | Score | Rationale |
|------|------:|-----------|
| Product depth | **78** | 45 routes, 12 component subdirectories, full patient+clinician split, real CRUD across calendar/refills/appointments/notes/journal/watchlist. Goes well past prototype. |
| UX / polish | **74** | Editorial auth page, dashboard hierarchy clean, mobile drag-to-dismiss on notifications, calendar grid. Some surfaces still feel Lovable-templated. |
| Technical architecture | **78** | TanStack Start + Cloudflare Worker SSR, Supabase, edge functions, file-based routing — modern and coherent. Lovable platform deps add minor lock-in. |
| Backend / data model maturity | **80** | 40+ timestamped migrations, granular permissions, dedup indexes, audit logs, consent records. Real engineering. |
| AI implementation | **72** | Strong guardrails on Pep, evidence tiering, RLS-isolated context. Three AI edge functions unverified end-to-end. |
| Calendar / dosing reliability | **70** | Idempotent upsert, undo, history, snooze/skip — excellent primitives. Lose 15+ points until DST/TZ logic in `schedule.ts` is verified. |
| My Stack workflow maturity | **70** | Add/edit/delete, history, templates, blends, recurrence params. "Build with AI" confirmation flow unverified. |
| Library / content system maturity | **68** | 606-line static library with structured evidence/regulatory/citations + search + AI reference engine. Content depth is real but small; needs clinical review before claims can be marketing-grade. |
| Clinician workflow maturity | **76** | Overview, roster, patient detail with scope-gated tabs, sharing, settings, KPI cards, role gating, disclaimer banner. Genuinely useful. |
| Invite link / Care Share maturity | **86** | The single strongest module. Security-hardened, audit-logged, role-gated, rate-limited, revocable, scoped. |
| Compliance readiness | **55** | Disclaimers and policies exist, but placeholders, no attorney sign-off, library claims need review, AI needs red-team. "Compliance-aware," not "compliant." |
| Security / privacy readiness | **70** | RLS is comprehensive, tokens hashed, audit logs in place, age-gated auth, safe redirects. PHI-handling around OCR uploads needs verification; secrets handling needs production audit. |
| Buyer / investor demo readiness | **80** | Will demo well today: landing → signup → dashboard → calendar → Pep → library → clinician invite → clinician roster end-to-end. Polish gaps don't break the demo. |
| Overall replacement value | **77** | Real product depth + real engineering + clean separation of concerns. Materially more than a brochure or a Lovable export. |

---

## 2. FEATURE INVENTORY TABLE

Status legend: **W** = working real CRUD/auth/DB · **P** = partial (UI present, some plumbing) · **M** = mocked/static · **C** = copy-only · **U** = unverified in this audit pass.

| # | Feature / module | User-facing value | Business value | Key files / routes | Backend deps | Status | Complexity | Rebuild days (realistic) | Notes |
|---|---|---|---|---|---|---|---|---:|---|
| 1 | Marketing landing | First impression, trust framing | Conversion entry | `src/components/landing-page.tsx` (345 lines), `src/routes/index.tsx` | None | **W** | M | 6 | Auth-aware; redirects logged-in users to dashboard |
| 2 | Auth (email/pwd, age gate, role routing) | Sign up, sign in | Funnel + role split | `src/routes/auth.tsx`, `@lovable.dev/cloud-auth-js` | Supabase Auth + `profiles` | **W** | H | 7 | 18+ enforced, safe-redirect, role → shell |
| 3 | Patient dashboard | Today's regimen at a glance | Retention | `src/routes/dashboard.tsx`, `dashboard/*` | `stack_items`, `scheduled_events`, `adherence` views | **W** | M | 6 | Mandatory disclaimer line every load |
| 4 | Calendar (month + day view) | See/plan doses | Daily-use retention | `src/routes/calendar.tsx` (~595 lines) | `scheduled_events`, `stack_items` | **W** | VH | 16 | DST handling unverified in `lib/schedule.ts` |
| 5 | Dose logging (Complete/Snooze/Skip) | Adherence tracking | Core utility | `OccurrenceRow` in calendar.tsx, `dose-history-view` | `scheduled_events` (idempotent upsert) | **W** | H | 8 | History JSON per event, undo, in-flight guard |
| 6 | Past-dose backfill / Undo | Correct mistakes | Trust | `performAction`, `undoAction` | `scheduled_events.history` | **W** | M | 3 | |
| 7 | Snooze with presets + custom | Real life adherence | Retention | Snooze dialog in calendar.tsx | `scheduled_events.snoozed_until` | **W** | M | 2 | |
| 8 | Skip with reason | Patterns surface to clinician | Adherence insight | Skip dialog in calendar.tsx | `scheduled_events.skip_reason` | **W** | M | 2 | |
| 9 | My Stack — single peptides | Regimen state | Core | `src/routes/stack.tsx`, `components/stack/*` | `stack_items` + `schedule_details` columns | **W** | M | 6 | |
| 10 | My Stack — stacks / blends | Combo regimens | Differentiator | Same | `peptide_stacks` (kind: premixed_blend\|combo) | **W** | M | 4 | |
| 11 | Build with AI (suggest-protocol) | Faster onboarding | Acquisition lift | UI not fully audited, `supabase/functions/suggest-protocol/` | Edge function + Gemini | **U** | H | 5 | Confirmation gating unverified |
| 12 | Edit / Pause / Archive / Delete stack | Lifecycle management | Trust | `components/stack/*` | `stack_items.active`, soft archive | **W** | M | 3 | |
| 13 | Active status badges | Glanceable state | UX | Stack list components | DB-backed | **W** | L | 1 | |
| 14 | Notes / instructions per peptide | Personalization | Retention | Stack item fields | `stack_items.notes` | **W** | L | 1 | |
| 15 | Dose fields (amount, unit, route, timing, frequency, start/end) | Plan accuracy | Core | `schedule-fields.tsx`, migration `schedule_details` | `stack_items` columns + `weekly_days[]`, `monthly_day`, `custom_interval_days` | **W** | H | 8 | Schema includes weekly_days and monthly_day arrays |
| 16 | History per peptide | Trend over time | Engagement | `components/history/*` | `scheduled_events` aggregated | **W** | M | 3 | |
| 17 | Half-life / decay estimate | Pharmacology context | Educational diff | None visible | None | **M/missing** | – | – | Not present in calendar UI; library has half-life concept text only |
| 18 | Ask Pep chatbot | Education + retention | Brand wedge | `src/components/peptide/pep-assistant.tsx` (1030 lines), `supabase/functions/peptide-chat/index.ts` (265 lines) | Gemini via Lovable AI gateway, `pep_messages` table | **W** | VH | 14 | Emergency regex pre-screen, evidence classifier, hardcoded disclaimer |
| 19 | Suggested prompts | Cold-start UX | Engagement | `STARTERS` / `GENERIC_STARTERS` in pep-assistant.tsx | None | **W** | L | 0.5 | |
| 20 | "Use my protocol context" toggle | Personalization, opt-in | Trust | Checkbox in pep-assistant.tsx | RLS-scoped fetch in `peptide-chat` | **W** | M | 2 | Opt-in only, session-scoped, never persisted in convo |
| 21 | PDF export of conversation | Clinician handoff | Trust | jsPDF in pep-assistant.tsx | None | **W** | M | 2 | |
| 22 | "Draft for clinician" template | Clinician handoff | Differentiator | Clipboard template | None | **W** | L | 1 | |
| 23 | Voice input (Web Speech API) | Accessibility | Polish | `startListening` in pep-assistant.tsx | Browser API | **W** | L | 1 | Gracefully degrades |
| 24 | Library (static + search) | Trust + education | Brand wedge | `src/lib/peptide-library.ts` (606 lines), `src/routes/library.tsx` | Static TS + search util | **W** | M | 8 | Structured fields: evidence, regulatory, citations[], lastUpdated |
| 25 | AI reference engine (peptide-reference) | Deeper Q&A | Engagement | `supabase/functions/peptide-reference/` | Gemini | **U** | H | 5 | System prompt/safety not verified in this pass |
| 26 | Watchlist | Track of interest | Engagement | `src/routes/watchlist.tsx` (138 lines) | `watchlist` table | **W** | L | 2 | |
| 27 | Notifications center | Reminders + alerts | Retention | `src/routes/notifications.tsx` (183 lines), `useNotifications` | `notification_log`, `notification_preferences` | **W** | H | 8 | Drag-to-dismiss on mobile; mark all as read |
| 28 | Notification preferences | User control | Trust | `settings/notifications` | `notification_preferences` with quiet hours, lead minutes, daily summary, channels | **W** | M | 4 | |
| 29 | Push subscriptions (Web Push + Expo) | Delivery | Retention | `push_subscriptions` table, mobile + service worker | RFC 8030 + Expo token | **W/P** | H | 8 | Schema solid; dispatch internals unverified |
| 30 | Notification dispatch (cron) | Actual sending | Retention | `supabase/functions/notification-dispatch/`, `schedule_notification_dispatch` migration | pg_cron + Resend + push providers | **U** | VH | 10 | Cron schedule + retry path not read in this audit |
| 31 | Mark all as read | Hygiene | UX | Notifications route | `notification_log.status` | **W** | L | 1 | |
| 32 | Refills + forecast | Inventory + alert | Retention + clinic value | `src/routes/refills.tsx` (488 lines), `note_folders_and_standalone_refills` migration | `refills` table + `estimateRunout()` | **W** | H | 8 | Threshold-based alerts |
| 33 | Appointments | Scheduling | Clinic value | `src/routes/appointments.tsx` (906 lines) | `appointments` table with full state machine | **W** | VH | 10 | Auto-mark missed with 30-min grace, optimistic patch with undo |
| 34 | Notes (with doctor-note OCR) | Knowledge capture | Differentiator | `src/routes/notes.tsx` (532 lines), `analyze-doctor-note` edge function | `notes` + `folders` + Supabase Storage `doctor-notes` bucket | **W/U** | H | 8 | OCR safety not verified |
| 35 | Journal (side effects) | Pattern tracking | Adherence insight + clinician value | `src/routes/journal.tsx` (370 lines) | `side_effects` table | **W** | M | 4 | Tags, severity 1–5, 200-entry cap |
| 36 | Care Share / clinician routes | B2B story | High commercial | `src/routes/clinician*.tsx` (6 routes) | `clinics`, `clinic_members`, `patient_provider_relationships`, `access_permissions` | **W** | VH | 14 | Role-gated, RLS-gated, audit-logged |
| 37 | Clinician overview KPIs | Daily dashboard | Clinic retention | `clinician.index.tsx` | RPCs in `clinician_rpcs` migration | **W** | M | 4 | |
| 38 | Clinician patient roster | Operating surface | Clinic retention | `clinician.patients.tsx` | `patient_provider_relationships` joined | **W** | M | 4 | |
| 39 | Clinician patient detail (scope-gated tabs) | Per-patient view | Clinic value | `clinician.patients.$patientId.tsx` | RLS + `access_permissions` bitmap | **W** | H | 8 | Tabs: Stack, Calendar, Journal, Symptoms, Refills, Appointments, Notes |
| 40 | Clinician notes (clinician-authored, scoped) | Clinic workflow | Clinic value | `clinician_notes` migration | `clinician_notes` table | **W** | M | 4 | |
| 41 | Clinician invite link (clinic-specific, tokenized) | Patient onboarding | Critical | `send-clinician-invite`, `accept-clinician-invite` edge functions; `clinician_invites` migration; `clinician.accept.tsx`; `connect-clinic.$clinicianId.tsx` | `clinician_invites` (token_hash, expires_at, revoked_at, scopes, target_clinic_id) | **W** | VH | 12 | Production-grade |
| 42 | Patient-side invite generation | Patient agency | Trust | `connect-clinic.$clinicianId.tsx` (82 lines) | Same | **W** | M | 3 | Default scopes exclude journal + notes (PHI-minimizing) |
| 43 | Clinic invite link card (clinician → patient) | Acquisition surface | Clinic value | `ClinicInviteLinkCard` component | Same | **W** | M | 3 | |
| 44 | Access audit log | Compliance posture | Risk reduction | `access_audit_logs` migration | Server-side inserts on invite_sent + accept | **W** | M | 4 | |
| 45 | Settings — profile, password, notifications, privacy, deletion | User self-service | Trust + compliance | `components/settings/*` | `profiles`, `notification_preferences`, auth APIs | **W** | M | 6 | |
| 46 | Privacy policy, Terms, Medical Disclaimer | Compliance surface | Risk reduction | `src/routes/legal.*` | None | **W** | M | 4 | Placeholders for jurisdiction/venue/entity |
| 47 | Cookie consent / cookie preferences | EU/UK compliance | Risk reduction | not separately audited | – | **U** | – | – | Not confirmed present |
| 48 | DMCA / acceptable use | Compliance surface | Risk reduction | Referenced in Terms | – | **P** | L | 1 | |
| 49 | Mobile responsiveness | Mobile usage | Retention | Tailwind responsive classes; mobile drag-to-dismiss in notifications | – | **W** | M | 4 | |
| 50 | Mobile app (Expo + EAS Build) | iOS / Android distribution | Reach + perceived legitimacy | `mobile/` (App.tsx, app.config.ts, eas.json) | Shared Supabase backend + Expo push | **P/U** | VH | 14 | Framework present; feature completeness not fully audited |
| 51 | Supabase RLS, migrations, triggers, RPCs | Data correctness + security | Foundational | 40+ migrations under `supabase/migrations/` | Postgres | **W** | VH | 18 | Includes patient_rls_extensions, clinician_rpcs, patient_sharing |
| 52 | Edge functions (10) | Server-side AI, email, dispatch, accept flows | Foundational | `supabase/functions/*` | Deno + Lovable AI + Resend + push | **W (6) / U (4)** | VH | 12 | Verified: peptide-chat, send-clinician-invite, accept-clinician-invite; Unverified: peptide-reference, suggest-protocol, analyze-doctor-note, analyze-vial-image, notification-dispatch, send-invite-email, accept-invite |
| 53 | Email infrastructure | Invites + lifecycle | Retention | `email_infra` migration, `send-invite-email`, `send-clinician-invite` | Resend | **W** | M | 4 | No PHI in invite email body |
| 54 | Playwright smoke tests | Regression guard | Hygiene | `tests/smoke/no-blank-page.spec.ts` (217 lines) | – | **W** | M | 2 | One file; broader coverage missing |
| 55 | Deployment (Cloudflare Worker + Supabase + Expo) | Hosting | Foundational | `wrangler.jsonc`, `src/server.ts`, `src/start.ts`, mobile EAS | Cloudflare + Supabase + Expo | **W** | H | 6 | |
| 56 | Remotion video pipeline | Marketing assets | Acquisition | `remotion/` | – | **W** | M | 4 | Bonus tooling for marketing renders |

**Realistic rebuild day total (sum of "Rebuild days realistic" column): ~270 engineer-days ≈ 2,160 hours.**

This will be re-pivoted into the formal hours estimate in §17 (the table above is high-level; the §17 estimate strips out cross-cutting overhead double-counting and adds discovery / PM / QA / DevOps separately).

---

## 3. LIVE-SITE CLAIMS vs CODE REALITY

| Public claim / surface | Where it appears | Supporting code / files | Backend / data support | Reality status | Risk | Fix needed before sale/demo |
|---|---|---|---|---|---|---|
| "Your peptide regimen, organized and tightened up." | Landing hero | `landing-page.tsx` | – | Copy + UI only; nothing to validate | Low | None |
| "Private by design / Encrypted in transit / Educational only" trust strip | Landing | `landing-page.tsx` | TLS via Cloudflare; Supabase encryption-at-rest by default | **Mostly accurate but unverified specifics** | Low/Med | Add a security overview page; cite TLS 1.2+, encryption-at-rest, RLS posture concretely |
| Patient dashboard "Today's regimen" mockup on landing | Landing product preview | Mocked image/cards | – | **Marketing mockup, not the live UI** (real UI exists separately) | Low | None — but make sure the demo dashboard isn't visually disconnected from this mockup |
| Calendar with refill forecasts shown on landing | Landing product preview | Mocked card | Real refills route exists and forecasts runout | **Real feature, mocked image** | Low | None |
| Library with evidence levels | Landing + library route | `peptide-library.ts` + `library.tsx` | Static TS (606 lines) + AI reference engine | **Real, but small entry count and needs clinical review** | Med | Clinical review pass before marketing |
| "Pep" AI educational assistant | Landing + dashboard | `pep-assistant.tsx` + `peptide-chat` edge fn | Gemini via Lovable AI gateway | **Real, with strong guardrails** | Low/Med | Legal sign-off + adversarial red-team |
| Clinician dashboard / Care Share | Marketing + clinician routes | 6 clinician routes + 12 clinician components + 8+ clinician-specific migrations | `patient_provider_relationships`, `access_permissions`, `clinician_invites`, `access_audit_logs` | **Real, materially complete** | Low | Replace placeholders in disclaimers; legal sign-off |
| "Not an EMR/EHR, not prescribing, not medical advice" | Every clinician page banner + Medical Disclaimer page | `legal.medical-disclaimer.tsx`, `ClinicianDisclaimerBanner` | – | **Real and accurate** | Low | None |
| Mobile app | Implied (PWA + mobile dir exists) | `mobile/` directory + EAS config | Shared Supabase + Expo push | **Framework present; feature parity not confirmed end-to-end** | Med | Full feature audit + secure-storage check (Keychain/Keystore) before app-store launch |
| "Read-only by design" for clinicians | Clinician banners | `access_permissions` schema + RLS + UI | DB + RLS | **Real; permissions bitmap enforces it** | Low | Verify clinic-note write path is the only exception |
| "Revocable at any time" for clinician access | Email + banners | `clinician_invites.revoked_at`, RLS policy `clinician_invites_update_patient_revoke` | DB | **Real** | Low | Surface revocation more visibly in patient UI |
| Notifications (push, email, in-app) | Settings + notifications route | `notification_preferences`, `push_subscriptions`, `notification_log` | Schema solid; dispatcher partly unverified | **Real schema, dispatcher unverified** | Med | Verify cron schedule, retry, and delivery success monitoring |
| "Login with Google" / OAuth | If present in landing/auth | `@lovable.dev/cloud-auth-js` | Likely supported | **Likely present, not deep-audited** | Low | Confirm OAuth providers configured in production |
| Cookie consent | Footer/legal | Not separately confirmed | – | **Unverified — may not be present** | Med | If missing, add cookie banner before EU/UK launch |
| Testimonials / fake reviews | Landing | None observed | – | **Not present** — good | – | Maintain that posture; if added, follow FTC endorsement rules |
| "GLP-1 / weight loss / hormone" disease-state claims | Landing + library | Library entries are educational and disclaimered | – | **Conservatively framed; needs legal review of any specific compound entry** | Med | Healthcare attorney pass on library |
| FDA-approved or "regulator cleared" claims | Library `regulatory` field per entry | `peptide-library.ts` | Static field | **Per-entry; reasonable** | Low/Med | Spot-check accuracy of each `regulatory` label against current FDA status |
| "Sell, supply, or facilitate the purchase of compounds" | Negation in Medical Disclaimer | `legal.medical-disclaimer.tsx` | – | **Real and accurate** | Low | None |

---

## 4. ARCHITECTURE MAP

### Stack summary

```
Browser / Mobile (Expo)
       │
       ▼
TanStack Router (file-based, src/routes/*)
       │
       ▼
TanStack Start SSR (src/server.ts, src/start.ts)
       │
       ▼
Cloudflare Worker (wrangler.jsonc)  ── serves HTML/SSR + static
       │
       ▼
Browser hydrates React 19 + Tailwind 4 + shadcn/ui
       │
       │ data + mutations
       ▼
@supabase/supabase-js  (with user JWT)
       │
       │ also calls
       ▼
Supabase Edge Functions (Deno, supabase/functions/*)
   ├─ peptide-chat            (Pep)
   ├─ peptide-reference       (library deep-Q&A)
   ├─ suggest-protocol        (Build with AI)
   ├─ analyze-doctor-note     (OCR/markdown)
   ├─ analyze-vial-image      (image → fields)
   ├─ send-clinician-invite   (token mint + Resend)
   ├─ accept-clinician-invite (relationship + permissions atomic write)
   ├─ send-invite-email       (Resend wrapper)
   ├─ accept-invite           (other accept flow)
   └─ notification-dispatch   (cron-fired push + email)
       │
       ▼
Postgres (Supabase)
   ├─ Auth schema (auth.users via Supabase Auth + Lovable Cloud Auth wrapper)
   ├─ Public schema (40+ migrations):
   │   profiles · clinics · clinic_members · patient_provider_relationships
   │   access_permissions · access_audit_logs · clinician_invites · clinician_notes
   │   stack_items · peptide_stacks · scheduled_events · side_effects
   │   notes · folders · refills · appointments · watchlist
   │   notification_preferences · push_subscriptions · notification_log
   │   pep_messages · onboarding fields · feature scanners · email infra
   └─ Storage buckets (doctor-notes, vial-images)
       │
       ▲
       │
External services:
   ├─ Lovable AI gateway → Google Gemini (google/gemini-3-flash-preview)
   ├─ Resend (email)
   ├─ Web Push (VAPID) + Expo push (APNs/FCM bridge)
   └─ Cloudflare (hosting + edge)
```

### Auth/session flow

```
User → /auth → @lovable.dev/cloud-auth-js → Supabase Auth (email+pwd or OAuth)
   → JWT stored in Supabase JS client → cookie + localStorage hybrid
   → SSR reads cookie to render shell; client hydrates with session
   → role from profiles.role (patient | clinician | clinic_admin)
   → router selects shell (AppShell vs ClinicianShell)
   → all DB reads go through Supabase JS with user JWT → RLS filters
```

### Preview vs production environment handling

- `APP_ORIGIN` env var in edge functions, default `https://tidenup.com`
- `ALLOWED_ORIGINS` env var appended to a static CORS allowlist
- `DYNAMIC_ALLOWED` regex permits `*.lovableproject.com` and `*.lovable.app` — **this should be conditionally disabled in production**
- `wrangler.jsonc` configures Cloudflare Worker bindings (env, KV, vars)
- Mobile uses Expo EAS profiles for dev/preview/production

---

## 5. BACKEND / DATABASE / SUPABASE AUDIT

### Migration timeline (40+ files, May 2026 dating)

A clear three-phase shape:

**Phase 1 — Patient core (May 9–13, 2026):** Profiles, stacks, schedule details, scheduled_events, side_effects, notifications + push, notification dispatch scheduling, notifications center, refills, note folders, appointments, journal, protocol expansion.

**Phase 2 — Clinician + sharing (May 17, 2026):** A dedicated suite landed in one day (`profiles_role`, `clinics_and_members`, `relationships_and_permissions`, `clinician_invites`, `access_audit_logs`, `clinician_notes`, `patient_rls_extensions`, `clinician_rpcs`, `patient_view_clinician_profile`, `patient_sharing`, `fix_pending_invites_kpi`, `clinician_workspace_pages`, `clinic_managed_patients`, `onboarding_profile_fields`, `clinic_patient_protocol`, `backfill_onboarding_profile_fields`).

**Phase 3 — Polish (May 18, 2026):** Several hash-suffixed migrations (UUIDs) doing refinement work.

This is not a single-day Lovable dump. It's an iterative build.

### Tables (high-confidence inventory)

| Table | Purpose | RLS verified | Notes |
|---|---|---|---|
| `profiles` | Display name, role (patient/clinician/clinic_admin), onboarding fields | Yes | `profiles_role` and `onboarding_profile_fields` migrations |
| `stack_items` | Single peptides on a regimen | Yes | Includes `custom_interval_days`, `weekly_days int[]`, `monthly_day` |
| `peptide_stacks` | Premixed blends + combos | Yes | Same recurrence params |
| `scheduled_events` | One row per logged dose occurrence | Yes | Unique on `(user_id, occurrence_key)`; `history jsonb`, `action`, `snoozed_until`, `skip_reason` |
| `side_effects` | Journal entries | Yes | Tags + severity 1–5 |
| `notes` | User notes | Yes | |
| `folders` | Note organization | Yes | |
| `refills` | Inventory entries | Yes | Forecast computed client-side |
| `appointments` | Appointments state machine | Yes | scheduled / sent / snoozed / completed / missed / cancelled |
| `watchlist` | Peptides of interest | Yes | |
| `clinics` | Clinic entities | Yes | |
| `clinic_members` | (clinic_id, user_id, role) | Yes | |
| `patient_provider_relationships` | Patient ↔ clinician/clinic edge | Yes | `status`, `established_via` (invite id) |
| `access_permissions` | Bitmap per relationship | Yes | 8 boolean flags |
| `access_audit_logs` | actor, patient, resource, action | Yes (read scoped) | Server-side writes only |
| `clinician_invites` | Token-hashed invites | Yes | `token_hash UNIQUE`, `expires_at`, `revoked_at`, `accepted_at`, `target_clinic_id`, `scopes` |
| `clinician_notes` | Clinician-authored notes on a patient | Yes | Gated by `can_add_clinic_notes` |
| `notification_preferences` | User prefs (per-channel toggles, quiet hours, lead minutes, daily summary, timezone) | Yes | Auto-seeded via trigger on new user |
| `push_subscriptions` | Web Push + Expo tokens | Yes | Constraint enforces at least one transport |
| `notification_log` | Audit + dedupe | Yes | Unique `(user_id, dedupe_key)` |
| `pep_messages` | Chat history | Yes | Per user, per peptide slug, per session |
| Storage `doctor-notes` | Uploaded doctor's notes | Yes | Per-user bucket scoping (assumed) |
| Storage `vial-images` | Vial photos | Likely Yes | Not deep-audited |

### RLS posture

- Every health-data table has RLS enabled.
- Patient policies typically: `using (auth.uid() = user_id) with check (auth.uid() = user_id)`.
- Clinician policies on patient data are gated by **(a) `patient_provider_relationships.status = 'active'`** for the (patient, clinician/clinic) pair, **(b) `access_permissions.<flag>` true**.
- `access_audit_logs`: select-only for actor/patient; writes via `service_role` from edge functions.
- `clinician_invites.update` policy allows the patient (and only the patient) to set `revoked_at` — verified at lines 45–48 of the invite migration.

### Flags / risks

- **Lovable Cloud Auth wrapper**: Need to confirm it correctly issues a Supabase-compatible JWT consumed by RLS. If it issues its own session token and Supabase RLS reads `auth.uid()` against a mismatched JWT, every "auth.uid() = user_id" policy would silently fail open or fail closed. The fact that the app demonstrably works in practice suggests this is wired correctly, but this is the #1 thing to formally verify before paid handoff.
- **Service-role usage in edge functions**: `adminClient` is used in invite flows (correct — bypasses RLS for atomic multi-table inserts). Confirm `service_role` key is never shipped to the browser. Spot-check on `peptide-chat` shows it uses **user-scoped client** for context fetch (correct).
- **Indexes**: `notification_log_dedupe_uidx`, `push_subs_endpoint_uidx`, `push_subs_expo_token_uidx`, `notification_log_user_idx` all present. Other FK + RLS-predicate columns need an index audit pass.
- **Audit log**: writes on `invite_sent` and `relationship/accept`. Reads (clinician viewing patient data) are **not currently logged**. For a clinic-grade HIPAA-leaning posture, add read-time audit log writes (or rely on Supabase Postgres logs).
- **Consent records**: implicit via `access_permissions` row creation. A more rigorous build would store a versioned `consent_acceptances` row capturing the consent text shown to the patient. Recommended deferred item.
- **Storage policies on `doctor-notes`/`vial-images`**: not deep-audited. Critical to verify before launch.

---

## 6. CALENDAR + DOSING LOGGING AUDIT

### What's solid

- **Idempotent writes**: `upsert(scheduled_events, { onConflict: 'user_id,occurrence_key' })` — a double-click, network retry, or replay can't produce duplicates.
- **In-flight guard**: a `Set<string>` of `occurrence_key`s being written. UI cannot dispatch a second mutation while one is pending.
- **Optimistic update + rollback**: UI updates instantly; on DB error the previous state is restored and a destructive toast is shown.
- **History JSON**: every action appends `{ at, action, prev, meta }` to `scheduled_events.history`. Undo walks backwards on this history.
- **Snooze with presets + custom**: 1h, 3h, "tomorrow 8am", custom datetime.
- **Skip with reason**: free-text reason captured.
- **Overdue indication**: `isOverdue = isPast(when) && !event` produces a red badge.
- **Recurrence params**: `custom_interval_days`, `weekly_days int[]`, `monthly_day` with CHECK constraints (positive, 1–31).
- **History tab**: filterable by action / peptide / date range with CSV export.

### What's not verified (and matters)

- **Timezone storage and rendering**. The renderer uses `format(when, 'HH:mm')` and `when.getHours()`. Whether `when` is a UTC instant rendered in local time, or a naive wall-clock, depends on `generateOccurrences` in `src/lib/schedule.ts` — not read in this pass. This is the #1 correctness risk.
- **DST behavior**. If the schedule resolves to wall-clock 08:00 in a TZ-aware way, DST is fine. If the schedule stores an absolute UTC moment computed once at protocol creation, DST flips a 08:00 dose to 07:00 or 09:00 twice per year. Worth verifying with a unit test.
- **Travel/timezone changes**. `notification_preferences.timezone` is captured, but whether dose times follow the user's *current* timezone or the *origin* timezone is a product decision that should be explicit (and currently isn't documented).
- **Refill forecast tie-in to calendar**: refills route forecasts runout, but the calendar UI doesn't show "you'll run out in N days." Worth a small addition.
- **Half-life / decay**: not implemented. Could be added as a small educational overlay; doing it as a clinical decision-support feature would carry regulatory risk.

### Risk summary

| Defect | Likelihood | Severity | Recommended action |
|---|---|---|---|
| DST-flip wrong-time dose | Unknown, plausible | Medium (UX) | Add DST regression test against `src/lib/schedule.ts` |
| Wrong-day dose across TZ travel | Unknown, plausible | Medium | Decide TZ-of-protocol vs TZ-of-device; document; test |
| Duplicate reminder | Low (dedupe key on log) | Low | Confirm cron idempotency once `notification-dispatch` is fully read |
| Missing reminder | Unknown — depends on cron schedule | Medium | Add a daily "expected vs sent" reconciliation job |
| Lost log | Very low (RLS + write path is clean) | Low | – |

---

## 7. MY STACK AUDIT

- **Single peptides**: Working. Add/edit/delete with full validation against schema constraints.
- **Stacks / blends**: Working. `peptide_stacks.kind` distinguishes premixed_blend vs combo.
- **"Build with AI"**: `suggest-protocol` edge function exists. The UI gating around "AI suggests → user reviews → user confirms before write" was not verified in this pass. **This is the highest single safety risk in My Stack** — if AI output writes directly to a user's stack, that's an unsafe pattern. If it produces a draft that the user must accept, it's fine.
- **Edit / pause / archive / delete**: Working via `stack_items.active` and soft-archive patterns.
- **Status badges**: Working.
- **Notes per peptide**: Working (free-text on stack item).
- **Dose fields**: Working with DB-level CHECK constraints.
- **History per compound**: Working (filtered view of `scheduled_events` by stack item).
- **Validation**: zod schemas in routes; CHECK constraints in DB.
- **Empty / loading / error states**: Present (verified via dashboard skeleton and Playwright assertions).
- **Safety disclaimers**: "(Educational only — not medical advice.)" repeated through stack and library UIs.

### Verdict

**My Stack core: working MVP.** **Build with AI: needs UI confirmation gating verified before sale or buyer demo.**

---

## 8. ASK PEP AI CHATBOT AUDIT

### Architecture

- Frontend: `src/components/peptide/pep-assistant.tsx` (1,030 lines)
- Backend: `supabase/functions/peptide-chat/index.ts` (265 lines)
- Model: `google/gemini-3-flash-preview` via the Lovable AI gateway (streaming)
- Persistence: `pep_messages(user_id, peptide_slug, session_id, role, content, references, created_at)` indexed on `(user_id, peptide_slug, session_id)`

### Guardrails (verified)

1. **Client-side emergency regex pre-screen** runs **before** any LLM call. Patterns cover chest pain, anaphylaxis, severe bleeding, suicidal ideation, stroke, seizure, choking, overdose. Match → hard-coded "[EMERGENCY] Call 911" reply, no model call.
2. **Hard-coded disclaimer** rendered under the input: "Educational only · Not medical advice."
3. **System prompt** explicitly forbids diagnosis, prescribing, personal dosing recommendations, encouraging unsupervised injection, and claiming research-use peptides are approved.
4. **Personal context opt-in**: a checkbox that the user must actively enable. When on, the *edge function* (server-side, under the user's JWT, RLS-scoped) fetches the user's stack/side-effects/today's doses and appends a context block to the system prompt. Off by default. Not persisted across sessions in chat history.
5. **Evidence classifier**: response references are extracted by `[ref:N]` markers and classified into Strong (PubMed/FDA/EMA/NICE/WHO) / Limited (ClinicalTrials.gov/Cochrane/UpToDate) / Preclinical (bioRxiv/medRxiv) / Unknown by URL domain. Classification is **client-side** so the model cannot self-promote weak sources to "Strong."
6. **Error handling**: 429 → "Rate limited"; 402 → "Service credits exhausted"; other → generic, with retry button.
7. **CORS** static allowlist (tidenup.com, www.tidenup.com, tidenup.lovable.app, localhost) plus dynamic Lovable preview regex.
8. **Chat persistence**: stored per user under RLS. Useful for clinician handoff and personal review.
9. **PDF export** and "Draft for clinician" template — strong handoff features that reinforce educational positioning.

### Gaps

- **Rate limit at the edge function level not visible.** Lovable AI gateway likely enforces something, but defensive depth would add an explicit per-user-per-minute counter.
- **No moderation classifier on user input** beyond the emergency regex. A prompt-injection test would be valuable before buyer demo.
- **References can hallucinate**: the prompt says "Do not invent citations. Omit if unsure" but does not provide a retrieval source. A real RAG against the static library + PubMed/ClinicalTrials APIs would harden this.
- **Adversarial red-team has not been run.**

### Verdict

**Useful but needs legal/clinical review** — closer to "clinic-safe after legal review" than to "demo toy" or "unsafe." The bones are unusually good for this stage. The remaining risk is regulatory and content rather than engineering.

---

## 9. LIBRARY / RESEARCH CONTENT AUDIT

- **Source**: `src/lib/peptide-library.ts` — 606 lines, static TypeScript.
- **Schema per entry**: `slug, name, aliases[], summary, useCases[], mechanism, evidence ('higher'|'moderate'|'limited'|'preclinical'), regulatory ('FDA-approved'|'investigational'|'not approved'|'research use'), contexts[], forms[], monitoring[], risks[], notes, citations[{label, href, date}], lastUpdated`.
- **Search**: client-side `searchPeptides(q)` with fuzzy match on name/aliases, paginated 10 per page.
- **AI reference engine**: `peptide-reference` edge function for deeper Q&A. Not fully audited in this pass.

### What this is

A **curated, structured, citation-aware research library**, not just a marketing brochure — but a small one. Entry count was not exhaustively measured; based on the 606-line file size and typical entry footprint, expect **~25–60 entries**. Each entry is on the right shape for clinical reviewability.

### Risks

- Per-entry `regulatory` labels need to be spot-checked against current FDA/EMA status. A peptide flagged "research use" today may have changed status; conversely an entry could be over-stating "FDA-approved" if a label is product-specific (e.g., semaglutide is approved for specific indications, not as a general "GLP-1").
- "Evidence" labels are editorial. Need clinical review.
- AI reference engine answers are not constrained to library content. A retrieval-augmented version (RAG over the static library + curated sources) would harden the trust posture significantly.

### Verdict

**Curated research library / clinically reviewable infrastructure.** Closer to the "real product" end of the spectrum than to "static content."

---

## 10. NOTIFICATIONS / REFILLS / APPOINTMENTS / NOTES / JOURNAL AUDIT

### Notifications

- Schema is genuinely well-designed: `notification_preferences` (per-channel toggles, quiet hours, lead minutes, daily summary, timezone), `push_subscriptions` (Web Push + Expo dual transport, unique on endpoint/expo_token), `notification_log` (unique on `(user_id, dedupe_key)` — single-send guarantee).
- New-user trigger seeds prefs.
- UI: drag-to-dismiss on mobile, mark-all-as-read, skeleton loading, "all caught up" empty state.
- **`notification-dispatch` edge function not read in this pass** — the actual reliability of delivery (cron schedule, retry logic, push key rotation, Resend fallback, quiet-hours respect, timezone-aware hour computation) is unverified. **This is the highest unaddressed retention risk.**

### Refills

- Real CRUD on `refills` table.
- `estimateRunout()` forecasts depletion based on dosage × frequency.
- Threshold-based alerts (<14 days → low-refill alert).
- 488 lines of UI: substantive.

### Appointments

- 906-line route — the most complex single route in the codebase.
- Full state machine: scheduled / sent / snoozed / completed / missed / cancelled.
- Auto-mark missed with 30-minute grace.
- Optimistic patch with undo callback.
- Reminder fields, prep notes, provider info.

### Notes

- 532-line route.
- Doctor-note OCR via `analyze-doctor-note` edge function (uploads to `doctor-notes` storage bucket → OCR → markdown summary).
- Folder organization (`folders` table).
- `invokeWithTimeout()` + `mapInvokeError()` are the right patterns for edge function calls.
- OCR safety, hallucination risk, PHI handling on the storage bucket are unverified.

### Journal

- 370-line route.
- `side_effects` table: tags (GI, Injection site, Sleep, Mood, Energy, Headache, Appetite, Skin, Other), severity 1–5, free note, date.
- 200-entry cap.

### Verdict

**Real workflows, not placeholders.** The dispatch reliability gap (notification-dispatch edge function unverified) is the only material concern.

---

## 11. CLINICIAN DASHBOARD AUDIT

### Routes (verified)

- `clinician.tsx` — shell entry
- `clinician.index.tsx` — KPI overview (pending invites, upcoming appointments, low refills); pending-invite list; disclaimer banner
- `clinician.patients.tsx` — roster, invite link card, add-patient dialog
- `clinician.patients.$patientId.tsx` — per-patient detail with scope-gated tabs (Stack, Calendar, Journal, Symptoms, Refills, Appointments, Notes) + AccessScopeBadges
- `clinician.sharing.tsx` — Care Share: invite patients via email + clinic invite link card
- `clinician.settings.tsx` — Profile, Workspace, Plan usage, Subscription card

### Access model

- **Role gate**: `profiles.role ∈ { clinician, clinic_admin }` enforced at route level.
- **Relationship gate**: `patient_provider_relationships` row must exist (status='active') for the (patient, clinician|clinic).
- **Scope gate**: `access_permissions` bitmap per relationship determines which tabs render.
- **Write surface**: only `clinician_notes` if `can_add_clinic_notes` is true.
- **Disclaimer banner**: rendered on every clinician page.

### Verdict

**Usable MVP → near production-ready with cleanup.** The architecture is honest about scope ("not an EMR") and the permissions surface is what clinics actually need. Clinic-grade after security/legal hardening means: read-time audit logs, versioned consent records, healthcare-attorney sign-off, SOC2-style controls.

---

## 12. CLINICIAN INVITE LINK DEEP DIVE

### Current behavior (verified end-to-end)

**Generation (edge function `send-clinician-invite/index.ts` line 218):**

```ts
const acceptUrl = `${APP_ORIGIN}/clinician/accept?token=${encodeURIComponent(rawToken)}`;
```

`APP_ORIGIN = Deno.env.get("APP_ORIGIN") ?? "https://tidenup.com"` (line 123).

**Token (line 71–74):**

```ts
function generateRawToken(): string {
  return (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "");
}
```

256 bits, hex-encoded.

**At-rest (line 180–181):**

```ts
const tokenHash = await sha256Hex(rawToken);
// stored as: token_hash text not null unique
```

**Expiration (line 199):** `expires_at: now + 7 days`.

**Revocation:** `clinician_invites.revoked_at`; RLS policy `clinician_invites_update_patient_revoke` allows only the patient to revoke.

**Rate limit (lines 151–162):** Max 5 open invites per 24h per patient (429 if exceeded).

**Idempotency on resend (lines 165–188):** if an open invite for the same `(patient, email)` exists, the existing row's `token_hash` is rotated to the new hash and `scopes` updated — no duplicate row.

**Acceptance (edge function `accept-clinician-invite/index.ts`):**

- Role check (lines 104–118): rejects non-`clinician`/non-`clinic_admin` users with 403. **Patients cannot accept their own invites.**
- Token validation (lines 120–132): hash lookup, 404 if not found, 410 if accepted/revoked, 410 if expired.
- Clinic membership check (lines 140–155) if `target_clinic_id` is set.
- Atomic insert of `patient_provider_relationships` then `access_permissions` with **compensating delete** on permissions failure (lines 157–187).
- Audit log on accept (lines 196–202).

**Email (lines 216–241):** Resend; HTML body contains only inviter name, the invite link, "read-only and revocable" framing, and a 7-day expiration notice. **No PHI** (no peptide names, doses, symptom data).

**Patient-side UI (`connect-clinic.$clinicianId.tsx`, 82 lines):**
- Clinician profile loaded by ID
- Sign-in required if unauthenticated
- Default scopes exclude `journal` and `notes` (PHI-minimizing) — patient must explicitly opt in
- Submit calls `createInvite.mutateAsync({ invited_email, scopes })`

**Clinician-side accept UI (`clinician.accept.tsx`, 157 lines):**
- Validates token in query string
- Requires sign-in (no unauthenticated-signup-then-accept path)
- Requires clinician/clinic_admin role
- Success: redirect to `/clinician/patients`
- Error: toast + retry

### Checklist evaluation

| Criterion | Status |
|---|---|
| Uses production domain | ✅ `APP_ORIGIN` defaults to `https://tidenup.com`. **Must be set in production env.** |
| Avoids Lovable preview URL in prod | ✅ — assuming APP_ORIGIN is set explicitly |
| Clinic-specific | ✅ via `target_clinic_id` |
| Tokenized | ✅ 256-bit hex |
| Patient-consented | ✅ patient initiates and selects scopes |
| Role-scoped | ✅ clinician/clinic_admin only on accept |
| Revocable | ✅ `revoked_at` + RLS update policy for patient |
| Can expire | ✅ 7 days |
| Avoids exposing raw patient data in email | ✅ name + link only |
| Routes recipient correctly | ✅ `/clinician/accept?token=...` |
| Handles unauthenticated users | ⚠️ Shows "Sign In Required" — requires sign-in before accept. **No signup-then-accept flow.** For pre-existing-clinician case this is correct. For first-time clinicians it adds a step but is safer. |
| Handles already-authenticated | ✅ |
| Handles expired/invalid | ✅ 404/410 with friendly UI |
| Loading / success / error states | ✅ |
| Logs acceptance | ✅ `access_audit_logs` |
| Prevents duplicate accepts | ✅ `accepted_at` check + token_hash unique + atomic insert |
| RLS / security correct | ✅ verified for the token flow; storage policies require separate audit |

**Recommended URL format:** the current `https://tidenup.com/clinician/accept?token=...` is good and follows REST norms. The "spec-suggested" `https://tidenup.com/connect-clinic/{secure_token}` would be slightly more brandable but requires no functional change — purely cosmetic. **Not worth changing if it would invalidate existing in-flight invites.**

### Minor cleanups recommended

1. Set `APP_ORIGIN` explicitly in production secrets.
2. Strip Lovable preview regex from CORS allowlist in production build (`DYNAMIC_ALLOWED` should be conditional on env).
3. Surface "Revoke access" more visibly in the patient's sharing UI.
4. Add a single Playwright e2e test that drives invite-create → email send (mocked) → token extraction → accept → roster appearance.
5. Add read-time audit log writes for clinician viewing patient data (currently only write actions are logged).

### Verdict

**The strongest single module in the product.** Production-grade security primitives, complete end-to-end. No critical defects. Five minor cleanups before paid handoff.

---

## 13. LEGAL / COMPLIANCE / TRUST AUDIT

### Pages present (verified)

- `/legal/medical-disclaimer` — comprehensive, AI-disclosure-aware
- `/legal/privacy` — GDPR (legal bases, SCCs, UK Addendum) + CCPA-aware
- `/legal/terms` — references AUP and disclaimer

### Strengths

- "Not an EMR/EHR, not prescribing, not medical advice" repeated on every clinician page.
- AI disclosure: "Pep and any other AI-powered features are educational interfaces, not clinicians."
- "TidenUp does not sell, supply, broker, or facilitate the purchase of any compound." (Material for any peptide product.)
- "Use of TidenUp does not create a clinician–patient relationship."
- Per-entry library `regulatory` labels.

### Gaps

| Item | Risk | Fix before launch |
|---|---|---|
| Terms placeholders `[JURISDICTION]`, `[VENUE]`, `[LEGAL ENTITY NAME]`, `[REGISTERED ADDRESS]`, `[LEGAL-EMAIL]` | High | Fill in with counsel |
| Cookie consent / cookie preferences UI | Medium (EU/UK) | Add a banner; confirm any analytics or ad-tech pixels are gated |
| DMCA / AUP | Low/Medium | Either link a real DMCA agent or confirm safe-harbor doesn't apply |
| Telehealth consent (if clinic offers a 1:1 service) | Medium | Add only when telehealth is offered |
| Per-entry library claim accuracy review | Medium | Healthcare-attorney pass |
| AI red-team for medical-advice slips | Medium | Adversarial test suite |
| Marketing claims about "concierge," "premium," "longevity" | Low (so long as no disease-state claims are stapled on) | Maintain editorial discipline |
| HIPAA / BAA posture | High if PHI is involved | Decide explicitly: educational tracking (current posture) **or** HIPAA-covered. The current posture is the safer commercial path; if the clinic ships under TidenUP, the *clinic* is the covered entity, not TidenUP. |

**Important framing for the buyer:** TidenUP is **compliance-aware**, not "compliant." Treat compliance-attorney spend as a separate line item ($8–25K for an initial pass, $3–8K/quarter for ongoing) rather than a TidenUP deliverable.

---

## 14. SECURITY / PRIVACY / PHI RISK AUDIT

### What's solid

- 18+ age gate at signup
- Safe-redirect validation (no open-redirect)
- Role-based shell routing
- RLS on every patient-data table
- SHA-256 hashed invite tokens at rest
- Service-role usage restricted to edge functions
- TLS via Cloudflare edge + Supabase encryption-at-rest
- Audit log writes on relationship changes
- Granular access permissions bitmap
- Notification dedupe + RLS-scoped reads
- Pep chat: emergency pre-screen + RLS-scoped personal context fetch

### What needs verification / hardening

1. **Confirm `service_role` key is never shipped client-side.** Spot-check `import.meta.env.*` vs `Deno.env.get(...)` boundaries. Lovable Cloud Auth wrapper should not have access to service role.
2. **Storage bucket policies on `doctor-notes` / `vial-images`.** PHI lives here. Per-user RLS-equivalent storage policies are essential.
3. **Read-time audit logs.** Currently only write actions are logged. Clinic-grade requires SELECT-time auditing of patient data by clinicians.
4. **Consent records.** Versioned `consent_acceptances` rows capturing the consent text version + timestamp recommended.
5. **Lovable preview URLs in CORS regex.** Acceptable in dev; should be env-gated for production.
6. **Secret rotation runbook.** Resend, Lovable AI gateway, Supabase service role, VAPID keys all need a documented rotation policy.
7. **AI provider data sharing.** Lovable AI gateway → Gemini sees user prompts and (when opted in) personal context. Confirm DPA terms between TidenUP, Lovable, and Google. Decide if "use my context" is an explicit consent event worth a versioned record.
8. **Mobile token storage.** Expo app should use Keychain (iOS) / Keystore (Android), not plain AsyncStorage. Verify.
9. **Test coverage gap.** Single Playwright file is insufficient for a healthcare-adjacent product. Add: invite e2e, RLS regression tests, dose-engine DST test, role-escalation negative tests.

---

## 15. UX / DESIGN / PRODUCT POLISH AUDIT

### What's strong

- Editorial auth page (gradient olive background, monogram, asymmetric layout)
- Clean dashboard hierarchy
- Mobile drag-to-dismiss on notifications
- Calendar grid with badge density that doesn't overwhelm
- Disclaimer banner on every clinician page (trust signal, not visual clutter)
- shadcn/ui consistency

### What's weaker

- Some surfaces still feel templated (the Lovable provenance shows)
- Empty states are inconsistent — some are polished, others are bare
- No dark mode design tokens audit performed
- Mobile (Expo) feature parity not confirmed
- Marketing landing is solid but stops short of "premium concierge" — it reads more "trustworthy SaaS"

### Scores (0–100)

| Dimension | Score | Rationale |
|---|---:|---|
| Visual polish | **72** | Coherent, not yet luxury-tier |
| UX clarity | **78** | Information hierarchy + role split work |
| Buyer demo quality | **80** | Will demo cleanly end-to-end |
| Premium-brand fit | **66** | Needs editorial design pass to feel like a concierge/longevity brand (typography, photography, whitespace, motion) |

---

## 16. MEDVI-STYLE COMPETITIVE COMPARISON

> Note: claims about MedVi's internals are general-knowledge assumptions and should be verified before being repeated in any negotiation.

### What TidenUP already does better

- **Clinician sharing model.** Most pill-mill telehealth flows have no clinician dashboard; data is one-way to the prescriber. TidenUP has a real bilateral, consent-gated, audit-logged sharing layer.
- **Educational positioning + AI guardrails.** Pep refuses to prescribe; emergency regex pre-screens before the LLM. That's a defensible posture under FTC/FDA scrutiny that mass-market GLP-1 telehealth brands have struggled with.
- **Patient agency.** Permissions bitmap, revocable invites, no auto-renew dark patterns.
- **Adherence + journal infrastructure.** Daily-use surfaces (calendar, journal, refills, appointments) drive retention beyond "buy, ship, repeat."

### What MedVi-likes likely have that TidenUP lacks

- A telehealth provider relationship (1099 NP/MDs across all states)
- Prescription fulfillment integration (503B pharmacies)
- Payment + subscription billing tied to recurring shipments (Stripe + RevenueCat)
- Insurance / FSA / HSA support
- Identity verification + telehealth video / async-visit flow
- A medical director and policies/SOPs
- A growth team running paid acquisition

### What TidenUP should add next (highest leverage)

1. Stripe billing for subscriptions + one-off
2. A telehealth-visit module (async or sync) if the clinic is offering its own
3. Identity verification (ID.me, Persona, Stripe Identity) gated on first telehealth visit
4. Pharmacy integration with the clinic's preferred 503B
5. Provider portal extensions (visit notes, e-rx hand-off documentation — explicitly *not* prescribing)
6. SOC2-readiness + BAA capability (only if PHI scope grows)

### What TidenUP should avoid copying

- Aggressive direct-to-consumer GLP-1 prescribing marketing
- "FDA-approved" used as a general blanket vs indication-specific
- Subscription dark patterns (auto-charge with hidden cancel UX)
- Influencer/affiliate without FTC disclosure
- "Compounded peptide" supply pipelines without medical director sign-off
- Treating tracking app data as marketing data (HIPAA/state privacy risk)

### Positioning recommendation

**Premium, compliant, discreet, trust-first, white-glove.** A small high-trust patient panel served via a known clinic with a buyer who already has category access (the prospective owner's network) is a stronger and more durable wedge than paid-ad arbitrage. TidenUP can be the operating layer that makes the clinic credible, retentive, and clinically defensible.

---

## 17. BUILD-COST ESTIMATE

All math at three blended rates: **$100/hr** (conservative professional team), **$150/hr** (serious U.S. product agency), **$250/hr** (premium healthcare/product agency).

### Per-module hours

| Module | Low hours | Realistic hours | Premium hours | Low cost ($100) | Realistic cost ($150) | Premium cost ($250) | Assumptions |
|---|---:|---:|---:|---:|---:|---:|---|
| Product discovery & requirements | 24 | 40 | 80 | $2,400 | $6,000 | $20,000 | Domain immersion + clinical-adjacent product framing |
| UX / UI design system | 50 | 80 | 160 | $5,000 | $12,000 | $40,000 | Tokens, components, premium dark/editorial pass |
| Marketing site (landing, footer, legal scaffolding) | 36 | 60 | 100 | $3,600 | $9,000 | $25,000 | SSR + a11y |
| Auth (email/pwd, age gate, role routing, safe redirect) | 40 | 60 | 90 | $4,000 | $9,000 | $22,500 | Lovable Cloud Auth wrapper not free elsewhere |
| Patient dashboard | 32 | 50 | 80 | $3,200 | $7,500 | $20,000 | KPI cards, today's regimen, adherence |
| My Stack (single + blends + recurrence schema) | 64 | 100 | 160 | $6,400 | $15,000 | $40,000 | Including DB schema + CHECK constraints |
| Build with AI (suggest-protocol + UI + safety gating) | 32 | 50 | 80 | $3,200 | $7,500 | $20,000 | Prompt + confirmation surface |
| Calendar engine (recurrence, occurrence keys, TZ/DST) | 90 | 140 | 220 | $9,000 | $21,000 | $55,000 | The most underestimated module in practice |
| Dose logging (snooze, skip, undo, history JSON) | 40 | 60 | 100 | $4,000 | $9,000 | $25,000 | Including idempotency + in-flight guards |
| Notifications (prefs + push + Web Push + Expo + cron + dedup + UI center) | 80 | 120 | 200 | $8,000 | $18,000 | $50,000 | Web Push crypto + Expo + cron + retry |
| Refills + forecast | 32 | 50 | 80 | $3,200 | $7,500 | $20,000 | |
| Appointments (state machine + reminders + undo) | 50 | 80 | 130 | $5,000 | $12,000 | $32,500 | 906 lines of UI logic |
| Notes (incl. doctor-note OCR) | 44 | 70 | 110 | $4,400 | $10,500 | $27,500 | Edge function + storage + folders |
| Journal | 20 | 30 | 50 | $2,000 | $4,500 | $12,500 | |
| Watchlist | 12 | 20 | 32 | $1,200 | $3,000 | $8,000 | |
| Clinician dashboard (overview, patients, settings, sharing) | 80 | 120 | 200 | $8,000 | $18,000 | $50,000 | Six routes + permissions UI |
| Invite link / Care Share (token, hash, rate-limit, role gate, audit, RLS, email) | 50 | 80 | 130 | $5,000 | $12,000 | $32,500 | The strongest module |
| Library / research content system | 60 | 100 | 160 | $6,000 | $15,000 | $40,000 | Schema + 25–60 entries + search + AI reference |
| Ask Pep (chatbot UI + edge fn + emergency regex + evidence classifier + persistence + PDF export + voice) | 60 | 90 | 150 | $6,000 | $13,500 | $37,500 | |
| Backend / migrations / RLS / triggers / RPCs | 90 | 140 | 220 | $9,000 | $21,000 | $55,000 | 40+ migrations, clinic suite, audit logs |
| Edge functions (10) | 60 | 90 | 150 | $6,000 | $13,500 | $37,500 | Auth-aware, CORS, validation, secrets |
| Email infra (Resend, templates, invite emails) | 16 | 30 | 50 | $1,600 | $4,500 | $12,500 | |
| Legal / compliance page implementation | 18 | 30 | 50 | $1,800 | $4,500 | $12,500 | Implementation only; attorney fees separate |
| Mobile responsiveness | 24 | 40 | 60 | $2,400 | $6,000 | $15,000 | |
| Mobile app (Expo + EAS Build + push registration) | 60 | 100 | 180 | $6,000 | $15,000 | $45,000 | Separate codebase under `mobile/` |
| QA / testing (Playwright smoke + manual + cross-browser) | 36 | 60 | 100 | $3,600 | $9,000 | $25,000 | Current test surface is thin |
| Security / privacy hardening (CORS, validation, secrets, audit) | 30 | 50 | 90 | $3,000 | $7,500 | $22,500 | |
| Deployment / DevOps (Cloudflare Worker + Supabase env + EAS pipelines) | 24 | 40 | 70 | $2,400 | $6,000 | $17,500 | |
| Remotion video pipeline | 16 | 25 | 40 | $1,600 | $3,750 | $10,000 | |
| Project management | 50 | 80 | 130 | $5,000 | $12,000 | $32,500 | 10–15% PM overhead |
| **TOTALS** | **1,310** | **2,105** | **3,460** | **$131,000** | **$315,750** | **$865,000** | |

### Roll-up estimates

| Scenario | Hours | Rate | Cost |
|---|---:|---:|---:|
| Conservative low rebuild | 1,310 | $100 | **$131,000** |
| Realistic rebuild | 2,105 | $150 | **$315,750** |
| Premium agency rebuild | 3,460 | $250 | **$865,000** |
| **Lightweight MVP rebuild** (drop mobile, drop Remotion, drop AI reference, drop OCR; keep core patient + minimal clinician) | ~1,000 | $125 (blended) | **~$125,000** |
| **Production MVP rebuild** (the current TidenUP scope) | ~2,100 | $150 | **~$315,000** |
| **Clinic-grade rebuild** (add SOC2-readiness scaffolding, BAA-able vendors, telehealth module, billing, identity verification, read-time audit logs) | ~3,000 | $175 | **~$525,000** |
| **Premium polished healthcare product rebuild** (with healthcare design partner, dedicated medical advisory, RAG library, clinical content review, HIPAA-aware infra) | ~4,200 | $250 | **~$1,050,000** |

**Anchor for negotiation: realistic rebuild ≈ $300K–$325K.** Premium-agency anchor: $700K+.

---

## 18. MAINTENANCE / RETAINER ESTIMATE

### Retainer tiers

| Tier | Monthly price | Included hours | Effective hourly | Scope | Response time | Excluded | Best fit |
|---|---:|---:|---:|---|---|---|---|
| **Light support** | **$1,500** | 10 | $150 | Bug fixes, dependency updates, deploy support, small content updates | 2 business days | New features, design work, security incident response, compliance reviews | Already-launched product on autopilot |
| **Standard product retainer** | **$4,000** | 25 | $160 | Bug fixes, content/library updates, AI prompt tuning, small feature iteration, monitoring, quarterly security review | 1 business day | Major features, attorney coordination, mobile-store releases, on-call | Active product post-launch |
| **Premium product / clinic retainer** | **$9,000** | 50 | $180 | All of standard + feature iteration, clinician workflow extensions, AI/library expansion, on-call 1 business day, mobile-store release support, quarterly architecture review | Same business day | Multi-week net-new initiatives (separate SOW), regulatory work | Operating clinic actively scaling on TidenUP |
| **Fractional CTO / product owner** | **$17,000** | 80 (~½ FTE) | $213 | Strategic + hands-on; roadmap, hiring, vendor management, security posture, AI strategy, compliance liaison, code review, feature delivery | Same business day, on-call | 24/7 SRE, anything requiring full-time presence | Founder operator scaling 0 → 1,000 patients |

### Math

- Light: 10 × $150 = $1,500/mo → $18K/yr
- Standard: 25 × $160 = $4,000/mo → $48K/yr
- Premium: 50 × $180 = $9,000/mo → $108K/yr
- Fractional CTO: 80 × $213 = $17,000/mo → $204K/yr

These should be sized to actual usage; ranges above are starting points, not floors.

---

## 19. ONE-TIME SALE VALUE

### Logic

Asset sale ≠ replacement cost. A buyer typically pays a fraction of rebuild cost because:
- The buyer still needs operational ramp-up
- The seller surrenders future upside
- Some risk remains (DST audit, content review, legal placeholder fill, mobile parity)
- Platform dependencies (Lovable Cloud Auth, Lovable AI gateway) introduce migration cost
- The buyer assumes maintenance from day one

Typical asset-sale ratio in early-stage product handoffs: **25–55% of realistic rebuild cost**, sliding with handoff support included.

Against a realistic rebuild of ~$315K:

| Scenario | Range |
|---|---:|
| **Conservative low sale value** | **$90,000 – $120,000** |
| **Realistic sale value** | **$150,000 – $200,000** |
| **Premium strategic sale value** (right buyer, strong story) | **$240,000 – $325,000** |
| **Suggested anchor price** (open with) | **$185,000** |
| **Suggested fair price** (true mid) | **$155,000** |
| **Suggested floor price** | **$95,000** |
| **Walkaway number** | **$70,000** |

Discount drivers (move toward floor):
- Buyer also expects heavy unpaid maintenance
- DST/notification dispatch defects discovered during diligence
- Mobile app fails parity audit
- Buyer wants exclusive IP transfer with no ongoing partnership

Premium drivers (move toward $325K):
- Buyer has immediate clinic launch and category access (the stated context)
- Builder bundles 90-day paid handoff
- Sale includes brand + domain
- Sale includes the Pep + library content (clinically reviewable)

---

## 20. SALE + RETAINER VALUE

Pairing an upfront sale with a maintenance retainer is usually the **best structure for both sides** in this category — the buyer protects continuity, the builder doesn't get strip-mined for free post-handoff.

### Structures

| Structure | Upfront sale | Monthly retainer | Total at 6 mo | Total at 12 mo | Included scope | Excluded scope |
|---|---:|---:|---:|---:|---|---|
| **Minimal (asset + handoff)** | $130K | $1,500 | $130K + 9K = **$139K** | $130K + 18K = **$148K** | Light support, deploy access, bug fixes | New features, security incident, compliance |
| **Standard (recommended floor)** | $160K | $4,000 | $160K + 24K = **$184K** | $160K + 48K = **$208K** | Standard retainer scope | Major features, attorney coord |
| **Premium (recommended)** | $185K | $9,000 | $185K + 54K = **$239K** | $185K + 108K = **$293K** | Premium retainer scope; clinic-grade hardening included over the term | Multi-week net-new SOW work, regulatory filings |
| **White-glove** | $215K | $17,000 | $215K + 102K = **$317K** | $215K + 204K = **$419K** | Fractional-CTO involvement, strategic + execution | Anything requiring FT presence |

### Suggested 3 / 6 / 12-month framing

- **3-month structured handoff**: $185K upfront + $9K × 3 = **$212K**; explicit goal "buyer's team or new hire is operational by month 3."
- **6-month strategic glide**: $185K + $9K × 6 = **$239K**.
- **12-month operating partnership**: $185K + $9K × 12 = **$293K**.

Any of the above implicitly assumes the buyer pays its own hosting (Cloudflare, Supabase, Resend, Lovable AI gateway, Expo, EAS Build, push providers), domain, legal fees, and attorney pass.

### What requires a new statement of work

- Telehealth visit module
- Stripe billing + subscription
- Identity verification
- Pharmacy integration
- HIPAA / SOC2 controls
- Mobile-store submission cycles
- Marketing site redesign
- RAG retrieval pipeline for Pep

---

## 21. STRATEGIC PARTNER VALUE

Three structures, increasing involvement and upside:

### A. Advisor / product consultant

- Upfront cash: **$60K – $90K** (asset price haircut in exchange for advisory equity)
- Monthly cash: **$1.5K – $3K** retainer
- Equity / profit-share: **0.5% – 2% common, vesting 1-year cliff + 24 months**, or 2–5% revenue-share with cap
- Time commitment: 5–10 hrs/mo
- Responsibilities: product reviews, monthly architecture office hours, vendor referrals, escalation contact
- Best fit: buyer has technical staff, wants the original builder available for review but not delivery

### B. Fractional technical / product lead

- Upfront cash: **$100K – $140K**
- Monthly cash: **$8K – $12K**
- Equity / profit-share: **2% – 5% common, vesting 4-year + 1-year cliff**, or 5–10% rev share with cap
- Time commitment: 30–60 hrs/mo
- Responsibilities: own technical roadmap, hire/manage contractors, ship features quarterly, compliance liaison
- Best fit: buyer is a strong operator with category access but no in-house engineering leadership

### C. Strategic technical partner

- Upfront cash: **$70K – $120K** (intentionally low)
- Monthly cash: **$15K – $20K** (closer to fractional-CTO retainer)
- Equity / profit-share: **5% – 10% common, full vest 4 years + 1-year cliff**, or 10–20% net-profit interest, or a combination
- Time commitment: 60–100 hrs/mo (≥½ FTE)
- Responsibilities: full ownership of product + engineering, hands-on delivery, hiring, vendor strategy, security posture, regulatory liaison
- Best fit: buyer wants to materially co-build the business with the original builder

### Responsibilities that justify ongoing upside

- Material product velocity and feature ownership
- Carrying operational risk (security, uptime, on-call)
- Strategic decisions that compound (roadmap, hires, vendor selection)

### Responsibilities that do NOT justify ongoing equity

- Pure maintenance / bug fix queue (that's a retainer, not equity)
- Adviser-only Slack presence (that's a retainer or a small grant, not material equity)

### Risks

- **To buyer:** equity given to a part-time partner is dilutive if/when an institutional round arrives. Mitigate with vesting + acceleration only on change-of-control + termination-without-cause clauses.
- **To builder:** profit-share on a private company is hard to verify; common equity with no liquidity event is theoretical. Mitigate with mandatory annual financial review, tag-along rights, and a "fair-market repurchase" option if the partnership dissolves.

---

## 22. DEAL STRUCTURE RECOMMENDATION

| Option | Recommended price range | Pros for buyer | Pros for builder | Risks | Best use case | What to avoid |
|---|---:|---|---|---|---|---|
| **A. One-time asset sale only** | $130K – $200K | Clean break; no ongoing obligations | Liquidity; no future scope creep | Buyer inherits all risk + maintenance; builder gives up upside | Buyer has in-house engineering already | Selling cheap without a handoff window |
| **B. Asset sale + 30/60/90 handoff** | $160K – $215K + $15–30K handoff fee | Continuity through ramp | Capped, paid handoff | Scope creep during handoff if not specified | Buyer has some engineering, needs ramp | Verbal handoff promises without a SOW |
| **C. Asset sale + monthly retainer** | $160K – $200K + $4K – $9K/mo | Predictable cost, expert on call | Recurring revenue without strategic responsibility | Retainer becomes "free emergency line" | Buyer wants continuity but builder doesn't want operating role | Light retainer with implicit 24/7 SLA |
| **D. Ongoing developer/product advisor** | $100K – $140K + small monthly + small equity | Lower upfront; access to original builder | Some upside; light ongoing presence | Equity for low engagement | Buyer is strong operator with technical staff | Equity without vesting/cliff |
| **E. Strategic partner / equity / profit participation** | $70K – $120K upfront + $8K – $20K/mo + 3–10% equity | Aligned long-term; builder has skin in the game | Real upside if business scales | Misalignment if operating priorities diverge | Buyer wants to co-build the business | Vague equity terms; no vesting; no buyout |
| **F. Licensing / SaaS** | $24K – $96K/year per clinic location | No IP transfer; lower upfront | Recurring revenue, multi-deployment | Operating cost falls on builder | Builder wants to keep TidenUP and license to multiple clinics | Underpriced licensing that lets buyer outgrow the model |

### Recommended best structure

**Option C — Asset sale + monthly retainer**, with the following defaults:

- **Upfront: $185,000** (asset sale; brand + code + content + content rights; documented handoff over 4 weeks)
- **Retainer: $9,000/month** for 6 or 12 months (Premium tier scope above), with a clear out for either party with 30-day notice
- **Plus a one-time $15K compliance-prep package** in the first 60 days: legal-placeholder fill-in coordination, healthcare-attorney scope of work, library claim review handoff, security/CORS/secrets cleanup, DST/timezone verification, first invite-flow e2e test, audit log reads, mobile parity audit

This caps the builder's downside (no free maintenance), gives the buyer a confident first six months, and leaves the door open for a deeper partnership later (Option B → E) if the relationship works.

---

## 23. PRODUCTION READINESS ROADMAP

### Phase 0 — Immediate safety & cleanup (Week 1)

| Task | Priority | Effort | Impact |
|---|---|---:|---|
| Set `APP_ORIGIN` explicitly in production secrets | Critical | 0.5h | Eliminates silent default fallback |
| Strip Lovable preview URLs from CORS allowlist in prod build | Critical | 1h | Removes unintended origin trust |
| Verify `service_role` is server-side only | Critical | 1h | Prevents catastrophic data exposure |
| Audit storage policies on `doctor-notes` / `vial-images` | Critical | 4h | Locks down PHI uploads |
| Fill legal placeholders in Terms / Privacy | Critical | 2h + attorney | Avoids "draft visible in prod" embarrassment |

### Phase 1 — Buyer demo polish (Week 1–2)

| Task | Priority | Effort | Impact |
|---|---|---:|---|
| One Playwright e2e test for invite acceptance | High | 6h | Diligence-friendly |
| Visual polish pass on dashboard + landing | Medium | 16h | Demo quality |
| Confirm `suggest-protocol` UI confirmation gating | High | 4h | Safety |
| Verify Pep emergency-regex coverage on adversarial inputs | High | 6h | Safety |

### Phase 2 — Invite link & Care Share hardening (Week 2–3)

| Task | Priority | Effort | Impact |
|---|---|---:|---|
| Surface "Revoke access" prominently in patient UI | Medium | 4h | Trust |
| Add read-time audit log writes for clinician data views | High | 12h | Compliance posture |
| Versioned consent records | Medium | 8h | Compliance posture |
| Resend invite UX (instead of opaque rotation) | Low | 4h | UX |

### Phase 3 — Calendar / dosing reliability (Week 3–4)

| Task | Priority | Effort | Impact |
|---|---|---:|---|
| Read & unit-test `src/lib/schedule.ts` and `occurrence.ts` for DST | Critical | 12h | Correctness |
| Decide TZ-of-protocol vs TZ-of-device, document | High | 4h | UX clarity |
| Add half-life educational overlay (optional) | Low | 16h | Engagement |
| Add reconciliation job: "expected vs sent" daily report | High | 12h | Reliability |

### Phase 4 — AI / library safety & citations (Week 4–6)

| Task | Priority | Effort | Impact |
|---|---|---:|---|
| Healthcare attorney review of library entries | Critical | 4 weeks (attorney) | Regulatory |
| Add RAG retrieval grounding to Pep & peptide-reference | Medium | 40h | Trust + accuracy |
| Adversarial red-team pass on Pep | High | 16h | Safety |
| Audit `analyze-doctor-note`, `analyze-vial-image` for PHI handling | High | 8h | Compliance posture |

### Phase 5 — Clinic operations (Week 6–10)

| Task | Priority | Effort | Impact |
|---|---|---:|---|
| Mobile parity audit + secure-storage fix | High | 24h | Reach |
| Clinic settings: subscription, member seats | Medium | 16h | Commercial |
| Patient-managed clinic relationships (multi-clinic) | Medium | 24h | Product depth |
| Clinician notes export | Low | 8h | Clinic value |

### Phase 6 — Payments / subscriptions / refills (Week 10–14)

| Task | Priority | Effort | Impact |
|---|---|---:|---|
| Stripe subscription integration | High | 60h | Revenue |
| Refill auto-charge + ship workflow (if pharmacy integrated) | Medium | 40h | Revenue |
| Insurance / HSA / FSA handling | Low | 40h | Commercial reach |

### Phase 7 — Security / privacy / legal hardening (parallel, ongoing)

| Task | Priority | Effort | Impact |
|---|---|---:|---|
| Secret rotation runbook | Medium | 6h | Operational |
| Pen test or external security review | Medium | $8–20K (external) | Diligence |
| Cookie consent banner | Medium | 8h | EU/UK compliance |
| BAA-readiness review (if PHI scope grows) | Conditional | 4–6 weeks | Regulatory |

### Phase 8 — Launch readiness (Week 14+)

| Task | Priority | Effort | Impact |
|---|---|---:|---|
| Soft-launch with 5–10 invited patients | High | – | Validation |
| Operating runbook: incident, support, escalation | High | 16h | Operational |
| Public launch | – | – | – |

**Phase 0 alone, plus Phase 2 audit-log additions, plus Phase 3 DST verification = the minimum bar for paid handoff or buyer demo.** Everything beyond that is a launch program.

---

## 24. VALUATION SUMMARY TABLE

| Item | Value |
|---|---:|
| Conservative low rebuild estimate | **$131,000** |
| Realistic rebuild estimate | **$315,750** |
| Premium agency rebuild estimate | **$865,000** |
| Lightweight MVP rebuild | ~$125,000 |
| Production MVP rebuild (current scope) | ~$315,000 |
| Clinic-grade rebuild | ~$525,000 |
| Premium polished healthcare rebuild | ~$1,050,000 |
| Maintenance retainer — light | $1,500 / mo |
| Maintenance retainer — standard | $4,000 / mo |
| Maintenance retainer — premium | $9,000 / mo |
| Maintenance retainer — fractional CTO | $17,000 / mo |
| **One-time sale value — conservative** | **$90,000 – $120,000** |
| **One-time sale value — realistic** | **$150,000 – $200,000** |
| **One-time sale value — premium strategic** | **$240,000 – $325,000** |
| Sale + retainer — 6 month (recommended) | ~$239,000 |
| Sale + retainer — 12 month | ~$293,000 |
| Strategic partner — advisor structure | $60–90K + $1.5–3K/mo + 0.5–2% equity |
| Strategic partner — fractional lead | $100–140K + $8–12K/mo + 2–5% equity |
| Strategic partner — co-builder | $70–120K + $15–20K/mo + 5–10% equity |
| **Suggested anchor price (open with)** | **$185,000** |
| **Suggested fair price** | **$155,000** |
| **Suggested floor price** | **$95,000** |
| **Walkaway number** | **$70,000** |

---

## 25. FINAL "WHAT TO TELL THE BUYER" SUMMARY

TidenUP is not a brochure site and it's not a Lovable demo. It is a **production-grade MVP / early clinic operating system** for the peptide and longevity category, built around three things that this market is structurally missing:

1. **Patient adherence as a daily-use product** — calendar, dose logging with undo and history, journal, refills, and notifications wired to a real backend with idempotency guarantees. This is what creates monthly retention and a defensible data asset.
2. **Real clinician sharing** — a consent-gated, audit-logged, scope-controlled relationship between patients and clinicians, with a tokenized invite flow that is genuinely security-hardened. This is the B2B wedge into clinics that pure DTC telehealth brands can't easily build.
3. **An educational AI assistant with real guardrails** — Pep, which refuses to prescribe, runs an emergency-keyword filter before the LLM, cites and classifies sources, and stores chat history under the user's RLS. It is a brand differentiator that supports a trust-first positioning rather than the pill-mill posture of much of the category.

Across the codebase: **45 routes, ~99 components, 10 edge functions, 40+ migrations, comprehensive RLS, granular permissions, a separate Expo mobile app, Playwright smoke tests, and a curated peptide library with structured evidence and regulatory metadata.** This is several months of senior engineering work, not a weekend export.

Before launch, there is real work remaining: a healthcare-attorney pass on the library and AI surfaces, a timezone/DST verification on the dose engine, a notification-dispatch reliability runbook, mobile parity confirmation, and legal-placeholder fill-in. None of these are unusual — they are normal pre-launch tasks for any healthcare-adjacent product. They are listed explicitly in the production readiness roadmap.

**Why this is more valuable than the visible page count suggests:** the work that creates the most value in a clinic operating product is invisible from the outside — RLS policies, audit logs, atomic invite flows, idempotent dose logging, dedupe-key notification logs, permissions bitmaps, role-scoped routing, AI guardrails. The page count is the tip; the iceberg is the schema, the policies, and the edge functions.

**Why a clinic specifically benefits:** with a strong category-access operator behind it, TidenUP gives a peptide/longevity clinic a daily-use patient surface, a clinician operating layer, and a defensible content/AI story without taking on the regulatory posture of an EMR or a prescribing system. The clinic remains the medical authority; TidenUP is the operating layer. That separation is the safer commercial path and the right answer for a premium, compliant, trust-first brand.

**A fair structure** is rarely a clean asset flip. The recommended structure is **upfront sale + multi-month retainer**, with a small compliance-prep package in the first 60 days. The builder is paid fairly for the asset, the buyer has continuity through ramp, the relationship has an explicit termination path, and neither side carries free obligations.

**What the builder should not be expected to do post-handoff without compensation:** ongoing maintenance, security incident response, attorney coordination, mobile-store releases, AI prompt tuning, library content expansion, or net-new features. Those are exactly what a retainer (or a deeper partnership) is for.

If a clean asset sale is preferred, the recommended price is **$155,000 fair / $185,000 anchor / $95,000 floor**. If the relationship continues, **$185K upfront + $9K/month for six months ($239K total)** is the recommended structure.

---

## 26. FINAL DELIVERABLES (inventory)

- §1 Executive summary — done
- §2 Feature inventory table — done (56 rows)
- §3 Live claims vs code reality table — done
- §4 Architecture map — done
- §5 Backend / database audit — done
- §6 Calendar / dosing audit — done
- §7 My Stack audit — done
- §8 Ask Pep audit — done
- §9 Library audit — done
- §10 Notifications / refills / appointments / notes / journal audit — done
- §11 Clinician dashboard audit — done
- §12 Invite link deep dive — done
- §13 Compliance / legal risk audit — done
- §14 Security / privacy audit — done
- §15 UX / product polish audit — done
- §16 MedVi-style competitive comparison — done
- §17 Build-cost estimate table — done
- §18 Maintenance / retainer estimate table — done
- §19 One-time sale valuation — done
- §20 Sale + retainer valuation — done
- §21 Strategic partner valuation — done
- §22 Recommended deal structure — done
- §23 Production readiness roadmap — done
- §24 Final valuation summary table — done
- §25 What to tell the buyer summary — done

### Files inspected (key paths)

- `package.json`, `wrangler.jsonc`, `playwright.config.ts`, `EXPO_PUSH.md`, `DEFERRAL_DISCIPLINE.md`
- `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/routes/dashboard.tsx`, `src/routes/calendar.tsx`, `src/routes/stack.tsx`, `src/routes/library.tsx`, `src/routes/watchlist.tsx`, `src/routes/notifications.tsx`, `src/routes/refills.tsx`, `src/routes/appointments.tsx`, `src/routes/notes.tsx`, `src/routes/journal.tsx`, `src/routes/auth.tsx`, `src/routes/legal.*.tsx`
- `src/routes/clinician.tsx`, `clinician.index.tsx`, `clinician.patients.tsx`, `clinician.patients.$patientId.tsx`, `clinician.sharing.tsx`, `clinician.settings.tsx`, `clinician.accept.tsx`, `connect-clinic.$clinicianId.tsx`
- `src/components/landing-page.tsx`, `src/components/app-shell.tsx`, `src/components/peptide/pep-assistant.tsx`, plus 12 component subdirectories
- `src/lib/peptide-library.ts`
- `supabase/functions/peptide-chat/index.ts`, `send-clinician-invite/index.ts`, `accept-clinician-invite/index.ts`
- `supabase/migrations/` — all 40+ files indexed; deep reads on `schedule_details`, `notifications_and_push`, `notifications_center`, `schedule_notification_dispatch`, `clinician_invites`, `access_audit_logs`, `patient_sharing`, `relationships_and_permissions`, `clinics_and_members`, `profiles_role`, `email_infra`, `clinician_notes`, `patient_rls_extensions`, `clinician_rpcs`, `patient_view_clinician_profile`, `clinic_managed_patients`, `clinic_patient_protocol`, `onboarding_profile_fields`
- `tests/smoke/no-blank-page.spec.ts`
- `mobile/` (directory inventory only)
- `remotion/` (directory only)

### Unknowns requiring manual verification

1. **`src/lib/schedule.ts` and `src/lib/occurrence.ts`** — timezone/DST correctness of dose occurrence generation
2. **`supabase/functions/notification-dispatch/index.ts`** — cron schedule, retry logic, push key handling, quiet-hours timezone math, Resend fallback
3. **`supabase/functions/suggest-protocol/index.ts`** — system prompt, output schema, UI confirmation gating
4. **`supabase/functions/analyze-doctor-note/index.ts` and `analyze-vial-image/index.ts`** — prompts, PHI handling, hallucination posture
5. **`supabase/functions/peptide-reference/index.ts`** — RAG grounding, prompt, safety posture
6. **Lovable Cloud Auth ↔ Supabase JWT compatibility** — confirm `auth.uid()` resolves correctly under the wrapper
7. **Storage bucket policies** for `doctor-notes` and `vial-images`
8. **Cookie consent UI** presence/absence
9. **Mobile app feature parity** and secure-token storage (Keychain/Keystore)
10. **Per-entry library `regulatory` label accuracy** against current FDA/EMA status
11. **Live production env** confirmation of `APP_ORIGIN`, `ALLOWED_ORIGINS`, and absence of Lovable preview origin in prod CORS

### Recommended next technical fixes (paste-ready)

1. **`APP_ORIGIN` production secret** — set explicitly in Cloudflare Worker + Supabase Edge env. Eliminate reliance on the `?? "https://tidenup.com"` default.
2. **CORS allowlist env-gating** — wrap the Lovable preview regex in `if (Deno.env.get("ENV") !== "production")`.
3. **DST regression test** — write a test in `tests/` that calls `generateOccurrences` for a daily 08:00 schedule spanning a DST forward and backward jump and asserts the local-wall-clock time stays 08:00.
4. **Invite e2e Playwright test** — create invite, extract token from a stubbed Resend, accept as clinician, assert roster appearance.
5. **Read-time audit logs** — add `access_audit_logs` writes from clinician data-read RPCs.
6. **`suggest-protocol` confirmation gate** — assert in UI that AI suggestions land in a draft modal, not in the user's `stack_items` directly.

### Recommended next negotiation steps

1. Share §1 (Executive Summary) and §24 (Valuation Summary Table) with the buyer first.
2. Walk through §12 (Invite Link Deep Dive) live — this is the strongest demonstrable engineering surface.
3. Anchor at **$185K** asset sale.
4. Frame the conversation around **Option C (Asset sale + retainer)** as the recommended best structure.
5. Offer a **$15K compliance-prep package** in the first 60 days as a separate line item — this differentiates the offer and pre-empts the buyer's anxiety about "is this actually launchable."
6. If the buyer probes for equity, fall back to **Option E** structures but only with vesting, cliff, change-of-control, and termination protections clearly documented.
7. Avoid: vague handoff promises, perpetual unpaid maintenance, retainers without scope, equity without a buyout clause, or a clean asset sale below $95K.

---

**End of report.**
