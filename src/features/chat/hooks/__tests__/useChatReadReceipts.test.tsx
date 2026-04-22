import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useChatReadReceipts } from '../useChatReadReceipts';
import { markMessagesAsRead } from '@/services/readReceiptService';

vi.mock('@/services/readReceiptService', () => ({
  markMessagesAsRead: vi.fn(),
}));

describe('useChatReadReceipts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls activeChannel.markRead after debounce when a Stream-backed channel is present', async () => {
    const markRead = vi.fn(async () => undefined);
    const activeChannel = {
      markRead,
      state: {
        read: {
          'user-1': {
            unread_messages: 1,
            last_read: '2026-04-13T00:00:00.000Z',
          },
        },
      },
    };
    const liveMessages = [{ id: 'msg-1', user_id: 'user-2' }];

    renderHook(() =>
      useChatReadReceipts(false, 'user-1', 'trip-1', liveMessages, activeChannel as any),
    );

    await waitFor(
      () => {
        expect(markRead).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 },
    );

    expect(markMessagesAsRead).not.toHaveBeenCalled();
  });

  it('uses legacy markMessagesAsRead when activeChannel is unavailable', async () => {
    const liveMessages = [{ id: 'msg-1', user_id: 'user-2' }];

    renderHook(() => useChatReadReceipts(false, 'user-1', 'trip-1', liveMessages, null));

    await waitFor(
      () => {
        expect(markMessagesAsRead).toHaveBeenCalledWith(['msg-1'], 'trip-1', 'user-1');
      },
      { timeout: 3000 },
    );
  });
});
