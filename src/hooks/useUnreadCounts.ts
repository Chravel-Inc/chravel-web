import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Channel } from 'stream-chat';
import { supabase } from '@/integrations/supabase/client';

/** Minimal message shape for unread counting - compatible with useTripChat / Stream MessageResponse */
interface UnreadMessage {
  id: string;
  user_id?: string;
  privacy_mode?: string;
  message_type?: string;
  created_at?: string;
  user?: { id?: string };
}

interface UseUnreadCountsOptions {
  tripId: string;
  messages: UnreadMessage[];
  userId: string | null;
  enabled?: boolean;
  /**
   * When provided (including `null` while the Stream channel is still connecting), unread counts
   * are derived from Stream read cursors — not `message_read_receipts` (Stream message IDs do not
   * match Supabase rows). Omit entirely to keep the legacy receipt-based path.
   */
  streamChannel?: Channel | null;
}

interface UnreadCounts {
  broadcastCount: number;
  messageUnreadCount: number;
}

function getSenderId(msg: UnreadMessage): string | undefined {
  return msg.user?.id ?? msg.user_id;
}

function computeStreamUnreadCounts(
  channel: Channel,
  stableMessages: UnreadMessage[],
  userId: string,
): UnreadCounts {
  const myRead = channel.state?.read?.[userId];
  const lastReadAt =
    myRead?.last_read != null ? new Date(myRead.last_read as string | Date) : null;

  const unreadFromOthers = stableMessages.filter(msg => {
    const senderId = getSenderId(msg);
    if (!senderId || senderId === userId) return false;
    const createdRaw = msg.created_at;
    if (!createdRaw) return true;
    const msgTime = new Date(createdRaw);
    if (Number.isNaN(msgTime.getTime())) return true;
    if (!lastReadAt || Number.isNaN(lastReadAt.getTime())) return true;
    return msgTime > lastReadAt;
  });

  const unreadBroadcasts = unreadFromOthers.filter(
    msg => msg.privacy_mode === 'broadcast' || msg.message_type === 'broadcast',
  ).length;
  const totalUnread = unreadFromOthers.length;

  return {
    broadcastCount: unreadBroadcasts,
    messageUnreadCount: totalUnread - unreadBroadcasts,
  };
}

/**
 * Hook to track unread message counts with real-time updates.
 * Debounces recalculation to avoid firing multiple times per second when
 * rapid read receipt events arrive (e.g. user scrolling through many messages).
 */
export function useUnreadCounts({
  tripId,
  messages,
  userId,
  enabled = true,
  streamChannel,
}: UseUnreadCountsOptions): UnreadCounts {
  const [broadcastCount, setBroadcastCount] = useState(0);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Bumped on Stream read events so we re-derive counts from `channel.state.read`. */
  const [streamReadBump, setStreamReadBump] = useState(0);

  const usesStreamUnread = streamChannel !== undefined;

  // Stabilize message IDs to avoid re-render loops from new array references.
  // Only recalculates when the actual set of message IDs changes.
  const messageIdList = useMemo(() => messages.map(m => m.id).join(','), [messages]);
  const stableMessages = useMemo(() => messages, [messageIdList]); // eslint-disable-line react-hooks/exhaustive-deps

  const calculateUnreadCounts = useCallback(async () => {
    if (!userId || !tripId || stableMessages.length === 0) {
      setBroadcastCount(0);
      setMessageUnreadCount(0);
      return;
    }

    try {
      const messageIds = stableMessages.map(m => m.id);

      const { data: readStatuses, error } = await supabase
        .from('message_read_receipts')
        .select('message_id')
        .eq('user_id', userId)
        .in('message_id', messageIds);

      if (error) {
        if (import.meta.env.DEV) console.error('Failed to fetch read statuses:', error);
        return;
      }

      const readMessageIds = new Set(
        (readStatuses ?? []).map((s: { message_id: string }) => s.message_id),
      );

      const unreadMessages = stableMessages.filter(
        msg => !readMessageIds.has(msg.id) && getSenderId(msg) !== userId,
      );
      const totalUnread = unreadMessages.length;
      const unreadBroadcasts = unreadMessages.filter(
        msg => msg.privacy_mode === 'broadcast' || msg.message_type === 'broadcast',
      ).length;

      setBroadcastCount(unreadBroadcasts);
      setMessageUnreadCount(totalUnread - unreadBroadcasts);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error calculating unread counts:', error);
    }
  }, [tripId, userId, stableMessages]);

  // Debounced version for realtime events
  const debouncedCalculate = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      calculateUnreadCounts();
    }, 500);
  }, [calculateUnreadCounts]);

  // Stream trip chat: unread follows channel read cursors (markRead / message.read).
  useEffect(() => {
    if (!usesStreamUnread || !enabled) return;

    if (!userId || !tripId || stableMessages.length === 0 || streamChannel == null) {
      setBroadcastCount(0);
      setMessageUnreadCount(0);
      return;
    }

    const next = computeStreamUnreadCounts(streamChannel, stableMessages, userId);
    setBroadcastCount(next.broadcastCount);
    setMessageUnreadCount(next.messageUnreadCount);
  }, [
    usesStreamUnread,
    enabled,
    userId,
    tripId,
    stableMessages,
    streamChannel,
    streamReadBump,
  ]);

  useEffect(() => {
    if (!usesStreamUnread || !enabled || streamChannel == null) return;

    const bump = (): void => {
      setStreamReadBump(n => n + 1);
    };

    streamChannel.on('message.read', bump);
    streamChannel.on('notification.mark_read', bump);

    return () => {
      streamChannel.off('message.read', bump);
      streamChannel.off('notification.mark_read', bump);
    };
  }, [usesStreamUnread, enabled, streamChannel]);

  useEffect(() => {
    if (usesStreamUnread) return;

    if (!enabled || !userId || !tripId || stableMessages.length === 0) {
      setBroadcastCount(0);
      setMessageUnreadCount(0);
      return;
    }

    // Calculate immediately on mount / dependency change
    calculateUnreadCounts();

    // Subscribe to read status changes — debounced to avoid recalc storm
    const channel = supabase
      .channel(`unread_counts:${tripId}:${userId}`)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'message_read_receipts',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          debouncedCalculate();
        },
      )
      .subscribe();

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [
    usesStreamUnread,
    tripId,
    userId,
    stableMessages,
    enabled,
    calculateUnreadCounts,
    debouncedCalculate,
  ]);

  return { broadcastCount, messageUnreadCount };
}
