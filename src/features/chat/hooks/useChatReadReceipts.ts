import { useEffect, useRef, useState } from 'react';

export function useChatReadReceipts(
  isDemoMode: boolean,
  userId: string | undefined,
  resolvedTripId: string | undefined,
  liveMessages: any[],
  activeChannel?: any,
) {
  const getMessageUserId = (msg: any): string | undefined => msg.user_id || msg.user?.id;

  // Stream handles read states natively, but we expose this empty state
  // so the component signature doesn't break.
  const [readStatusesByMessage, setReadStatusesByMessage] = useState<Record<string, any[]>>({});

  const markedMessageIdsRef = useRef<Set<string>>(new Set());
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isDemoMode || !userId || !resolvedTripId || liveMessages.length === 0 || !activeChannel) return;

    const newUnmarkedIds = liveMessages
      .filter(msg => getMessageUserId(msg) !== userId && !markedMessageIdsRef.current.has(msg.id))
      .map(msg => msg.id);

    if (newUnmarkedIds.length === 0) return;

    if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    markReadTimerRef.current = setTimeout(async () => {
      try {
        if (typeof activeChannel.markRead === 'function') {
          await activeChannel.markRead();
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

  return { readStatusesByMessage, setReadStatusesByMessage };
}
