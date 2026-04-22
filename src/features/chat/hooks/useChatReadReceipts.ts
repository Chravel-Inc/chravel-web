import { useEffect, useMemo, useRef } from 'react';
import { markMessagesAsRead } from '@/services/readReceiptService';
import type { Channel } from 'stream-chat';

export function useChatReadReceipts(
  isDemoMode: boolean,
  userId: string | undefined,
  resolvedTripId: string | undefined,
  liveMessages: Array<{ id: string; user_id?: string; user?: { id?: string } }>,
  activeChannel: Channel | null,
) {
  const getMessageUserId = (message: {
    user_id?: string;
    user?: { id?: string };
  }): string | undefined => message.user_id ?? message.user?.id;

  const markedMessageIdsRef = useRef<Set<string>>(new Set());
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isStreamBackedChat = useMemo(
    () => Boolean(activeChannel?.state?.read && typeof activeChannel?.markRead === 'function'),
    [activeChannel],
  );

  useEffect(() => {
    if (isDemoMode || !userId || !resolvedTripId || liveMessages.length === 0) return;

    const newUnmarkedIds = liveMessages
      .filter(message => {
        const senderId = getMessageUserId(message);
        return senderId !== userId && !markedMessageIdsRef.current.has(message.id);
      })
      .map(message => message.id);

    if (newUnmarkedIds.length === 0) return;

    if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    markReadTimerRef.current = setTimeout(async () => {
      try {
        if (isStreamBackedChat && activeChannel) {
          await activeChannel.markRead();
        } else {
          await markMessagesAsRead(newUnmarkedIds, resolvedTripId, userId);
        }
        newUnmarkedIds.forEach(id => markedMessageIdsRef.current.add(id));
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(error);
        }
      }
    }, 1000);

    return () => {
      if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    };
  }, [liveMessages, userId, resolvedTripId, isDemoMode, activeChannel, isStreamBackedChat]);
}
