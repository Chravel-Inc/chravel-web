/**
 * useStreamProChannel — reconnect backfill tests
 *
 * Verifies that messages missed during a WebSocket disconnection are fetched
 * and merged — without duplicates — when the connection recovers.
 *
 * Follows the established vi.hoisted shared-object pattern from chat-flow.test.tsx:
 *   - A single `shared` object mutated in-place (never reassigned)
 *   - vi.mock factories reference `shared` through a stable closure
 *   - Tests fire reconnect by invoking captured callbacks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// vi.hoisted: runs before vi.mock factories — all state must live here.
// Mutate properties in-place; NEVER reassign the object reference.
const shared = vi.hoisted(() => {
  const connectionStatusCallbacks: Array<(isConnected: boolean) => void> = [];
  const connectedCallbacks: Array<() => void> = [];

  const channelHandlers: Record<string, Array<(e: unknown) => void>> = {};

  const fakeChannel = {
    id: 'channel-123',
    state: { messages: [] as Array<Record<string, unknown>> },
    watch: vi.fn().mockResolvedValue({ messages: [] }),
    query: vi.fn().mockResolvedValue({ messages: [] }),
    stopWatching: vi.fn().mockResolvedValue(undefined),
    sendMessage: vi.fn().mockResolvedValue({ message: { id: 'sent-1' } }),
    on: vi.fn((event: string, handler: (e: unknown) => void) => {
      if (!channelHandlers[event]) channelHandlers[event] = [];
      channelHandlers[event].push(handler);
    }),
    off: vi.fn((event: string, handler: (e: unknown) => void) => {
      if (channelHandlers[event]) {
        channelHandlers[event] = channelHandlers[event].filter(h => h !== handler);
      }
    }),
    _emit(eventName: string, event: unknown) {
      (channelHandlers[eventName] || []).forEach(h => h(event));
    },
    _resetHandlers() {
      Object.keys(channelHandlers).forEach(k => {
        channelHandlers[k].length = 0;
      });
    },
  };

  const streamClient = {
    userID: 'user-1',
    channel: vi.fn(() => fakeChannel),
  };

  return {
    streamClient,
    fakeChannel,
    connectionStatusCallbacks,
    connectedCallbacks,
  };
});

vi.mock('@/services/stream/streamClient', () => ({
  getStreamClient: vi.fn(() => shared.streamClient),
  onStreamClientConnected: vi.fn((cb: () => void) => {
    shared.connectedCallbacks.push(cb);
    return () => {
      const idx = shared.connectedCallbacks.indexOf(cb);
      if (idx >= 0) shared.connectedCallbacks.splice(idx, 1);
    };
  }),
  onStreamClientConnectionStatusChange: vi.fn((cb: (isConnected: boolean) => void) => {
    shared.connectionStatusCallbacks.push(cb);
    return () => {
      const idx = shared.connectionStatusCallbacks.indexOf(cb);
      if (idx >= 0) shared.connectionStatusCallbacks.splice(idx, 1);
    };
  }),
}));

vi.mock('@/services/stream/streamChannelFactory', () => ({
  CHANNEL_TYPE_CHANNEL: 'chravel-channel',
  proChannelId: (id: string) => `channel-${id}`,
}));

// Import SUT after all vi.mock calls
import { useStreamProChannel } from '../useStreamProChannel';

const MSG_A = {
  id: 'msg-a',
  text: 'before disconnect',
  created_at: '2026-01-01T10:00:00.000Z',
  type: 'regular',
};
const MSG_B = {
  id: 'msg-b',
  text: 'missed during disconnect',
  created_at: '2026-01-01T11:00:00.000Z',
  type: 'regular',
};

describe('useStreamProChannel — reconnect backfill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset callback arrays in-place (never reassign)
    shared.connectionStatusCallbacks.length = 0;
    shared.connectedCallbacks.length = 0;
    shared.fakeChannel._resetHandlers();
    shared.fakeChannel.watch.mockResolvedValue({ messages: [] });
    shared.fakeChannel.query.mockResolvedValue({ messages: [] });
    shared.streamClient.channel.mockReturnValue(shared.fakeChannel);
  });

  it('(a) initial load populates messages from channel.watch', async () => {
    shared.fakeChannel.watch.mockResolvedValue({ messages: [MSG_A] });

    const { result } = renderHook(() => useStreamProChannel('channel-1'));

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
    });

    expect(result.current.messages[0].id).toBe('msg-a');
    expect(result.current.isLoading).toBe(false);
  });

  it('(b) on reconnect, missed messages are backfilled and merged without duplicates', async () => {
    shared.fakeChannel.watch.mockResolvedValue({ messages: [MSG_A] });

    const { result } = renderHook(() => useStreamProChannel('channel-1'));

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
    });

    // Backfill returns MSG_A (already loaded) + MSG_B (missed)
    shared.fakeChannel.query.mockResolvedValueOnce({ messages: [MSG_A, MSG_B] });

    await act(async () => {
      shared.connectionStatusCallbacks.forEach(cb => cb(true));
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });

    const ids = result.current.messages.map(m => m.id);
    expect(ids).toContain('msg-a');
    expect(ids).toContain('msg-b');
    // MSG_A must appear exactly once
    expect(ids.filter(id => id === 'msg-a')).toHaveLength(1);
  });

  it('(b) backfill queries with created_at_after the latest loaded message timestamp', async () => {
    shared.fakeChannel.watch.mockResolvedValue({ messages: [MSG_A] });

    const { result } = renderHook(() => useStreamProChannel('channel-1'));

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
    });

    shared.fakeChannel.query.mockClear();
    shared.fakeChannel.query.mockResolvedValueOnce({ messages: [] });

    await act(async () => {
      shared.connectionStatusCallbacks.forEach(cb => cb(true));
    });

    expect(shared.fakeChannel.query).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.objectContaining({
          created_at_after: MSG_A.created_at,
          limit: 100,
        }),
      }),
    );
  });

  it('(b) no backfill query is fired before initial hydration completes', async () => {
    // watch never resolves — hook stays in loading state
    shared.fakeChannel.watch.mockReturnValue(new Promise(() => {}));

    renderHook(() => useStreamProChannel('channel-1'));

    await act(async () => {
      shared.connectionStatusCallbacks.forEach(cb => cb(true));
    });

    // query should not have been called with created_at_after (backfill guard)
    const backfillCalls = shared.fakeChannel.query.mock.calls.filter(
      (call: unknown[]) =>
        call[0] &&
        typeof call[0] === 'object' &&
        (call[0] as Record<string, unknown>).messages &&
        'created_at_after' in
          ((call[0] as Record<string, unknown>).messages as Record<string, unknown>),
    );
    expect(backfillCalls).toHaveLength(0);
  });

  it('(b) hook remains stable when backfill query throws', async () => {
    shared.fakeChannel.watch.mockResolvedValue({ messages: [MSG_A] });

    const { result } = renderHook(() => useStreamProChannel('channel-1'));

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
    });

    shared.fakeChannel.query.mockRejectedValueOnce(new Error('Stream query failed'));

    await act(async () => {
      shared.connectionStatusCallbacks.forEach(cb => cb(true));
    });

    // State unchanged after a failed backfill
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].id).toBe('msg-a');
  });

  it('(b) merged messages are sorted chronologically after backfill', async () => {
    const MSG_EARLY = {
      id: 'msg-early',
      text: 'early',
      created_at: '2026-01-01T09:00:00.000Z',
      type: 'regular',
    };

    shared.fakeChannel.watch.mockResolvedValue({ messages: [MSG_A] }); // 10:00

    const { result } = renderHook(() => useStreamProChannel('channel-1'));

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
    });

    // Backfill returns later msg + an earlier one
    shared.fakeChannel.query.mockResolvedValueOnce({ messages: [MSG_B, MSG_EARLY] });

    await act(async () => {
      shared.connectionStatusCallbacks.forEach(cb => cb(true));
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(3);
    });

    const [first, second, third] = result.current.messages;
    expect(first.id).toBe('msg-early'); // 09:00
    expect(second.id).toBe('msg-a'); // 10:00
    expect(third.id).toBe('msg-b'); // 11:00
  });

  it('(c) connection status listeners are cleaned up on unmount (no leak)', async () => {
    shared.fakeChannel.watch.mockResolvedValue({ messages: [MSG_A] });

    const { unmount } = renderHook(() => useStreamProChannel('channel-1'));

    await waitFor(() => {
      expect(shared.connectionStatusCallbacks.length).toBeGreaterThan(0);
    });

    unmount();

    // After unmount, all captured callbacks should have been removed
    expect(shared.connectionStatusCallbacks).toHaveLength(0);
    expect(shared.connectedCallbacks).toHaveLength(0);
  });
});
