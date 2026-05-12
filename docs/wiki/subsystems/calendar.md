# Calendar

## Purpose
Trip calendar events with reminders, agendas, and bi-directional Google Calendar sync. Idempotent dedupe by external event ID (memory #15).

## Entry Points
| Component / Hook | File | Purpose |
|---|---|---|
| Calendar feature module | `src/features/calendar/` | Components, hooks, utils |
| `useCalendarRealtime` | `src/features/calendar/hooks/useCalendarRealtime.ts` | Realtime updates |
| `calendarService` | `src/services/calendarService.ts` | CRUD |
| `calendarSync` | `src/services/calendarSync.ts` | External sync |
| `calendarStorageService` | `src/services/calendarStorageService.ts` | Offline cache |
| `calendarOfflineQueue` | `src/services/calendarOfflineQueue.ts` | Offline mutation queue |

## Data Flow
1. User adds event in trip calendar tab.
2. `calendarService.create()` writes to `trip_events` (or `synced_calendar_events` for connected calendars).
3. `useCalendarRealtime` picks up the change via Supabase Realtime, invalidates `tripKeys.calendar(tripId)`.
4. If user has a Google Calendar connection (`calendar_connections`), `calendar-sync` edge function pushes the event upstream.
5. Webhook from Google triggers `calendar-sync` again to reconcile — deduped by external ID + sync token (memory #15).

## State Touched
- **TanStack Query keys:** `tripKeys.calendar(tripId)` = `['calendarEvents', tripId]`
- **Cache config:** `staleTime: 60s, gcTime: 10m, refetchOnWindowFocus: true` (`src/lib/queryKeys.ts:94-98`)
- **Local:** offline mutation queue when offline

## Tables & RLS
| Table | Read | Write | Notes |
|---|---|---|---|
| `trip_events` | trip members | members + admins | |
| `synced_calendar_events` | trip members + owner | sync-service-role only | Deduped by external_event_id |
| `calendar_reminders` | trip members | self / admins | |
| `calendar_integrations` | self | self | OAuth refresh tokens stored encrypted |
| `calendar_connections` | self | self | Per-user provider link |
| `event_reminders` | trip members | admins | Cron-fired |

## Edge Functions Used
- `calendar-sync` — bi-directional sync with Google Calendar
- `event-reminders` — cron-fired reminder dispatch (`verify_jwt = false`, must use `cronGuard`)

## Demo vs Authenticated
- Demo calendar reads mocked events from `src/mockData/`.
- `useCalendarRealtime` short-circuits in demo (no Supabase subscription).
- External calendar sync disabled in demo.

## Mobile / PWA / Capacitor considerations
- Offline queue ensures mutations survive flaky connections.
- Reminder push notifications via `send-push` / `web-push-send`.
- Local timezone awareness: each trip has a `trip_timezones` entry.

## Known Risks
- **Idempotency required** (memory #9, #15). Any new external calendar provider integration must dedupe by external event ID, not insert order.
- **`event-reminders` is cron-fired and `verify_jwt = false`.** Must validate `CRON_SECRET` via `cronGuard.ts` (fail-closed). Memory: `DEBUG_PATTERNS.md` #4.
- Recurring event handling is delicate — moves an instance vs the series.
- Drift watchlist: `synced_calendar_events.external_event_id` vs TS interface field. Verify in `RISKS.md`.

## Source Refs
- `src/features/calendar/` — feature module
- `src/services/calendarService.ts`, `calendarSync.ts`, `calendarStorageService.ts`, `calendarOfflineQueue.ts`
- `supabase/functions/calendar-sync/`, `supabase/functions/event-reminders/`
- `src/lib/queryKeys.ts:27` — query key
- `agent_memory.jsonl` #9, #15
- `docs/ACTIVE/GOOGLE_MAPS_PLACES_INTEGRATION.md` (adjacent integration notes)
