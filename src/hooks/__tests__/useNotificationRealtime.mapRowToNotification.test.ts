import { describe, expect, it } from 'vitest';
import {
  isJoinApprovedNotificationRow,
  mapRowToNotification,
} from '@/lib/notificationRealtimeUtils';

describe('mapRowToNotification', () => {
  it('falls back to notifications.trip_id when metadata.trip_id is missing', () => {
    const mapped = mapRowToNotification({
      id: 'notif-1',
      type: 'info',
      title: 'Join Request Approved',
      message: 'Your request to join "MLB All Star Weekend" has been approved!',
      is_read: false,
      metadata: { trip_name: 'MLB All Star Weekend', action: 'join_approved' },
      trip_id: 'trip-from-column',
      created_at: '2026-03-19T12:00:00.000Z',
    });

    expect(mapped.tripId).toBe('trip-from-column');
    expect(mapped.tripName).toBe('MLB All Star Weekend');
  });

  it('prefers metadata.trip_id when both metadata and column are present', () => {
    const mapped = mapRowToNotification({
      id: 'notif-2',
      type: 'info',
      title: 'Join Request Approved',
      message: 'Approved',
      is_read: false,
      metadata: { trip_id: 'trip-from-metadata' },
      trip_id: 'trip-from-column',
      created_at: '2026-03-19T12:00:00.000Z',
    });

    expect(mapped.tripId).toBe('trip-from-metadata');
  });
});

describe('isJoinApprovedNotificationRow', () => {
  it('returns true for join_approved action in metadata', () => {
    expect(
      isJoinApprovedNotificationRow({
        type: 'info',
        title: 'x',
        metadata: { action: 'join_approved' },
      }),
    ).toBe(true);
  });

  it('returns false for unrelated notifications', () => {
    expect(
      isJoinApprovedNotificationRow({
        type: 'message',
        title: 'New message',
        metadata: {},
      }),
    ).toBe(false);
  });
});
