# Capacitor Mobile Bridge

## Status: stub

**The Capacitor native shell does NOT live in this repo.** It lives in the `chravel-mobile` sister repo. This repository is the web/PWA shell — the same React build that the Capacitor wrapper consumes.

## Capacitor surface visible from THIS repo

Some Capacitor-shell awareness bleeds into the web code:

| Concern | File | What it does |
|---|---|---|
| Installed-app detection | `src/utils/platformDetection.ts` (`isInstalledApp()`) | Detects Capacitor / PWA shell vs plain browser |
| OAuth in installed shells | `src/hooks/useAuth.tsx:899-941, 952-990` | Opens system browser via `@capacitor/browser` (when registered) instead of in-WebView (Google rejects embedded WebView OAuth) |
| OAuth return URL | `src/hooks/useAuth.tsx:907-908, 957-958` | Universal Link `https://chravel.app/auth-callback` for the iOS shell to intercept |
| Installed-auth browser opener | `src/utils/installedAuthBrowser.ts` | Wraps `@capacitor/browser` open |
| Localstorage safety | `src/integrations/supabase/client.ts:8-26` | Safe-storage shim when `localStorage` is unavailable in sandboxed previews |
| Service worker visibility refresh | `src/App.tsx:226-240` | Silent SW update check on visibility change (native-app-style) |
| Chunk-load auto-recovery | `src/App.tsx:243-298` | Clears caches + reloads on dynamic-import failure |

## What does NOT live here
- No `capacitor.config.ts` (not in this repo).
- No `ios/` Xcode project.
- No `android/` Android project.
- No native plugins (camera, push, geolocation native bridge, etc.).
- No Fastlane / TestFlight scripts beyond `.github/workflows/ios-release.yml` orchestration.

All of those live in `chravel-mobile`.

## Cross-link
- This repo's `docs/ios/` directory documents iOS features (companion documentation; the actual native code is in `chravel-mobile`).
- `docs/mobile/` has additional mobile/PWA notes.
- The `appstore/` and `playstore/` directories here hold store metadata + screenshot scripts (`npm run screenshots:appstore`).

## Source Refs
- `src/utils/platformDetection.ts`
- `src/utils/installedAuthBrowser.ts`
- `src/hooks/useAuth.tsx:899-990`
- `src/integrations/supabase/client.ts:8-26`
- `src/App.tsx:226-298`
- `docs/ios/`, `docs/mobile/`
- `chravel-mobile` sister repo (external)
