# Concierge Controls Recovery — Build Provenance & Ship Notes

**Date:** 2026-07-11  
**Branch work:** `cursor/concierge-controls-recovery-52d3`  
**Do not rewrite July 9 fixes** (`6483f370d` / PR #798) — they are already on `main` and in production web.

## Build-provenance table

| Surface | Version/build | Commit or deployment SHA | Asset source | Contains latest fix? |
|---|---:|---|---|---|
| Local main (at branch cut) | git tip | `b5df5ae0c96549813d851b6998f4698558550435` | source tree | **Yes** (`6483f370d` ancestor) |
| Production `chravel.app` | `build-version=mrex8prk` (~2026-07-10 12:38 UTC); `x-deployment-id=13ba4fa0-2de7-447a-918b-dc13efee065f` | Exact git SHA not embedded in HTML; chunk `AIConciergeChat-BJZ3yrwT-mrex8prk.js` contains `header-search-btn`, `header-upload-btn`, `Concierge Chravel Agent`, `mint-realtime-token`, `ai-gateway.vercel` | Remote hashed Vite assets behind Cloudflare | **Yes** (marker evidence) |
| iOS / TestFlight | **Human required** — read NativeSettings `buildId` / deploy SHA + App Store Connect build # | Unknown until device/EAS check | `Chravel-Inc/chravel-mobile` Expo WebView (`window.ChravelNative`). Bridge auth callbacks target `https://chravel.app` — remote load is the intended production path; bundled offline `dist` would require a native rebuild | **Unknown until verified on device** |
| Android | No `android/` in `chravel-web` | N/A in this repo | Play / wrapper via `chravel-mobile` if applicable | Unknown |

### How to verify a TestFlight binary

1. Open the failing build → Profile / Native Settings → record app version + `buildId` (and deploy SHA prefix if shown).
2. Safari Web Inspector on device → Network → confirm JS filenames include `mrex8prk` (or newer post-CSP ship) and DOM has `[data-testid="header-search-btn"]`.
3. In `chravel-mobile`, confirm WebView `source` is `https://chravel.app` vs a frozen bundle pinned at EAS build time.

## Reproducibility matrix (agent environment)

| Surface | Search | Upload | Text focus | Keyboard | Dictation | Send | Realtime |
|---|---|---|---|---|---|---|---|
| Desktop (Vitest lean controls) | Pass (open/stay/close) | Pass (label↔input) | N/A headless focus | N/A | Toggle wired | Disabled clarity | Lazy-mount start |
| Desktop Chrome/Safari manual | Human | Human | Human | Human | Human | Human | Human — CSP was blocking gateway WS |
| iPhone Safari | Human | Human | Human | Human | Human | Human | Human |
| Installed iOS PWA | Human | Human | Human | Human | Human | Human | Human |
| iOS Capacitor/TestFlight (`chravel-mobile`) | Human | Human | Human | Human | Human | Human | Human — DoD gate |
| Android Chrome / native wrapper | Human | Human | Human | Human | Human | Human | Human |

**Layer classification guidance:** use `document.elementFromPoint(x,y)` at each circled control. If the top element is not the button/textarea, treat as overlay/hit-test (Phase 1). If the handler fires but Search closes immediately, treat as stale `isActive` (should already be fixed in `mrex8prk`). If overlay opens then WS fails, treat as CSP/Gateway/secrets (Phase 3).

## Residual defects fixed in this recovery

1. **Meta CSP gap (realtime):** `index.html` `connect-src` lacked `https://ai-gateway.vercel.sh` and `wss://ai-gateway.vercel.sh`. Live production was serving meta CSP only (no HTTP CSP header observed), so gateway WebSockets could be blocked after a successful mint.
2. **Dictation vs realtime mic contention:** `onSessionStart` now calls `stopDictation()` before starting realtime.
3. **Composer affordance / Send clarity:** placeholder `Ask anything about this trip…`; send button `aria-disabled` + title + stronger `disabled:opacity-40`.
4. **Hit-test hardening:** composer rail `isolate` + `data-testid`; message scroller `z-0`; inactive mobile tab panes `pointerEvents: 'none'` + `aria-hidden`.

## External services (verified / human)

| Check | Status |
|---|---|
| Feature flag `concierge_realtime_voice` | **Enabled** (100% rollout) in project `jmjiyekmxwsxkfnqwyaa` |
| `concierge_conversation_mode` | Enabled |
| Edge functions `mint-realtime-token` / `realtime-voice-session` / `execute-concierge-tool` | Deployed (versions 17 / 21 / 515 as of audit) |
| `AI_GATEWAY_API_KEY` Supabase secret | **Human confirm** in Dashboard → Edge Functions → Secrets |
| Vercel production git SHA | **Human** (Vercel MCP needsAuth); use dashboard or PostHog `deploy_sha` after ship |
| Physical iPhone TestFlight QA | **Human — required for DoD** |

## Deployment plan

1. Merge this branch → deploy web (`chravel.app`).
2. Confirm new `build-version` meta ≠ `mrex8prk` and HTML CSP includes `ai-gateway.vercel.sh`.
3. Soft-kill TestFlight app if it loads remote URL; if EAS bundles `dist`, rebuild + bump build number + upload.
4. Run physical QA checklist (search categories, attachments, keyboard, dictation permissions, realtime multi-turn ×5, stop releases mic).

## Rollback

- Web: revert to previous production deployment / prior commit; CSP-only revert is a one-file change to `index.html`.
- TestFlight: previous build in App Store Connect.
- No database migration in this recovery.
