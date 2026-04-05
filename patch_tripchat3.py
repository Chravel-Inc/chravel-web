import re

with open('src/features/chat/components/TripChat.tsx', 'r') as f:
    content = f.read()

# Add import
import_str = "import { useChatReactions } from '../hooks/useChatReactions';\n"
if "import { useChatReactions }" not in content:
    content = content.replace("import { MessageTypeBar } from './MessageTypeBar';", import_str + "import { MessageTypeBar } from './MessageTypeBar';")

# First, properly fix the syntax error on line 626 and extract the whole block
# I'll just use regex to remove everything from `const handleReaction = async` to its closing brace
# Wait, let's look at the original file structure carefully

# We know the original `TripChat.tsx` has a syntax error around 624-627
# Let's just strip out `handleReaction` from the string completely
start_str = "    const handleReaction = async (messageId: string, reactionType: string) => {"
end_str = "    };\n\n    // Handle opening a thread"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + "\n    // Handle opening a thread" + content[end_idx + len(end_str):]


# Also remove `const [reactions, setReactions] = useState`
state_start = "const [reactions, setReactions] = useState<"
state_end = "    >({});\n"
state_start_idx = content.find(state_start)
state_end_idx = content.find(state_end, state_start_idx)

if state_start_idx != -1 and state_end_idx != -1:
    content = content[:state_start_idx] + content[state_end_idx + len(state_end):]

# Now insert the hook usage right before handleOpenThread (which used to be after handleReaction)
hook_usage = """
    const { reactions, setReactions, handleReaction } = useChatReactions(
      demoMode.isDemoMode,
      user?.id,
      liveMessages,
      toggleReaction
    );
"""
content = content.replace("    // Handle opening a thread", hook_usage + "\n    // Handle opening a thread")

with open('src/features/chat/components/TripChat.tsx', 'w') as f:
    f.write(content)
