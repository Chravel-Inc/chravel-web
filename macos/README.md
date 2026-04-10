# Chravel macOS (Modules 1-5 scaffold)

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
- Module 3 workspace hydration:
  - Chat repository protocol + Supabase adapter
  - Trip selection drives native chat history load
  - Mock chat repository fallback
- Module 4 chat loop hardening:
  - Native compose/send flow with optimistic UI updates
  - Message send endpoint support in Supabase adapter
- Module 5 realtime architecture:
  - `ChatRealtimeService` abstraction
  - `PollingChatRealtimeService` implementation
  - Coordinator-level stream consumption and merge strategy
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
# Prefer temporary shell scope or Keychain/launchctl for local token handling.
export CHRAVEL_SUPABASE_ACCESS_TOKEN="<user-access-token>"
```

If env vars are absent, the app falls back to mock session/trips/chat.

## Next module

- Replace polling implementation with websocket channel transport
- Add read receipts, typing indicators, and delivery status metadata
