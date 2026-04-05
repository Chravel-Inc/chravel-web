import re

with open('src/features/chat/components/TripChat.tsx', 'r') as f:
    content = f.read()

# First, fix the syntax error safely. The syntax error is due to an unmatched brace.
# Let's completely replace the block from 613 (handleReaction) down to 673 (before handleOpenThread) with nothing.
# In the original file before ANY modifications, handleReaction looks like this:

handle_reaction_regex = re.compile(
    r"\s*const handleReaction = async \(messageId: string, reactionType: string\) => \{.*?\};\n",
    re.DOTALL
)

# And the reactions state looks like this:
reactions_state_regex = re.compile(
    r"\s*const \[reactions, setReactions\] = useState<\s*Record<string, Record<string, \{ count: number; userReacted: boolean; users: string\[\] \}\>>\s*>\(\{\}\);\n",
    re.DOTALL
)

# Actually, I can just replace by string matching to be very precise.
# Let's print out the exact string around the error from the unmodified file.
