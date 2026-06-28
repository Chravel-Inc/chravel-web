# Dead Code Audit — 2026-06-28

Periodic forensic audit. Knip reports ~210 "unused files" repo-wide; most are false positives (Supabase Edge Functions, Remotion, Vercel API routes, scripts). This pass targets **proof-verified dead `src/` code only**.

## Executive Summary

| Metric | Count |
|--------|-------|
| Total candidates reviewed | 32 |
| Safe to remove now | 19 (10 files + 7 co-located tests + 2 export trims) |
| Refactor first | 1 (`errorTracking` duplicate — deferred) |
| External confirmation needed | 210+ (knip framework/orphan entries) |

**Expected benefits:** ~1,800 LOC removed, fewer duplicate type sources (`channels.ts`, `media.ts`, `ai.ts`), no bundle impact (tree-shaken already), clearer join-request helper surface, one fewer unused font dependency.

## Audit Table (Implemented This Pass)

| ID | Category | File / Symbol | Why Dead | Proof | Impact | Action | Risk | External? |
|----|----------|---------------|----------|-------|--------|--------|------|-----------|
| DC-01 | Constants | `constants/messageTypes.ts` | Never imported | `rg messageTypes` → self only | None | Remove | Low | N |
| DC-02 | Hook | `useConciergeVoiceInput.ts` | Superseded by `useConciergeVoice` + `useWebSpeechVoice` | `rg useConciergeVoiceInput` → self only | None | Remove | Low | N |
| DC-03 | Types | `types/channels.ts` | Duplicate of `types/roleChannels.ts` | `rg types/channels` → 0 imports | None | Remove | Low | N |
| DC-04 | Types | `types/ai.ts` | Barrel-only, zero consumers | `rg types/ai` → 0 imports | None | Remove | Low | N |
| DC-05 | Types | `types/media.ts` | Duplicate of `types/pro.ts` MediaMetadata | `rg types/media` → 0 imports | None | Remove | Low | N |
| DC-06 | Util | `utils/coverImageStyle.ts` | Test-only | `rg coverImageStyle` → test only | None | Remove + test | Low | N |
| DC-07 | Component | `SubscriptionPaywall.tsx` | Never mounted; billing uses UpgradeModal | `rg SubscriptionPaywall` → self + test | None | Remove + test | Low | N |
| DC-08 | Component | `NativePageTransition.tsx` | Exported but never mounted | `rg NativePageTransition` → barrel only | None | Remove + barrel | Low | N |
| DC-09 | Adapter | `messageMapper.ts` | Superseded by `streamMessageViewModel.ts` | Prod: comment only; test-only import | None | Remove + test | Low | N |
| DC-10 | Hook | `useDashboardJoinRequests()` | Forbidden per contract; zero callers | `rg useDashboardJoinRequests(` → def only | None | Remove hook body | Low | N |
| DC-11 | Exports | `getSponsoredRecommendations`, `getRecommendationById` | Never called | `rg` → index.ts only | None | Remove exports | Low | N |
| DC-12 | Exports | `chatAttachment.ts` dead types | Only `RichLinkPreview` consumed | `rg RichChatAttachment` → self | None | Trim file | Low | N |
| DC-13 | Exports | `isSuperAdmin`, `hasSuperAdminRole` | Zero external importers | `useSuperAdmin` hook is canonical | None | Unexport | Low | N |
| DC-14 | Dep | `@fontsource/fira-sans` | Never imported in CSS/TS | `rg fira-sans` → 0 | Smaller install | Remove dep | Low | N |
| DC-15 | Barrel | `types/index.ts` | Zero consumers after direct import fix | `rg from '@/types'` → 0 | None | Remove | Low | N |

## Deferred

| ID | Item | Reason |
|----|------|--------|
| DF-01 | 210+ knip unused files (edge functions, remotion, api/) | Framework entry points; per-function ops verification |
| DF-02 | 394 knip unused exports | Many public API / test helpers; batch triage |
| DF-03 | `utils/errorTracking.ts` vs `services/errorTracking.ts` | Both have live prod imports; consolidation needs regression pass |
| DF-04 | Skipped integration test suites | Test debt, not prod dead code |
| DF-05 | `NativeCompactHeader`, `NativePillSegment` | Defined but unused; low gain, separate pass |

## Rollback

`git revert <commit-sha>` restores all deleted files.
