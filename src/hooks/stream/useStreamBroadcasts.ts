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
import { getStreamClient, onStreamClientConnected } from '@/services/stream/streamClient';
import { CHANNEL_TYPE_BROADCAST, broadcastChannelId } from '@/services/stream/streamChannelFactory';
import type { Channel, MessageResponse } from 'stream-chat';

type BroadcastPriority = 'urgent' | 'reminder' | 'fyi';

function normalizeBroadcastPriority(priority: unknown): BroadcastPriority {
  const normalizedPriority = typeof priority === 'string' ? priority.toLowerCase() : '';

  if (normalizedPriority === 'urgent') return 'urgent';
  if (
    normalizedPriority === 'reminder' ||
    normalizedPriority === 'important' ||
    normalizedPriority === 'logistics'
  ) {
    return 'reminder';
  }
  return 'fyi';
}

function normalizeMessagePriority(message: MessageResponse): MessageResponse {
  const msg = message as unknown as Record<string, unknown>;
  const extraData = msg.extra_data as Record<string, unknown> | undefined;
  const normalized = normalizeBroadcastPriority(msg.priority ?? extraData?.priority);

  return {
    ...message,
    priority: normalized,
    extra_data: {
      ...extraData,
      priority: normalized,
    },
  } as MessageResponse;
}

export function useStreamBroadcasts(tripId: string | undefined) {
  const [broadcasts, setBroadcasts] = useState<MessageResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const channelRef = useRef<Channel | null>(null);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [streamClientReady, setStreamClientReady] = useState(Boolean(getStreamClient()?.userID));

  useEffect(() => {
    const unsubscribe = onStreamClientConnected(() => {
      setStreamClientReady(true);
    });

    return unsubscribe;
  }, []);

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

        const initial = ((state.messages || []) as MessageResponse[]).map(normalizeMessagePriority);
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
  }, [tripId, streamClientReady]);

  // Realtime: new broadcasts appear instantly
  useEffect(() => {
    const channel = activeChannel;
    if (!channel) return;

    const handleEvent = () => {
      const messages = ([...channel.state.messages] as unknown as MessageResponse[]).map(
        normalizeMessagePriority,
      );
      setBroadcasts(messages.reverse()); // newest first
    };

    channel.on('message.new', handleEvent);
    channel.on('message.updated', handleEvent);
    channel.on('message.deleted', handleEvent);

    return () => {
      channel.off('message.new', handleEvent);
      channel.off('message.updated', handleEvent);
      channel.off('message.deleted', handleEvent);
    };
  }, [activeChannel]);

  const sendBroadcast = async (
    text: string,
    priority: string,
    metadata: Record<string, unknown>,
  ) => {
    const channel = channelRef.current;
    if (!channel) return;
    const normalizedPriority = normalizeBroadcastPriority(priority);
    await channel.sendMessage({
      text,
      priority: normalizedPriority,
      extra_data: {
        ...metadata,
        priority: normalizedPriority,
      },
      metadata: {
        ...metadata,
        priority: normalizedPriority,
      },
    } as Parameters<Channel['sendMessage']>[0]);
  };

  return {
    broadcasts,
    isLoading,
    sendBroadcast,
    activeChannel,
  };
}
