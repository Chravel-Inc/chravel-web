import re

with open('src/features/chat/components/TripChat.tsx', 'r') as f:
    content = f.read()

# Add import
import_str = "import { useChatReactions } from '../hooks/useChatReactions';\n"
if "import { useChatReactions }" not in content:
    content = content.replace("import { MessageTypeBar } from './MessageTypeBar';", import_str + "import { MessageTypeBar } from './MessageTypeBar';")

# First, fix the syntax error natively.
content = re.sub(
    r"\s*// Authenticated mode: persist to database\s*\}\s*// Optimistic update",
    "\n      // Optimistic update",
    content
)

# Replace reactions state with hook
content = re.sub(
    r"const \[reactions, setReactions\] = useState<\s*Record<string, Record<string, \{ count: number; userReacted: boolean; users: string\[\] \}>>\s*>.*?;\n",
    "",
    content,
    flags=re.DOTALL
)

# Remove handleReaction definition entirely
content = re.sub(
    r"\s*const handleReaction = async \(messageId: string, reactionType: string\) => \{.*?\n\s*\};\n",
    "\n",
    content,
    flags=re.DOTALL
)

# Insert the hook usage just before const handleMessageEdit
hook_usage = """
    const { reactions, setReactions, handleReaction } = useChatReactions(
      demoMode.isDemoMode,
      user?.id,
      liveMessages,
      toggleReaction
    );
"""
content = content.replace("const handleMessageEdit = useCallback(", hook_usage + "\n    const handleMessageEdit = useCallback(")


with open('src/features/chat/components/TripChat.tsx', 'w') as f:
    f.write(content)
