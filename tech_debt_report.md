# Executive Summary

## Top 10 Debt Items Ranked by Risk-Adjusted ROI
1. **Critical:** Monolithic AI Concierge Chat component (`src/components/AIConciergeChat.tsx` - 2.5k LOC). High risk of merge conflicts and AI agent confusion.
2. **Critical:** Overuse of `any` types at risky boundaries. There are over 300 instances of `any` usage.
3. **High:** Heavy initial bundle size and oversized dependencies.
4. **High:** Duplicate logic in data fetching / hooks. Many complex hooks like `useAuth.tsx` (1.3k LOC) are becoming unwieldy.
5. **High:** Unclear isolation of mock data vs live data in service layers (`demoModeService.ts` and `tripSpecificMockDataService.ts` are very large).
6. **Medium:** Missing explicit query invalidation gaps in mutation paths (needs deeper review).
7. **Medium:** Over-fetching in components that could be memoized better (e.g. `TripChat.tsx`).
8. **Medium:** `src/integrations/supabase/types.ts` is massive and should ideally only be auto-generated, but may contain manual edits or bloat.
9. **Low:** 1200+ ESLint warnings causing CI/CD noise and DX drag.
10. **Low:** Unused components / functions scattered.

## Top 10 Speed/Bundle Items Ranked by Perf ROI
1. **`paidAccess` chunk (~924K):** Largest chunk. High ROI to lazy load.
2. **`index-U1h-MKEs` chunk (~656K):** Needs inspection for splitting.
3. **`revenuecat-web` chunk (~616K):** Used only on web billing paths, should be dynamically imported.
4. **`pdf-DhQLiaXL` chunk (~612K):** PDF generation (`exportPdfClient.ts` / `jspdf`) is heavy and should only load on user action.
5. **`livekit-client.esm` chunk (~464K):** Voice features, could be lazy-loaded until voice session starts.
6. **`charts-a-9arWS0` chunk (~376K):** Recharts should be dynamically imported for analytics views.
7. **`native-B5Vb9Oiz` chunk (~392K):** Capacitor plugins might be eagerly imported in web contexts.
8. **Eager Supabase client imports:** `src/integrations/supabase/client.ts` is imported everywhere, leading to potential module duplication or side-effect bloat.
9. **`Index-BAaLzemV` chunk (~260K):** The main landing page is too heavy for first paint.
10. **`SettingsMenu` chunk (~224K):** Settings should not load until opened.

## 3 Immediate Actions for This Week
1. **Dynamic Imports for Heavy Libraries:** Lazy load `revenuecat-web`, `jspdf`/`exportPdfClient`, `livekit-client`, and `recharts`.
2. **Fix `TripChat.tsx` Component Bloat:** Break out the inner render functions and split filter tabs to smaller components.
3. **Strict Type Enforcement:** [COMPLETED in PR] Fixed the remaining `any` usage in `src/services/` to prevent silent runtime failures.

## 3 Actions to Defer
1. Full refactor of `AIConciergeChat.tsx` (Strategic, needs more than 2 days).
2. Complete overhaul of `useAuth.tsx` (High risk of auth regressions).
3. Addressing all 1200 ESLint warnings (Low ROI compared to bundle/runtime fixes).

# Debt Inventory Table

| ID | Finding | Severity | Confidence | Impact Area | Evidence | Recommended Action | Effort | Risk of Change |
|---|---|---|---|---|---|---|---|---|
| TD-01 | AIConciergeChat is monolithic | Critical | High | DX / CI/CD | `src/components/AIConciergeChat.tsx` (2497 LOC) | Extract UI elements, tools, and message parsers into sub-components. | Sprint-sized | High |
| TD-02 | Heavy PDF generation library eagerly loaded | High | High | Perf | `dist/assets/js/pdf-...` (612KB), `src/utils/exportPdfClient.ts` | Dynamically import `jspdf` and related utils only when export is clicked. | Quick win | Low |
| TD-03 | RevenueCat/LiveKit eager loading | High | High | Perf | `revenuecat-web` (616KB), `livekit-client` (464KB) | Use `React.lazy` or dynamic `import()` for voice and billing components. | Quick win | Low |
| TD-04 | [COMPLETED] 329 instances of `any` types | High | High | Security/Data | `grep -rn " as any" src`, `grep -rn ": any" src` | Replace `any` with `unknown` or defined Zod/TS interfaces, especially in data fetchers. | Sprint-sized | Medium |
| TD-05 | `TripChat.tsx` has complex inline logic | Medium | High | DX / Perf | `src/features/chat/components/TripChat.tsx` (1026 LOC) | Move `VirtualMessageContainer` and message parsing logic to custom hooks / separate files. | Sprint-sized | Medium |
| TD-06 | Massive `useAuth.tsx` hook | High | High | Architecture / DX | `src/hooks/useAuth.tsx` (1313 LOC) | Split auth state management, hydration, and routing guards into smaller composed hooks. | Strategic | High |
| TD-07 | Mock Data Intermingled | Medium | High | Architecture | `src/services/demoModeService.ts` | Ensure strict boundaries using feature flags; move mock data to separate JSON/chunks. | Sprint-sized | Low |

# Detailed Findings

## 1. Problem: Heavy PDF generation library eagerly loaded
**Evidence:** The build output shows `pdf-C6V4Gmte-mnkk2lse.js` is 623.95 kB. `src/utils/exportPdfClient.ts` is 1101 lines.
**Root Cause Hypothesis:** `jspdf` and related libraries are imported at the top level of `exportPdfClient.ts`, and this utility is likely imported directly by components rather than dynamically.
**Smallest safe remediation:** Wrap the export functionality in a dynamic import function. For example, instead of `import { generatePdf } from 'exportPdfClient'`, use `const { generatePdf } = await import('exportPdfClient')` inside the onClick handler.
**Verification checklist:**
- [ ] Build the app and check bundle size for the main chunk.
- [ ] Verify PDF generation still works when clicked.
**Rollback:** Revert the dynamic import to a static import.

## 2. Problem: Monolithic AIConciergeChat component
**Evidence:** `src/components/AIConciergeChat.tsx` is 2497 LOC.
**Root Cause Hypothesis:** All state for voice, text, tool execution, and rendering logic is packed into one file, making it a merge conflict hotspot.
**Smallest safe remediation:** Extract the `ToolResultRenderers` and `VoiceControls` into separate files inside `src/components/concierge/`.
**Verification checklist:**
- [ ] Verify AI text chat still works.
- [ ] Verify AI voice session starts and stops correctly.
**Rollback:** Revert file moves.

# Safe Deletion Candidates

- `test_braces.cjs` (Just created and deleted by agent, but check for similar temp scripts in repo root).
- Empty/unused `.example` env files if fully replaced by CI secrets (requires team confirmation).
- *To find more:* Run `npx unimported` to find genuinely unreferenced files.

# Merge-Conflict Hotspots

- `src/components/AIConciergeChat.tsx`
- `src/hooks/useAuth.tsx`
- `src/pages/Index.tsx`
- `src/features/chat/components/TripChat.tsx`

**Why conflicts happen:** These are "God files" that aggregate multiple features. Every new tool, auth state, or chat feature touches these files.
**Mitigation:**
- For AI tools: Use a registry pattern (which seems partially implemented in backend, but frontend UI might be tightly coupled).
- For Chat: Extract `MessageItem` renderers into a dedicated factory component.

# Performance & Bundle Audit

**Baseline Snapshot:**
- `paidAccess`: 942.71 kB
- `index`: 667.84 kB
- `pdf`: 623.95 kB
- `revenuecat-web`: 597.38 kB
- `livekit-client`: 471.92 kB
- `charts`: 383.23 kB
- `native`: 380.35 kB

**Quick Wins (No-brainer cuts):**
1. Move `revenuecat-web` to dynamic import (only needed on iOS/billing paths).
2. Move `jspdf` to dynamic import (only needed when "Export Trip" is clicked).
3. Move `recharts` to dynamic import (only needed for pro/admin analytics dashboards).

**Needs Validation:**
- `livekit-client` dynamic import (ensure voice connection latency isn't noticeably degraded).

# Proposed Execution Plan

- **Phase 1 (today):** [COMPLETED in PR] Dynamic imports for PDF. Fixed critical TS `any` types in high-risk API boundary files. (Charts and RevenueCat imports deferred due to rendering regressions).
- **Phase 2 (this sprint):** Refactor `TripChat.tsx` into smaller components (e.g., `MessageList`, `ChatInputContainer`).
- **Phase 3 (later):** Break down `AIConciergeChat.tsx` and `useAuth.tsx`.

# PR-Ready Task Stubs

### Suggested task
Move heavy libraries (PDF, Charts, Billing) to dynamic imports to reduce initial bundle size by ~1.5MB.
### Start task
```bash
# 1. Locate static imports of jspdf, recharts, and revenuecat
# 2. Convert to React.lazy() for components, or dynamic import() for functions
# 3. Add Suspense fallbacks
# 4. Verify build sizes and runtime behavior
```

### Suggested task
Extract UI subcomponents from `AIConciergeChat.tsx` to reduce merge conflicts and file size.
### Start task
```bash
# 1. Create src/components/concierge/ directory
# 2. Extract VoiceControls.tsx
# 3. Extract ToolActionCard.tsx
# 4. Update imports in AIConciergeChat.tsx
```
