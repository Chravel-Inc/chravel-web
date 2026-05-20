## Make the Notifications permission toggle honest

### Root cause
The Permissions Center toggle calls `Notification.requestPermission()`. On the web, **once a user has denied notifications at the browser level, no JS can re-prompt or grant it** — the browser returns `denied` immediately. The same is true for revoking a granted permission. That's why flipping the toggle just produces the "enable in your browser settings" toast with no real effect.

So the toggle is *technically* wired up (it works the first time, when state is `prompt`), but for users whose state is already `denied` or `granted`, it can't do anything from the app. The current UI hides that limitation behind a switch that looks interactive.

### Decision
Keep the Permissions Center (users still need to see status and trigger first-time prompts), but make the affordance match what's actually possible per state. No false promises.

### Changes in `src/components/consumer/ConsumerPermissionsSection.tsx`

Per-card UI based on `state`:

- **`prompt` (never asked):** Keep the Switch. Toggling on calls `requestPermission` → browser prompt appears. This is the only case where the app can actually flip the bit. Works today, no change.
- **`granted`:** Replace the Switch with a static "Granted" badge + a small "Manage in browser settings" link/button. Removes the misleading off-toggle that just shows a "revoke in Settings" toast.
- **`denied`:** Replace the Switch with a "Blocked by your browser" badge + a "How to enable" button that:
  - On installed PWA / native shell (`isInstalledApp()`): calls `openNotificationSettingsIfAvailable()` / `openAppSettings()` (already implemented in `webPermissions.ts`).
  - On a regular browser tab: opens a small inline help panel with 2-line, browser-specific steps (Chrome/Safari/Firefox/Edge) — detect via `navigator.userAgent`. Include the site-settings URL fragment for Chromium (`chrome://settings/content/siteDetails?site=<origin>`) where applicable, with a copy-to-clipboard fallback since `chrome://` URLs can't be opened by JS.
- **`unavailable` / `not_applicable`:** Keep the Switch disabled (already correct).

Add a one-line explainer under the Permissions Center subtitle:
> "Browsers only let apps request permissions the first time. After that, changes must be made in your browser or device settings."

### Files changed
- `src/components/consumer/ConsumerPermissionsSection.tsx` — per-state rendering, browser-detection helper for instructions, inline help panel.

No changes to `webPermissions.ts` (its API already supports this). No DB/RLS/edge-function impact.

### Out of scope
- Adding native push prompting on iOS PWA (separate workstream, requires service-worker subscription flow).
- Per-trip notification preferences — those live under Notifications, not Permissions, and aren't related to the OS/browser-level toggle.