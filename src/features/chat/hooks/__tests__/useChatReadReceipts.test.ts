import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatReadReceipts } from '../useChatReadReceipts';

const subscribeToReadReceipts = vi.hoisted(() => vi.fn(() => ({ id: 'subscription-1' })));
const getMessagesReadStatus = vi.hoisted(() => vi.fn().mockResolvedValue({}));

vi.mock('@/services/readReceiptService', () => ({
  subscribeToReadReceipts,
  getMessagesReadStatus,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    removeChannel: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('useChatReadReceipts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls activeChannel.markRead when a Stream-backed channel is available', async () => {
    const markRead = vi.fn().mockResolvedValue(undefined);
    const activeChannel = { markRead, state: { read: {} } } as never;

    renderHook(() =>
      useChatReadReceipts(
        false,
        'user-1',
        'trip-1',
        [{ id: 'msg-1', user_id: 'user-2' }],
        activeChannel,
      ),
    );

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(markRead).toHaveBeenCalledTimes(1);
  });

  it('skips markRead when no active channel is available', async () => {
    renderHook(() =>
      useChatReadReceipts(false, 'user-1', 'trip-1', [{ id: 'msg-1', user_id: 'user-2' }], null),
    );

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(subscribeToReadReceipts).toHaveBeenCalledTimes(1);
  });
});
