import { describe, expect, it } from 'vitest';
import {
  appendOlderNotifications,
  applyNotificationPatch,
  clearOptimisticMutation,
  markNotificationReadOptimistic,
  oldestCreatedAtCursor,
  type NotificationCacheItem,
} from '../realtimeCache';

const base = (overrides: Partial<NotificationCacheItem> = {}): NotificationCacheItem => ({
  id: 'n1',
  isRead: false,
  timestampMs: 10,
  ...overrides,
});

describe('notification realtime cache conflict handling', () => {
  it('keeps optimistic read when stale realtime patch arrives', () => {
    const optimistic = markNotificationReadOptimistic([base()], 'n1', 'm1');
    const merged = applyNotificationPatch(optimistic, base({ isRead: false, timestampMs: 9 }));

    expect(merged[0].isRead).toBe(true);
    expect(merged[0].optimisticMutationId).toBe('m1');
  });

  it('accepts newer realtime patch after optimistic write', () => {
    const optimistic = markNotificationReadOptimistic([base()], 'n1', 'm1');
    const merged = applyNotificationPatch(optimistic, base({ isRead: true, timestampMs: 12 }));

    expect(merged[0].isRead).toBe(true);
    expect(merged[0].timestampMs).toBe(12);
  });

  it('clears optimistic marker after refetch/ack', () => {
    const optimistic = markNotificationReadOptimistic([base()], 'n1', 'm1');
    const cleared = clearOptimisticMutation(optimistic, 'n1', 'm1');

    expect(cleared[0].optimisticMutationId).toBeUndefined();
  });
});

describe('inbox pagination (loadMore) merge', () => {
  it('picks the OLDEST loaded created_at as the next-page cursor', () => {
    const page = [
      base({ id: 'n1', createdAt: '2026-01-02T00:00:00.000Z' }),
      base({ id: 'n2', createdAt: '2026-01-01T00:00:00.000Z' }),
      base({ id: 'n3', createdAt: '2026-01-03T00:00:00.000Z' }),
    ];
    expect(oldestCreatedAtCursor(page)).toBe('2026-01-01T00:00:00.000Z');
  });

  it('returns null when nothing is loaded so loadMore is a no-op', () => {
    expect(oldestCreatedAtCursor([])).toBeNull();
  });

  it('appends an older page after the existing feed, de-duping overlapping ids', () => {
    const existing = [
      base({ id: 'n1', createdAt: '2026-01-02T00:00:00.000Z' }),
      base({ id: 'n2', isRead: true, createdAt: '2026-01-01T00:00:00.000Z' }),
    ];
    // Second page re-includes n2 (boundary/realtime overlap) plus two genuinely older rows.
    const olderPage = [
      base({ id: 'n2', isRead: false, createdAt: '2026-01-01T00:00:00.000Z' }),
      base({ id: 'n3', createdAt: '2025-12-31T00:00:00.000Z' }),
      base({ id: 'n4', createdAt: '2025-12-30T00:00:00.000Z' }),
    ];

    const merged = appendOlderNotifications(existing, olderPage);

    // n2 is not duplicated: n1, n2, n3, n4.
    expect(merged.map(n => n.id)).toEqual(['n1', 'n2', 'n3', 'n4']);
    expect(new Set(merged.map(n => n.id)).size).toBe(4);

    // Existing rows win — n2's read state is preserved (older duplicate does NOT flip it
    // back to unread), so the separately-counted unread total cannot drift on pagination.
    expect(merged.find(n => n.id === 'n2')?.isRead).toBe(true);
  });

  it('returns the same array reference when the older page adds nothing new', () => {
    const existing = [base({ id: 'n1', createdAt: '2026-01-02T00:00:00.000Z' })];
    const merged = appendOlderNotifications(existing, [
      base({ id: 'n1', createdAt: '2026-01-02T00:00:00.000Z' }),
    ]);
    expect(merged).toBe(existing);
  });
});
