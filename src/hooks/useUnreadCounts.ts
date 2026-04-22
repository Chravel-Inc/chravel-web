import { useState, useEffect, useMemo } from 'react';
import type { Channel } from 'stream-chat';
import { splitUnreadFromStreamReadState } from '@/features/chat/selectors/readStateSelectors';

export const splitUnreadCounts = splitUnreadFromStreamReadState;

/** Minimal message shape for unread counting - compatible with useTripChat */
interface UnreadMessage {
  id: string;
  user_id?: string;
  user?: { id?: string };
  privacy_mode?: string;
  message_type?: string;
  created_at?: string | Date;
}

interface UseUnreadCountsOptions {
  tripId: string;
  messages: UnreadMessage[];
  userId: string | null;
  enabled?: boolean;
  activeChannel?: Channel | null;
}

interface UnreadCounts {
  broadcastCount: number;
  messageUnreadCount: number;
}

/**
 * Hook to track unread counts for Stream-backed chat.
 * Source of truth:
 *   - total unread from Stream (`countUnread()` with `state.read[userId].unread_messages` fallback)
 *   - broadcast vs standard split from messages after `last_read` when marker + loaded history match total
 *   - conservative total-only unread when `last_read` is missing/invalid or loaded history does not match total
 */
export function useUnreadCounts({
  tripId,
  messages,
  userId,
  enabled = true,
  activeChannel,
}: UseUnreadCountsOptions): UnreadCounts {
  const [broadcastCount, setBroadcastCount] = useState(0);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);

  const stableMessages = useMemo(() => messages, [messages]);

  useEffect(() => {
    if (!enabled || !tripId || !userId) {
      setBroadcastCount(0);
      setMessageUnreadCount(0);
      return;
    }

    const readState = activeChannel?.state.read?.[userId];
    const totalUnreadFromStream = activeChannel?.countUnread?.() ?? readState?.unread_messages ?? 0;

    const { broadcastCount: nextBroadcastCount, messageUnreadCount: nextMessageUnreadCount } =
      splitUnreadFromStreamReadState({
        messages: stableMessages,
        userId,
        totalUnread: totalUnreadFromStream,
        readState,
      });

    setBroadcastCount(nextBroadcastCount);
    setMessageUnreadCount(nextMessageUnreadCount);
  }, [tripId, userId, stableMessages, enabled, activeChannel]);

  return { broadcastCount, messageUnreadCount };
}
