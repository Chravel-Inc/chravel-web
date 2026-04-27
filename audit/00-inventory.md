# Phase 0 — Open PR Inventory

**Repo:** Chravel-Inc/chravel-web
**Generated:** 2026-04-27 (Phase 0 — read-only inventory)
**Source data:** `audit/pr-inventory.json` (raw list) + `audit/pr-inventory-enriched.json` (per-PR `get` + `get_check_runs`)

## Summary

| Metric | Count |
|---|---|
| Total open PRs | 47 |
| Drafts | 14 |
| Ready (non-draft) | 33 |
| CI passing | 33 |
| CI failing | 14 |
| Mergeable: clean | 4 |
| Mergeable: unstable (mergeable, but failing checks) | 11 |
| Mergeable: dirty (conflict with main) | 18 |
| Mergeable: unknown (GH not yet computed) | 14 |

**Authors:** ChravelApp (13), MeechYourGoals (19), cursor[bot] (15)

## All Open PRs (sorted by createdAt desc — newest first)

Columns: # · Title · Author · Draft · Age (days since createdAt) · Files · +/− · CI · Mergeable · Last activity (since updatedAt) · One-line

| # | Title | Author | D | Age | Files | +/− | CI | Mergeable | Last act | What it does |
|---|---|---|---|---:|---:|---|---|---|---|---|
| #393 | fix(date): add parseLocalDate to handle YYYY-MM-DD timezone bugs sa... | ChravelApp |  | 0d | 4 | +59/−5 | ✓ pass (13/17) | △ unstable | 0d ago | fix |
| #392 | 🧹 [code health] Fetch preferred payment method from user | ChravelApp |  | 0d | 2 | +747/−731 | ✓ pass (4/5) | ? unknown | 0d ago | [code health] Fetch preferred payment method from user |
| #391 | 🧹 Code Health: Implement scaffold for Google Play Billing provider | ChravelApp |  | 0d | 3 | +928/−732 | ✓ pass (3/4) | ? unknown | 0d ago | Code Health |
| #390 | 🧹 Remove unused DemoModeBadge component | ChravelApp |  | 0d | 2 | +0/−15 | ✓ pass (13/16) | ? unknown | 0d ago | Remove unused DemoModeBadge component |
| #389 | 🧹 Remove unused isVerbose function export from logging.ts | ChravelApp |  | 0d | 1 | +0/−3 | ✓ pass (13/17) | ? unknown | 0d ago | Remove unused isVerbose function export from logging.ts |
| #388 | Implement receipt extraction and storage | ChravelApp |  | 0d | 3 | +793/−736 | ✓ pass (3/4) | ? unknown | 0d ago | Implement receipt extraction and storage |
| #386 | Fix Stream pinned message support across trip and channel chats | cursor[bot] | Y | 0d | 13 | +1017/−844 | ✓ pass (12/15) | ✗ conflict | 0d ago | Fix Stream pinned message support across trip and channel chats |
| #384 | Deliver Daily Engineering Digest | MeechYourGoals |  | 0d | 1 | +547/−756 | ✓ pass (12/16) | ? unknown | 0d ago | Deliver Daily Engineering Digest |
| #383 | chore: PR triage audit report | MeechYourGoals |  | 1d | 0 | +0/−0 | ✗ fail (2f/12p) | ? unknown | 1d ago | chore |
| #381 | Claude/slack session k gfv a | ChravelApp |  | 2d | 4 | +40/−37 | ✗ fail (1f/12p) | ? unknown | 2d ago | Claude/slack session k gfv a |
| #361 | Security Review Complete | MeechYourGoals |  | 4d | 0 | +0/−0 | ✓ pass (13/17) | ? unknown | 4d ago | Security Review Complete |
| #359 | ThreadView: add pagination, dedupe, reconnect backfill, and tests | ChravelApp |  | 4d | 4 | +532/−93 | ✓ pass (4/5) | ? unknown | 4d ago | ThreadView |
| #358 | chore: generate daily engineering digest | MeechYourGoals |  | 4d | 1 | +11/−0 | ✓ pass (13/17) | ? unknown | 4d ago | chore |
| #338 | fix(events): harden EventDetail + consolidate ErrorBoundary reload UX | cursor[bot] | Y | 6d | 7 | +67/−37 | ✓ pass (11/15) | ? unknown | 6d ago | fix |
| #337 | fix(chat): Stream-aligned alerts and notification deep-links to chat | cursor[bot] | Y | 6d | 14 | +278/−4 | ✗ fail (1f/11p) | ? unknown | 6d ago | fix |
| #336 | fix(ios-web): branded boot splash + faster auth cold start | cursor[bot] | Y | 6d | 4 | +53/−23 | ✓ pass (12/15) | ? unknown | 6d ago | fix |
| #335 | fix(native): Trip type switcher modal uses theme CSS vars (dark mode) | cursor[bot] | Y | 6d | 1 | +13/−14 | ✓ pass (12/15) | △ unstable | 6d ago | fix |
| #334 | fix(theme): enable Tailwind dark: variants by syncing html.dark | cursor[bot] | Y | 6d | 3 | +15/−3 | ✓ pass (12/15) | △ unstable | 6d ago | fix |
| #326 | chore: Generate PR Audit Report | MeechYourGoals |  | 8d | 2 | +98/−1 | ✓ pass (12/16) | △ unstable | 8d ago | chore |
| #317 | chore: generate daily engineering digest | MeechYourGoals |  | 8d | 0 | +0/−0 | ✗ fail (1f/12p) | △ unstable | 8d ago | chore |
| #316 | fix(chat): use resolved Supabase URL/key for stream-join-channel | cursor[bot] | Y | 9d | 4 | +25/−15 | ✗ fail (1f/11p) | ✗ conflict | 8d ago | fix |
| #314 | fix(web): remove service worker unregister race on startup | cursor[bot] | Y | 9d | 1 | +5/−9 | ✗ fail (1f/11p) | △ unstable | 9d ago | fix |
| #295 | fix(trip): redirect trip members from /preview to main shell for chat | cursor[bot] | Y | 11d | 2 | +33/−11 | ✗ fail (1f/11p) | ✗ conflict | 11d ago | fix |
| #288 | test(light-mode): add class-state tests for TripViewToggle & share ... | ChravelApp |  | 11d | 6 | +211/−0 | ✗ fail (1f/11p) | ✗ conflict | 11d ago | test |
| #285 | Daily Engineering Digest | MeechYourGoals |  | 11d | 1 | +1/−1 | ✓ pass (12/16) | △ unstable | 11d ago | Daily Engineering Digest |
| #281 | Stream membership reliability: structured failure logging, server f... | ChravelApp |  | 12d | 14 | +496/−7 | ✓ pass (4/5) | ✗ conflict | 12d ago | Stream membership reliability |
| #252 | consolidate(revenuecat): canonicalize native adapter and remove web... | ChravelApp |  | 12d | 9 | +142/−804 | ✗ fail (1f/11p) | ✗ conflict | 12d ago | consolidate |
| #239 | fix(concierge): eliminate streaming scroll jitter on iOS (stick-to-... | cursor[bot] | Y | 13d | 3 | +175/−85 | ✓ pass (10/13) | ✗ conflict | 13d ago | fix |
| #227 | fix(concierge): restore trip tools, RAG timeout, and AIConciergeCha... | cursor[bot] |  | 13d | 4 | +15/−90 | ✓ pass (11/15) | ✗ conflict | 13d ago | fix |
| #210 | Stream-first transport cutover, media utils, feature-flagged broadc... | ChravelApp |  | 14d | 2 | +6/−4 | ✓ pass (10/14) | ✗ conflict | 14d ago | Stream-first transport cutover, media utils, feature-flagged broadcast scheduling & assorted hardening |
| #209 | 🧪 Add tests for OfflineQueue | MeechYourGoals |  | 14d | 1 | +80/−0 | ✓ pass (11/15) | △ unstable | 14d ago | Add tests for OfflineQueue |
| #204 | Generate daily engineering digest | MeechYourGoals |  | 14d | 2 | +5/−22 | ✓ pass (3/4) | ✗ conflict | 14d ago | Generate daily engineering digest |
| #203 | chore: PR Triage Audit Report | MeechYourGoals |  | 15d | 8 | +159/−14 | ✓ pass (3/4) | ✗ conflict | 14d ago | chore |
| #197 | fix(messaging): canonicalize ScheduledMessage type and map broadcas... | MeechYourGoals | Y | 15d | 4 | +42/−41 | ✓ pass (10/13) | ✗ conflict | 15d ago | fix |
| #183 | 🧹 Extract duplicated MIME type checkers to shared utility | MeechYourGoals |  | 15d | 4 | +11/−14 | ✓ pass (4/5) | ✗ conflict | 15d ago | Extract duplicated MIME type checkers to shared utility |
| #181 | 🧹 fix(chat): remove hardcoded preferred payment method | MeechYourGoals |  | 15d | 3 | +36/−11 | ✗ fail (3f/9p) | △ unstable | 15d ago | fix |
| #164 | Add native macOS SwiftUI app scaffold (Modules 1-5) with Supabase a... | ChravelApp |  | 16d | 37 | +1634/−1 | ✓ pass (3/4) | ✗ conflict | 16d ago | Add native macOS SwiftUI app scaffold |
| #159 | fix(concierge): stop vibrating/jittery answers during streaming | cursor[bot] | Y | 17d | 3 | +105/−26 | ✗ fail (2f/9p) | ✗ conflict | 17d ago | fix |
| #157 | fix(db): restore trip embed for pending join requests on home dashb... | cursor[bot] | Y | 17d | 1 | +37/−0 | ✗ fail (2f/9p) | △ unstable | 17d ago | fix |
| #152 | Clean up root markdown sprawl and technical debt | MeechYourGoals |  | 17d | 39 | +1/−3113 | ✓ pass (12/14) | ✗ conflict | 17d ago | Clean up root markdown sprawl and technical debt |
| #148 | fix(chat): Disambiguate GetStream channel vs role TripChannel in Tr... | cursor[bot] |  | 17d | 1 | +30/−28 | ✗ fail (1f/11p) | ✗ conflict | 15d ago | fix |
| #144 | Enforce tripId validation and scoping in execute-concierge-tool | MeechYourGoals |  | 17d | 2 | +16/−13 | ✓ pass (12/14) | ✗ conflict | 17d ago | Enforce tripId validation and scoping in execute-concierge-tool |
| #127 | docs(ci): E2E nightly workflow guide + optional Slack notify | cursor[bot] | Y | 19d | 3 | +106/−0 | ✗ fail (1f/10p) | △ unstable | 19d ago | docs |
| #123 | fix: limit chunk error auto-reloads and generate audit report | MeechYourGoals |  | 20d | 4 | +73/−434 | ✓ pass (13/15) | ✓ clean | 20d ago | fix |
| #113 | chore: Generate Daily Engineering Digest | MeechYourGoals |  | 21d | 1 | +1/−1 | ✓ pass (10/11) | ✓ clean | 21d ago | chore |
| #109 | 🧪 [Testing Improvement] Maximize sanitizeConciergeContent coverage | MeechYourGoals |  | 21d | 2 | +52/−2 | ✓ pass (10/10) | ✓ clean | 21d ago | [Testing Improvement] Maximize sanitizeConciergeContent coverage |
| #108 | 🧹 Code Health: Clean up unimplemented receipt extraction and implem... | MeechYourGoals |  | 21d | 3 | +27/−24 | ✓ pass (10/10) | ✓ clean | 21d ago | Code Health |

## Failing CI breakdown (14 PRs)

| # | First failing check | All failing |
|---|---|---|
| #383 | Build Web App | Build Web App, Static Checks |
| #381 | CodeQL | CodeQL |
| #337 | deploy-impact | deploy-impact |
| #317 | gitleaks | gitleaks |
| #316 | gitleaks | gitleaks |
| #314 | gitleaks | gitleaks |
| #295 | gitleaks | gitleaks |
| #288 | gitleaks | gitleaks |
| #252 | Build Web App | Build Web App |
| #181 | Unit Tests (Vitest) | Unit Tests (Vitest), Static Checks, gitleaks |
| #159 | Static Checks | Static Checks, Unit Tests (Vitest) |
| #157 | Static Checks | Static Checks, Unit Tests (Vitest) |
| #148 | Static Checks | Static Checks |
| #127 | Unit Tests (Vitest) | Unit Tests (Vitest) |

## Dirty (conflict-with-main) PRs (18 PRs)

- #386 — Fix Stream pinned message support across trip and channel chats (cursor[bot], 13 files)
- #316 — fix(chat): use resolved Supabase URL/key for stream-join-channel (cursor[bot], 4 files)
- #295 — fix(trip): redirect trip members from /preview to main shell for chat (cursor[bot], 2 files)
- #288 — test(light-mode): add class-state tests for TripViewToggle & share controls; add trip-detail visual QA checklist (ChravelApp, 6 files)
- #281 — Stream membership reliability: structured failure logging, server fallback, and edge function (ChravelApp, 14 files)
- #252 — consolidate(revenuecat): canonicalize native adapter and remove web purchases-js init (ChravelApp, 9 files)
- #239 — fix(concierge): eliminate streaming scroll jitter on iOS (stick-to-bottom) (cursor[bot], 3 files)
- #227 — fix(concierge): restore trip tools, RAG timeout, and AIConciergeChat build (cursor[bot], 4 files)
- #210 — Stream-first transport cutover, media utils, feature-flagged broadcast scheduling & assorted hardening (ChravelApp, 2 files)
- #204 — Generate daily engineering digest (MeechYourGoals, 2 files)
- #203 — chore: PR Triage Audit Report (MeechYourGoals, 8 files)
- #197 — fix(messaging): canonicalize ScheduledMessage type and map broadcasts rows (MeechYourGoals, 4 files)
- #183 — 🧹 Extract duplicated MIME type checkers to shared utility (MeechYourGoals, 4 files)
- #164 — Add native macOS SwiftUI app scaffold (Modules 1-5) with Supabase adapters and tests (ChravelApp, 37 files)
- #159 — fix(concierge): stop vibrating/jittery answers during streaming (cursor[bot], 3 files)
- #152 — Clean up root markdown sprawl and technical debt (MeechYourGoals, 39 files)
- #148 — fix(chat): Disambiguate GetStream channel vs role TripChannel in TripChat (cursor[bot], 1 files)
- #144 — Enforce tripId validation and scoping in execute-concierge-tool (MeechYourGoals, 2 files)

## Notes for Phase 1

- **Per-PR meta JSON files** (`audit/pr-<num>-meta.json` with reviews/comments/reviewThreads) were deferred from Phase 0 to Phase 1 to keep this inventory step bounded. They will be fetched as part of Phase 1 categorization, where Cursor Bot review content is needed for each PR.
- **`mergeable_state: unknown`** appears on 14 PRs because GitHub had not yet computed mergeability when fetched. Phase 4 (pre-merge verification) re-fetches this.
- **Activity sequencing tip:** PR #210 (Stream-first transport cutover, +6/−4 in this branch's tip but is a large meta-PR) is one of several that may unblock or invalidate downstream PRs once landed; flagged in Phase 5 instructions.
