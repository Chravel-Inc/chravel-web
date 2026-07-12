/**
 * Tests for Chat Search Service - Message/Broadcast search with filters
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  resolveSenderNameToIds,
  searchChatContentWithFilters,
  searchChatContent,
} from '../chatSearchService';
import { supabase } from '@/integrations/supabase/client';

const searchTripChannelMessagesMock = vi.hoisted(() => vi.fn());
const fetchTripBroadcastHistoryMock = vi.hoisted(() => vi.fn());

const createChainMock = (resolvedValue: { data: unknown; error: unknown }) => {
  const promise = Promise.resolve(resolvedValue);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: Record<string, any> = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    ilike: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    is: vi.fn(),
    or: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    then: (onFulfilled: (v: unknown) => unknown) => promise.then(onFulfilled),
    catch: (onRejected: (e: unknown) => unknown) => promise.catch(onRejected),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.ilike.mockReturnValue(chain);
  chain.gte.mockReturnValue(chain);
  chain.lte.mockReturnValue(chain);
  chain.is.mockReturnValue(chain);
  chain.or.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  return chain;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/services/stream/streamMessageSearch', () => ({
  searchTripChannelMessages: (...args: unknown[]) => searchTripChannelMessagesMock(...args),
  fetchTripBroadcastHistory: (...args: unknown[]) => fetchTripBroadcastHistoryMock(...args),
}));

describe('chatSearchService', () => {
  const tripId = 'trip-123';

  beforeEach(() => {
    vi.clearAllMocks();
    searchTripChannelMessagesMock.mockResolvedValue([]);
    fetchTripBroadcastHistoryMock.mockResolvedValue([]);
  });

  describe('resolveSenderNameToIds', () => {
    it('returns matching user_ids for partial name match', async () => {
      (supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(
          createChainMock({
            data: [{ user_id: 'u1' }, { user_id: 'u2' }],
            error: null,
          }),
        )
        .mockReturnValueOnce(
          createChainMock({
            data: [
              { user_id: 'u1', resolved_display_name: 'Coach Mike', display_name: 'Coach' },
              { user_id: 'u2', resolved_display_name: 'Alice', display_name: 'Alice' },
            ],
            error: null,
          }),
        );

      const ids = await resolveSenderNameToIds(tripId, 'Coach');
      expect(ids).toContain('u1');
      expect(ids).not.toContain('u2');
    });

    it('returns empty when no match', async () => {
      (supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(createChainMock({ data: [{ user_id: 'u1' }], error: null }))
        .mockReturnValueOnce(
          createChainMock({
            data: [{ user_id: 'u1', resolved_display_name: 'Alice' }],
            error: null,
          }),
        );

      const ids = await resolveSenderNameToIds(tripId, 'UnknownPerson');
      expect(ids).toEqual([]);
    });

    it('returns empty for empty sender name', async () => {
      const ids = await resolveSenderNameToIds(tripId, '');
      expect(ids).toEqual([]);
    });
  });

  describe('searchChatContentWithFilters', () => {
    it('delegates to searchChatContent for plain text (backward compat)', async () => {
      searchTripChannelMessagesMock.mockResolvedValue([
        {
          messageId: 'm1',
          text: 'hello',
          authorName: 'A',
          authorId: 'u1',
          tripId,
          channelType: 'chravel-trip',
          channelId: `trip-${tripId}`,
          createdAt: '2026-01-01',
        },
      ]);

      const result = await searchChatContentWithFilters(tripId, {
        text: 'hello',
      });
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].content).toBe('hello');
    });

    it('returns only broadcasts when isBroadcastOnly (sourced from Stream)', async () => {
      fetchTripBroadcastHistoryMock.mockResolvedValue([
        {
          id: 'b1',
          text: 'Announcement',
          user: { id: 'u1', name: 'Coach' },
          priority: 'normal',
          created_at: '2026-01-15T00:00:00.000Z',
          message_type: 'broadcast',
        },
      ]);

      const result = await searchChatContentWithFilters(tripId, {
        text: '',
        isBroadcastOnly: true,
      });
      expect(fetchTripBroadcastHistoryMock).toHaveBeenCalledWith({ tripId, limit: 50 });
      expect(result.messages).toHaveLength(0);
      expect(result.broadcasts).toHaveLength(1);
      expect(result.broadcasts[0]).toMatchObject({
        id: 'b1',
        message: 'Announcement',
        created_by: 'u1',
        created_by_name: 'Coach',
        priority: 'normal',
        type: 'broadcast',
      });
    });

    it('filters Stream broadcasts by sender', async () => {
      fetchTripBroadcastHistoryMock.mockResolvedValue([
        {
          id: 'b1',
          text: 'From coach',
          user: { id: 'u1', name: 'Coach Mike' },
          created_at: '2026-01-15T00:00:00.000Z',
        },
        {
          id: 'b2',
          text: 'From someone else',
          user: { id: 'u2', name: 'Alice' },
          created_at: '2026-01-16T00:00:00.000Z',
        },
      ]);
      // resolveSenderNameToIds: trip_members then profiles_public
      (supabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(
          createChainMock({ data: [{ user_id: 'u1' }, { user_id: 'u2' }], error: null }),
        )
        .mockReturnValueOnce(
          createChainMock({
            data: [
              { user_id: 'u1', resolved_display_name: 'Coach Mike' },
              { user_id: 'u2', resolved_display_name: 'Alice' },
            ],
            error: null,
          }),
        );

      const result = await searchChatContentWithFilters(tripId, {
        text: '',
        sender: 'Coach',
        isBroadcastOnly: true,
      });
      expect(result.broadcasts).toHaveLength(1);
      expect(result.broadcasts[0].id).toBe('b1');
    });
  });

  describe('searchChatContent (legacy)', () => {
    it('searches messages and broadcasts by text', async () => {
      searchTripChannelMessagesMock.mockResolvedValue([
        {
          messageId: 'm1',
          text: 'test',
          authorName: 'A',
          authorId: 'u1',
          tripId,
          channelType: 'chravel-trip',
          channelId: `trip-${tripId}`,
          createdAt: '2026-01-01',
        },
      ]);

      fetchTripBroadcastHistoryMock.mockResolvedValue([
        {
          id: 'b1',
          text: 'test announcement',
          user: { id: 'u1', name: 'A' },
          created_at: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'b2',
          text: 'unrelated broadcast',
          user: { id: 'u1', name: 'A' },
          created_at: '2026-01-02T00:00:00.000Z',
        },
      ]);

      const result = await searchChatContent(tripId, 'test');
      expect(result.messages).toHaveLength(1);
      // Text filter applies client-side over the Stream broadcast history.
      expect(result.broadcasts).toHaveLength(1);
      expect(result.broadcasts[0].id).toBe('b1');
    });
  });
});
