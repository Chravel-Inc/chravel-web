const fs = require('fs');

let code = fs.readFileSync('src/features/chat/components/TripChat.tsx', 'utf8');

const buggyBlock = `      if (toggleReaction) {
        // Stream path — Stream SDK handles optimistic updates internally
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
      } else {`;

const fixedBlock = `      if (toggleReaction) {
        // Stream path
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
        });`;

if (code.includes(buggyBlock)) {
    code = code.replace(buggyBlock, fixedBlock);

    // Now we also have a duplicated `setReactions` call below `} else {` because we brought it into the `else` block from above. Let's fix that.

    fs.writeFileSync('src/features/chat/components/TripChat.tsx', code);
    console.log('Fixed syntax error and preserved state update.');
} else {
    console.log('Buggy block not found exactly as expected.');
}
