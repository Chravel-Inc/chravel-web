import { useState, useCallback } from 'react';

export function useChatReactions(
  isDemoMode: boolean,
  userId: string | undefined,
  _liveMessages: any[],
  streamToggleReaction?: (messageId: string, reactionType: string) => Promise<void>,
) {
  const [reactions, setReactions] = useState<
    Record<string, Record<string, { count: number; userReacted: boolean; users: string[] }>>
  >({});

  const handleReaction = useCallback(
    async (messageId: string, reactionType: string) => {
      if (isDemoMode || !userId || !streamToggleReaction) {
        return;
      }

      // Stream SDK is the single source of truth for authenticated chat reactions.
      await streamToggleReaction(messageId, reactionType);
    },
    [isDemoMode, userId, streamToggleReaction],
  );

  return { reactions, setReactions, handleReaction };
}
