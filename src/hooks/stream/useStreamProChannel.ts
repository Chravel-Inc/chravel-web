/**
 * useStreamProChannel — Stream-backed Pro channel messaging
 *
 * Provides message loading, sending, and realtime for a Pro channel
 * via Stream. Channel list still comes from Supabase (trip_channels table).
 * Only message transport moves to Stream.
 *
 * Returns the same message shape (RoleChannelMessage) for seamless routing.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getStreamClient,
  onStreamClientConnected,
  onStreamClientConnectionStatusChange,
} from '@/services/stream/streamClient';
import { CHANNEL_TYPE_CHANNEL, proChannelId } from '@/services/stream/streamChannelFactory';
import type { StreamQuotedReferenceInput } from '@/services/stream/streamMessagePayload';
import type { Channel, MessageResponse } from 'stream-chat';

const PAGE_SIZE = 30;

export function useStreamProChannel(channelId: string | null) {
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [streamReady, setStreamReady] = useState(Boolean(getStreamClient()?.userID));

  const channelRef = useRef<Channel | null>(null);
  const [activeStreamChannel, setActiveStreamChannel] = useState<Channel | null>(null);
  const isMountedRef = useRef(true);
  const hasHydratedRef = useRef(false);
  const lastMessageTimestampRef = useRef<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Backfill messages missed during WebSocket disconnection (same pattern as useStreamTripChat)
  const backfillMissedMessages = useCallback(async () => {
    const channel = channelRef.current;
    if (!channel || !lastMessageTimestampRef.current || !isMountedRef.current || !channelId) return;

    try {
      const response = await channel.query({
        messages: {
          created_at_after: lastMessageTimestampRef.current,
          limit: 100,
        },
      });

      const fetched = (response.messages || []) as MessageResponse[];
      if (fetched.length === 0) return;

      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newMessages = fetched.filter(m => !existingIds.has(m.id));
        if (newMessages.length === 0) return prev;
        return [...prev, ...newMessages].sort(
          (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime(),
        );
      });
    } catch {
      // Non-fatal backfill failure — realtime will self-correct on the next event
    }
  }, [channelId]);

  useEffect(() => {
    const unsubscribeConnected = onStreamClientConnected(() => {
      setStreamReady(true);
    });
    const unsubscribeStatus = onStreamClientConnectionStatusChange(isConnected => {
      setStreamReady(isConnected);
      if (isConnected && hasHydratedRef.current) {
        void backfillMissedMessages();
      }
    });

    return () => {
      unsubscribeConnected();
      unsubscribeStatus();
    };
  }, [backfillMissedMessages]);

  // Watch channel when channelId changes
  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      setHasMore(true);
      setIsLoadingMore(false);
      channelRef.current = null;
      setActiveStreamChannel(null);
      return;
    }

    const client = getStreamClient();
    if (!client?.userID || !streamReady) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const init = async () => {
      try {
        const channel = client.channel(CHANNEL_TYPE_CHANNEL, proChannelId(channelId));
        const state = await channel.watch({ state: true, messages: { limit: PAGE_SIZE } });

        if (cancelled) return;

        channelRef.current = channel;
        setActiveStreamChannel(channel);

        const initial = (state.messages || []) as MessageResponse[];
        setMessages(initial);
        setHasMore(initial.length === PAGE_SIZE);
      } catch {
        // Non-fatal — will show empty state
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    // Reset hydration state when channelId changes so backfill waits for fresh data
    hasHydratedRef.current = false;
    lastMessageTimestampRef.current = null;

    init();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        channelRef.current.stopWatching();
        channelRef.current = null;
        setActiveStreamChannel(null);
      }
    };
  }, [channelId, streamReady]);

  // Track hydration state and latest message timestamp for reconnect backfill
  useEffect(() => {
    if (messages.length > 0) {
      hasHydratedRef.current = true;
      const latest = messages[messages.length - 1];
      if (latest?.created_at) {
        lastMessageTimestampRef.current = latest.created_at;
      }
    }
  }, [messages]);

  // Realtime events
  useEffect(() => {
    const channel = activeStreamChannel;
    if (!channel || !channelId) return;

    const handleEvent = () => {
      setMessages([...channel.state.messages] as unknown as MessageResponse[]);
    };

    channel.on('message.new', handleEvent);
    channel.on('message.updated', handleEvent);
    channel.on('message.deleted', handleEvent);
    channel.on('reaction.new', handleEvent);
    channel.on('reaction.deleted', handleEvent);

    return () => {
      channel.off('message.new', handleEvent);
      channel.off('message.updated', handleEvent);
      channel.off('message.deleted', handleEvent);
      channel.off('reaction.new', handleEvent);
      channel.off('reaction.deleted', handleEvent);
    };
  }, [activeStreamChannel, channelId]);

  const sendMessage = useCallback(
    async (
      content: string,
      options?: {
        attachments?: any[];
        parentId?: string;
        isBroadcast?: boolean;
        quotedReference?: StreamQuotedReferenceInput;
      },
    ): Promise<boolean> => {
      const channel = channelRef.current;
      if (!channel) return false;

      try {
        await channel.sendMessage({
          text: content,
          attachments: options?.attachments || undefined,
          parent_id: options?.parentId,
          quoted_reference: options?.quotedReference,
          ...(options?.isBroadcast ? ({ isBroadcast: true } as Record<string, unknown>) : {}),
        } as Parameters<typeof channel.sendMessage>[0]);
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  const loadMore = useCallback(async () => {
    const channel = channelRef.current;
    if (!channel || !hasMore || isLoadingMore || messages.length === 0) return;

    setIsLoadingMore(true);
    try {
      const oldestId = messages[0]?.id;
      const result = await channel.query({
        messages: { limit: PAGE_SIZE, id_lt: oldestId },
      });
      const olderMessages = (result.messages || []) as MessageResponse[];

      if (olderMessages.length > 0) {
        setMessages(prev => [...olderMessages, ...prev]);
        setHasMore(olderMessages.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch {
      // Non-fatal pagination error
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, messages]);

  return {
    messages,
    isLoading,
    hasMore,
    isLoadingMore,
    loadMore,
    sendMessage,
    activeChannel: activeStreamChannel,
  };
}
