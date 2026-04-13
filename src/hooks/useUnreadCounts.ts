import { useState, useEffect, useMemo } from 'react';
import type { Channel } from 'stream-chat';

/** Minimal message shape for unread counting - compatible with useTripChat */
interface UnreadMessage {
  id: string;
  user_id?: string;
  user?: { id?: string };
  privacy_mode?: string;
  message_type?: string;
  created_at?: string;
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
 *   - total unread from Stream read state
 *   - split by broadcast/non-broadcast from currently loaded unread messages
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

    const totalUnreadFromStream =
      activeChannel?.countUnread?.() ?? activeChannel?.state.read?.[userId]?.unread_messages ?? 0;

    if (!totalUnreadFromStream) {
      setBroadcastCount(0);
      setMessageUnreadCount(0);
      return;
    }

    // Use loaded messages newer than last_read when possible.
    // If message window is partial, keep Stream total authoritative and clamp split safely.
    const lastReadAt = activeChannel?.state.read?.[userId]?.last_read
      ? new Date(activeChannel.state.read[userId].last_read).getTime()
      : 0;

    const unreadLoaded = stableMessages.filter(msg => {
      const senderId = msg.user?.id || msg.user_id;
      if (senderId === userId) return false;
      if (!lastReadAt) return true;
      const createdAt = msg.created_at ? new Date(msg.created_at).getTime() : 0;
      return createdAt > lastReadAt;
    });

    const unreadLoadedTail = unreadLoaded.slice(-totalUnreadFromStream);
    const estimatedUnreadBroadcasts = unreadLoadedTail.filter(
      msg => msg.privacy_mode === 'broadcast' || msg.message_type === 'broadcast',
    ).length;

    const safeBroadcastCount = Math.min(estimatedUnreadBroadcasts, totalUnreadFromStream);
    setBroadcastCount(safeBroadcastCount);
    setMessageUnreadCount(Math.max(0, totalUnreadFromStream - safeBroadcastCount));
  }, [tripId, userId, stableMessages, enabled, activeChannel]);

  return { broadcastCount, messageUnreadCount };
}
