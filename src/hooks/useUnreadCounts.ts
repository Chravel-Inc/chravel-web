import { useState, useEffect, useMemo } from 'react';
import type { Channel } from 'stream-chat';

/** Minimal message shape for unread counting - compatible with useTripChat */
interface UnreadMessage {
  id: string;
  user_id?: string;
  user?: { id?: string };
  privacy_mode?: string;
  message_type?: string;
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
 *   - activeChannel.countUnread() / activeChannel.state.read[userId]
 *   - local message metadata only for broadcast vs standard split
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
    if (!enabled || !tripId || !userId || stableMessages.length === 0) {
      setBroadcastCount(0);
      setMessageUnreadCount(0);
      return;
    }

    const totalUnreadFromStream =
      activeChannel?.countUnread?.() ?? activeChannel?.state.read?.[userId]?.unread_messages ?? 0;

    if (!totalUnreadFromStream) {
      setBroadcastCount(0);
      setMessageUnreadCount(0);
      return;
    }

    const unreadCandidates = stableMessages.filter(msg => {
      const senderId = msg.user?.id || msg.user_id;
      return senderId !== userId;
    });

    const unreadTail = unreadCandidates.slice(-totalUnreadFromStream);
    const unreadBroadcasts = unreadTail.filter(
      msg => msg.privacy_mode === 'broadcast' || msg.message_type === 'broadcast',
    ).length;

    setBroadcastCount(unreadBroadcasts);
    setMessageUnreadCount(Math.max(0, totalUnreadFromStream - unreadBroadcasts));
  }, [tripId, userId, stableMessages, enabled, activeChannel]);

  return { broadcastCount, messageUnreadCount };
}
