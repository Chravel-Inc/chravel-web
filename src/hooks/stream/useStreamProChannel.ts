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
import type { Channel, Event, MessageResponse, UserResponse } from 'stream-chat';

const PAGE_SIZE = 30;

export function useStreamProChannel(channelId: string | null) {
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamReady, setStreamReady] = useState(Boolean(getStreamClient()?.userID));

  const channelRef = useRef<Channel | null>(null);
  const [activeStreamChannel, setActiveStreamChannel] = useState<Channel | null>(null);

  useEffect(() => {
    const unsubscribeConnected = onStreamClientConnected(() => {
      setStreamReady(true);
    });
    const unsubscribeStatus = onStreamClientConnectionStatusChange(isConnected => {
      setStreamReady(isConnected);
    });

    return () => {
      unsubscribeConnected();
      unsubscribeStatus();
    };
  }, []);

  // Watch channel when channelId changes
  useEffect(() => {
    if (!channelId) {
      setMessages([]);
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
      } catch {
        // Non-fatal — will show empty state
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

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
      options?: { attachments?: any[]; parentId?: string; isBroadcast?: boolean },
    ): Promise<boolean> => {
      const channel = channelRef.current;
      if (!channel) return false;

      try {
        await channel.sendMessage({
          text: content,
          attachments: options?.attachments || undefined,
          parent_id: options?.parentId,
          isBroadcast: options?.isBroadcast || undefined,
        });
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  return {
    messages,
    isLoading,
    sendMessage,
    activeChannel: activeStreamChannel,
  };
}
