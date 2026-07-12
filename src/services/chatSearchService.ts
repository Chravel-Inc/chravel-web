/**
 * Chat Search Service
 * Provides safe search across Messages and Broadcasts ONLY
 * CRITICAL: Never accesses channels, channel_messages, or channel_members
 *
 * Broadcasts are sourced from Stream (message_type='broadcast' on the trip
 * channel) — the same transport the chat's Broadcasts tab renders — NOT from
 * the legacy `broadcasts` table. The table previously fed this search, which
 * made search results diverge from what the tabs displayed. The table remains
 * write-only from chat's perspective pending full retirement (see migration
 * 20260712010000_deprecate_broadcasts_table.sql for the two-phase plan).
 */
import { supabase } from '@/integrations/supabase/client';
import { getStreamClient } from '@/services/stream/streamClient';
import { CHANNEL_TYPE_TRIP, tripChannelId } from '@/services/stream/streamChannelFactory';
import {
  fetchTripBroadcastHistory,
  searchTripChannelMessages,
} from '@/services/stream/streamMessageSearch';
import type { ParsedMessageSearchQuery } from '@/lib/parseMessageSearchQuery';

export interface MessageSearchResult {
  id: string;
  content: string;
  author_name: string;
  user_id: string | null;
  created_at: string;
  parent_message_id?: string;
  type: 'message';
}

export interface BroadcastSearchResult {
  id: string;
  message: string;
  created_by: string;
  created_by_name: string;
  priority: string | null;
  created_at: string;
  type: 'broadcast';
}

/**
 * Resolve sender name to user_id(s) by matching trip members.
 * Partial match: "Coach" matches "Coach Mike".
 * Deterministic: exact > startsWith > contains.
 */
export async function resolveSenderNameToIds(
  tripId: string,
  senderName: string,
): Promise<string[]> {
  if (!senderName.trim()) return [];

  const { data: members } = await supabase
    .from('trip_members')
    .select('user_id')
    .eq('trip_id', tripId);

  const userIds = [...new Set((members || []).map(m => m.user_id).filter(Boolean))] as string[];
  if (userIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from('profiles_public')
    .select('user_id, display_name, resolved_display_name, first_name, last_name')
    .in('user_id', userIds);

  const query = senderName.trim().toLowerCase();
  const matches: Array<{ user_id: string; rank: number }> = [];

  for (const p of profiles || []) {
    const resolved = (p.resolved_display_name || p.display_name || '').trim();
    const display = (p.display_name || '').trim();
    const fullName = `${(p.first_name || '').trim()} ${(p.last_name || '').trim()}`.trim();
    const candidates = [resolved, display, fullName].filter(Boolean);

    for (const name of candidates) {
      const lower = name.toLowerCase();
      if (lower === query) {
        matches.push({ user_id: p.user_id, rank: 0 });
        break;
      }
      if (lower.startsWith(query)) {
        matches.push({ user_id: p.user_id, rank: 1 });
        break;
      }
      if (lower.includes(query)) {
        matches.push({ user_id: p.user_id, rank: 2 });
        break;
      }
    }
  }

  if (matches.length === 0) return [];

  matches.sort((a, b) => a.rank - b.rank);
  const bestRank = matches[0].rank;
  return matches.filter(m => m.rank === bestRank).map(m => m.user_id);
}

/**
 * Search trip messages - NEVER accesses channel data
 */
export async function searchTripMessages(
  tripId: string,
  query: string,
  limit: number = 50,
): Promise<MessageSearchResult[]> {
  if (!query.trim()) return [];

  // Delegate to the canonical Stream search helper instead of reinventing the
  // getStreamClient()→channel.search() pipeline (which had drifted out of test coverage).
  // Map the normalized StreamMessageSearchHit shape onto MessageSearchResult.
  const hits = await searchTripChannelMessages({ tripId, query, limit });
  return hits.map(hit => ({
    id: hit.messageId,
    content: hit.text,
    author_name: hit.authorName,
    user_id: hit.authorId,
    created_at: hit.createdAt || new Date().toISOString(),
    parent_message_id: hit.threadParentId,
    type: 'message' as const,
  }));
}

/**
 * Load broadcast messages from Stream and map to the search result shape.
 * Stream user ids ARE Supabase user ids (stream-token upserts users by
 * auth id), so created_by remains filterable against trip members, and the
 * sender name rides along on the message — no profiles round-trip needed.
 */
async function fetchStreamBroadcastResults(
  tripId: string,
  limit: number,
): Promise<BroadcastSearchResult[]> {
  const messages = await fetchTripBroadcastHistory({ tripId, limit });
  return messages.map(message => ({
    id: message.id,
    message: message.text || '',
    created_by: message.user?.id || '',
    created_by_name: message.user?.name || message.user?.id || 'Unknown',
    priority: (message as { priority?: string }).priority ?? null,
    created_at:
      typeof message.created_at === 'string' ? message.created_at : new Date().toISOString(),
    type: 'broadcast' as const,
  }));
}

/**
 * Search broadcasts - sourced from Stream, matching what the Broadcasts tab shows
 */
export async function searchBroadcasts(
  tripId: string,
  query: string,
  limit: number = 50,
): Promise<BroadcastSearchResult[]> {
  if (!query.trim()) return [];

  const broadcasts = await fetchStreamBroadcastResults(tripId, limit);
  const normalizedQuery = query.trim().toLowerCase();
  return broadcasts.filter(b => b.message.toLowerCase().includes(normalizedQuery));
}

/**
 * Search trip messages with filters (sender only)
 */
async function searchTripMessagesWithFilters(
  tripId: string,
  parsed: ParsedMessageSearchQuery,
  limit: number = 50,
): Promise<MessageSearchResult[]> {
  const textQuery = parsed.text.trim();
  if (!textQuery && !parsed.sender) return [];

  let streamResults: MessageSearchResult[] = [];

  if (textQuery) {
    streamResults = await searchTripMessages(tripId, textQuery, limit);
  } else {
    const client = getStreamClient();
    if (!client?.userID) return [];

    try {
      const channel = client.channel(CHANNEL_TYPE_TRIP, tripChannelId(tripId));
      const state = await channel.query({ messages: { limit } });
      streamResults = (
        (state.messages || []) as Array<{
          id: string;
          text?: string;
          user?: { id?: string; name?: string };
          created_at?: string;
        }>
      ).map(message => ({
        id: message.id,
        content: message.text || '',
        // 'User' matches the canonical mapChannelSearchHit fallback used by the text-search path
        // (via searchTripChannelMessages) so both paths render the same placeholder.
        author_name: message.user?.name || message.user?.id || 'User',
        user_id: message.user?.id || null,
        created_at: message.created_at || new Date().toISOString(),
        parent_message_id: (message as { parent_id?: string }).parent_id || undefined,
        type: 'message' as const,
      }));
    } catch {
      return [];
    }
  }

  if (!parsed.sender) return streamResults;

  const senderIds = await resolveSenderNameToIds(tripId, parsed.sender);
  if (senderIds.length === 0) return [];

  return streamResults.filter(m => m.user_id && senderIds.includes(m.user_id));
}

/**
 * Search broadcasts with filters (sender only)
 * When allowEmptyContent (e.g. user typed "broadcast" only), return all matching broadcasts.
 */
async function searchBroadcastsWithFilters(
  tripId: string,
  parsed: ParsedMessageSearchQuery,
  limit: number = 50,
  allowEmptyContent: boolean = false,
): Promise<BroadcastSearchResult[]> {
  const hasAnyFilter = parsed.text.trim() || parsed.sender;

  if (!hasAnyFilter && !allowEmptyContent) return [];

  let results = await fetchStreamBroadcastResults(tripId, limit);

  if (parsed.text.trim()) {
    const normalizedText = parsed.text.trim().toLowerCase();
    results = results.filter(b => b.message.toLowerCase().includes(normalizedText));
  }

  if (parsed.sender) {
    const senderIds = await resolveSenderNameToIds(tripId, parsed.sender);
    if (senderIds.length === 0) return [];
    results = results.filter(b => senderIds.includes(b.created_by));
  }

  return results;
}

/**
 * Search both messages and broadcasts simultaneously
 */
export async function searchChatContent(
  tripId: string,
  query: string,
): Promise<{
  messages: MessageSearchResult[];
  broadcasts: BroadcastSearchResult[];
}> {
  const [messages, broadcasts] = await Promise.all([
    searchTripMessages(tripId, query),
    searchBroadcasts(tripId, query),
  ]);

  return { messages, broadcasts };
}

/**
 * Search with parsed filters (sender, broadcast-only, weekday, date range).
 * When isBroadcastOnly: only search broadcasts, skip messages.
 * Backward compatible: if no filters and plain text, behaves like searchChatContent.
 */
export async function searchChatContentWithFilters(
  tripId: string,
  parsed: ParsedMessageSearchQuery,
): Promise<{
  messages: MessageSearchResult[];
  broadcasts: BroadcastSearchResult[];
}> {
  const hasFilters = parsed.sender || parsed.isBroadcastOnly;

  if (!hasFilters && parsed.text.trim()) {
    return searchChatContent(tripId, parsed.text);
  }

  const searchMessages = !parsed.isBroadcastOnly;
  const searchBroadcastsFlag = true;

  const allowEmptyBroadcast = parsed.isBroadcastOnly && !parsed.text.trim() && !parsed.sender;

  const [messages, broadcasts] = await Promise.all([
    searchMessages ? searchTripMessagesWithFilters(tripId, parsed) : Promise.resolve([]),
    searchBroadcastsFlag
      ? searchBroadcastsWithFilters(tripId, parsed, 50, allowEmptyBroadcast)
      : Promise.resolve([]),
  ]);

  return { messages, broadcasts };
}
