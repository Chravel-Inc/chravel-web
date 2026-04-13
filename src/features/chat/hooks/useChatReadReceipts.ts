import { useEffect, useMemo, useRef, useState } from 'react';
import {
  markMessagesAsRead,
  subscribeToReadReceipts,
  getMessagesReadStatus,
} from '@/services/readReceiptService';
import { supabase } from '@/integrations/supabase/client';
import type { Channel } from 'stream-chat';

export function useChatReadReceipts(
  isDemoMode: boolean,
  userId: string | undefined,
  resolvedTripId: string | undefined,
  liveMessages: any[],
  activeChannel: Channel | null,
) {
  const getMessageUserId = (msg: any): string | undefined => msg.user_id || msg.user?.id;

  const [readStatusesByMessage, setReadStatusesByMessage] = useState<Record<string, any[]>>({});

  const markedMessageIdsRef = useRef<Set<string>>(new Set());
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ownMessageIdsRef = useRef<Set<string>>(new Set());

  const isStreamBackedChat = useMemo(
    () => Boolean(activeChannel?.state?.read && typeof activeChannel?.markRead === 'function'),
    [activeChannel],
  );

  useEffect(() => {
    if (!userId) return;
    ownMessageIdsRef.current = new Set(
      liveMessages.filter(msg => getMessageUserId(msg) === userId).map(msg => msg.id),
    );
  }, [liveMessages, userId]);

  useEffect(() => {
    if (!isStreamBackedChat) return;

    const streamReadState = activeChannel?.state?.read;
    if (!streamReadState) {
      setReadStatusesByMessage({});
      return;
    }

    const nextReadStatuses: Record<string, any[]> = {};

    for (const message of liveMessages) {
      const messageUserId = getMessageUserId(message);
      const messageCreatedAt = (message as any).created_at ?? (message as any).createdAt;
      if (!messageCreatedAt || !message?.id) continue;

      const messageCreatedAtDate = new Date(messageCreatedAt);
      if (Number.isNaN(messageCreatedAtDate.getTime())) continue;

      const statusesForMessage: any[] = [];
      for (const [readerId, readState] of Object.entries(streamReadState)) {
        const readerLastRead = (readState as any)?.last_read;
        if (!readerLastRead || readerId === userId || readerId === messageUserId) continue;

        const readAtDate = new Date(readerLastRead);
        if (Number.isNaN(readAtDate.getTime()) || readAtDate < messageCreatedAtDate) continue;

        statusesForMessage.push({
          id: `${message.id}:${readerId}`,
          message_id: message.id,
          user_id: readerId,
          read_at: readerLastRead,
          created_at: readerLastRead,
        });
      }

      if (statusesForMessage.length > 0) {
        nextReadStatuses[message.id] = statusesForMessage;
      }
    }

    setReadStatusesByMessage(nextReadStatuses);
  }, [activeChannel, isStreamBackedChat, liveMessages, userId]);

  useEffect(() => {
    if (isDemoMode || !userId || !resolvedTripId || isStreamBackedChat) return;

    const subscription = subscribeToReadReceipts(resolvedTripId, (newStatus: any) => {
      setReadStatusesByMessage(prev => {
        const msgId = (newStatus as any).message_id;
        if (
          !prev[msgId] &&
          !markedMessageIdsRef.current.has(msgId) &&
          !ownMessageIdsRef.current.has(msgId)
        )
          return prev;
        const currentStatuses = prev[msgId] || [];
        if (currentStatuses.some((s: any) => s.user_id === (newStatus as any).user_id)) {
          return prev;
        }
        return {
          ...prev,
          [msgId]: [...currentStatuses, newStatus],
        };
      });
    });

    return () => {
      supabase.removeChannel(subscription).catch(error => {
        if (import.meta.env.DEV) {
          console.error(error);
        }
      });
    };
  }, [userId, resolvedTripId, isDemoMode, isStreamBackedChat]);

  useEffect(() => {
    const canMarkReadViaChannel =
      !isDemoMode && Boolean(activeChannel && typeof activeChannel.markRead === 'function');
    if (!canMarkReadViaChannel || !userId || !resolvedTripId || liveMessages.length === 0) return;

    const newUnmarkedIds = liveMessages
      .filter(msg => getMessageUserId(msg) !== userId && !markedMessageIdsRef.current.has(msg.id))
      .map(msg => msg.id);

    if (newUnmarkedIds.length === 0) return;

    if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    markReadTimerRef.current = setTimeout(async () => {
      try {
        if (isStreamBackedChat) {
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

  // Fetch read statuses for own messages only in legacy (Supabase) mode.
  const ownMessageCountRef = useRef(0);
  useEffect(() => {
    if (isDemoMode || !userId || liveMessages.length === 0 || isStreamBackedChat) return;

    const ownMessages = liveMessages.filter(msg => getMessageUserId(msg) === userId);
    if (ownMessages.length === ownMessageCountRef.current) return;
    ownMessageCountRef.current = ownMessages.length;

    const ownMessageIds = ownMessages.map(msg => msg.id);
    if (ownMessageIds.length === 0) return;

    getMessagesReadStatus(ownMessageIds)
      .then(statuses => setReadStatusesByMessage(prev => ({ ...prev, ...statuses })))
      .catch(e => {
        if (import.meta.env.DEV) {
          console.error('Failed to fetch read statuses', e);
        }
      });
  }, [liveMessages, userId, isDemoMode, isStreamBackedChat]);

  return { readStatusesByMessage, setReadStatusesByMessage };
}
