# Deck Outline (27 slides)

> One-line bullets per slide. The full Gamma-paste deck lives in `deck.md`.

| # | Title | Bullets |
|---|---|---|
| 1 | Chravel Codebase Wiki | git SHA `1e833665` · generated 2026-05-12 · `claude/code-wiki-generator-YIV8v` |
| 2 | Executive Summary | Group-trip coordination layer · Consumer + Pro/Enterprise + Event tiers · NOT an OTA |
| 3 | Stack at a Glance | React 18.3 / Vite 5.4 / TS 5.9 (strict OFF) · TanStack Query 5.56 / Zustand 5.0 · Supabase + Stream Chat + LiveKit + Gemini |
| 4 | Repo Map | 1,105 src files · 88 edge functions · 358 migrations · 215 tables · 6 stores |
| 5 | System Architecture | (embed `system-architecture.mmd`) |
| 6 | Routing Map | 33 lazy routes + 1 catch-all · public vs ProtectedRoute vs InternalAdminRoute |
| 7 | State Architecture | TanStack `tripKeys` factory · 6 Zustand stores · per-domain stale/gc |
| 8 | Auth & RLS | useAuth.tsx 1,383 lines · 824 RLS policies · email/Google/Apple/phone · `_shared/requireAuth.ts` |
| 9 | Data Model | (embed ER diagram fragment) · 215 tables grouped into 8 clusters |
| 10 | Edge Functions Inventory | 88 functions · 16 public (verify_jwt=false) · `lovable-concierge` 2,155 lines · `functionExecutor` 143 KB |
| 11 | Subsystem: Chat & Broadcasts | Stream Chat 9.40 + Supabase Realtime hybrid · system messages silent + skip_push (memory #29) |
| 12 | Subsystem: Calendar | Google Cal bi-sync · idempotent dedupe by external event ID (memory #15) |
| 13 | Subsystem: Places & Links | Google Maps + Places API · single MapView per page (memory #18) |
| 14 | Subsystem: AI Concierge | Gemini text + Vertex Live voice · 38 tools, 18 query classes · 5-file sync (memory #26) |
| 15 | Subsystem: Polls | Realtime tally · poll-close → Stream silent system message |
| 16 | Subsystem: Tasks | Permission model varies by trip type (memory #8) |
| 17 | Subsystem: Payments | Stripe web + RevenueCat iOS · strict SDK boundary (memory #6) · split state machine (memory #16) |
| 18 | Subsystem: Media | Compression → validation → signed URL → AI tagging (memory #12, #17) |
| 19 | Subsystem: Events & Viral Loop | `/event/:eventId` public surface · invite tokens · existence ≠ access (memory #21) |
| 20 | Mobile / PWA / Capacitor | Capacitor shell in `chravel-mobile` · PWA workbox · OAuth via system browser on installed shells |
| 21 | Third-Party Integrations | 10+ SaaS · ~94 env vars · payment SDK boundary · Gemini fallback to Lovable gateway |
| 22 | Performance Hotspots | Manual chunks · 33 lazy routes · `eventsPerSecond: 40` realtime cap · 1,293 ESLint warning baseline |
| 23 | Test Coverage Map | 217 tests / 1,105 source files (~12%) · 17 gaps in `TEST_GAPS.md` · Playwright E2E |
| 24 | Risk Register | Field drift top-10 sweep · RLS gaps · concierge tool 5-file sync · capability token defaults |
| 25 | Day-1 Contributor Path | clone → env → `npm run dev` → first PR · `CLAUDE.md` manifesto |
| 26 | Roadmap Hooks | Pro/Enterprise extension points · feature flags · `src/features/` modularization |
| 27 | Regeneration Protocol | Triggers: migrations / functions / types / deps · `REGEN.md` · Gamma-paste workflow |
