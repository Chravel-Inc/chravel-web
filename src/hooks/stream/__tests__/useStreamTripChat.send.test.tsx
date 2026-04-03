import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStreamTripChat } from '../useStreamTripChat';

const sendMessageMock = vi.fn();
const watchMock = vi.fn();
const stopWatchingMock = vi.fn();
const onMock = vi.fn();
const offMock = vi.fn();

const mockChannel = {
  watch: watchMock,
  stopWatching: stopWatchingMock,
  on: onMock,
  off: offMock,
  sendMessage: sendMessageMock,
};

vi.mock('@/services/stream/streamClient', () => ({
  getStreamClient: vi.fn(() => ({
    userID: 'user-1',
    channel: vi.fn(() => mockChannel),
  })),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('useStreamTripChat send path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    watchMock.mockResolvedValue({ messages: [] });
    sendMessageMock.mockImplementation(
      () =>
        new Promise(() => {
          /* intentionally never resolves — stalled SDK */
        }),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('sendMessageAsync resolves immediately so composer is not blocked on stalled sendMessage', async () => {
    const { result } = renderHook(() => useStreamTripChat('trip-abc', { enabled: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let settled = false;
    await act(async () => {
      void result.current.sendMessageAsync('hello', 'You').then(() => {
        settled = true;
      });
    });

    expect(settled).toBe(true);
    expect(result.current.isCreating).toBe(false);
    expect(sendMessageMock).toHaveBeenCalledTimes(1);
  });
});
