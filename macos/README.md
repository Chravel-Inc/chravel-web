# Chravel macOS (Modules 1-2 scaffold)

This directory contains the native macOS desktop app foundation for Chravel.

## Current scope

- SwiftUI-native app shell (`NavigationSplitView` + sidebar + detail workspace)
- Core destination model for all parity modules:
  - Dashboard, Chat, Calendar, Tasks, Payments, Places, Media, Polls, Documents, AI Concierge
- Module 2 data skeleton:
  - Session bootstrap coordinator
  - Auth provider protocol + Supabase adapter
  - Trip repository protocol + Supabase REST adapter
  - Mock auth/trip providers for local development fallback
- Basic command menu + keyboard shortcuts (`⌘1`, `⌘2`, `⌘3`)
- Settings scene scaffold
- Lightweight telemetry via `OSLog`

## Build (macOS host)

```bash
cd macos
swift build
swift test
swift run ChravelMacApp
```

## Optional Supabase environment

Set these vars to point the macOS app to a live backend:

```bash
export CHRAVEL_SUPABASE_URL="https://<project-ref>.supabase.co"
export CHRAVEL_SUPABASE_ANON_KEY="<anon-key>"
export CHRAVEL_SUPABASE_ACCESS_TOKEN="<user-access-token>"
```

If env vars are absent, the app falls back to mock session/trips.

## Next module

- Real-time coordinator actor for chat and collaborative updates
- Native dashboard + trip workspace hydration per selected trip
