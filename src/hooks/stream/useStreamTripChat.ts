/**
 * useStreamTripChat — Stream-backed trip chat hook
 *
 * Drop-in replacement for the Supabase-backed useTripChat.
 * Returns the exact same shape so TripChat.tsx and all downstream
 * components work without changes.
 *
 * Architecture:
 *   - Uses stream-chat JS client (low-level, no UI components)
 *   - Messages are transformed via messageMapper to match TripChatMessage shape
 *   - Realtime delivery via Stream WebSocket (replaces dual-path broadcast+CDC)
 *   - Read state, typing, reactions handled by Stream built-ins
 *   - Offline support via Stream SDK's built-in persistence
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getStreamClient } from '@/services/stream/streamClient';
import { CHANNEL_TYPE_TRIP, tripChannelId } from '@/services/stream/streamChannelFactory';
import {
  streamMessageToChravel,
  type ChrravelChatMessage,
} from '@/services/stream/adapters/mappers/messageMapper';
import { messageEvents } from '@/telemetry/events';
import type { Channel, Event, MessageResponse } from 'stream-chat';

const PAGE_SIZE = 30;

/**
 * Stream-backed trip chat hook.
 * Return type matches useTripChat exactly for seamless routing.
 */
export const useStreamTripChat = (tripId: string | undefined, options?: { enabled?: boolean }) => {
  const isEnabled = options?.enabled !== false;
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChrravelChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const channelRef = useRef<Channel | null>(null);
  // State mirror of channelRef for triggering the event subscription effect
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);

  // Initialize channel and load messages
  useEffect(() => {
    if (!tripId || !isEnabled) {
      setIsLoading(false);
      return;
    }

    const client = getStreamClient();
    if (!client?.userID) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const init = async () => {
      try {
        const channel = client.channel(CHANNEL_TYPE_TRIP, tripChannelId(tripId));
        const state = await channel.watch({ state: true, messages: { limit: PAGE_SIZE } });

        if (cancelled) return;

        channelRef.current = channel;
        setActiveChannel(channel);

        const initialMessages = (state.messages || []).map((m: MessageResponse) =>
          streamMessageToChravel(m, tripId),
        );
        setMessages(initialMessages);
        setHasMore((state.messages || []).length === PAGE_SIZE);
        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Failed to connect to chat';
        setError(new Error(msg));
        setIsLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        channelRef.current.stopWatching();
        channelRef.current = null;
        setActiveChannel(null);
      }
    };
  }, [tripId, isEnabled]);

  // Subscribe to realtime events
  useEffect(() => {
    const channel = activeChannel;
    if (!channel || !tripId) return;

    const handleNewMessage = (event: Event) => {
      if (!event.message) return;
      const newMsg = streamMessageToChravel(event.message as MessageResponse, tripId);

      setMessages(prev => {
        // Dedup by ID (handles optimistic → server confirmation)
        if (prev.some(m => m.id === newMsg.id)) {
          return prev.map(m => (m.id === newMsg.id ? newMsg : m));
        }
        return [...prev, newMsg];
      });
    };

    const handleUpdatedMessage = (event: Event) => {
      if (!event.message) return;
      const updated = streamMessageToChravel(event.message as MessageResponse, tripId);
      setMessages(prev => prev.map(m => (m.id === updated.id ? updated : m)));
    };

    const handleDeletedMessage = (event: Event) => {
      if (!event.message) return;
      setMessages(prev => prev.filter(m => m.id !== event.message!.id));
    };

    channel.on('message.new', handleNewMessage);
    channel.on('message.updated', handleUpdatedMessage);
    channel.on('message.deleted', handleDeletedMessage);
    channel.on('reaction.new', handleUpdatedMessage);
    channel.on('reaction.updated', handleUpdatedMessage);
    channel.on('reaction.deleted', handleUpdatedMessage);

    return () => {
      channel.off('message.new', handleNewMessage);
      channel.off('message.updated', handleUpdatedMessage);
      channel.off('message.deleted', handleDeletedMessage);
      channel.off('reaction.new', handleUpdatedMessage);
      channel.off('reaction.updated', handleUpdatedMessage);
      channel.off('reaction.deleted', handleUpdatedMessage);
    };
  }, [activeChannel, tripId]);

  /**
   * Fire-and-forget send: Stream confirms via WebSocket (`message.new`).
   * We intentionally do NOT expose `isCreating` / await the HTTP round-trip here.
   * Otherwise TripChat's `await sendTripMessage` + ChatInput's `isTyping={isCreating}`
   * block the composer until `sendMessage` resolves — if that promise stalls (network,
   * SDK edge case), the send button spins forever and `sendLockRef` never clears.
   */
  const dispatchStreamSend = useCallback(
    (
      content: string,
      mediaType: string | undefined,
      mediaUrl: string | undefined,
      privacyMode: string | undefined,
      messageType: 'text' | 'broadcast' | 'payment' | 'system' | undefined,
      replyToId: string | undefined,
      mentionedUserIds: string[] | undefined,
    ) => {
      const channel = channelRef.current;
      if (!channel || !tripId) return;

      const payload: Record<string, unknown> = {
        text: content,
      };

      if (privacyMode && privacyMode !== 'standard') {
        payload.privacy_mode = privacyMode;
      }
      if (messageType && messageType !== 'text') {
        payload.message_type = messageType;
      }
      if (replyToId) {
        payload.parent_id = replyToId;
      }
      if (mentionedUserIds && mentionedUserIds.length > 0) {
        payload.mentioned_users = mentionedUserIds;
      }
      if (mediaUrl) {
        payload.attachments = [{ type: mediaType || 'file', asset_url: mediaUrl }];
      }

      void channel
        .sendMessage(payload as Parameters<Channel['sendMessage']>[0])
        .then(() => {
          messageEvents.sent({
            trip_id: tripId,
            message_type:
              (messageType as 'text' | 'media' | 'broadcast' | 'payment' | 'system') || 'text',
            has_media: Boolean(mediaUrl),
            character_count: content.length,
            is_offline_queued: false,
          });
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Failed to send message';
          messageEvents.sendFailed(tripId, msg);
          toast({
            title: 'Send Failed',
            description: msg,
            variant: 'destructive',
          });
        });
    },
    [tripId, toast],
  );

  // Send message — matches useTripChat signature exactly
  const sendMessage = useCallback(
    (
      content: string,
      _authorName: string,
      mediaType?: string,
      mediaUrl?: string,
      _userId?: string,
      privacyMode?: string,
      messageType?: 'text' | 'broadcast' | 'payment' | 'system',
      replyToId?: string,
      mentionedUserIds?: string[],
    ) => {
      dispatchStreamSend(
        content,
        mediaType,
        mediaUrl,
        privacyMode,
        messageType,
        replyToId,
        mentionedUserIds,
      );
    },
    [dispatchStreamSend],
  );

  // sendMessageAsync — resolves immediately; delivery/errors handled like sendMessage
  const sendMessageAsync = useCallback(
    async (
      content: string,
      _authorName: string,
      mediaType?: string,
      mediaUrl?: string,
      _userId?: string,
      privacyMode?: string,
      messageType?: 'text' | 'broadcast' | 'payment' | 'system',
      replyToId?: string,
      mentionedUserIds?: string[],
    ): Promise<ChrravelChatMessage | undefined> => {
      const channel = channelRef.current;
      if (!channel || !tripId) return undefined;

      dispatchStreamSend(
        content,
        mediaType,
        mediaUrl,
        privacyMode,
        messageType,
        replyToId,
        mentionedUserIds,
      );

      // Optimistic shape for callers that still await; list state updates from `message.new`
      const now = new Date().toISOString();
      return {
        id: `pending-${now}`,
        trip_id: tripId,
        content,
        author_name: '',
        created_at: now,
        updated_at: now,
        message_type: messageType || 'text',
        media_type: mediaType,
        media_url: mediaUrl,
        privacy_mode: privacyMode || 'standard',
      } as ChrravelChatMessage;
    },
    [tripId, dispatchStreamSend],
  );

  // Load more (older messages)
  const toggleReaction = useCallback(
    async (messageId: string, reactionType: string) => {
      if (!channelRef.current) return;
      const channel = channelRef.current;

      try {
        // Optimistically check if we already reacted
        const message = messages.find(m => m.id === messageId);
        const hasReacted = message?.reactions?.[reactionType]?.userReacted;

        if (hasReacted) {
          await channel.deleteReaction(messageId, reactionType);
        } else {
          await channel.sendReaction(messageId, { type: reactionType });
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[Stream] toggleReaction failed:', err);
        }
      }
    },
    [messages],
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

      const olderMessages = (result.messages || []).map((m: MessageResponse) =>
        streamMessageToChravel(m, tripId!),
      );

      if (olderMessages.length > 0) {
        setMessages(prev => [...olderMessages, ...prev]);
        setHasMore(olderMessages.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch {
      // Pagination failure is non-fatal
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, messages, tripId]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    sendMessageAsync,
    /** Stream path: always false — send is fire-and-forget; UI unlocks immediately */
    isCreating: false,
    loadMore,
    hasMore,
    isLoadingMore,
    toggleReaction,
  };
};
