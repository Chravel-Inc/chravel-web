# Chravel macOS (Module 1 scaffold)

This directory contains the native macOS desktop app foundation for Chravel.

## Current scope

- SwiftUI-native app shell (`NavigationSplitView` + sidebar + detail workspace)
- Core destination model for all parity modules:
  - Dashboard, Chat, Calendar, Tasks, Payments, Places, Media, Polls, Documents, AI Concierge
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

## Next module

- Supabase auth/session wiring
- Repository layer for trip list and workspace loading
- Realtime coordinator actor for chat and collaborative updates
