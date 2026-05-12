# Events & Viral Loop

## Purpose
Public-facing event surface that converts guests into authenticated users. Event organizers run agenda + lineup + RSVPs + Q&A; attendees can RSVP, ask, and convert to full trip members.

## Entry Points
| File | Purpose |
|---|---|
| `src/pages/EventDetail.tsx` | Desktop event page |
| `src/pages/MobileEventDetail.tsx` | Mobile event page |
| `src/hooks/useEventAdmin.ts` | Organizer checks |
| `src/hooks/useEventPermissions.ts` | Permission gates |
| `src/hooks/useEventAgenda.ts`, `useEventAgendaFiles.ts` | Agenda |
| `src/hooks/useEventLineup.ts`, `useEventLineupFiles.ts` | Lineup |
| `src/hooks/useEventTasks.ts` | Tasks |
| `src/hooks/useEventTabSettings.ts` | Per-event tab visibility |
| `src/pages/TripPreview.tsx`, `JoinTrip.tsx`, `InviteSlugRedirect.tsx` | Viral path |

## Routes (from `architecture/02-routing.md`)
- `/event/:eventId` — public event page (guests can render w/o auth)
- `/t/:tripId` and `/trip/:tripId/preview` — preview surface for any trip
- `/join/:token` — invite token landing
- `/j/:token` — short-link redirect to `/join/:token`
- `/accept-invite/:token` — org invite

## Viral loop

```
Share link (organizer)
  ↓
/event/:eventId  (guest renders, no auth required)
  ↓
RSVP / "Join chat" CTA
  ↓
/auth?returnTo=/event/:eventId  (or /join/:token)
  ↓
Sign-up → onAuthStateChange → returnTo target → join trip
```

## Tables & RLS
| Table | Read | Write | Notes |
|---|---|---|---|
| `event_agenda_items` | event members | organizer | |
| `event_lineup_members` | event members | organizer | |
| `event_attendees` | event members | organizer | |
| `event_rsvps` | event members | self | |
| `event_qa_questions` | event members | members | |
| `event_qa_upvotes` | event members | members | |
| `event_tasks` | event members | organizer | |
| `event_reminders` | event members | service | Cron-fired |
| `event_analytics` | event members | service | Aggregate |
| `attendee_connections` | event members | self | Networking surface |
| `show_schedules`, `game_schedules` | event members | organizer | |
| `trip_invites` | issued+target | service | |
| `invite_links` | trip admins | trip admins | |
| `invite_rate_limits` | service | service | Anti-abuse |
| `trip_join_requests` | requester + admins | requester | |

## Edge Functions Used
- `generate-trip-preview` (verify_jwt = false) — render-safe trip preview HTML
- `get-trip-preview` (verify_jwt = false) — fetch preview JSON
- `generate-invite-preview` / `get-invite-preview` (both verify_jwt = false)
- `join-trip` — accept invite + create membership
- `approve-join-request` — admin approves pending member
- `event-reminders` (verify_jwt = false; cron) — push reminders
- `share-preview` — generate share-able preview

## Demo vs Authenticated
- Demo event uses mocked agenda/lineup.
- Guest view of an event is essentially "demo of one event" — RSVP CTAs still route to auth.

## Mobile / PWA / Capacitor considerations
- `MobileEventDetail.tsx` is the mobile variant.
- Event Q&A must be touch-friendly (large tap targets).
- Push notification dispatch for reminders works in PWA + Capacitor.

## Known Risks
- Memory #21: trip access requires existence check AND RLS-gated membership. Public event surfaces must respect this — never leak member-only data on the guest path.
- "Trip preview CTA should resolve membership and join-request status together" (`LESSONS.md`).
- "Branded OG hosts should never be used as app CTA destinations" (`LESSONS.md`) — the `p.chravel.app` unfurl host is for rendering, not navigation.
- "Dashboard request cards and request counters must share the same outbound source-of-truth" (`LESSONS.md`).
- `event-reminders` is cron; must use `cronGuard`.
- `invite_rate_limits` must be honored — otherwise brute-force invite-token enumeration is possible.

## Source Refs
- `src/pages/EventDetail.tsx`, `MobileEventDetail.tsx`, `TripPreview.tsx`, `JoinTrip.tsx`, `InviteSlugRedirect.tsx`, `AcceptOrganizationInvite.tsx`
- `src/hooks/useEventAdmin.ts`, `useEventPermissions.ts`, `useEventAgenda.ts`, `useEventLineup.ts`, `useEventTasks.ts`, `useEventTabSettings.ts`, `useInviteLink.ts`, `useDashboardJoinRequests.ts`
- `supabase/functions/{generate-trip-preview,get-trip-preview,generate-invite-preview,get-invite-preview,join-trip,approve-join-request,event-reminders,share-preview}/`
- `agent_memory.jsonl` #21
- `LESSONS.md` — preview CTA, dashboard requests, branded OG hosts
