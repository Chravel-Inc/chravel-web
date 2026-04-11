import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStreamTripChat } from '../useStreamTripChat';

const sendMessageMock = vi.fn();
const watchMock = vi.fn();
const queryMock = vi.fn();
const stopWatchingMock = vi.fn();
const onMock = vi.fn();
const offMock = vi.fn();

const mockChannel = {
  watch: watchMock,
  query: queryMock,
  stopWatching: stopWatchingMock,
  on: onMock,
  off: offMock,
  sendMessage: sendMessageMock,
};

vi.mock('@/services/stream/streamClient', () => ({
  getStreamApiKey: vi.fn(() => 'stream-key'),
  getStreamClient: vi.fn(() => ({
    userID: 'user-1',
    channel: vi.fn(() => mockChannel),
  })),
  onStreamClientConnected: vi.fn(() => () => {}),
  onStreamClientConnectionStatusChange: vi.fn(() => () => {}),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('useStreamTripChat send path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    watchMock.mockResolvedValue({ messages: [] });
    queryMock.mockResolvedValue({ messages: [] });
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

  it('strips legacy reply ids before sending to Stream parent_id', async () => {
    const { result } = renderHook(() => useStreamTripChat('trip-abc', { enabled: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.sendMessage(
        'hello',
        'You',
        undefined,
        undefined,
        'user-1',
        undefined,
        'text',
        'legacy-1',
      );
    });

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(sendMessageMock.mock.calls[0]?.[0]?.parent_id).toBeUndefined();
  });
});
