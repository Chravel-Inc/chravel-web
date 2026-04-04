with open("src/features/chat/components/TripChat.tsx", "r") as f:
    content = f.read()

import re

# Block 1
block1_search = """<<<<<<< HEAD
    const {
      messages: liveMessages,
      isLoading: liveLoading,
      sendMessageAsync: sendTripMessage,
      isCreating: isSendingMessage,
      loadMore: loadMoreMessages,
      hasMore,
      isLoadingMore,
      toggleReaction,
    } = useTripChat(shouldSkipLiveChat ? undefined : resolvedTripId);
=======
>>>>>>> origin/main"""
block1_replace = ""
content = content.replace(block1_search, block1_replace)

# Block 2
block2_search = """<<<<<<< HEAD
      if (toggleReaction) {
        await toggleReaction(messageId, reactionType);
=======
      // Authenticated mode: persist to database
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
            ? current.users.filter(id => id !== user.id)
            : Array.from(new Set([...current.users, user.id])),
        };
        return updated;
      });

      // Persist to backend
      if (toggleReaction) {
        // Stream path
        await toggleReaction(messageId, reactionType);
      } else {
        // Supabase path
        const result = await toggleMessageReaction(
          messageId,
          user.id,
          reactionType as ReactionType,
        );
        if (result.error) {
          if (import.meta.env.DEV)
            console.error('[TripChat] Failed to toggle reaction:', result.error);
          // Revert on failure - refetch reactions
          const messageIds = liveMessages.map(m => m.id);
          const freshReactions = await getMessagesReactions(messageIds, user.id);
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
>>>>>>> origin/main"""

block2_replace = """      if (toggleReaction) {
        await toggleReaction(messageId, reactionType);"""
content = content.replace(block2_search, block2_replace)


# Block 3
block3_search = """<<<<<<< HEAD
                          reactions={message.reactions || {}}
=======
                          reactions={message.reactions || reactions[message.id]}
>>>>>>> origin/main"""

block3_replace = "                          reactions={message.reactions || {}}"
content = content.replace(block3_search, block3_replace)


with open("src/features/chat/components/TripChat.tsx", "w") as f:
    f.write(content)
