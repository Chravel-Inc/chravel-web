# Capacitor / iOS

## Status: STUB — native shell lives in `chravel-mobile` sister repo

This repository (`chravel-web`) is the **web / PWA shell**. The Capacitor v8 wrapper, the iOS Xcode project, the Android Gradle project, and all native plugins live in the **`chravel-mobile`** sister repo. See [`integrations/capacitor-mobile-bridge.md`](../integrations/capacitor-mobile-bridge.md) for the surface of this repo that bleeds into native concerns.

## What lives in THIS repo

- The actual React/Vite app that the Capacitor wrapper loads.
- The PWA service worker (`public/sw.js`) that runs in the web shell.
- iOS-aware control flow in client code:
  - `isInstalledApp()` detection (`src/utils/platformDetection.ts`).
  - System-browser OAuth open path (`src/utils/installedAuthBrowser.ts`, `src/hooks/useAuth.tsx:899-941`).
  - Universal Link return URLs.
  - Safe-storage fallback for sandboxed environments.
- App-Store-adjacent assets:
  - `appstore/` — App Store metadata, screenshots, marketing.
  - `playstore/` — Play Store metadata.
  - `ios-release/` — release scaffolding.
  - `macos/` — adjacent macOS assets.
- `.github/workflows/ios-release.yml` orchestrates the native release (delegates the build to `chravel-mobile`).
- Documentation under `docs/ios/` describing iOS feature behavior (companion to native code in `chravel-mobile`).

## What does NOT live in THIS repo

- `capacitor.config.ts` — not present (verified via `ls`).
- `ios/` directory — not present.
- `android/` directory — not present.
- Native plugins (camera, push, geolocation, etc.) — in `chravel-mobile`.
- Fastlane configuration — in `chravel-mobile`.

## Where to read next

- [`platform/pwa.md`](./pwa.md) — full PWA documentation.
- [`integrations/capacitor-mobile-bridge.md`](../integrations/capacitor-mobile-bridge.md) — Capacitor-aware code that lives here.
- [`docs/ios/`](../../ios/) — iOS feature guides.
- `chravel-mobile` repo — source of truth for the native shell.

## Source Refs

- `ls /home/user/chravel-web` — no `capacitor.config.ts`, `ios/`, or `android/` at SHA `1e833665`
- `src/utils/platformDetection.ts`, `src/utils/installedAuthBrowser.ts`
- `src/hooks/useAuth.tsx:899-941, 952-990`
- `.github/workflows/ios-release.yml`
- `appstore/`, `playstore/`, `ios-release/`, `macos/`, `docs/ios/`
