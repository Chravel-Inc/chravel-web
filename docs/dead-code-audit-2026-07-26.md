# Dead Code Audit — 2026-07-26

Periodic forensic audit (batch 3). Prior passes: batch 1 (#845, 2026-07-22), batch 2 (same PR), file audit 2026-06-21.

## Executive Summary

| Metric | Count |
|--------|-------|
| Total candidates reviewed | 24 |
| Safe to remove now (implemented) | 14 |
| Refactor first | 2 |
| External / ops confirmation | 200+ (knip framework orphans) |

**Expected benefits:** ~1,800 LOC removed, smaller places/telemetry/archive surface, fewer unused exports, no UX change (tree-shaken paths only).

## Implemented This Pass (batch 3)

| ID | Category | File / Symbol | Why Dead | Proof | Risk |
|----|----------|---------------|----------|-------|------|
| DC-19 | Service | `archiveService` dead methods | Never called outside file | `rg` — only `archiveTrip`, `restoreTrip`, `hideTrip`, `unhideTrip`, `getArchivedTrips`, `getHiddenTrips`, `deleteTripForMe`, `cleanupTripStorage` have consumers | Low |
| DC-20 | Service | `mediaAITagging` taggers | Upload pipeline never wired | Only `filterMediaByAITags` imported (`UnifiedMediaHub`) | Low |
| DC-21 | Telemetry | 8 unused event groups | Zero imports | `placeEvents`, `pollEvents`, `exportEvents`, `recommendationEvents`, `shareExtensionEvents`, `conciergeEvents`, `subscriptionEvents`, `notificationEvents` | Low |
| DC-22 | Lib | `peekPollDeepLink` | Never called | `rg` — `set`/`consume`/`request` used | Low |
| DC-23 | Lib | `stripInlineMarkdown` | Never called | `renderInlineMarkdown` used in UseCase pages | Low |
| DC-24 | Hook | `useReorderTripBaseCamps` | Never imported | `rg` zero consumers | Low |
| DC-25 | Hook | `checkIsSuperAdmin`, perf metric exports | Never imported | `useSuperAdmin` / `usePerformanceMonitor` kept | Low |
| DC-26 | Service | `googlePlacesNew` dead API | Prod uses `autocomplete` + `generateSessionToken` only | `LocationSearchBar` sole importer | Low |
| DC-27 | Service | `openStreetMapFallback.ts` | Only consumed by removed googlePlaces paths | Deleted with tests | Low |

## Deferred

| ID | Item | Reason |
|----|------|--------|
| DF-07 | `useDashboardJoinRequests` hook | Dead in prod but types + `getJoinRequestDisplayLabel` live; tests + guardrails reference hook |
| DF-08 | Duplicate `isPinnedMessage` | Behavior divergence — consolidation is a bug fix, not dead-code removal |
| DF-09 | 200+ knip unused files (api/, remotion/, scripts/) | Framework entry points |
| DF-10 | `useGradualFeature*` | Staged rollout infra; test-covered |

## Rollback

`git revert <commit-sha>` restores all deleted code.
