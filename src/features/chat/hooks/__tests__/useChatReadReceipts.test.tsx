import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useChatReadReceipts } from '../useChatReadReceipts';
import {
  getMessagesReadStatus,
  markMessagesAsRead,
  subscribeToReadReceipts,
} from '@/services/readReceiptService';

const removeChannelMock = vi.fn(() => Promise.resolve({}));

vi.mock('@/services/readReceiptService', () => ({
  markMessagesAsRead: vi.fn(),
  subscribeToReadReceipts: vi.fn(() => ({ id: 'legacy-read-receipts-channel' })),
  getMessagesReadStatus: vi.fn(async () => ({})),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    removeChannel: (...args: unknown[]) => removeChannelMock(...args),
  },
}));

describe('useChatReadReceipts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses Stream read state for display and does not query legacy Supabase receipts in Stream mode', async () => {
    const activeChannel = {
      markRead: vi.fn(async () => undefined),
      state: {
        read: {
          'reader-1': { last_read: '2026-04-13T10:05:00.000Z' },
          'sender-1': { last_read: '2026-04-13T10:10:00.000Z' },
          'me-1': { last_read: '2026-04-13T10:10:00.000Z' },
        },
      },
    };

    const liveMessages = [
      {
        id: 'msg-1',
        created_at: '2026-04-13T10:00:00.000Z',
        user: { id: 'sender-1' },
        text: 'hello',
      },
    ];

    const { result } = renderHook(() =>
      useChatReadReceipts(false, 'me-1', 'trip-1', liveMessages, activeChannel),
    );

    await waitFor(() => {
      expect(result.current.readStatusesByMessage['msg-1']).toBeDefined();
    });

    expect(result.current.readStatusesByMessage['msg-1']).toEqual([
      {
        id: 'msg-1:reader-1',
        message_id: 'msg-1',
        user_id: 'reader-1',
        read_at: '2026-04-13T10:05:00.000Z',
        created_at: '2026-04-13T10:05:00.000Z',
      },
    ]);

    expect(subscribeToReadReceipts).not.toHaveBeenCalled();
    expect(getMessagesReadStatus).not.toHaveBeenCalled();
    expect(markMessagesAsRead).not.toHaveBeenCalled();
  });

  it('keeps legacy Supabase read receipt path when Stream channel is unavailable', async () => {
    vi.mocked(getMessagesReadStatus).mockResolvedValueOnce({
      'msg-own': [
        {
          id: 'legacy-1',
          message_id: 'msg-own',
          user_id: 'reader-2',
          read_at: '2026-04-13T09:05:00.000Z',
          created_at: '2026-04-13T09:05:00.000Z',
        },
      ],
    });

    const liveMessages = [
      {
        id: 'msg-own',
        created_at: '2026-04-13T09:00:00.000Z',
        user_id: 'me-1',
      },
      {
        id: 'msg-other',
        created_at: '2026-04-13T09:10:00.000Z',
        user_id: 'other-1',
      },
    ];

    renderHook(() => useChatReadReceipts(false, 'me-1', 'trip-1', liveMessages, undefined));

    await waitFor(() => {
      expect(subscribeToReadReceipts).toHaveBeenCalledWith('trip-1', expect.any(Function));
    });

    await waitFor(() => {
      expect(getMessagesReadStatus).toHaveBeenCalledWith(['msg-own']);
    });
  });

  it('calls activeChannel.markRead after debounce when a Stream-backed channel is present', async () => {
    const markRead = vi.fn(async () => undefined);
    const activeChannel = { markRead, state: { read: {} } };
    const liveMessages = [{ id: 'msg-1', user_id: 'user-2' }];

    renderHook(() => useChatReadReceipts(false, 'user-1', 'trip-1', liveMessages, activeChannel));

    await waitFor(
      () => {
        expect(markRead).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 },
    );
  });

  it('does not use Stream markRead when activeChannel is null; legacy subscription still applies', async () => {
    const liveMessages = [{ id: 'msg-1', user_id: 'user-2' }];

    renderHook(() => useChatReadReceipts(false, 'user-1', 'trip-1', liveMessages, null));

    await waitFor(() => {
      expect(subscribeToReadReceipts).toHaveBeenCalledWith('trip-1', expect.any(Function));
    });
  });
});
