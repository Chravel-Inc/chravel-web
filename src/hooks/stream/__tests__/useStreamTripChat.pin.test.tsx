import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStreamTripChat } from '../useStreamTripChat';

const { watchMock, pinMessageMock, unpinMessageMock, onMock, offMock } = vi.hoisted(() => ({
  watchMock: vi.fn(),
  pinMessageMock: vi.fn(),
  unpinMessageMock: vi.fn(),
  onMock: vi.fn(),
  offMock: vi.fn(),
}));

const mockChannel = {
  state: {
    messages: [],
  },
  watch: watchMock,
  on: onMock,
  off: offMock,
  stopWatching: vi.fn(),
  query: vi.fn().mockResolvedValue({ messages: [] }),
  sendMessage: vi.fn(),
  sendReaction: vi.fn(),
  deleteReaction: vi.fn(),
};

vi.mock('@/services/stream/streamClient', () => ({
  connectStreamClient: vi.fn().mockResolvedValue({
    userID: 'user-1',
    channel: vi.fn(() => mockChannel),
    pinMessage: pinMessageMock,
    unpinMessage: unpinMessageMock,
  }),
  getStreamApiKey: vi.fn(() => 'stream-key'),
  getStreamClient: vi.fn(() => ({
    userID: 'user-1',
    channel: vi.fn(() => mockChannel),
    pinMessage: pinMessageMock,
    unpinMessage: unpinMessageMock,
  })),
  onStreamClientConnected: vi.fn(() => () => {}),
  onStreamClientConnectionStatusChange: vi.fn(() => () => {}),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    session: { access_token: 'mock-access-token' },
  }),
}));

describe('useStreamTripChat pin toggles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    watchMock.mockResolvedValue({
      membership: { user_id: 'user-1' },
      messages: [],
    });
  });

  it('pins via Stream pinMessage API by id', async () => {
    const { result } = renderHook(() => useStreamTripChat('trip-abc', { enabled: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.togglePin('message-1', true);
    });

    expect(pinMessageMock).toHaveBeenCalledTimes(1);
    expect(pinMessageMock).toHaveBeenCalledWith('message-1');
    expect(unpinMessageMock).not.toHaveBeenCalled();
  });

  it('unpins via Stream unpinMessage API by id', async () => {
    const { result } = renderHook(() => useStreamTripChat('trip-abc', { enabled: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.togglePin('message-2', false);
    });

    expect(unpinMessageMock).toHaveBeenCalledTimes(1);
    expect(unpinMessageMock).toHaveBeenCalledWith('message-2');
    expect(pinMessageMock).not.toHaveBeenCalled();
  });

  it('surfaces Stream errors so callers can render specific failure toasts', async () => {
    const { result } = renderHook(() => useStreamTripChat('trip-abc', { enabled: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    pinMessageMock.mockRejectedValueOnce(Object.assign(new Error('forbidden'), { code: 17 }));

    await expect(
      act(async () => {
        await result.current.togglePin('message-3', true);
      }),
    ).rejects.toThrow('forbidden');
  });
});
