import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStreamTripChat } from '../useStreamTripChat';

const watchMock = vi.fn();
const onMock = vi.fn();
const offMock = vi.fn();

const baseMessage = {
  id: 'parent-1',
  text: 'top-level',
  created_at: '2026-04-23T00:00:00.000Z',
  type: 'regular',
  user: { id: 'user-2' },
};

const mockChannel = {
  state: {
    messages: [] as Array<Record<string, unknown>>,
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
  }),
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

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    session: { access_token: 'mock-access-token' },
  }),
}));

describe('useStreamTripChat thread reply filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChannel.state.messages = [{ ...baseMessage }];
    watchMock.mockResolvedValue({
      membership: { user_id: 'user-1' },
      messages: [{ ...baseMessage }],
    });
  });

  it('does not insert thread replies (parent_id set) into main messages state', async () => {
    const { result } = renderHook(() => useStreamTripChat('trip-abc', { enabled: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newMessageHandler = onMock.mock.calls.find(([event]) => event === 'message.new')?.[1];
    expect(newMessageHandler).toBeTypeOf('function');

    act(() => {
      newMessageHandler?.({
        message: {
          id: 'reply-1',
          text: 'thread reply',
          parent_id: 'parent-1',
          created_at: '2026-04-23T00:00:01.000Z',
          type: 'regular',
          user: { id: 'user-2' },
        },
      });
    });

    expect(result.current.messages.some(m => m.id === 'reply-1')).toBe(false);
    expect(result.current.messages.some(m => m.id === 'parent-1')).toBe(true);
  });

  it('still inserts top-level messages (no parent_id) into main state', async () => {
    const { result } = renderHook(() => useStreamTripChat('trip-abc', { enabled: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newMessageHandler = onMock.mock.calls.find(([event]) => event === 'message.new')?.[1];

    act(() => {
      newMessageHandler?.({
        message: {
          id: 'top-level-2',
          text: 'another top-level',
          created_at: '2026-04-23T00:00:02.000Z',
          type: 'regular',
          user: { id: 'user-3' },
        },
      });
    });

    expect(result.current.messages.some(m => m.id === 'top-level-2')).toBe(true);
  });

  it('ignores message.updated events for thread replies', async () => {
    const { result } = renderHook(() => useStreamTripChat('trip-abc', { enabled: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updatedHandler = onMock.mock.calls.find(([event]) => event === 'message.updated')?.[1];
    expect(updatedHandler).toBeTypeOf('function');

    const before = result.current.messages;

    act(() => {
      updatedHandler?.({
        message: {
          id: 'some-reply',
          text: 'edited thread reply',
          parent_id: 'parent-1',
          created_at: '2026-04-23T00:00:03.000Z',
          type: 'regular',
          user: { id: 'user-2' },
        },
      });
    });

    expect(result.current.messages).toEqual(before);
  });
});
