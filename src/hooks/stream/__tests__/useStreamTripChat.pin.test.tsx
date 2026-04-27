import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStreamTripChat } from '../useStreamTripChat';

const { watchMock, partialUpdateMessageMock, onMock, offMock } = vi.hoisted(() => ({
  watchMock: vi.fn(),
  partialUpdateMessageMock: vi.fn(),
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
    partialUpdateMessage: partialUpdateMessageMock,
  }),
  getStreamApiKey: vi.fn(() => 'stream-key'),
  getStreamClient: vi.fn(() => ({
    userID: 'user-1',
    channel: vi.fn(() => mockChannel),
    partialUpdateMessage: partialUpdateMessageMock,
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

  it('pins via partial message update without replacing message payload', async () => {
    const { result } = renderHook(() => useStreamTripChat('trip-abc', { enabled: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.togglePin('message-1', true);
    });

    expect(partialUpdateMessageMock).toHaveBeenCalledTimes(1);
    expect(partialUpdateMessageMock).toHaveBeenCalledWith({
      id: 'message-1',
      set: { pinned: true },
    });
    expect(partialUpdateMessageMock.mock.calls[0]?.[0]).not.toHaveProperty('text');
    expect(partialUpdateMessageMock.mock.calls[0]?.[0]).not.toHaveProperty('message');
  });

  it('unpins via partial message update', async () => {
    const { result } = renderHook(() => useStreamTripChat('trip-abc', { enabled: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.togglePin('message-2', false);
    });

    expect(partialUpdateMessageMock).toHaveBeenCalledWith({
      id: 'message-2',
      set: { pinned: false },
    });
  });
});
