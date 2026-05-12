# Tasks

## Purpose
Assignable trip tasks with status, due dates, and per-event variants. Consumer trips, pro trips, and events all surface tasks under different permission models (memory #8).

## Entry Points
| File | Purpose |
|---|---|
| `src/hooks/useTripTasks.ts` | Trip tasks with realtime |
| `src/hooks/useEventTasks.ts` | Event-specific tasks |
| `src/services/taskStorageService.ts` | Storage helpers |
| Trip tasks tab UI under `src/components/trip/` | Renderer |

## Data Flow
1. User creates task in trip → `useTripTasks.create` → DB insert into `trip_tasks`.
2. Assignment: `task_assignments` row links user → task.
3. Status updates write to `task_status` / `trip_task_status`.
4. `useTripTasks` subscribes via Supabase Realtime.
5. Task complete → `systemMessageService.emit({ type: 'task_complete' })` → silent Stream message.

## State Touched
- **TanStack Query keys:** `tripKeys.tasks(tripId, isDemoMode?)` = `['tripTasks', tripId, isDemoMode]`
- **Cache config:** `staleTime: 30s, gcTime: 5m, refetchOnWindowFocus: true` (`src/lib/queryKeys.ts:101-105`)

## Tables & RLS
| Table | Read | Write | Notes |
|---|---|---|---|
| `trip_tasks` | trip members | members (consumer), role-gated (pro), organizer-only (event) | Memory #8 |
| `task_assignments` | trip members | task creator + assignee | |
| `task_status` / `trip_task_status` | trip members | assignee + admins | |
| `event_tasks` | event members | organizer | |

## Edge Functions Used
None directly. Task mutations are client → Supabase.

## Demo vs Authenticated
- Demo tasks are mocked.
- Task complete in demo does not emit Stream system message.

## Mobile / PWA / Capacitor considerations
- Task list virtualization (`@tanstack/react-virtual`) for large trips.
- Swipe gestures for complete/snooze.
- Task assignment must propagate to push notification (`notificationContentBuilder.ts`) for assignee.

## Known Risks
- Memory #8: **permission model varies by trip type.** A shared `useTripTasks` mutation hook serving multiple trip types must consult the trip-type-aware permission guard.
- Memory #20: realtime must filter by `trip_id`.
- Lineup "replace import" can hard-delete data on transient insert failures (`DEBUG_PATTERNS.md`) — relevant when bulk-importing tasks.

## Source Refs
- `src/hooks/useTripTasks.ts`, `useEventTasks.ts`
- `src/services/taskStorageService.ts`
- `src/services/systemMessageService.ts`
- `src/lib/queryKeys.ts:28-31`
- `agent_memory.jsonl` #8, #20, #29
- `DEBUG_PATTERNS.md` — Lineup "replace import" hard-delete
