with open('src/features/chat/components/TripChat.tsx', 'r') as f:
    text = f.read()

# We can see at line 618 it says `if (toggleReaction) {`, and the closing brace is missing or there's some extra code. Let's fix handleReaction.
old_str = """    const handleReaction = async (messageId: string, reactionType: string) => {
      if (demoMode.isDemoMode || !user?.id) {
        return;
      }

      if (toggleReaction) {
        // Stream path — Stream SDK handles optimistic updates internally
      // Authenticated mode: persist to database
      // Optimistic update
      setReactions(prev => {"""

new_str = """    const handleReaction = async (messageId: string, reactionType: string) => {
      if (demoMode.isDemoMode || !user?.id) {
        return;
      }

      if (toggleReaction) {
        // Stream path — Stream SDK handles optimistic updates internally
        await toggleReaction(messageId, reactionType);
        return;
      }

      // Supabase Authenticated mode: persist to database
      // Optimistic update
      setReactions(prev => {"""

text = text.replace(old_str, new_str)
with open('src/features/chat/components/TripChat.tsx', 'w') as f:
    f.write(text)
