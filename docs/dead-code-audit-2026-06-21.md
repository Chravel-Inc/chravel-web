# Dead Code Audit — 2026-06-21

Periodic forensic audit. Knip reports ~218 "unused files" repo-wide; most are false positives (Supabase Edge Functions, Remotion, Vercel API routes, scripts). This pass targets **proof-verified dead `src/` code only**.

## Executive Summary

| Metric | Count |
|--------|-------|
| Total candidates reviewed | 28 |
| Safe to remove now | 18 files (+ 7 co-located tests) |
| Refactor first | 0 |
| External confirmation needed | 210+ (knip framework orphans) |

**Expected benefits:** ~2,500 LOC removed, smaller mental surface for places/chat/privacy/membership, fewer orphan tests, no bundle impact (tree-shaken already).

## Audit Table (Implemented This Pass)

| ID | Category | File / Symbol | Why Dead | Proof | Impact | Action | Risk | External? |
|----|----------|---------------|----------|-------|--------|--------|------|-----------|
| DC-01 | Component | `AddPlaceModal.tsx` | LinksPanel slimmed; modal never wired | `rg AddPlaceModal` → comment only in LinksPanel | None | Remove | Low | N |
| DC-02 | Component | `SearchBar.tsx` | Superseded by LocationSearchBar / MediaSearchBar | Zero imports | None | Remove | Low | N |
| DC-03 | Hook | `usePlaceResolution.ts` | Only consumed by DC-01 | Single import from AddPlaceModal | None | Remove | Low | N |
| DC-04 | Hook | `useReducedMotion.ts` | HeroSection removed hook; test mock stale | Zero prod imports | None | Remove + fix test | Low | N |
| DC-05 | Util | `smartInputDetector.ts` | Only consumed by DC-01 | Single import from AddPlaceModal | None | Remove | Low | N |
| DC-06 | Service | `chatBroadcastService.ts` | Broadcast path never integrated in UI | Zero external refs | None | Remove | Low | N |
| DC-07 | Service | `privacyService.ts` | Privacy via `useTripPrivacyConfig` + types | Zero external refs | None | Remove | Low | N |
| DC-08 | Service | `tripMembershipService.ts` | Membership via hooks + `types/tripMembership` | Zero external refs | None | Remove | Low | N |
| DC-09 | Types | `types/voice.ts` | Voice types inlined elsewhere / unused | Zero imports | None | Remove | Low | N |
| DC-10 | Lib | `egressLogger.ts` | DevTools-only, never wired | Self + comment refs only | None | Remove | Low | N |
| DC-11 | Service | `calendarSyncService.ts` | Test-only | No prod imports | None | Remove + test | Low | N |
| DC-12 | Service | `chatUrlExtractor.ts` | Test-only | No prod imports | None | Remove + test | Low | N |
| DC-13 | Service | `tripContextAggregator.ts` | Documented but never wired | No prod imports | None | Remove + test | Low | N |
| DC-14 | Adapter | `messageAdapter.ts` | Test-only | No prod imports | None | Remove + test | Low | N |
| DC-15 | Adapter | `channelAdapter.ts` | Test-only | No prod imports | None | Remove + test | Low | N |
| DC-16 | Adapter | `calendarAdapter.ts` | Test-only | No prod imports | None | Remove + test | Low | N |
| DC-17 | Adapter | `accommodationAdapter.ts` | Test-only | No prod imports | None | Remove + test | Low | N |
| DC-18 | Types | `types/accommodations.ts` | Only used by DC-17 | Single dead import | None | Remove | Low | N |

## Deferred (Not Removed)

| ID | Item | Reason |
|----|------|--------|
| DF-01 | 200+ knip "unused files" (supabase/functions, remotion, api/) | Framework entry points; require per-function ops verification |
| DF-02 | 386 knip unused exports | Many are public API / test helpers; batch triage needed |
| DF-03 | `paymentAdapter.ts` | **Live** — used by paymentService + usePayments |
| DF-04 | `types/tripMembership.ts` | **Live** — used by useJoinRequests |
| DF-05 | `types/privacy.ts` | **Live** — used by CreateTripModal + useTripPrivacyConfig |
| DF-06 | `CONCIERGE_CONTEXT_ARCHITECTURE.md` | Stale doc referencing tripContextAggregator; update in follow-up |

## Rollback

`git revert <commit-sha>` restores all deleted files.
