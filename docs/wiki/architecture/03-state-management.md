# State Management

Three layers:

1. **Server state** — TanStack Query 5 (`@tanstack/react-query` 5.56.2). Single `QueryClient` in `src/lib/queryClient.ts`. Query keys enumerated in `src/lib/queryKeys.ts`.
2. **Cross-cutting client state** — Zustand 5.0.6, 6 stores total. Lives in `src/store/` and `src/stores/`.
3. **Local component state** — `useState`/`useReducer`. Not enumerated here.

## TanStack Query

### Provider

`<QueryClientProvider>` wraps the entire app: `src/App.tsx:313`. The client comes from `src/lib/queryClient.ts`.

### Query key factory

`src/lib/queryKeys.ts:12-63` exports the `tripKeys` factory. **Every read should derive keys from this factory** — inline keys are a P2 finding.

| Key | Builder | Notes |
|---|---|---|
| `['trips']` | `tripKeys.all` | Base |
| `['trips', 'list']` | `tripKeys.lists()` | Dashboard |
| `['trip', tripId]` | `tripKeys.detail(tripId)` | Trip detail |
| `['trip-members', tripId]` | `tripKeys.members(tripId)` | Roster |
| `['tripChat', tripId]` | `tripKeys.chat(tripId)` | Chat aux data |
| `['tripChatMessages', tripId, limit?]` | `tripKeys.chatMessages(...)` | Chat messages |
| `['calendarEvents', tripId]` | `tripKeys.calendar(tripId)` | Calendar |
| `['tripTasks', tripId, isDemoMode?]` | `tripKeys.tasks(...)` | Tasks (demo-aware) |
| `['tripPolls', tripId, isDemoMode?]` | `tripKeys.polls(...)` | Polls (demo-aware) |
| `['tripMedia', tripId, isDemoMode?]` | `tripKeys.media(...)` | Media (demo-aware) |
| `['tripPlaces', tripId, isDemoMode?]` | `tripKeys.places(...)` | Places (demo-aware) |
| `['tripLinks', tripId, isDemoMode?]` | `tripKeys.tripLinks(...)` | Links (demo-aware) |
| `['tripPayments', tripId]` | `tripKeys.payments(tripId)` | Payments |
| `['tripPaymentBalances', tripId, userId]` | `tripKeys.paymentBalances(...)` | Balance summary |
| `['tripBroadcasts', tripId]` | `tripKeys.broadcasts(tripId)` | Broadcasts |
| `['tripRoster', tripId]` | `tripKeys.roster(tripId)` | Pro roster |
| `['tripChannels', tripId]` | `tripKeys.channels(tripId)` | Pro channels |
| `['tripAdmins', tripId]` | `tripKeys.tripAdmins(tripId)` | Trip admins |
| `['tripRoles', tripId]` | `tripKeys.tripRoles(tripId)` | Trip roles |
| `['eventAgenda', tripId]` | `tripKeys.agenda(tripId)` | Event agenda |
| `['eventLineup', tripId]` | `tripKeys.lineup(tripId)` | Event lineup |
| `['eventRsvps', tripId]` | `tripKeys.rsvps(tripId)` | Event RSVPs |

### Cache config (`QUERY_CACHE_CONFIG`)

`src/lib/queryKeys.ts:71-158`. Per-domain stale/gc/refetch policy:

| Domain | `staleTime` | `gcTime` | `refetchOnWindowFocus` |
|---|---|---|---|
| `trip` | 60s | 5m | true |
| `members` | 30s | 5m | false |
| `chat` | 10s | 3m | false (realtime owns it) |
| `calendar` | 60s | 10m | true |
| `tasks` | 30s | 5m | true |
| `polls` | 60s | 5m | true |
| `media` | 120s | 10m | false |
| `payments` | 30s | 5m | true |
| `paymentBalances` | 30s | 5m | true |
| `places` | 120s | 10m | false |
| `channels` | 30s | 5m | false |
| `tripAdmins` | 60s | 5m | false |
| `tripRoles` | 60s | 5m | false |

### Prefetch priorities

`src/lib/queryKeys.ts:164-173`:
```
members(1) > chat(2) > calendar(3) > tasks(4) > polls(5) > media(6) > payments(7) > places(8)
```
Lower number = higher priority. Used by trip-detail prefetch logic.

### Useful patterns in this codebase

- `queryClient.clear()` is called on sign-out (`useAuth.tsx:1111, 785`) to prevent cross-user contamination.
- `queryClient.prefetchQuery(...)` warms the user-trip cache during auth (`useAuth.tsx:452-461`).
- Cache invalidation on mutations: see hook files in `src/hooks/` (e.g. `useDeleteTrip.ts`).

## Zustand stores (6)

All stores live in `src/store/` or `src/stores/`. They are persisted to `localStorage` when state survives reloads (demo, onboarding, notifications); session-only otherwise (concierge, demo members).

| Store | File | Hook | Persisted? | Purpose |
|---|---|---|---|---|
| Demo mode | `src/store/demoModeStore.ts` | `useDemoModeStore` | Yes (`TRIPS_DEMO_VIEW`) | `demoView: 'off' \| 'marketing' \| 'app-preview'`. Computed: `isDemoMode = demoView === 'app-preview'`. |
| Demo trip members | `src/stores/demoTripMembersStore.ts` | `useDemoTripMembersStore` | Session | Per-trip mock members added during preview. |
| Onboarding | `src/stores/onboardingStore.ts` | `useOnboardingStore` | Yes (`chravel_onboarding_completed`) | First-run screens, pending destination capture. |
| Notifications realtime | `src/store/notificationRealtimeStore.ts` | `useNotificationRealtimeStore` | Yes (resets on sign-out) | In-app notification list + unread count. |
| Entitlements | `src/store/entitlementsStore.ts` | `useEntitlementsStore` | Session | Single source of subscription truth (RC + Stripe + demo + super-admin). |
| Concierge session | `src/store/conciergeSessionStore.ts` | `useConciergeSessionStore` | Session | AI concierge messages, voice state, error/success markers, per-trip session map. |

### Single-writer discipline (`CLAUDE.md`)

Each store should have exactly one canonical writer surface. Cross-checks that flagged risks:
- `useAuth.tsx` writes to `useDemoModeStore.setDemoView('off')` on sign-in (`useAuth.tsx:649-651, 714-717, 1102-1104`) and on sign-out (`signOut`). Acceptable because it's a derived "clear-on-auth-event" — but any other writer outside `DemoEntry.tsx`/`AuthPage.tsx`/`DemoTripGate.tsx` is suspect.
- `useNotificationRealtimeStore.clearAll()` runs on every sign-out (`useAuth.tsx:788, 1120, 1135-1137`).

See `RISKS.md` for any detected >1-writer violations.

### Demo state of truth

`useDemoModeStore` is **the** source of demo state. Any local boolean `isDemo` derived elsewhere is a code-smell candidate.

The store recognizes a legacy `TRIPS_DEMO_MODE` localStorage key for backwards compat (see `src/store/demoModeStore.ts`). Reading raw `localStorage.getItem('TRIPS_DEMO_VIEW')` is not the pattern — go through the store.

## Contexts (non-Zustand)

| Context | File | Purpose |
|---|---|---|
| `AuthContext` | `src/hooks/useAuth.tsx:134, 1376-1382` | Auth user + session + auth methods |
| `ConsumerSubscriptionProvider` | `src/hooks/useConsumerSubscription.tsx` | Wraps subscription state for consumer trips |
| `TooltipProvider` | `@radix-ui/react-tooltip` via `src/components/ui/tooltip.tsx` | Radix tooltip context |

Provider order in `App.tsx:313-617`: `QueryClientProvider` → `AuthProvider` → `ConsumerSubscriptionProvider` → `AppInitializer` → `TooltipProvider` → toasters + `Router`.

## Local persistence (beyond Zustand)

- `localStorage` direct reads/writes — auth breaking-version flag (`src/App.tsx:198-223`), onboarding cache, Supabase session key (`chravel-auth-session`).
- `idb` (`package.json:113`) backs the offline message queue (`src/offline/`, `src/services/offlineMessageQueue.ts`).
- `fake-indexeddb` for tests (`package.json:107`).

## Mobile / PWA / Capacitor considerations

- All stores persist via `localStorage` — Capacitor's `Preferences` is **not** used in this repo; the native shell relies on web `localStorage`.
- IndexedDB-backed offline queue is functional in PWA + Capacitor shells.
- On visibility-change, auth refreshes session (`useAuth.tsx:808-845`); stores do not need to react to visibility separately.

## Known risks

- **Inline query keys.** Hooks that build `['trip-foo', tripId]` inline rather than through `tripKeys` are P2 drift candidates. Sweep planned in `RISKS.md`.
- **Per-domain `isDemoMode` parameter.** Several keys accept `isDemoMode?` (tasks/polls/media/places/tripLinks). When the boolean is omitted, the key is missing the demo-distinguishing segment — a subtle cache-collision risk between demo and real data. Verify every caller passes it.
- **`queryClient.clear()` on sign-out.** Catches anything not keyed under user — but trip data is keyed by `tripId` not `userId`. If two users share a device, the sign-out clear is what prevents leakage. Removing it would be a P0 regression.

## Source Refs

- `src/lib/queryKeys.ts:1-173`
- `src/lib/queryClient.ts`
- `src/App.tsx:313, 322` (provider order, Router placement)
- `src/store/demoModeStore.ts`
- `src/store/entitlementsStore.ts`
- `src/store/notificationRealtimeStore.ts`
- `src/store/conciergeSessionStore.ts`
- `src/stores/onboardingStore.ts`
- `src/stores/demoTripMembersStore.ts`
- `src/hooks/useAuth.tsx:1111, 785, 788, 1120` (cross-store cleanup on auth events)
