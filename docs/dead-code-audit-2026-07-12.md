# Dead Code Audit — 2026-07-12

Periodic forensic audit (cron automation). Knip reports ~213 "unused files" repo-wide; most are false positives (Supabase Edge Functions, Remotion, Vercel API routes, skill assets, scripts). This pass targets **proof-verified dead `src/` code** plus one unused npm dependency.

## Executive Summary

| Metric | Count |
|--------|-------|
| Total candidates reviewed | 32 |
| Safe to remove now | **4 files** + **1 dependency** |
| Refactor / wire first | 1 (`useCoverEditPermission`) |
| External / ops confirmation needed | ~206 (knip framework orphans) |

**Expected benefits:** ~13 KB source removed, one fewer direct dependency (`@ai-sdk/openai`), clearer concierge voice architecture (single live path via `useConciergeConversationMode` + `VoiceButton`/`RealtimeVoiceButton`), reduced duplicate type surface (`channels.ts` vs `roleChannels.ts`).

**Prior passes already cleaned:** 18+ files from 2026-06-21 audit, 10 files from 2026-05-30 cleanup (billing hooks/providers, SearchBar, AddPlaceModal, egressLogger, test-only adapters, etc.).

## Audit Table (Implemented This Pass)

| ID | Category | File / Symbol | Why Dead | Proof | Impact | Action | Risk | External? |
|----|----------|---------------|----------|-------|--------|--------|------|-----------|
| DC-19 | Constants | `src/constants/messageTypes.ts` | Duplicate of inline union in `UnifiedMessage.type` | `rg messageTypes` → 0 imports | None | **Removed** | Low | N |
| DC-20 | Component | `ConciergeConversationMic.tsx` | Built for conversation mode but never mounted; `AIConciergeChat` uses `VoiceButton`/`RealtimeVoiceButton` | 0 external refs | None | **Removed** | Low | N |
| DC-21 | Hook | `useConciergeVoiceInput.ts` | Superseded by `useWebSpeechVoice` (dictation) + `useConciergeConversationMode` (hands-free STT) | 0 external refs; `concierge-stt` still live via conversation mode | None | **Removed** | Low | N |
| DC-22 | Types | `src/types/channels.ts` | Stale duplicate; live types in `types/roleChannels.ts` | 0 imports; `roleChannels.ts` used by 15+ files | None | **Removed** | Low | N |
| DC-23 | Dependency | `@ai-sdk/openai` | Direct import count = 0; realtime uses `ai` gateway + `@ai-sdk/react` | `rg @ai-sdk/openai` → 0 | Smaller lockfile | **Removed** | Low | N |

## Deferred (Not Removed)

| ID | Item | Reason |
|----|------|--------|
| DF-07 | `useCoverEditPermission.ts` | Orphan hook but mirrors live `can_edit_trip_cover` RPC; should be **wired** into cover-edit surfaces, not deleted |
| DF-08 | `src/lib/mcp/index.ts` + `tools/echo.ts` | **Live** — bundled by `mcpPlugin()` in `vite.config.ts` → `supabase/functions/mcp` |
| DF-09 | ~206 knip "unused files" (supabase/functions, remotion, api/, scripts/) | Framework entry points; require per-function ops verification |
| DF-10 | ~408 knip unused exports | Many are public API / test helpers / edge shared types; batch triage needed |
| DF-11 | Deprecated-but-live symbols (`useConciergeHistory`, `conciergeSessionStore`, `types/messaging.ts`) | Still imported; removal needs migration to canonical types |

## False Positive Traps Verified

| Pattern | Example | Verdict |
|---------|---------|---------|
| Vite plugin entry | `src/lib/mcp/**` | **Keep** — not imported in TS graph |
| Lazy routes | All `App.tsx` lazy imports | **Keep** — knip without config misses some |
| Demo mode parallel paths | `src/mockData/*`, `src/data/*` | **Keep** — intentional |
| Edge function invoke by name | `concierge-stt` | **Keep** — called from `useConciergeConversationMode` |
| Billing module | `src/billing/*` | **Keep** — 10+ consumers (stale knip_output.txt falsely flagged) |

## Cleanup Plan (Executed)

1. Delete DC-19 through DC-22 (no co-located tests)
2. Remove `@ai-sdk/openai` from `package.json`; `npm install`
3. Add `knip.json` entry points to reduce false positives on future runs
4. Run `npm run typecheck && npm run lint && npm run test:run && npm run build`

## Rollback

`git revert <commit-sha>` restores deleted files and dependency.
