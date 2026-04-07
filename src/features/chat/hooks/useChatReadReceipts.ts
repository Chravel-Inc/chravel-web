import { useEffect, useRef, useState } from 'react';
import {
  markMessagesAsRead,
  subscribeToReadReceipts,
  getMessagesReadStatus,
} from '@/services/readReceiptService';
import { supabase } from '@/integrations/supabase/client';

export function useChatReadReceipts(
  isDemoMode: boolean,
  userId: string | undefined,
  resolvedTripId: string | undefined,
  liveMessages: any[],
  activeChannel?: any,
) {
  const getMessageUserId = (msg: any): string | undefined => msg.user_id || msg.user?.id;

  const [readStatusesByMessage, setReadStatusesByMessage] = useState<Record<string, any[]>>({});

  const markedMessageIdsRef = useRef<Set<string>>(new Set());
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ownMessageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;
    ownMessageIdsRef.current = new Set(
      liveMessages.filter(msg => getMessageUserId(msg) === userId).map(msg => msg.id),
    );
  }, [liveMessages, userId]);

  useEffect(() => {
    if (isDemoMode || !userId || !resolvedTripId) return;

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
  }, [userId, resolvedTripId, isDemoMode]);

  useEffect(() => {
    if (isDemoMode || !userId || !resolvedTripId || liveMessages.length === 0) return;

    const newUnmarkedIds = liveMessages
      .filter(msg => getMessageUserId(msg) !== userId && !markedMessageIdsRef.current.has(msg.id))
      .map(msg => msg.id);

    if (newUnmarkedIds.length === 0) return;

    if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    markReadTimerRef.current = setTimeout(async () => {
      try {
        if (activeChannel && typeof activeChannel.markRead === 'function') {
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
  }, [liveMessages, userId, resolvedTripId, isDemoMode, activeChannel]);

  // Fetch read statuses for own messages (only when own message count changes)
  const ownMessageCountRef = useRef(0);
  useEffect(() => {
    if (isDemoMode || !userId || liveMessages.length === 0) return;

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
  }, [liveMessages, userId, isDemoMode]);

  return { readStatusesByMessage, setReadStatusesByMessage };
}
