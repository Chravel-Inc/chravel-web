import { useState, useEffect, useMemo } from 'react';
import type { Channel } from 'stream-chat';

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

interface StreamReadState {
  last_read?: string | Date;
  unread_messages?: number;
}

export function splitUnreadCounts({
  messages,
  userId,
  totalUnread,
  readState,
}: {
  messages: UnreadMessage[];
  userId: string;
  totalUnread: number;
  readState?: StreamReadState;
}): UnreadCounts {
  if (!totalUnread) {
    return { broadcastCount: 0, messageUnreadCount: 0 };
  }

  const lastRead = readState?.last_read ? new Date(readState.last_read) : null;
  const canReliablySplit = Boolean(lastRead && !Number.isNaN(lastRead.getTime()));

  if (!canReliablySplit || !lastRead) {
    return { broadcastCount: 0, messageUnreadCount: totalUnread };
  }

  const unreadByMarker = messages.filter(msg => {
    const senderId = msg.user?.id || msg.user_id;
    if (!senderId || senderId === userId) return false;

    if (!msg.created_at) return false;
    const createdAt = new Date(msg.created_at);
    if (Number.isNaN(createdAt.getTime())) return false;

    return createdAt > lastRead;
  });

  if (unreadByMarker.length !== totalUnread) {
    return { broadcastCount: 0, messageUnreadCount: totalUnread };
  }

  const broadcastCount = unreadByMarker.filter(
    msg => msg.privacy_mode === 'broadcast' || msg.message_type === 'broadcast',
  ).length;

  return {
    broadcastCount,
    messageUnreadCount: Math.max(0, totalUnread - broadcastCount),
  };
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
      splitUnreadCounts({
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
