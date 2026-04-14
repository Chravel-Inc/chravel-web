import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStreamBroadcasts } from '../useStreamBroadcasts';

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
  state: { messages: [] as Array<Record<string, unknown>> },
};

vi.mock('@/services/stream/streamClient', () => ({
  getStreamClient: vi.fn(() => ({
    userID: 'user-1',
    channel: vi.fn(() => mockChannel),
  })),
  onStreamClientConnected: vi.fn(() => () => undefined),
}));

describe('useStreamBroadcasts priority normalization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    watchMock.mockResolvedValue({
      messages: [
        {
          id: 'msg-1',
          text: 'legacy priority message',
          priority: 'important',
          extra_data: {},
        },
      ],
    });
  });

  it('normalizes legacy incoming priority aliases to canonical set', async () => {
    const { result } = renderHook(() => useStreamBroadcasts('trip-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect((result.current.broadcasts[0] as any)?.priority).toBe('reminder');
    expect(
      ((result.current.broadcasts[0] as any)?.extra_data as Record<string, unknown>)?.priority,
    ).toBe('reminder');
  });

  it('sends canonical priority values even when caller passes legacy alias', async () => {
    const { result } = renderHook(() => useStreamBroadcasts('trip-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.sendBroadcast('hello', 'important', { recipients: 'everyone' });
    });

    expect(sendMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'hello',
        priority: 'reminder',
        extra_data: expect.objectContaining({
          recipients: 'everyone',
          priority: 'reminder',
        }),
        metadata: expect.objectContaining({
          recipients: 'everyone',
          priority: 'reminder',
        }),
      }),
    );
  });
});
