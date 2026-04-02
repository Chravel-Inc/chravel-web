/**
 * useStreamBroadcasts — Stream-backed broadcast message delivery
 *
 * Stream handles ONLY message delivery and realtime visibility.
 * Scheduling, priority metadata, and response buttons (coming/wait/cant)
 * stay in Supabase (broadcasts + broadcast_reactions tables).
 *
 * This hook reads broadcast messages from the Stream chravel-broadcast
 * channel for realtime display. RSVP responses use Supabase directly.
 */

import { useState, useEffect, useRef } from 'react';
import { getStreamClient } from '@/services/stream/streamClient';
import { CHANNEL_TYPE_BROADCAST, broadcastChannelId } from '@/services/stream/streamChannelFactory';
import type { Channel, Event, MessageResponse, UserResponse } from 'stream-chat';

export interface StreamBroadcastMessage {
  id: string;
  tripId: string;
  message: string;
  sender: string;
  senderId: string;
  createdAt: string;
  priority: string;
  metadata: Record<string, unknown>;
}

function streamMsgToBroadcast(msg: MessageResponse, tripId: string): StreamBroadcastMessage {
  const user = msg.user as UserResponse | undefined;
  const custom = msg as unknown as Record<string, unknown>;
  return {
    id: msg.id,
    tripId,
    message: msg.text || '',
    sender: user?.name || 'Organizer',
    senderId: user?.id || '',
    createdAt: msg.created_at || new Date().toISOString(),
    priority: (custom.priority as string) || 'fyi',
    metadata: (custom.metadata as Record<string, unknown>) || {},
  };
}

export function useStreamBroadcasts(tripId: string | undefined) {
  const [broadcasts, setBroadcasts] = useState<StreamBroadcastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const channelRef = useRef<Channel | null>(null);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);

  // Watch broadcast channel
  useEffect(() => {
    if (!tripId) {
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
        const channel = client.channel(CHANNEL_TYPE_BROADCAST, broadcastChannelId(tripId));
        const state = await channel.watch({
          state: true,
          messages: { limit: 50 },
        });

        if (cancelled) return;

        channelRef.current = channel;
        setActiveChannel(channel);

        const initial = (state.messages || []).map((m: MessageResponse) =>
          streamMsgToBroadcast(m, tripId),
        );
        setBroadcasts(initial.reverse()); // newest first
        setIsLoading(false);
      } catch {
        if (!cancelled) setIsLoading(false);
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
  }, [tripId]);

  // Realtime: new broadcasts appear instantly
  useEffect(() => {
    const channel = activeChannel;
    if (!channel || !tripId) return;

    const handleNew = (event: Event) => {
      if (!event.message) return;
      const msg = streamMsgToBroadcast(event.message as MessageResponse, tripId);
      setBroadcasts(prev => {
        if (prev.some(b => b.id === msg.id)) return prev;
        return [msg, ...prev]; // newest first
      });
    };

    channel.on('message.new', handleNew);
    return () => {
      channel.off('message.new', handleNew);
    };
  }, [activeChannel, tripId]);

  const sendBroadcast = async (
    text: string,
    priority: string,
    metadata: Record<string, unknown>,
  ) => {
    const channel = channelRef.current;
    if (!channel) return;
    await channel.sendMessage({
      text,
      priority,
      metadata,
    } as Parameters<Channel['sendMessage']>[0]);
  };

  return {
    broadcasts,
    isLoading,
    sendBroadcast,
  };
}
