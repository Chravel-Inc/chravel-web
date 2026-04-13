import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useUnreadCounts } from '../useUnreadCounts';

describe('useUnreadCounts (Stream source)', () => {
  it('uses Stream unread total and classifies broadcast subset from loaded unread messages', () => {
    const activeChannel = {
      countUnread: () => 3,
      state: {
        read: {
          'user-1': {
            unread_messages: 3,
            last_read: '2026-04-13T00:00:00.000Z',
          },
        },
      },
    };

    const messages = [
      {
        id: 'm-1',
        user: { id: 'user-2' },
        message_type: 'text',
        created_at: '2026-04-13T00:01:00.000Z',
      },
      {
        id: 'm-2',
        user: { id: 'user-3' },
        message_type: 'broadcast',
        created_at: '2026-04-13T00:02:00.000Z',
      },
      {
        id: 'm-3',
        user: { id: 'user-1' },
        message_type: 'text',
        created_at: '2026-04-13T00:03:00.000Z',
      },
      {
        id: 'm-4',
        user: { id: 'user-4' },
        privacy_mode: 'broadcast',
        created_at: '2026-04-13T00:04:00.000Z',
      },
    ];

    const { result } = renderHook(() =>
      useUnreadCounts({
        tripId: 'trip-1',
        messages,
        userId: 'user-1',
        enabled: true,
        activeChannel: activeChannel as any,
      }),
    );

    expect(result.current.broadcastCount).toBe(2);
    expect(result.current.messageUnreadCount).toBe(1);
  });

  it('does not drop unread total when message window is empty', () => {
    const activeChannel = {
      countUnread: () => 5,
      state: {
        read: {
          'user-1': {
            unread_messages: 5,
            last_read: '2026-04-13T00:00:00.000Z',
          },
        },
      },
    };

    const { result } = renderHook(() =>
      useUnreadCounts({
        tripId: 'trip-1',
        messages: [],
        userId: 'user-1',
        enabled: true,
        activeChannel: activeChannel as any,
      }),
    );

    expect(result.current.broadcastCount).toBe(0);
    expect(result.current.messageUnreadCount).toBe(5);
  });
});
