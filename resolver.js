import fs from 'fs';

let content = fs.readFileSync('src/features/chat/components/TripChat.tsx', 'utf8');

// 1. Lines 149-178
content = content.replace(/<<<<<<< HEAD\n=======\n([\s\S]*?)>>>>>>> origin\/main/m, '$1');

// 2. Lines 776-832 & 3. Lines 838-918
const badBlock = `<<<<<<< HEAD
      // Authenticated mode: persist to database
=======
      if (toggleReaction) {
        // Stream path — Stream SDK handles optimistic updates internally
        await toggleReaction(messageId, reactionType);
      } else {
        // Supabase path — optimistic update + persist
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
      }
      // Supabase Authenticated mode: persist to database
>>>>>>> origin/main
      // Optimistic update
      setReactions(prev => {
        const updated = { ...prev };
        if (!updated[messageId]) {
          updated[messageId] = {};
<<<<<<< HEAD
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

      // Persist to database
      const result = await toggleMessageReaction(messageId, user.id, reactionType as ReactionType);
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
=======
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

      // Persist to backend (Supabase path)
      const result = await toggleMessageReaction(messageId, user.id, reactionType as ReactionType);
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
>>>>>>> origin/main`;

const goodBlock = `      if (toggleReaction) {
        // Stream path — Stream SDK handles optimistic updates internally
        await toggleReaction(messageId, reactionType);
      } else {
        // Supabase path — optimistic update + persist
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
      }`;

content = content.replace(badBlock, goodBlock);

// 4. Lines 1079-1086
content = content.replace(/<<<<<<< HEAD\n=======\n([\s\S]*?)>>>>>>> origin\/main/m, '$1');

// 5. Lines 1151-1155
content = content.replace(
  /<<<<<<< HEAD\n\s*reactions=\{reactions\[message\.id\]\}\n=======\n\s*reactions=\{message\.reactions \|\| reactions\[message\.id\] \|\| \{\}\}\n>>>>>>> origin\/main/m,
  '                          reactions={message.reactions || reactions[message.id] || {}}',
);

fs.writeFileSync('src/features/chat/components/TripChat.tsx', content);
