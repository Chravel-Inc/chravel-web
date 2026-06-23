# Pull Request Audit Report

## 1. Executive Summary

- **Total open PRs reviewed:** 29
- **Merge Now:** 13
- **Keep Open:** 10
- **Close:** 6
- **Biggest duplication clusters:** Automated AI "Daily Engineering Digest" PRs (e.g., 317, 285, 204, 113). Concierge chat UI fix overlap (239 vs 159).
- **Biggest stale-work patterns:** Automated chore/audit scripts creating PRs and never closing them. These are point-in-time reads of git history.
- **Biggest risk if I do nothing:** Letting the massive Stream architecture cutover (PR 210) linger while other small PRs accumulate on top of the old transport. And general repository clutter preventing real feature work from being visible.

## 2. PR-by-PR Triage Table

| PR | Title | Status | Category | Overlap With | Key Finding | Scores (Rel / Qual / Ready / Align / Risk / ShouldExist) | Recommendation | Why |
|----|-------|--------|----------|--------------|-------------|----------------------------------------------------------|----------------|-----|
| #323 | fix(stream-webhook): mention-only notification rows with retry dedupe | Ready | fix | None | Deduplicates mention-based notifications correctly and avoids fanout spam. Code is well-scoped to webhook. | 90/85/95/90/10/90 | **MERGE NOW** | Deduplicates mention-based notifications correctly and avoids fanout spam. Code is well-scoped to webhook. |
| #317 | chore: generate daily engineering digest | Ready | audit | 285, 204, 113 | Automated digest reports are point-in-time documents, not codebase changes. | 0/80/100/10/0/0 | **CLOSE — OUTDATED / NO LONGER NEEDED** | Automated digest reports are point-in-time documents, not codebase changes. |
| #316 | fix(chat): use resolved Supabase URL/key for stream-join-channel | Draft | fix | None | Resolves config drift by using correct Supabase key resolution, but stuck in Draft. Author needs to mark ready. | 80/80/40/90/20/80 | **KEEP OPEN** | Resolves config drift by using correct Supabase key resolution, but stuck in Draft. Author needs to mark ready. |
| #314 | fix(web): remove service worker unregister race on startup | Draft | fix | None | Addresses service worker unregister race condition. Needs to be finished out of draft to ensure PWA stability. | 80/80/40/90/20/80 | **KEEP OPEN** | Addresses service worker unregister race condition. Needs to be finished out of draft to ensure PWA stability. |
| #295 | fix(trip): redirect trip members from /preview to main shell for chat | Draft | fix | None | Redirects users correctly for chat, preventing user confusion, but needs to be taken out of Draft. | 85/80/40/90/20/80 | **KEEP OPEN** | Redirects users correctly for chat, preventing user confusion, but needs to be taken out of Draft. |
| #288 | test(light-mode): add class-state tests for TripViewToggle & share controls; add trip-detail visual QA checklist | Ready | test | None | Adds necessary light-mode accessibility component tests and QA lists. Low risk test addition. | 80/90/95/90/10/80 | **MERGE NOW** | Adds necessary light-mode accessibility component tests and QA lists. Low risk test addition. |
| #285 | Daily Engineering Digest | Ready | audit | 317, 204, 113 | Automated digest output should not be a PR. | 0/80/100/10/0/0 | **CLOSE — OUTDATED / NO LONGER NEEDED** | Automated digest output should not be a PR. |
| #281 | Stream membership reliability: structured failure logging, server fallback, and edge function | Ready | feature | None | Critical reliability improvements for Stream membership with server fallback. Enhances PR 210 architecture. | 95/85/90/95/30/100 | **MERGE NOW** | Critical reliability improvements for Stream membership with server fallback. Enhances PR 210 architecture. |
| #252 | consolidate(revenuecat): canonicalize native adapter and remove web purchases-js init | Ready | cleanup | None | Canonicalizes RevenueCat native adapter and removes contradictory web layer, aligning with mobile-web app strategy. | 85/85/90/90/20/85 | **MERGE NOW** | Canonicalizes RevenueCat native adapter and removes contradictory web layer, aligning with mobile-web app strategy. |
| #239 | fix(concierge): eliminate streaming scroll jitter on iOS (stick-to-bottom) | Draft | fix | 159 | Robust ResizeObserver-driven fix for iOS scroll jitter in concierge. Needs final review and un-drafting. | 90/90/40/90/10/90 | **KEEP OPEN** | Robust ResizeObserver-driven fix for iOS scroll jitter in concierge. Needs final review and un-drafting. |
| #227 | fix(concierge): restore trip tools, RAG timeout, and AIConciergeChat build | Ready | fix | None | Restores missing trip scoped tools and RAG timeout fixes. Reverses critical regressions in AI features. | 90/90/90/90/15/90 | **MERGE NOW** | Restores missing trip scoped tools and RAG timeout fixes. Reverses critical regressions in AI features. |
| #210 | Stream-first transport cutover, media utils, feature-flagged broadcast scheduling & assorted hardening | Ready | feature | None | Massive and necessary architectural cutover to Stream-first transport. Needs dedicated time to verify cutover paths. | 100/80/70/100/80/100 | **KEEP OPEN** | Massive and necessary architectural cutover to Stream-first transport. Needs dedicated time to verify cutover paths. |
| #209 | 🧪 Add tests for OfflineQueue | Ready | test | None | Straightforward test coverage additions for OfflineQueue. No production risk. | 80/90/90/90/5/80 | **MERGE NOW** | Straightforward test coverage additions for OfflineQueue. No production risk. |
| #204 | Generate daily engineering digest | Ready | audit | 317, 285, 113 | Another point-in-time digest. Abandon. | 0/80/100/10/0/0 | **CLOSE — OUTDATED / NO LONGER NEEDED** | Another point-in-time digest. Abandon. |
| #203 | chore: PR Triage Audit Report | Ready | audit | None | PR Triage report stored as a PR. Meta PR that adds no codebase value. | 0/80/100/10/0/0 | **CLOSE — OUTDATED / NO LONGER NEEDED** | PR Triage report stored as a PR. Meta PR that adds no codebase value. |
| #197 | fix(messaging): canonicalize ScheduledMessage type and map broadcasts rows | Draft | fix | None | Crucial canonicalization for ScheduledMessage type, preventing field mismatch risks. Stuck in draft. | 85/80/40/90/20/85 | **KEEP OPEN** | Crucial canonicalization for ScheduledMessage type, preventing field mismatch risks. Stuck in draft. |
| #183 | 🧹 Extract duplicated MIME type checkers to shared utility | Ready | cleanup | None | Standard DRY cleanup extracting MIME checkers to a shared utility. Safe refactor. | 80/90/95/90/5/80 | **MERGE NOW** | Standard DRY cleanup extracting MIME checkers to a shared utility. Safe refactor. |
| #181 | 🧹 fix(chat): remove hardcoded preferred payment method | Ready | cleanup | None | Removes hardcoded Venmo string and uses dynamic queries. Corrects UX defect effectively. | 85/90/95/90/10/80 | **MERGE NOW** | Removes hardcoded Venmo string and uses dynamic queries. Corrects UX defect effectively. |
| #164 | Add native macOS SwiftUI app scaffold (Modules 1-5) with Supabase adapters and tests | Ready | test | None | Large, strategic macOS SwiftUI app scaffold. Keep open for feature parity development. | 80/80/50/80/50/100 | **KEEP OPEN** | Large, strategic macOS SwiftUI app scaffold. Keep open for feature parity development. |
| #159 | fix(concierge): stop vibrating/jittery answers during streaming | Draft | fix | 239 | Superseded by PR 239's ResizeObserver implementation which avoids forced per-commit scrolling. | 50/70/80/50/20/0 | **CLOSE — SUPERSEDED** | Superseded by PR 239's ResizeObserver implementation which avoids forced per-commit scrolling. |
| #157 | fix(db): restore trip embed for pending join requests on home dashboard | Draft | fix | None | Fixes RLS issue for trip requests on dashboard. Good fix but needs to be finished from draft state. | 85/80/40/90/20/80 | **KEEP OPEN** | Fixes RLS issue for trip requests on dashboard. Good fix but needs to be finished from draft state. |
| #152 | Clean up root markdown sprawl and technical debt | Ready | cleanup | None | Cleans up root markdown sprawl (tmp files, etc). Low-risk repository maintenance. | 80/90/95/90/5/80 | **MERGE NOW** | Cleans up root markdown sprawl (tmp files, etc). Low-risk repository maintenance. |
| #148 | fix(chat): Disambiguate GetStream channel vs role TripChannel in TripChat | Ready | fix | None | Disambiguates important GetStream Channel from Role Channel in TripChat, averting type confusion bugs. | 90/90/95/90/15/90 | **MERGE NOW** | Disambiguates important GetStream Channel from Role Channel in TripChat, averting type confusion bugs. |
| #144 | Enforce tripId validation and scoping in execute-concierge-tool | Ready | feature | None | Fixes severe capability scoping/auth bypass vulnerability by enforcing tripId validation in edge function. | 95/90/95/90/25/95 | **MERGE NOW** | Fixes severe capability scoping/auth bypass vulnerability by enforcing tripId validation in edge function. |
| #127 | docs(ci): E2E nightly workflow guide + optional Slack notify | Draft | docs | None | Adds CI docs for scheduled E2E pipeline. Good documentation addition, but waiting in draft. | 75/80/40/85/5/75 | **KEEP OPEN** | Adds CI docs for scheduled E2E pipeline. Good documentation addition, but waiting in draft. |
| #123 | fix: limit chunk error auto-reloads and generate audit report | Ready | audit | None | Crucial fix limiting infinite chunk error auto-reloads. Replaces aggressive unconditional cache clearing. | 95/90/90/90/25/90 | **MERGE NOW** | Crucial fix limiting infinite chunk error auto-reloads. Replaces aggressive unconditional cache clearing. |
| #113 | chore: Generate Daily Engineering Digest | Ready | audit | 317, 285, 204 | Bot-generated digest that clutters PR list. | 0/80/100/10/0/0 | **CLOSE — OUTDATED / NO LONGER NEEDED** | Bot-generated digest that clutters PR list. |
| #109 | 🧪 [Testing Improvement] Maximize sanitizeConciergeContent coverage | Ready | test | None | Adds tests to close coverage gaps in sanitizeConciergeContent. Excellent safety improvement. | 85/90/95/90/5/85 | **MERGE NOW** | Adds tests to close coverage gaps in sanitizeConciergeContent. Excellent safety improvement. |
| #108 | 🧹 Code Health: Clean up unimplemented receipt extraction and implement create_todo | Ready | cleanup | None | Removes unimplemented stub logic and connects real task creation feature cleanly. | 85/90/95/90/15/85 | **MERGE NOW** | Removes unimplemented stub logic and connects real task creation feature cleanly. |

## 3. Duplicate / Superseded Clusters

**Cluster 1: Automated Engineering Digests**
- **Root issue:** Bots/agents creating "Daily Engineering Digest" PRs that just dump text and stay open forever.
- **Best surviving PR:** None. These shouldn't be PRs.
- **PRs to close:** 317, 285, 204, 113, 203
- **Action:** Close immediately. No cherry-picking needed.

**Cluster 2: Concierge Scroll Jitter (iOS)**
- **Root issue:** AI concierge streaming causes vibrating/glitching scroll on iOS.
- **Best surviving PR:** 239 (uses ResizeObserver and coalescing).
- **PRs to close:** 159 (uses older, less robust per-React-commit forced scrolling).
- **Action:** Close 159 as superseded by 239. Review and finish 239.

## 4. Immediate Action Plan

1. **PRs to close immediately:**
   - 317, 285, 204, 113, 203 (Outdated bot/agent reports)
   - 159 (Superseded by 239)

2. **PRs to merge immediately:**
   - 323, 288, 281, 252, 227, 209, 183, 181, 152, 148, 144, 123, 109, 108

3. **PRs that need rebasing or conflict resolution:**
   - 210 (Stream-first cutover will likely have massive conflicts due to its size and age, needs rebasing before further evaluation)

4. **PRs that should be consolidated into a single replacement PR:**
   - None currently identified that require complex consolidation. #159 naturally consolidates into #239.

5. **PRs that should be abandoned and rebuilt later:**
   - None of the remaining PRs warrant total abandonment. The Draft PRs (316, 314, 295, 197, 157, 127) need active development to be finished, or can be rebuilt if author context is lost.

## 5. Suggested GitHub Comments

**For duplicate PR:**
> Closing this as it duplicates the effort in #[PR_NUMBER]. Let's continue the discussion and consolidate the work there.

**For superseded PR (e.g., #159):**
> Closing this as superseded by #239, which handles the scroll jitter more robustly using `ResizeObserver`. Thanks for the initial investigation!

**For outdated PR (e.g., bot digests):**
> Closing. Automated daily digests and point-in-time audit reports shouldn't remain open as code pull requests. We can track this information in Slack or via GitHub Issues instead.

**For already covered by merged work PR:**
> Closing this PR as the underlying issue has already been resolved and merged via another branch on base. Thanks for your contribution!

**For keep-open-but-needs-rework PR (e.g., drafts):**
> Keeping this open, but noting it is still marked as Draft and may need rebasing/reworking. Let us know what's blocking this from being marked ready for review or if you need help finishing it!
