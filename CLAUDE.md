# AI Ingestion Summary

- **App Name:** Chravel
- **Product Description:** A multi-platform trip management and collaboration app (web + PWA + iOS) that combines itinerary planning, real-time group chat, expense splitting, calendar sync, media sharing, and an AI-powered travel concierge for both consumer travelers and professional tour/event teams.

## Primary User Types
1. Consumer travelers (Free / Explorer / Frequent Chraveler tiers)
2. Pro/Enterprise teams (tour managers, event coordinators, sports teams)
3. Organization admins (B2B seat-based billing)
4. Advertisers (campaign management dashboard)

## Top 10 Systems/Modules
1. Trip Management (create, join, archive, share, invite)
2. Unified Messaging (trip chat, channels, broadcasts, threads, reactions)
3. AI Concierge (Gemini-powered travel assistant with voice + text)
4. Calendar & Events (Google Calendar sync, reminders, agendas)
5. Payments & Expense Splitting (RevenueCat subscriptions, Stripe checkout, split settlements)
6. Smart Import (Gmail OAuth, receipt OCR, artifact ingestion)
7. Media Gallery (upload, compression, AI tagging, lightbox)
8. Maps & Places (Google Maps, place search, location sharing)
9. Organizations & Teams (B2B, roles, permissions, rosters)
10. Notifications & Realtime (push notifications, Supabase realtime, read receipts)

## Top 10 Third-Party Integrations
1. Supabase (Postgres, RLS, Auth, Realtime, Edge Functions, Storage)
2. Google Gemini / Vertex AI (text + voice concierge)
3. Google Maps JavaScript API (maps, places, geocoding)
4. RevenueCat (iOS/web subscription billing)
5. Stripe (web checkout, webhooks, customer portal)
6. Capacitor (iOS/Android native shell)
7. Sentry (error tracking)
8. PostHog (product analytics)
9. Google Calendar API (bi-directional sync)
10. Gmail API (OAuth email import)

## Top 20 Core Entities/Features
1. Trips (consumer, pro, event types)
2. Trip Members / Participants
3. Messages (unified across chat + channels)
4. Channels (role-based, custom)
5. Broadcasts (trip-wide announcements)
6. Calendar Events (with recurrence, reminders)
7. Payment Splits (multi-method settlements)
8. Receipts (OCR-parsed expenses)
9. Media Attachments (photos, videos, files)
10. Artifacts (imported documents, itineraries)
11. Tasks (assignable, per-trip)
12. Polls (voting with real-time updates)
13. Links (shared with OG previews)
14. Organizations (B2B with seat billing)
15. AI Queries (concierge conversation history)
16. Notifications (push + email + in-app)
17. Profiles (user settings, preferences)
18. Subscriptions (consumer + pro tiers)
19. Campaigns (advertiser targeting + analytics)
20. Shared Locations (realtime GPS sharing)

## Known Risky Areas
- Trip Not Found flash during auth hydration (recurring)
- Auth desync causing data leaks
- RLS policy bypasses (zero-tolerance)
- Chat message loss on WebSocket reconnect
- Demo mode data contamination
- Capability token security (edge function JWT)
- CORS origin validation (edge functions)
- CronGuard fail-open (cron-only endpoints)
- Chat read receipt write amplification
- Supabase realtime unfiltered subscriptions

## Canonical Docs Created/Updated
- `CLAUDE.md` — Engineering manifesto & hard constraints
- `DEBUG_PATTERNS.md` — Security + performance anti-patterns
- `LESSONS.md` — Reusable engineering tips
- `TEST_GAPS.md` — Missing test coverage by subsystem
- `AGENTS.md` — Agent operating principles
- `agent_memory.jsonl` — Structured machine-readable memory

---

# 📐 TECHNICAL ARCHITECTURE REFERENCE

> Grounded in codebase evidence as of 2026-03-31. Every claim below is confirmed from code unless marked (inferred) or (partial).

## Stack at a Glance

| Layer | Technology | Key Files |
|-------|-----------|-----------|
| **Language** | TypeScript (strict: OFF) | `tsconfig.json` |
| **Frontend** | React 18.3 + Vite 5.4 (SWC) | `src/App.tsx`, `src/main.tsx` |
| **Server state** | TanStack Query 5 | `src/lib/queryKeys.ts` |
| **Client state** | Zustand 5 (6 stores) | `src/stores/`, `src/store/` |
| **Styling** | Tailwind 3.4 + shadcn/ui (Radix) | `tailwind.config.ts`, `src/components/ui/` (48 primitives) |
| **Routing** | React Router DOM 6 | `src/App.tsx` (~25 routes, all lazy-loaded) |
| **Backend** | Supabase Edge Functions (Deno) | `supabase/functions/` (~95 functions, ~45K lines) |
| **Database** | PostgreSQL via Supabase | `supabase/migrations/` (329 migrations, ~160 tables, 756 RLS policies) |
| **Auth** | Supabase Auth (email + Google OAuth) | `src/hooks/useAuth.tsx`, `_shared/requireAuth.ts` |
| **Realtime** | Supabase Realtime (WebSocket) | Chat, notifications, locations |
| **Storage** | Supabase Storage | Media uploads, avatars |
| **AI (text)** | Google Gemini via `lovable-concierge` (2,155 lines) | 38 tools, 18 query classes |
| **AI (voice)** | Vertex AI Live API (`gemini-live-2.5-flash-native-audio`) | `supabase/functions/gemini-voice-session/` |
| **Payments (web)** | Stripe (checkout + webhooks) | `supabase/functions/stripe-webhook/` |
| **Payments (iOS)** | RevenueCat | `src/integrations/revenuecat/` |
| **iOS wrapper** | Capacitor 8 (NOT React Native) | `capacitor.config.ts`, `ios/` |
| **Hosting** | Vercel (frontend) + Render (unfurl proxy) | `vercel.json`, `render.yaml` |
| **CI/CD** | 9 GitHub Actions workflows | `.github/workflows/` |
| **Analytics** | PostHog | `src/telemetry/` |
| **Errors** | Sentry | `@sentry/react` |

**No Python. No React Native. No GraphQL. No traditional server.**

## Codebase Scale

| Metric | Count |
|--------|-------|
| Frontend files (.ts/.tsx) | 936 |
| Frontend LOC | ~205,000 |
| Edge functions | ~95 |
| Edge function LOC | ~45,000 |
| Custom hooks | 100 (`src/hooks/`) |
| Service modules | 82 (`src/services/`) |
| Shared components | 96 (`src/components/`) |
| Pages | 33 (`src/pages/`) |
| Feature modules | 5 (`src/features/`: broadcasts, calendar, chat, share-extension, smart-import) |
| Test files | 109 (Vitest) + E2E suite (Playwright) |
| ESLint warning baseline | 1,293 |
| npm audit vulnerabilities | 13 (4 moderate, 8 high, 1 critical) |

## Architecture Topology

```
User → Vercel (static SPA) → Supabase (DB + Auth + Realtime + Storage + ~95 Edge Functions)
                            → Google Gemini / Vertex AI (AI concierge)
                            → Stripe / RevenueCat (payments)
                            → Google Maps / Calendar / Gmail (integrations)
iOS → Capacitor shell → same web app → same Supabase backend
```

- **Frontend queries Supabase directly** via JS client with user JWT; RLS filters at DB layer
- **Edge functions** handle server-side logic: AI, webhooks, imports, notifications, auth-gated mutations
- **Vercel edge functions** (4 in `api/`) handle OG link previews only
- **Render** hosts a 156-line Node.js unfurl proxy for branded OG previews (`p.chravel.app`)

## Environment Variables Summary

- **23 client-side** (`VITE_` prefixed): Supabase URL/key, Maps key, Stripe publishable key, analytics, feature toggles
- **~70 server-side** (Supabase Edge Function secrets): Gemini, Vertex, Stripe secret, APNS, Twilio, Resend, AWS, OAuth secrets, cron secrets
- **Total: ~93 unique env vars** across 10+ services
- CI validates env coverage via `scripts/check-env-coverage.ts`

## AI Concierge Architecture

1. Auth → Rate limit → Query classification (18 classes) → Selective tool loading (38 tools from `toolRegistry.ts`)
2. Context building per query class → Prompt assembly (conditional layers) → Gemini API call with function calling
3. Tool execution via capability tokens + secure router → Usage tracking → Response
4. **Voice path:** Vertex AI Live API, WebSocket duplex audio, shared tool declarations, circuit breaker, 5 voice presets
5. **RAG:** `kb_documents` + `kb_chunks` + `trip_embeddings` tables, embedding generation edge functions

## Security Posture

- **756 RLS policies** enforce access at DB layer
- **CORS:** exact origin matching, no wildcards (`_shared/cors.ts`)
- **Auth:** JWT validated server-side in every edge function via `requireAuth.ts`
- **Secrets:** validated at function startup via `requireSecrets()` from `_shared/validateSecrets.ts`
- **CI:** Gitleaks secret scanning + CodeQL static analysis on every PR
- **CSP headers** configured in `vercel.json` (includes `unsafe-inline` for scripts/styles)
- **Known gaps:** CronGuard fail-open on missing secret, capability token default secret fallback, client-side super admin check

## Deployment Flow

1. Push to `main`/`develop` → CI (lint, typecheck, test, build, migration lint, env validation)
2. Push to `main` → Vercel auto-deploys frontend
3. Push to `main` (changes in `supabase/functions/`) → GitHub Action deploys edge functions via Supabase CLI
4. PR to `main` → deploy-safety.yml posts impact analysis comment
5. iOS: manual workflow → Fastlane → TestFlight / App Store
6. Database migrations: **manual** (`supabase db push` or Dashboard)

## Key Architectural Decisions

- **Supabase as sole backend** — deep lock-in (migration: 9/10 difficulty), but zero infra management
- **Capacitor, not React Native** — same codebase for web+iOS, but limited native capabilities
- **Gemini, not OpenAI** — native voice via Vertex AI Live, function calling, multimodal; `openai-chat` edge function exists as legacy
- **Feature flags via DB table** — runtime kill switches, 60s client cache, no redeployment needed
- **shadcn/ui + Radix** — accessible, composable primitives; "premium dark/gold" design language
- **Offline queue** — IndexedDB cache + mutation queue + sync processor (real, not theoretical)

## Vendor Lock-In (migration difficulty 1-10)

| Service | Difficulty | Notes |
|---------|-----------|-------|
| Supabase | **9** | DB, auth, realtime, storage, edge functions — everything |
| Google Gemini | **5** | AI layer abstracted via gateway + tool registry |
| Google Maps | **7** | Deeply integrated in places/maps UI |
| Stripe | **5** | Standard webhook pattern, replaceable |
| RevenueCat | **4** | iOS billing wrapper only |
| Vercel | **2** | Static hosting, trivially swappable |

## Known Tech Debt (Critical Items)

- `lovable-concierge` edge function: 2,155-line monolith
- `AIConciergeChat.tsx`: 2,088-line god component
- Flat `src/hooks/` (100 files) and `src/services/` (82 files) — need modularization
- Only 5 of ~12 domains use `src/features/` pattern
- ~160 tables with potential orphans (mock tables in prod schema)
- 1,293 ESLint warnings (budget-tracked but high)
- Test coverage ~12% file coverage (109 tests / 936 source files)
- `core` binary (36MB) at repo root — purpose unknown

---

# 🧭 CHRAVEL ENGINEERING MANIFESTO
> **Stack:** React 18 + TypeScript · TanStack Query + Zustand · Tailwind · Supabase (Postgres, RLS, Auth, Realtime, Edge Functions) · Vercel
> **Platforms:** Web + PWA + Mobile Web
> **Non-negotiable:** Every edit must pass `npm run lint && npm run typecheck && npm run build` before commit

---

## GLOBAL PRINCIPLES

1. **Zero syntax errors** — every `{}`, `()`, `[]`, and JSX tag must close cleanly. Mentally simulate `npm run build` before returning code.
2. **TypeScript** — strict mode is OFF (`"strict": false`). Explicitly type all params and return values. No `any` unless interfacing with untyped third-party libs (comment why). Prefer `unknown` for dynamic data.
3. **Feature-based architecture** — new domain features go in `src/features/<name>/components/` and `src/features/<name>/hooks/`. Never put domain logic in `src/components/`.
4. **Vercel/Node 18+** — no experimental syntax, no stage-3 proposals. Code must compile in a fresh install.
5. **Readability > cleverness** — explicit names (`userTrips` not `ut`), one function = one responsibility, comment complex logic.
6. **No new libraries** unless explicitly requested.
7. **No `console.log`** left in committed code.

---

## HARD CONSTRAINTS

- ❌ Do NOT introduce new libraries without explicit request
- ❌ Do NOT break existing flows
- ❌ Do NOT weaken RLS or auth guarantees
- ❌ Do NOT call Supabase directly in JSX — always go through `/src/integrations/supabase/client.ts`
- ❌ Do NOT duplicate map components — use single `<MapView mode="..." />`
- ✅ Prefer incremental fixes over refactors unless refactor is unavoidable
- ✅ Output only artifacts that can be acted on — if ambiguous, ask ONE blocking question

---

## SECURITY GATE (check before every code output)

**Security:**
- No hardcoded secrets
- No client-side trust of `user_id`, `trip_id`, or role
- Supabase queries must respect existing RLS
- No privilege escalation via params or optimistic UI

**Data integrity:**
- Trip existence ≠ trip access
- Auth state must resolve before data fetch
- All IDs validated (UUID format, non-null)

**UI safety:**
- Loading ≠ Not Found ≠ Empty — never conflate these three states
- No flashing error states during auth hydration
- Mobile-safe layouts (no overflow regressions)

**Zero-tolerance paths:** Trip Not Found regressions · auth desync · RLS leaks

---

## BUG-FIX PROTOCOL

**Order is mandatory:** Reproduce → Diagnose → Fix → Prove

1. **Reproduce** — write a failing test first (unit for logic, integration for UI/hooks, e2e only if truly required). Test must fail for the real reason.
2. **Diagnose** — trace to root cause before touching production code. Identify exact component/hook/service/state involved.
3. **Fix surgically** — smallest correct change. No broad rewrites. No dead code left behind. Fix the layer where the bug belongs.
4. **Prove** — reproduction test must pass after fix. Nearby tests must still pass.
5. **Report** — root cause · files changed · fix applied · tests added · evidence it passes · regression risk.

**Non-negotiables:** Never claim "fixed" without proof. Never skip reproduction. Never refactor as a substitute for diagnosis.

---

## AGENT LEARNING PROTOCOL

**Purpose:** Compound debugging and implementation knowledge across sessions and tools.

**Memory files (repo root):**
- `DEBUG_PATTERNS.md` — recurring bug signatures + proven fixes
- `LESSONS.md` — reusable strategy / recovery / optimization tips
- `TEST_GAPS.md` — missing coverage discovered during work
- `agent_memory.jsonl` — structured machine-readable memory

### Before every non-trivial task:
1. Read relevant entries from `DEBUG_PATTERNS.md` and `LESSONS.md`
2. Retrieve only what matches: this subsystem, error pattern, feature type, or framework
3. State which prior learnings apply and how they change the plan

### After every meaningful task:
1. Extract up to 3 tips (strategy / recovery / optimization) — only if specific, reusable, and evidence-backed
2. **Collect learnings during the branch's work, but defer writing to memory files until the final commit of the branch.** Do not update memory files after every individual task — batch them into a single learning-update commit at the end. This reduces merge conflicts across parallel branches.
3. Update the appropriate memory file (in the batched commit):
   - Bug pattern discovered → `DEBUG_PATTERNS.md`
   - Broader reusable lesson → `LESSONS.md`
   - Missing test coverage found → `TEST_GAPS.md`
   - High-value structured entry → `agent_memory.jsonl`
4. Before writing: check for duplicates — merge and refine existing entries instead of appending copies
5. Report: which memory files were read, which were updated, what was added or skipped

> **Note:** `.gitattributes` configures `merge=union` for all memory files, so git auto-merges independent entries from parallel branches. If you notice garbled entries after a merge, manually clean up the affected file.

### Quality gate for memory entries:
- ✅ Specific and actionable (not "be careful with state")
- ✅ Evidence-backed (tied to a real task or bug)
- ✅ Reusable across future similar tasks
- ❌ No vague advice, one-off trivia, or speculative entries
- ❌ No duplicates of existing entries

### Bad vs. good tip:
- ❌ "Be careful with async state"
- ✅ "When trip data shows briefly then disappears, check whether auth hydration completes before the data fetch guard — stale auth state triggers the Not Found path before the real user session resolves"

---

## SUPABASE RULES

1. Always handle `error` explicitly — never ignore it
2. Always go through `/src/integrations/supabase/client.ts`
3. Type results using generated `Database` types from Supabase CLI
4. Use optimistic updates with rollback for insert/update mutations
5. Clean up realtime channels in `useEffect` return
6. All migrations MUST pass `npx tsx scripts/lint-migrations.ts`
7. All migrations MUST be timestamped (`YYYYMMDDHHMMSS_description.sql`)
8. All `CREATE TABLE` MUST use `IF NOT EXISTS`; all functions use `CREATE OR REPLACE`
9. All `DROP` statements MUST use `IF EXISTS`
10. Destructive changes (column drop, rename, type change) require two-phase migration with forward-fix documented
11. Edge functions MUST validate required secrets using `requireSecrets()` from `_shared/validateSecrets.ts`

---

## FEATURE FLAG RULES

1. Use `public.feature_flags` table for runtime kill switches — never require redeployment to disable a feature
2. Frontend: `import { useFeatureFlag } from '@/lib/featureFlags'` — returns `boolean`, 60s cache
3. Edge functions: `import { isFeatureEnabled } from '../_shared/featureFlags.ts'`
4. New user-facing features SHOULD have a kill switch flag seeded in the migration
5. Kill switch disables take effect within 60 seconds (client cache TTL)

---

## GOOGLE MAPS RULES

1. One map instance per page — use props/context for mode changes
2. Always null-check `mapRef.current` before any operation
3. Debounce high-frequency events (drag, zoom, `bounds_changed`) — 300ms
4. Clean up all event listeners in `useEffect` return
5. Type all coordinates as `{ lat: number; lng: number }`

---

## OUTPUT FORMAT (for all code responses)

```
Files Changed:
- src/features/trips/useTrip.ts

Code: [full file or unambiguous diff — no pseudocode]

Invariants Preserved:
- Auth-gated trip access preserved
- RLS unchanged

Regression Risk: LOW | MEDIUM | HIGH
Rollback: <1 sentence>
```

---

## KEY FILES & QUICK COMMANDS

```
/src/integrations/supabase/client.ts  — Supabase singleton
/src/types/                           — Type definitions
/src/components/                      — Reusable components
/src/lib/                             — Utility functions
/src/features/                        — Feature modules
```

```bash
npm run dev          # Local dev server
npm run lint         # Fix linting
npm run typecheck    # Type check
npm run build        # Production build (runs lint + typecheck)
npm run preview      # Test production build locally
```

**When builds fail:** Read the exact error (line + file) → check bracket balance → `npm run typecheck` → fix → push → check Vercel logs.

---

## CODE PATTERNS REFERENCE

For canonical ✅/❌ examples (React hooks, Supabase queries, Maps initialization, error patterns), load the `chravel-code-patterns` skill.

---

**"If it doesn't build, it doesn't ship."**

_Last Updated: 2026-03-31 · Maintained by: AI Engineering Team + Meech_
