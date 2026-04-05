import { useState, useCallback } from 'react';
import { ReactionType, toggleMessageReaction, getMessagesReactions } from '@/services/chatService';

export function useChatReactions(
  isDemoMode: boolean,
  userId: string | undefined,
  liveMessages: any[],
  streamToggleReaction?: (messageId: string, reactionType: string) => Promise<void>,
) {
  const [reactions, setReactions] = useState<
    Record<string, Record<string, { count: number; userReacted: boolean; users: string[] }>>
  >({});

  const handleReaction = useCallback(
    async (messageId: string, reactionType: string) => {
      if (isDemoMode || !userId) {
        return;
      }

      if (streamToggleReaction) {
        // Stream path — Stream SDK handles optimistic updates internally
        await streamToggleReaction(messageId, reactionType);
        return;
      }

      // Supabase Authenticated mode: persist to database
      // Optimistic update
      setReactions(prev => {
        const updated = { ...prev };
        if (!updated[messageId]) {
          updated[messageId] = {};
        }
        const current = updated[messageId][reactionType] || {
          count: 0,
          userReacted: false,
          users: [],
        };
        const wasReacted = current.userReacted;
        updated[messageId][reactionType] = {
          count: wasReacted ? Math.max(0, current.count - 1) : current.count + 1,
          userReacted: !wasReacted,
          users: wasReacted
            ? current.users.filter(id => id !== userId)
            : Array.from(new Set([...current.users, userId])),
        };
        return updated;
      });

      // Persist to backend (Supabase path)
      const result = await toggleMessageReaction(messageId, userId, reactionType as ReactionType);
      if (result.error) {
        if (import.meta.env.DEV)
          console.error('[TripChat] Failed to toggle reaction:', result.error);
        // Revert on failure - refetch reactions
        const messageIds = liveMessages.map(m => m.id);
        const freshReactions = await getMessagesReactions(messageIds, userId);
        const formatted: Record<
          string,
          Record<string, { count: number; userReacted: boolean; users: string[] }>
        > = {};
        for (const [msgId, typeMap] of Object.entries(freshReactions)) {
          formatted[msgId] = {};
          for (const [type, data] of Object.entries(typeMap)) {
            formatted[msgId][type] = {
              count: data.count,
              userReacted: data.userReacted,
              users: data.users || [],
            };
          }
        }
        setReactions(formatted);
      }
    },
    [isDemoMode, userId, streamToggleReaction, liveMessages],
  );

  return { reactions, setReactions, handleReaction };
}
