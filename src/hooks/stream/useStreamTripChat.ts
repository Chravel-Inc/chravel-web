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
import { supabase } from '@/integrations/supabase/client';
import {
  getStreamApiKey,
  getStreamClient,
  onStreamClientConnected,
} from '@/services/stream/streamClient';
import { CHANNEL_TYPE_TRIP, tripChannelId } from '@/services/stream/streamChannelFactory';
import { messageEvents } from '@/telemetry/events';
import type { Channel, Event, MessageResponse } from 'stream-chat';

const PAGE_SIZE = 30;

const LEGACY_MESSAGE_LIMIT = 200;

interface LegacyTripChatRow {
  id: string;
  content: string | null;
  author_name: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string | null;
  media_type: string | null;
  media_url: string | null;
  link_preview: unknown;
  privacy_mode: string | null;
  message_type: string | null;
  reply_to_id: string | null;
}

const toLegacyMessageId = (id: string) => `legacy-${id}`;

const mapLegacyRowsToStreamMessages = (rows: LegacyTripChatRow[]): MessageResponse[] =>
  rows.map(row => ({
    id: toLegacyMessageId(row.id),
    text: row.content || '',
    user: row.user_id
      ? {
          id: row.user_id,
          name: row.author_name || row.user_id,
        }
      : row.author_name
        ? { id: `legacy-user-${row.id}`, name: row.author_name }
        : null,
    created_at: row.created_at,
    updated_at: row.updated_at || row.created_at,
    parent_id: row.reply_to_id ? toLegacyMessageId(row.reply_to_id) : undefined,
    attachments: row.media_url
      ? [{ type: row.media_type || 'file', asset_url: row.media_url }]
      : undefined,
    message_type: row.message_type || undefined,
    privacy_mode: row.privacy_mode || undefined,
    link_preview: row.link_preview,
  })) as unknown as MessageResponse[];

/**
 * Stream-backed trip chat hook.
 * Return type matches useTripChat exactly for seamless routing.
 */
export const useStreamTripChat = (tripId: string | undefined, options?: { enabled?: boolean }) => {
  const isEnabled = options?.enabled !== false;
  const { toast } = useToast();

  // Return native MessageResponse objects directly to take advantage of Stream capabilities
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [streamClientReady, setStreamClientReady] = useState(Boolean(getStreamClient()?.userID));

  const channelRef = useRef<Channel | null>(null);
  // State mirror of channelRef for triggering the event subscription effect
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onStreamClientConnected(() => {
      setStreamClientReady(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onStreamClientConnectionStatusChange(isConnected => {
      if (!isMountedRef.current) return;
      setStreamClientReady(isConnected);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isEnabled || !tripId) return;

    if (streamClientReady && getStreamClient()?.userID) return;

    const timer = window.setTimeout(() => {
      if (streamClientReady || getStreamClient()?.userID) return;

      if (!getStreamApiKey()) {
        setError(new Error('Stream chat is not configured'));
        setIsLoading(false);
        return;
      }

      setError(new Error('Timed out waiting for chat connection'));
      setIsLoading(false);
    }, 10000);

    return () => window.clearTimeout(timer);
  }, [isEnabled, tripId, streamClientReady]);

  useEffect(() => {
    const unsubscribe = onStreamClientConnected(() => {
      setStreamClientReady(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isEnabled || !tripId) return;

    if (streamClientReady) return;

    const timer = window.setTimeout(() => {
      if (streamClientReady || getStreamClient()?.userID) return;

      if (!getStreamApiKey()) {
        setError(new Error('Stream chat is not configured'));
        setIsLoading(false);
        return;
      }

      setError(new Error('Timed out waiting for chat connection'));
      setIsLoading(false);
    }, 10000);

    return () => window.clearTimeout(timer);
  }, [isEnabled, tripId, streamClientReady]);

  // Initialize channel and load messages
  useEffect(() => {
    if (!tripId || !isEnabled) {
      setIsLoading(false);
      return;
    }

    const client = getStreamClient();
    if (!client?.userID || !streamClientReady) {
      return;
    }

    let cancelled = false;

    const loadMergedMessages = async (
      channel: Channel,
    ): Promise<{ mergedMessages: MessageResponse[]; streamMessagesCount: number }> => {
      const state = await channel.query({
        messages: { limit: PAGE_SIZE },
      });
      const streamMessages = (state.messages || []) as MessageResponse[];

      const { data: legacyRows, error: legacyError } = await supabase
        .from('trip_chat_messages')
        .select(
          'id,content,author_name,user_id,created_at,updated_at,media_type,media_url,link_preview,privacy_mode,message_type,reply_to_id',
        )
        .eq('trip_id', tripId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(LEGACY_MESSAGE_LIMIT);

      if (legacyError && import.meta.env.DEV) {
        console.warn('[Stream] Legacy trip chat backfill failed:', legacyError.message);
      }

      const legacyMessages = mapLegacyRowsToStreamMessages(
        (legacyRows || []) as LegacyTripChatRow[],
      );
      const mergedMessages = [...streamMessages];
      const seenMessageIds = new Set(streamMessages.map(message => message.id));
      const seenFingerprints = new Set(
        streamMessages.map(
          message =>
            `${message.user?.id || 'unknown'}|${(message.text || '').trim()}|${message.created_at}`,
        ),
      );
      for (const legacyMessage of legacyMessages) {
        if (seenMessageIds.has(legacyMessage.id)) continue;
        const fingerprint = `${legacyMessage.user?.id || 'unknown'}|${(legacyMessage.text || '').trim()}|${legacyMessage.created_at}`;
        if (seenFingerprints.has(fingerprint)) continue;
        mergedMessages.push(legacyMessage);
        seenFingerprints.add(fingerprint);
      }
      mergedMessages.sort((a, b) => {
        const aDate = new Date(a.created_at || 0).getTime();
        const bDate = new Date(b.created_at || 0).getTime();
        return aDate - bDate;
      });

      return {
        mergedMessages,
        streamMessagesCount: streamMessages.length,
      };
    };

    const init = async () => {
      try {
        const channel = client.channel(CHANNEL_TYPE_TRIP, tripChannelId(tripId));
        const state = await channel.watch({ state: true, messages: { limit: PAGE_SIZE } });
        const streamMessages = (state.messages || []) as MessageResponse[];

        const { data: legacyRows, error: legacyError } = await supabase
          .from('trip_chat_messages')
          .select(
            'id,content,author_name,user_id,created_at,updated_at,media_type,media_url,link_preview,privacy_mode,message_type,reply_to_id',
          )
          .eq('trip_id', tripId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true })
          .limit(LEGACY_MESSAGE_LIMIT);

        if (legacyError && import.meta.env.DEV) {
          console.warn('[Stream] Legacy trip chat backfill failed:', legacyError.message);
        }

        const legacyMessages = mapLegacyRowsToStreamMessages(
          (legacyRows || []) as LegacyTripChatRow[],
        );
        const mergedMessages = [...streamMessages];
        const seenMessageIds = new Set(streamMessages.map(message => message.id));
        const seenFingerprints = new Set(
          streamMessages.map(
            message =>
              `${message.user?.id || 'unknown'}|${(message.text || '').trim()}|${message.created_at}`,
          ),
        );
        for (const legacyMessage of legacyMessages) {
          if (seenMessageIds.has(legacyMessage.id)) continue;
          const fingerprint = `${legacyMessage.user?.id || 'unknown'}|${(legacyMessage.text || '').trim()}|${legacyMessage.created_at}`;
          if (seenFingerprints.has(fingerprint)) continue;
          mergedMessages.push(legacyMessage);
          seenFingerprints.add(fingerprint);
        }
        mergedMessages.sort((a, b) => {
          const aDate = new Date(a.created_at || 0).getTime();
          const bDate = new Date(b.created_at || 0).getTime();
          return aDate - bDate;
        });

        if (cancelled) return;

        channelRef.current = channel;
        setActiveChannel(channel);

        setMessages(mergedMessages);
        setHasMore(streamMessages.length === PAGE_SIZE);
        setError(null);
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
  }, [tripId, isEnabled, streamClientReady]);

  const reload = useCallback(async () => {
    if (!tripId || !isEnabled || !channelRef.current) return;
    const channel = channelRef.current;

    try {
      setIsLoading(true);
      const state = await channel.query({
        messages: { limit: PAGE_SIZE },
      });

      const streamMessages = (state.messages || []) as MessageResponse[];
      const { data: legacyRows } = await supabase
        .from('trip_chat_messages')
        .select(
          'id,content,author_name,user_id,created_at,updated_at,media_type,media_url,link_preview,privacy_mode,message_type,reply_to_id',
        )
        .eq('trip_id', tripId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(LEGACY_MESSAGE_LIMIT);

      const legacyMessages = mapLegacyRowsToStreamMessages(
        (legacyRows || []) as LegacyTripChatRow[],
      );
      const mergedMessages = [...streamMessages];
      const seenIds = new Set(streamMessages.map(message => message.id));
      legacyMessages.forEach(legacyMessage => {
        if (!seenIds.has(legacyMessage.id)) {
          mergedMessages.push(legacyMessage);
        }
      });
      mergedMessages.sort(
        (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime(),
      );

      setMessages(mergedMessages);
      setHasMore(streamMessages.length === PAGE_SIZE);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[Stream] reload failed:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [tripId, isEnabled]);

  // Subscribe to realtime events
  useEffect(() => {
    const channel = activeChannel;
    if (!channel || !tripId) return;

    const handleNewMessage = (event: Event) => {
      if (!event.message) return;
      const newMsg = event.message as MessageResponse;

      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) {
          return prev.map(m => (m.id === newMsg.id ? newMsg : m));
        }
        return [...prev, newMsg];
      });
    };

    const handleUpdatedMessage = (event: Event) => {
      if (!event.message) return;
      const updated = event.message as MessageResponse;
      setMessages(prev => prev.map(m => (m.id === updated.id ? updated : m)));
    };

    const handleDeletedMessage = (event: Event) => {
      if (!event.message) return;
      setMessages(prev => prev.filter(m => m.id !== event.message!.id));
    };

    const handleReaction = () => {
      // Stream mutates channel.state.messages in place on reaction events.
      // Re-cloning the array forces React to re-render.
      setMessages([...channel.state.messages] as unknown as MessageResponse[]);
    };

    channel.on('message.new', handleNewMessage);
    channel.on('message.updated', handleUpdatedMessage);
    channel.on('message.deleted', handleDeletedMessage);
    channel.on('reaction.new', handleReaction);
    channel.on('reaction.updated', handleReaction);
    channel.on('reaction.deleted', handleReaction);

    return () => {
      channel.off('message.new', handleNewMessage);
      channel.off('message.updated', handleUpdatedMessage);
      channel.off('message.deleted', handleDeletedMessage);
      channel.off('reaction.new', handleReaction);
      channel.off('reaction.updated', handleReaction);
      channel.off('reaction.deleted', handleReaction);
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
      const normalizedContent = content.trim();
      if (!normalizedContent) return;
      if (normalizedContent.length > 4000) {
        toast({
          title: 'Message too long',
          description: 'Please keep messages under 4000 characters.',
          variant: 'destructive',
        });
        return;
      }

      const payload: Record<string, unknown> = {
        text: normalizedContent,
      };

      if (privacyMode && privacyMode !== 'standard') {
        payload.privacy_mode = privacyMode;
      }
      if (messageType && messageType !== 'text') {
        payload.message_type = messageType;
      }
      if (replyToId && !replyToId.startsWith('legacy-')) {
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
            character_count: normalizedContent.length,
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
    ): Promise<MessageResponse | undefined> => {
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
        text: content,
        created_at: now,
        updated_at: now,
        type: 'regular',
        user: { id: _userId || 'unknown' },
        message_type: messageType || 'text',
        privacy_mode: privacyMode || 'standard',
      } as unknown as MessageResponse;
    },
    [tripId, dispatchStreamSend],
  );

  // Load more (older messages)
  const toggleReaction = useCallback(
    async (messageId: string, reactionType: string) => {
      if (messageId.startsWith('legacy-')) {
        return;
      }
      if (!channelRef.current) return;
      const channel = channelRef.current;

      try {
        // Capture prior state in case of revert
        const originalMessages = messages;

        // Optimistically check if we already reacted
        const message = messages.find(m => m.id === messageId);
        const hasReacted = (message as any)?.reactions?.[reactionType]?.userReacted;

        try {
          if (hasReacted) {
            await channel.deleteReaction(messageId, reactionType);
          } else {
            await channel.sendReaction(messageId, { type: reactionType });
          }
        } catch (err) {
          if (import.meta.env.DEV) {
            console.error('[Stream] toggleReaction failed:', err);
          }
          // Revert optimistic update
          setMessages(originalMessages);
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[Stream] toggleReaction prep failed:', err);
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

      const olderMessages = (result.messages || []) as MessageResponse[];

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
  }, [hasMore, isLoadingMore, messages]);

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
    reload,
    activeChannel,
  };
};
