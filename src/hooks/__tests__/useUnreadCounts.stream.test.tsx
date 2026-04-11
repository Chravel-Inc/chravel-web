import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { Channel } from 'stream-chat';
import { useUnreadCounts } from '../useUnreadCounts';

function makeStreamChannel(lastReadIso: string): Channel {
  return {
    state: {
      read: {
        me: { last_read: lastReadIso },
      },
    },
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as Channel;
}

describe('useUnreadCounts (Stream channel)', () => {
  it('counts messages from others newer than my read cursor as unread', async () => {
    const channel = makeStreamChannel('2024-01-01T12:00:00.000Z');

    const { result } = renderHook(() =>
      useUnreadCounts({
        tripId: 'trip-1',
        userId: 'me',
        enabled: true,
        streamChannel: channel,
        messages: [
          {
            id: 'a',
            user: { id: 'other' },
            created_at: '2024-01-01T00:00:00.000Z',
            message_type: 'text',
          },
          {
            id: 'b',
            user: { id: 'other' },
            created_at: '2024-01-02T00:00:00.000Z',
            message_type: 'text',
          },
        ],
      }),
    );

    await waitFor(() => {
      expect(result.current.messageUnreadCount).toBe(1);
      expect(result.current.broadcastCount).toBe(0);
    });
  });

  it('treats broadcast-type messages in the unread set as broadcastCount', async () => {
    const channel = makeStreamChannel('2024-01-01T12:00:00.000Z');

    const { result } = renderHook(() =>
      useUnreadCounts({
        tripId: 'trip-1',
        userId: 'me',
        enabled: true,
        streamChannel: channel,
        messages: [
          {
            id: 'x',
            user: { id: 'other' },
            created_at: '2024-01-02T00:00:00.000Z',
            message_type: 'broadcast',
          },
        ],
      }),
    );

    await waitFor(() => {
      expect(result.current.broadcastCount).toBe(1);
      expect(result.current.messageUnreadCount).toBe(0);
    });
  });
});
