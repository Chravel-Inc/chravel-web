import { describe, expect, it } from 'vitest';
import {
  applyNotificationPatch,
  clearOptimisticMutation,
  markNotificationReadOptimistic,
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
