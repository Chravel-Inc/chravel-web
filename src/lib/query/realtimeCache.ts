import type { NotificationType, NotificationPayloadMetadata } from '@/types/notifications';

export interface NotificationCacheItem {
  id: string;
  isRead: boolean;
  timestampMs: number;
  optimisticMutationId?: string;
  // Raw ISO `created_at` from the row — the stable pagination cursor. Distinct from
  // `timestampMs` (a client-side ingestion clock used only for optimistic precedence).
  createdAt?: string;
  // Extended display fields (populated by mapRowToNotification)
  type?: NotificationType;
  title?: string;
  description?: string;
  tripId?: string;
  tripName?: string;
  timestamp?: string;
  isHighPriority?: boolean;
  data?: NotificationPayloadMetadata;
}

export function applyNotificationPatch(
  current: NotificationCacheItem[],
  incoming: NotificationCacheItem,
): NotificationCacheItem[] {
  const existing = current.find(item => item.id === incoming.id);
  if (!existing) return [incoming, ...current];

  const hasPendingOptimistic = Boolean(existing.optimisticMutationId);
  const incomingIsOlder = incoming.timestampMs < existing.timestampMs;

  if (hasPendingOptimistic && incomingIsOlder) {
    return current;
  }

  return current.map(item => (item.id === incoming.id ? { ...existing, ...incoming } : item));
}

/**
 * Oldest loaded `created_at` — the cursor for the next page of older notifications.
 * Derived from the cache (not tracked separately) so it stays correct regardless of how
 * realtime INSERTs and paged rows interleave. Returns null when nothing is loaded yet.
 */
export function oldestCreatedAtCursor(items: NotificationCacheItem[]): string | null {
  return items.reduce<string | null>((oldest, item) => {
    if (!item.createdAt) return oldest;
    if (!oldest || item.createdAt < oldest) return item.createdAt;
    return oldest;
  }, null);
}

/**
 * Append an older page to the existing feed, de-duping by id so a row that also arrives via
 * realtime (or overlaps the cursor boundary) is never doubled. Existing items win — their
 * read state / optimistic markers are preserved untouched, so the unread count (a separate
 * DB COUNT) never drifts because of pagination.
 */
export function appendOlderNotifications(
  existing: NotificationCacheItem[],
  older: NotificationCacheItem[],
): NotificationCacheItem[] {
  const seen = new Set(existing.map(item => item.id));
  const appended = older.filter(item => !seen.has(item.id));
  return appended.length === 0 ? existing : [...existing, ...appended];
}

export function markNotificationReadOptimistic(
  current: NotificationCacheItem[],
  id: string,
  mutationId: string,
): NotificationCacheItem[] {
  return current.map(item =>
    item.id === id ? { ...item, isRead: true, optimisticMutationId: mutationId } : item,
  );
}

export function clearOptimisticMutation(
  current: NotificationCacheItem[],
  id: string,
  mutationId: string,
): NotificationCacheItem[] {
  return current.map(item => {
    if (item.id !== id || item.optimisticMutationId !== mutationId) return item;
    const { optimisticMutationId: _removed, ...rest } = item;
    return rest;
  });
}
