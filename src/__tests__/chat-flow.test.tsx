/**
 * chat-flow.test.tsx — Real chat logic tests.
 *
 * Two-tier strategy:
 *
 * Tier 1 — Pure helpers from messageEventModel.ts (no mocks required):
 *   - Ordering by timestamp then lexicographic id
 *   - Non-mutation guarantee
 *   - Contract: sort is not a dedup (callers use existingIds Set)
 *
 * Tier 2 — Hook-level resilience tests on useStreamTripChat:
 *   - upsertMessageInState: duplicate message.new event must not double-render
 *   - backfill merge on reconnect: messages missed during WS_CLOSED are merged
 *     without duplicating already-loaded messages
 *   - idempotency_key dedup: same key does not produce a second state entry
 *   - message.deleted removes from state
 *
 * Mock boundary: vi.mock at the service/module level (same pattern as
 * useTripMembersQuery.test.tsx). Fake channel objects are plain objects with
 * the required interface (same pattern as useUnreadCounts.stream.test.tsx).
 *
 * Hoisting note: vi.mock factories are hoisted above imports by Vitest, so
 * any state they reference must be created via vi.hoisted(). We keep a single
 * `shared` object whose properties are mutated in-place by beforeEach, so the
 * factory closures always see current values through the same object reference.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { MessageResponse } from 'stream-chat';

// Pure-function imports (no mocks needed)
import {
  sortMessagesWithCanonicalOrdering,
  compareCanonicalMessageOrder,
  getMessageSortTimestampMs,
} from '@/hooks/stream/messageEventModel';

/* eslint-disable @typescript-eslint/no-explicit-any -- mock setup */

// Fake channel type used in Tier 2 tests
type EventHandler = (event: { message?: MessageResponse }) => void;

type FakeChannel = {
  id: string;
  type: string;
  data: { own_capabilities: string[] };
  state: { messages: MessageResponse[]; own_capabilities: string[] };
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  watch: ReturnType<typeof vi.fn>;
  query: ReturnType<typeof vi.fn>;
  stopWatching: ReturnType<typeof vi.fn>;
  sendMessage: ReturnType<typeof vi.fn>;
  sendReaction: ReturnType<typeof vi.fn>;
  deleteReaction: ReturnType<typeof vi.fn>;
  _emit: (eventName: string, event: { message?: MessageResponse }) => void;
};

function makeFakeChannel(
  initialMessages: MessageResponse[] = [],
  channelId = 'trip-channel-1',
): FakeChannel {
  const handlers: Record<string, EventHandler[]> = {};
  const stateMessages = [...initialMessages];

  const channel: FakeChannel = {
    id: channelId,
    type: 'chravel-trip',
    data: { own_capabilities: [] },
    state: { messages: stateMessages, own_capabilities: [] },
    on: vi.fn((event: string, handler: EventHandler) => {
      if (!handlers[event]) handlers[event] = [];
      handlers[event].push(handler);
    }),
    off: vi.fn((event: string, handler: EventHandler) => {
      if (handlers[event]) {
        handlers[event] = handlers[event].filter(h => h !== handler);
      }
    }),
    watch: vi.fn().mockResolvedValue({ messages: initialMessages }),
    query: vi.fn().mockResolvedValue({ messages: [] }),
    stopWatching: vi.fn().mockResolvedValue(undefined),
    sendMessage: vi.fn().mockResolvedValue({ message: { id: 'sent-1' } }),
    sendReaction: vi.fn().mockResolvedValue({}),
    deleteReaction: vi.fn().mockResolvedValue({}),
    _emit: (eventName, event) => {
      (handlers[eventName] || []).forEach(h => h(event));
    },
  };

  return channel;
}

// vi.hoisted: runs before vi.mock factories so they can reference these values.
// We mutate properties in-place; never reassign the object reference.
const shared = vi.hoisted(() => {
  const connectionStatusCallbacks: Array<(isConnected: boolean) => void> = [];
  const connectedCallbacks: Array<() => void> = [];

  const streamClient = {
    userID: 'stream-user-1',
    channel: vi.fn((_type: string, _id: string) => null as any),
    partialUpdateMessage: vi.fn().mockResolvedValue({ message: null }),
  };

  return { streamClient, connectionStatusCallbacks, connectedCallbacks };
});

vi.mock('@/services/stream/streamClient', () => ({
  getStreamClient: vi.fn(() => shared.streamClient),
  getStreamApiKey: vi.fn(() => 'test-api-key'),
  connectStreamClient: vi.fn().mockResolvedValue(shared.streamClient),
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

vi.mock('@/services/stream/streamCanary', () => ({
  isStreamCanaryEnabledForUser: vi.fn().mockResolvedValue(false),
  reportStreamCanaryIncident: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/services/stream/streamChannelFactory', () => ({
  CHANNEL_TYPE_TRIP: 'chravel-trip',
  tripChannelId: (tripId: string) => `trip-${tripId}`,
}));

vi.mock('@/services/stream/streamMessagePayload', () => ({
  buildTripStreamMessagePayload: vi.fn().mockReturnValue({
    ok: true,
    payload: { text: 'hello', type: 'regular' },
    normalizedContent: 'hello',
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'stream-user-1', email: 'test@example.com' } }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
  toast: vi.fn(),
}));

vi.mock('@/telemetry/events', () => ({
  messageEvents: {
    sent: vi.fn(),
    sendFailed: vi.fn(),
    sendFailedAsync: vi.fn(),
  },
  streamReliabilityEvents: {
    timeToFirstMessage: vi.fn(),
    reconnectBackfill: vi.fn(),
    membershipRecoveryAttempt: vi.fn(),
  },
}));

vi.mock('@/telemetry/service', () => ({
  telemetry: { track: vi.fn(), identify: vi.fn(), reset: vi.fn() },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    }),
    removeChannel: vi.fn(),
    removeAllChannels: vi.fn(),
  },
}));

/* eslint-enable @typescript-eslint/no-explicit-any */

// Import SUT after all vi.mock calls
import { useStreamTripChat } from '@/hooks/stream/useStreamTripChat';

// Minimal MessageResponse factory
let _msgSeq = 0;
function makeMsg(
  overrides: Partial<MessageResponse> & { idempotency_key?: string } = {},
): MessageResponse {
  _msgSeq += 1;
  const id = overrides.id ?? `msg-${_msgSeq}`;
  const created_at =
    overrides.created_at ?? new Date(1_700_000_000_000 + _msgSeq * 1000).toISOString();
  return {
    id,
    text: `Message ${_msgSeq}`,
    type: 'regular',
    created_at,
    updated_at: created_at,
    ...overrides,
  } as MessageResponse;
}

// =============================================================================
// TIER 1 — Pure helper tests
// =============================================================================

describe('messageEventModel — pure helpers', () => {
  beforeEach(() => {
    _msgSeq = 0;
  });

  describe('getMessageSortTimestampMs', () => {
    it('returns 0 for a message with no created_at', () => {
      expect(getMessageSortTimestampMs({ id: 'x' } as MessageResponse)).toBe(0);
    });

    it('returns 0 for an invalid created_at string', () => {
      expect(
        getMessageSortTimestampMs({ id: 'x', created_at: 'not-a-date' } as MessageResponse),
      ).toBe(0);
    });

    it('returns correct epoch ms for a valid ISO timestamp', () => {
      const ts = '2024-01-01T10:00:00.000Z';
      expect(getMessageSortTimestampMs({ id: 'x', created_at: ts } as MessageResponse)).toBe(
        new Date(ts).getTime(),
      );
    });
  });

  describe('compareCanonicalMessageOrder', () => {
    it('sorts older message before newer', () => {
      const older = makeMsg({ id: 'a', created_at: '2024-01-01T10:00:00Z' });
      const newer = makeMsg({ id: 'b', created_at: '2024-01-01T11:00:00Z' });
      expect(compareCanonicalMessageOrder(older, newer)).toBeLessThan(0);
      expect(compareCanonicalMessageOrder(newer, older)).toBeGreaterThan(0);
    });

    it('breaks timestamp ties by lexicographic id', () => {
      const ts = '2024-01-01T10:00:00Z';
      const msgA = makeMsg({ id: 'aaa', created_at: ts });
      const msgB = makeMsg({ id: 'bbb', created_at: ts });
      expect(compareCanonicalMessageOrder(msgA, msgB)).toBeLessThan(0);
      expect(compareCanonicalMessageOrder(msgB, msgA)).toBeGreaterThan(0);
    });

    it('returns 0 for identical id and timestamp', () => {
      const msg = makeMsg({ id: 'same', created_at: '2024-01-01T10:00:00Z' });
      expect(compareCanonicalMessageOrder(msg, { ...msg })).toBe(0);
    });
  });

  describe('sortMessagesWithCanonicalOrdering', () => {
    it('sorts a shuffled array into chronological order', () => {
      const m1 = makeMsg({ id: 'a', created_at: '2024-01-01T10:00:00Z' });
      const m2 = makeMsg({ id: 'b', created_at: '2024-01-01T10:01:00Z' });
      const m3 = makeMsg({ id: 'c', created_at: '2024-01-01T10:02:00Z' });
      const sorted = sortMessagesWithCanonicalOrdering([m3, m1, m2]);
      expect(sorted.map(m => m.id)).toEqual(['a', 'b', 'c']);
    });

    it('does not mutate the input array', () => {
      const m1 = makeMsg({ id: 'x', created_at: '2024-01-01T10:01:00Z' });
      const m2 = makeMsg({ id: 'y', created_at: '2024-01-01T10:00:00Z' });
      const input = [m1, m2];
      const snapshot = [...input];
      sortMessagesWithCanonicalOrdering(input);
      expect(input).toEqual(snapshot);
    });

    it('documents sort-is-not-dedup contract: equal-id objects both survive', () => {
      // upsertMessageInState uses existingIds Set before calling sort.
      // The sort function must not silently drop entries.
      const msg = makeMsg({ id: 'dup', created_at: '2024-01-01T10:00:00Z' });
      const result = sortMessagesWithCanonicalOrdering([msg, { ...msg }]);
      expect(result).toHaveLength(2);
    });
  });
});

// =============================================================================
// TIER 2 — Hook-level resilience tests (useStreamTripChat)
// =============================================================================

describe('useStreamTripChat — resilience behaviour', () => {
  const TRIP_ID = 'trip-abc';

  beforeEach(() => {
    _msgSeq = 0;
    // Clear callback arrays in-place so vi.mock factory closures stay bound
    shared.connectionStatusCallbacks.length = 0;
    shared.connectedCallbacks.length = 0;
    // Reset stream client channel mock so each test supplies its own fake
    shared.streamClient.channel.mockReset();
    shared.streamClient.partialUpdateMessage.mockReset();
    shared.streamClient.partialUpdateMessage.mockResolvedValue({ message: null });
  });

  describe('upsertMessageInState — dedup by message id', () => {
    it('ignores a second message.new event with the same message id', async () => {
      const msg = makeMsg({ id: 'unique-msg-1', created_at: '2024-01-01T10:00:00Z' });
      const channel = makeFakeChannel([msg]);
      shared.streamClient.channel.mockReturnValue(channel);
      channel.watch.mockResolvedValue({ messages: [msg] });

      const { result } = renderHook(() => useStreamTripChat(TRIP_ID));
      await vi.waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 3000 });

      const countBefore = result.current.messages.length;

      // Re-receipt of same message (echo / WS duplicate)
      act(() => {
        channel._emit('message.new', { message: msg });
      });

      expect(result.current.messages.length).toBe(countBefore);
      expect(result.current.messages.filter(m => m.id === msg.id)).toHaveLength(1);
    });

    it('adds a genuinely new message that arrives via message.new', async () => {
      const existing = makeMsg({ id: 'existing-1', created_at: '2024-01-01T10:00:00Z' });
      const channel = makeFakeChannel([existing]);
      shared.streamClient.channel.mockReturnValue(channel);
      channel.watch.mockResolvedValue({ messages: [existing] });

      const { result } = renderHook(() => useStreamTripChat(TRIP_ID));
      await vi.waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 3000 });

      const incoming = makeMsg({ id: 'new-incoming', created_at: '2024-01-01T10:01:00Z' });
      act(() => {
        channel._emit('message.new', { message: incoming });
      });

      expect(result.current.messages.some(m => m.id === 'new-incoming')).toBe(true);
      expect(result.current.messages).toHaveLength(2);
    });
  });

  describe('backfillMissedMessages — reconnect merge', () => {
    it('merges missed messages without duplicating already-loaded ones', async () => {
      const existing = makeMsg({ id: 'pre-1', created_at: '2024-01-01T10:00:00Z' });
      const missed = makeMsg({ id: 'missed-1', created_at: '2024-01-01T10:02:00Z' });
      const channel = makeFakeChannel([existing]);
      shared.streamClient.channel.mockReturnValue(channel);
      channel.watch.mockResolvedValue({ messages: [existing] });
      // Server returns both pre-existing and missed message
      channel.query.mockResolvedValue({ messages: [existing, missed] });

      const { result } = renderHook(() => useStreamTripChat(TRIP_ID));
      await vi.waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 3000 });

      act(() => {
        shared.connectionStatusCallbacks.forEach(cb => cb(true));
      });

      await vi.waitFor(
        () => expect(result.current.messages.some(m => m.id === 'missed-1')).toBe(true),
        { timeout: 3000 },
      );

      // pre-1 must appear exactly once after backfill
      expect(result.current.messages.filter(m => m.id === 'pre-1')).toHaveLength(1);
      expect(result.current.messages).toHaveLength(2);
    });

    it('leaves state unchanged when backfill returns an empty result', async () => {
      const existing = makeMsg({ id: 'only-1', created_at: '2024-01-01T10:00:00Z' });
      const channel = makeFakeChannel([existing]);
      shared.streamClient.channel.mockReturnValue(channel);
      channel.watch.mockResolvedValue({ messages: [existing] });
      channel.query.mockResolvedValue({ messages: [] });

      const { result } = renderHook(() => useStreamTripChat(TRIP_ID));
      await vi.waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 3000 });

      act(() => {
        shared.connectionStatusCallbacks.forEach(cb => cb(true));
      });

      await new Promise(resolve => setTimeout(resolve, 60));

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].id).toBe('only-1');
    });
  });

  describe('upsertMessageInState — idempotency_key dedup', () => {
    it('does not add a second entry when two message.new events share an idempotency_key', async () => {
      const channel = makeFakeChannel([]);
      shared.streamClient.channel.mockReturnValue(channel);
      channel.watch.mockResolvedValue({ messages: [] });

      const { result } = renderHook(() => useStreamTripChat(TRIP_ID));
      await vi.waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 3000 });

      const idempotencyKey = 'ikey-abc-123';
      const msg = {
        ...makeMsg({ id: 'idem-msg-1', created_at: '2024-01-01T10:00:00Z' }),
        idempotency_key: idempotencyKey,
      } as MessageResponse & { idempotency_key: string };

      act(() => {
        channel._emit('message.new', { message: msg });
      });
      expect(result.current.messages).toHaveLength(1);

      act(() => {
        channel._emit('message.new', { message: { ...msg } });
      });
      expect(result.current.messages).toHaveLength(1);
    });
  });

  describe('message.deleted event', () => {
    it('removes the deleted message from the messages list', async () => {
      const msg = makeMsg({ id: 'to-delete', created_at: '2024-01-01T10:00:00Z' });
      const channel = makeFakeChannel([msg]);
      shared.streamClient.channel.mockReturnValue(channel);
      channel.watch.mockResolvedValue({ messages: [msg] });

      const { result } = renderHook(() => useStreamTripChat(TRIP_ID));
      await vi.waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 3000 });

      expect(result.current.messages.some(m => m.id === 'to-delete')).toBe(true);

      act(() => {
        channel._emit('message.deleted', { message: msg });
      });

      expect(result.current.messages.some(m => m.id === 'to-delete')).toBe(false);
    });
  });
});
