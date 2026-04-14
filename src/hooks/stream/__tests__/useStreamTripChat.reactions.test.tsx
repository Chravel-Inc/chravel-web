import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStreamTripChat } from '../useStreamTripChat';

const sendReactionMock = vi.fn();
const deleteReactionMock = vi.fn();
const watchMock = vi.fn();
const onMock = vi.fn();
const offMock = vi.fn();

const baseMessage = {
  id: 'message-1',
  text: 'hello',
  created_at: '2026-04-13T00:00:00.000Z',
  type: 'regular',
  user: { id: 'user-2' },
};

const mockChannel = {
  state: {
    messages: [] as Array<typeof baseMessage & { own_reactions?: Array<{ type: string }> }>,
  },
  watch: watchMock,
  on: onMock,
  off: offMock,
  stopWatching: vi.fn(),
  query: vi.fn().mockResolvedValue({ messages: [] }),
  sendMessage: vi.fn(),
  sendReaction: sendReactionMock,
  deleteReaction: deleteReactionMock,
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

describe('useStreamTripChat reactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChannel.state.messages = [{ ...baseMessage }];
    watchMock.mockResolvedValue({ messages: [{ ...baseMessage }] });
  });

  it('double-tap toggles same reaction: first add, second remove', async () => {
    const { result } = renderHook(() => useStreamTripChat('trip-abc', { enabled: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleReaction('message-1', 'love');
    });

    expect(sendReactionMock).toHaveBeenCalledTimes(1);
    expect(sendReactionMock).toHaveBeenCalledWith('message-1', { type: 'love' });
    expect(deleteReactionMock).not.toHaveBeenCalled();

    const reactionNewHandler = onMock.mock.calls.find(([event]) => event === 'reaction.new')?.[1];
    expect(reactionNewHandler).toBeTypeOf('function');

    mockChannel.state.messages = [{ ...baseMessage, own_reactions: [{ type: 'love' }] }];
    act(() => {
      reactionNewHandler?.({});
    });

    await act(async () => {
      await result.current.toggleReaction('message-1', 'love');
    });

    expect(deleteReactionMock).toHaveBeenCalledTimes(1);
    expect(deleteReactionMock).toHaveBeenCalledWith('message-1', 'love');
  });
});
