# Polls

## Purpose
Trip-scoped voting: create → cast vote → live tally → close → system message in chat.

## Entry Points
| File | Purpose |
|---|---|
| `src/hooks/useTripPolls.ts` | Realtime poll list + mutations |
| `src/services/pollStorageService.ts` | Per-trip poll storage helpers |

## Data Flow
1. Admin creates poll (`useTripPolls.create`) → DB insert into poll table.
2. Members vote → upsert vote row.
3. `useTripPolls` subscribes via Supabase Realtime (`postgres_changes`) to refresh tally.
4. On close: `systemMessageService.emit({ type: 'poll_close', ... })` → Stream channel `sendMessage({ silent: true, skip_push: true })` (memory #29).
5. `SystemMessageBubble` renders the closure inline in chat.

## State Touched
- **TanStack Query keys:** `tripKeys.polls(tripId, isDemoMode?)` = `['tripPolls', tripId, isDemoMode]`
- **Cache config:** `staleTime: 60s, gcTime: 5m, refetchOnWindowFocus: true` (`src/lib/queryKeys.ts:107-112`)

## Tables & RLS
Poll-related tables (names from `architecture/04-data-model-er.md` Cluster 1/2): the `tripKeys.polls` query key is `'tripPolls'` — the underlying table follows the trip-scoped pattern (read: trip members, write: members for votes / admins for poll definition).

## Edge Functions Used
None directly; polls are pure CRUD on the DB. System message emission happens client-side via `systemMessageService.ts`.

## Demo vs Authenticated
- Demo polls are mocked; vote state is local-only.
- Poll close in demo does not emit a Stream system message.

## Mobile / PWA / Capacitor considerations
- Vote button is a touch target — ensure ≥ 44 px tap area.
- Realtime tally must batch (don't re-render on every vote — debounce 200ms).

## Known Risks
- Memory #29: poll close → Stream silent system message. Wiring a new poll-state transition (e.g., "poll archived") must follow the same pattern.
- Memory #20: poll realtime subscription must filter by `trip_id`. Unfiltered subscriptions receive ALL global events.
- Memory #27: in mock-ID trips, poll behavior may differ from consumer trips — verify tier gates.

## Source Refs
- `src/hooks/useTripPolls.ts`
- `src/services/pollStorageService.ts`
- `src/services/systemMessageService.ts`
- `src/lib/queryKeys.ts:32-35`
- `agent_memory.jsonl` #20, #27, #29
