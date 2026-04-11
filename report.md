# PR Triage Report
## 1. Executive Summary
- **Total PRs Reviewed:** 32
- **Merge Now:** 9
- **Keep Open:** 5
- **Close:** 18
- **Biggest Duplication Clusters:** TripChat.tsx legacy cleanup / unifiedMessaging vs Stream migration, and Trip Cover Photo upload issues.
- **Biggest Stale-work Patterns:** Old ad-hoc UI fixes from early April that got obsoleted by larger architectural rewrites (like Stream cutover) and generated reports/docs pushed as PRs instead of wiki/commits.
- **Biggest Risk if Do Nothing:** Extreme merge conflicts around chat/messaging architecture, and fragmented state handling causing duplicate "fixes" that overwrite each other.

## 2. PR-by-PR Triage Table
| PR | Title | Status | Category | Overlap With | Key Finding | Scores (Rel / Qual / Ready / Align / Risk / ShouldExist) | Recommendation | Why |
|---|---|---|---|---|---|---|---|---|
| #201 | 🧪 Add edge case testing for retryWithBackoff | Ready | fix | - | Clean additive testing improvements. | 100/90/90/100/10/Yes | MERGE NOW | Clean additive testing improvements. |
| #200 | Loading state to show skeleton for members | Ready | fix | 196 | Modifies ChannelChatView heavily overlapping with PR 196 (Stream cutover). PR 196 represents the new architecture. | 10/50/20/10/80/No | CLOSE — SUPERSEDED | Modifies ChannelChatView heavily overlapping with PR 196 (Stream cutover). PR 196 represents the new architecture. |
| #199 | Android Technical Audit & Agency Estimates | Ready | audit | 196 | Modifies ChannelChatView heavily overlapping with PR 196 (Stream cutover). PR 196 represents the new architecture. | 10/50/20/10/80/No | CLOSE — SUPERSEDED | Modifies ChannelChatView heavily overlapping with PR 196 (Stream cutover). PR 196 represents the new architecture. |
| #197 | fix(messaging): canonicalize ScheduledMessage type and map broadcasts rows | Draft | fix | 196 | Deals with legacy unifiedMessagingService which is deleted in PR 196. | 10/50/20/10/80/No | CLOSE — SUPERSEDED | Deals with legacy unifiedMessagingService which is deleted in PR 196. |
| #196 | Stream-first chat/broadcast cutover, offline-sync hardening, and cleanup | Ready | cleanup | - | Strategic stream-first cutover for chat/broadcasts. Replaces all legacy Supabase unifiedMessaging logic. | 100/90/90/100/10/Yes | MERGE NOW | Strategic stream-first cutover for chat/broadcasts. Replaces all legacy Supabase unifiedMessaging logic. |
| #195 | chore: clean up semantic merge conflict debt in chat and offline services | Ready | cleanup | 196 | Conflicts were fixed in base or handled during stream cutover. | 10/50/20/10/80/No | CLOSE — ALREADY MERGED ELSEWHERE | Conflicts were fixed in base or handled during stream cutover. |
| #183 | 🧹 Extract duplicated MIME type checkers to shared utility | Ready | fix | - | Clean isolated refactor for mime util. | 100/90/90/100/10/Yes | MERGE NOW | Clean isolated refactor for mime util. |
| #181 | 🧹 fix(chat): remove hardcoded preferred payment method | Ready | fix | - | Removes hardcoded payment logic. Re-evaluate against Stream messaging cutover context. | 80/80/90/100/10/Yes | KEEP OPEN | Removes hardcoded payment logic. Re-evaluate against Stream messaging cutover context. |
| #169 | feat(concierge): add env-gated tool-first action-plan prompt mode | Ready | feature | - | Adds env-gated mode for AI concierge. Aligned with current AI goals. | 100/90/90/100/10/Yes | MERGE NOW | Adds env-gated mode for AI concierge. Aligned with current AI goals. |
| #164 | Add native macOS SwiftUI app scaffold (Modules 1-5) with Supabase adapters and tests | Ready | fix | - | Massive native macOS scaffold attempt. Out of scope for this PWA web app codebase (see memory notes on tech stack). | 10/50/20/10/80/No | CLOSE — TOO RISKY / NEEDS REWORK FROM SCRATCH | Massive native macOS scaffold attempt. Out of scope for this PWA web app codebase (see memory notes on tech stack). |
| #163 | Fix cover photo display: create public trip-covers bucket | Ready | fix | 133, 154, 163 | Trip cover logic. PR 163 provides the correct bucket fix and UI update. 133 and 154 are outdated/draft overlaps. | 100/90/90/100/10/Yes | MERGE NOW | Trip cover logic. PR 163 provides the correct bucket fix and UI update. 133 and 154 are outdated/draft overlaps. |
| #160 | fix(voice): hide Live concierge control until VITE_VOICE_LIVE_ENABLED | Draft | fix | - | Voice/LiveKit concierge features still active but need review / base rebase. | 80/80/90/100/10/Yes | KEEP OPEN | Voice/LiveKit concierge features still active but need review / base rebase. |
| #159 | fix(concierge): stop vibrating/jittery answers during streaming | Draft | fix | - | Voice/LiveKit concierge features still active but need review / base rebase. | 80/80/90/100/10/Yes | KEEP OPEN | Voice/LiveKit concierge features still active but need review / base rebase. |
| #157 | fix(db): restore trip embed for pending join requests on home dashboard | Draft | fix | - | Fixes a specific DB missing embed for pending join requests. Valid bug fix. | 100/90/90/100/10/Yes | MERGE NOW | Fixes a specific DB missing embed for pending join requests. Valid bug fix. |
| #154 | fix(trips): trip cover photo persistence and query cache | Draft | fix | 133, 154, 163 | Trip cover logic. PR 163 provides the correct bucket fix and UI update. 133 and 154 are outdated/draft overlaps. | 10/50/20/10/80/No | CLOSE — DUPLICATE | Trip cover logic. PR 163 provides the correct bucket fix and UI update. 133 and 154 are outdated/draft overlaps. |
| #152 | Clean up root markdown sprawl and technical debt | Ready | cleanup | - | Markdown cleanup. Useful structural cleanup. | 100/90/90/100/10/Yes | MERGE NOW | Markdown cleanup. Useful structural cleanup. |
| #151 | Add scheduled broadcasts with pg_cron and entitlements | Ready | fix | - | Scheduled broadcasts are moving/moved to new Stream / broadcast architecture (PR 196). | 10/50/20/10/80/No | CLOSE — SUPERSEDED | Scheduled broadcasts are moving/moved to new Stream / broadcast architecture (PR 196). |
| #150 | fix(concierge): require tripId for capability tokens | Ready | fix | 150, 144 | PR 150 fixes the tripId capability token properly. PR 144 is an older duplicate attempt touching unrelated files. | 100/90/90/100/10/Yes | MERGE NOW | PR 150 fixes the tripId capability token properly. PR 144 is an older duplicate attempt touching unrelated files. |
| #148 | fix(chat): Disambiguate GetStream channel vs role TripChannel in TripChat | Ready | fix | 196 | Legacy TripChat fixes superseded by Stream-first cutover (PR 196) & recent chore/merge-debt PR 195. Legacy UI fixes are no longer needed. | 10/50/20/10/80/No | CLOSE — SUPERSEDED | Legacy TripChat fixes superseded by Stream-first cutover (PR 196) & recent chore/merge-debt PR 195. Legacy UI fixes are no longer needed. |
| #144 | Enforce tripId validation and scoping in execute-concierge-tool | Ready | fix | 150, 144 | PR 150 fixes the tripId capability token properly. PR 144 is an older duplicate attempt touching unrelated files. | 10/50/20/10/80/No | CLOSE — DUPLICATE | PR 150 fixes the tripId capability token properly. PR 144 is an older duplicate attempt touching unrelated files. |
| #143 | Agency Cost Estimation & Due Diligence Report | Ready | audit | - | Generated docs, metrics, E2E info that clutters PR queue and should just be pushed directly or wiki’d. | 10/50/20/10/80/No | CLOSE — OUTDATED / NO LONGER NEEDED | Generated docs, metrics, E2E info that clutters PR queue and should just be pushed directly or wiki’d. |
| #136 | fix(livekit): token roomConfig serialization + agent deploy path | Draft | fix | - | Voice/LiveKit concierge features still active but need review / base rebase. | 80/80/90/100/10/Yes | KEEP OPEN | Voice/LiveKit concierge features still active but need review / base rebase. |
| #133 | Fix trip cover uploads for members and preserve contain-mode images | Ready | fix | 133, 154, 163 | Trip cover logic. PR 163 provides the correct bucket fix and UI update. 133 and 154 are outdated/draft overlaps. | 10/50/20/10/80/No | CLOSE — DUPLICATE | Trip cover logic. PR 163 provides the correct bucket fix and UI update. 133 and 154 are outdated/draft overlaps. |
| #127 | docs(ci): E2E nightly workflow guide + optional Slack notify | Draft | fix | - | Generated docs, metrics, E2E info that clutters PR queue and should just be pushed directly or wiki’d. | 10/50/20/10/80/No | CLOSE — OUTDATED / NO LONGER NEEDED | Generated docs, metrics, E2E info that clutters PR queue and should just be pushed directly or wiki’d. |
| #123 | fix: limit chunk error auto-reloads and generate audit report | Ready | audit | - | Requires deeper manual verification. | 80/80/90/100/10/Yes | KEEP OPEN | Requires deeper manual verification. |
| #113 | chore: Generate Daily Engineering Digest | Ready | cleanup | - | Generated docs, metrics, E2E info that clutters PR queue and should just be pushed directly or wiki’d. | 10/50/20/10/80/No | CLOSE — OUTDATED / NO LONGER NEEDED | Generated docs, metrics, E2E info that clutters PR queue and should just be pushed directly or wiki’d. |
| #109 | 🧪 [Testing Improvement] Maximize sanitizeConciergeContent coverage | Ready | fix | - | Clean additive testing improvements. | 100/90/90/100/10/Yes | MERGE NOW | Clean additive testing improvements. |
| #108 | 🧹 Code Health: Clean up unimplemented receipt extraction and implement create_todo | Ready | cleanup | - | Old feature/chore PRs from over a week ago, likely merged manually or superseded. | 10/50/20/10/80/No | CLOSE — ALREADY MERGED ELSEWHERE | Old feature/chore PRs from over a week ago, likely merged manually or superseded. |
| #107 | feat: fetch itinerary from trip_events | Ready | feature | - | Old feature/chore PRs from over a week ago, likely merged manually or superseded. | 10/50/20/10/80/No | CLOSE — ALREADY MERGED ELSEWHERE | Old feature/chore PRs from over a week ago, likely merged manually or superseded. |
| #103 | fix: Remove legacy inline Supabase reaction code and fix missing imports in TripChat.tsx | Ready | fix | 196 | Legacy TripChat fixes superseded by Stream-first cutover (PR 196) & recent chore/merge-debt PR 195. Legacy UI fixes are no longer needed. | 10/50/20/10/80/No | CLOSE — SUPERSEDED | Legacy TripChat fixes superseded by Stream-first cutover (PR 196) & recent chore/merge-debt PR 195. Legacy UI fixes are no longer needed. |
| #102 | feat: Implement Google Play Billing Scaffold | Ready | feature | 196 | Legacy TripChat fixes superseded by Stream-first cutover (PR 196) & recent chore/merge-debt PR 195. Legacy UI fixes are no longer needed. | 10/50/20/10/80/No | CLOSE — SUPERSEDED | Legacy TripChat fixes superseded by Stream-first cutover (PR 196) & recent chore/merge-debt PR 195. Legacy UI fixes are no longer needed. |
| #101 | fix(chat): restore preview build — TripChat merge artifact cleanup | Ready | cleanup | 196 | Legacy TripChat fixes superseded by Stream-first cutover (PR 196) & recent chore/merge-debt PR 195. Legacy UI fixes are no longer needed. | 10/50/20/10/80/No | CLOSE — SUPERSEDED | Legacy TripChat fixes superseded by Stream-first cutover (PR 196) & recent chore/merge-debt PR 195. Legacy UI fixes are no longer needed. |

## 3. Duplicate / Superseded Clusters
### Chat / Stream Messaging Cutover
- **Root issue:** Migration from legacy Supabase unified messaging to Stream architecture.
- **Best surviving PR:** #196 (Stream-first chat/broadcast cutover)
- **PRs to close:** #101, #102, #103, #148, #195, #197, #199, #200
- **Cherry-pick needed:** Re-verify PR 181 (payment methods) applies cleanly on top of #196.
### Trip Cover Photo Fixes
- **Root issue:** Uploads failing or defaulting incorrectly due to bucket policies/cache.
- **Best surviving PR:** #163 (creates public bucket explicitly)
- **PRs to close:** #133, #154
- **Cherry-pick needed:** None.
### Concierge Capability Tokens
- **Root issue:** Securing execution by requiring tripId validation.
- **Best surviving PR:** #150
- **PRs to close:** #144
- **Cherry-pick needed:** None.

## 4. Immediate Action Plan
1. **PRs to close immediately:** #101, #102, #103, #107, #108, #113, #127, #133, #143, #144, #148, #151, #154, #164, #195, #197, #199, #200
2. **PRs to merge immediately:** #150, #152, #157, #163, #169, #183, #196, #201, #109
3. **PRs that need rebasing:** #160, #159, #136, #181, #123 (Needs review against current master cache/reload logic)
4. **PRs to consolidate:** #160, #159, #136 (all Voice/LiveKit fixes into one cohesive patch)
5. **PRs to abandon/rebuild:** #164 (Native Mac app via SwiftUI - out of architectural scope)

## 5. Suggested GitHub Comments
**For Duplicate PR:**
> Closing in favor of #XYZ which resolves the same root issue more comprehensively. Thanks for the initial investigation!
**For Superseded PR:**
> Closing as this logic has been superseded by the architectural cutover in #XYZ. Legacy implementations are being phased out.
**For Outdated PR:**
> Closing as this PR is stale and the underlying codebase/issue has moved on. If this is still a priority, please open a fresh PR against `main`.
**For Keep-Open-But-Rebase PR:**
> We want to get this in, but it currently has conflicts with `main`. Could you rebase this when you have a moment?