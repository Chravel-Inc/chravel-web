# Store vs Query Ownership Matrix

## Canonical ownership
- **React Query (server state):** persisted entities fetched from Supabase (`notifications`, trips, polls, payments).
- **Zustand (client ephemeral state):** UI/session-only state (`unreadCount`, modal state, demo flags, wizard progress).

## Rules
1. Do not duplicate persisted entity arrays in Zustand when the same entities are in Query cache.
2. Realtime handlers must patch Query cache (`queryClient.setQueryData`) and only mirror minimal derived UI counters in Zustand.
3. Optimistic updates must include conflict metadata and ignore stale realtime patches until mutation ack/refetch resolves.
4. Selectors for Zustand must be primitive or memoized derived values to protect mobile render budgets.

## Notification flow (reference implementation)
- Source of truth list: Query key `['notifications', userId]`.
- Ephemeral mirror: Zustand `unreadCount` only.
- Update path: optimistic mark-as-read → realtime patch merge with timestamp guard → refetch unread count.
