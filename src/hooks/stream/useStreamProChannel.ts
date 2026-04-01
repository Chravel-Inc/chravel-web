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
import { getStreamClient } from '@/services/stream/streamClient';
import { CHANNEL_TYPE_CHANNEL, proChannelId } from '@/services/stream/streamChannelFactory';
import type { Channel, Event, MessageResponse, UserResponse } from 'stream-chat';

export interface StreamProChannelMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
}

function streamMsgToProChannel(msg: MessageResponse, channelId: string): StreamProChannelMessage {
  const user = msg.user as UserResponse | undefined;
  return {
    id: msg.id,
    channelId,
    senderId: user?.id || '',
    senderName: user?.name || user?.id || 'Unknown',
    senderAvatar: (user?.image as string) || undefined,
    content: msg.text || '',
    createdAt: msg.created_at || new Date().toISOString(),
  };
}

const PAGE_SIZE = 30;

export function useStreamProChannel(channelId: string | null) {
  const [messages, setMessages] = useState<StreamProChannelMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const channelRef = useRef<Channel | null>(null);
  const [activeStreamChannel, setActiveStreamChannel] = useState<Channel | null>(null);

  // Watch channel when channelId changes
  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      channelRef.current = null;
      setActiveStreamChannel(null);
      return;
    }

    const client = getStreamClient();
    if (!client?.userID) return;

    let cancelled = false;
    setIsLoading(true);

    const init = async () => {
      try {
        const channel = client.channel(CHANNEL_TYPE_CHANNEL, proChannelId(channelId));
        const state = await channel.watch({ state: true, messages: { limit: PAGE_SIZE } });

        if (cancelled) return;

        channelRef.current = channel;
        setActiveStreamChannel(channel);

        const initial = (state.messages || []).map((m: MessageResponse) =>
          streamMsgToProChannel(m, channelId),
        );
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
  }, [channelId]);

  // Realtime events
  useEffect(() => {
    const channel = activeStreamChannel;
    if (!channel || !channelId) return;

    const handleNew = (event: Event) => {
      if (!event.message) return;
      const msg = streamMsgToProChannel(event.message as MessageResponse, channelId);
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    const handleDelete = (event: Event) => {
      if (!event.message) return;
      setMessages(prev => prev.filter(m => m.id !== event.message!.id));
    };

    channel.on('message.new', handleNew);
    channel.on('message.deleted', handleDelete);

    return () => {
      channel.off('message.new', handleNew);
      channel.off('message.deleted', handleDelete);
    };
  }, [activeStreamChannel, channelId]);

  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    const channel = channelRef.current;
    if (!channel) return false;

    try {
      await channel.sendMessage({ text: content });
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
  };
}
