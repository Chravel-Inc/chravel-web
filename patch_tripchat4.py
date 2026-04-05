import re

with open('src/features/chat/components/TripChat.tsx', 'r') as f:
    content = f.read()

# Add import
import_str = "import { useChatReactions } from '../hooks/useChatReactions';\n"
if "import { useChatReactions }" not in content:
    content = content.replace("import { MessageTypeBar } from './MessageTypeBar';", import_str + "import { MessageTypeBar } from './MessageTypeBar';")

# Replace reactions state with hook
content = re.sub(
    r"\s*const \[reactions, setReactions\] = useState<\s*Record<string, Record<string, \{ count: number; userReacted: boolean; users: string\[\] \}>>\s*>.*?;\n",
    "",
    content,
    flags=re.DOTALL
)

# Extract handleReaction
handle_reaction_regex = r"\s*const handleReaction = async \(messageId: string, reactionType: string\) => \{.*?};\n"
content = re.sub(
    handle_reaction_regex,
    "",
    content,
    flags=re.DOTALL
)

# We also need to fix the stray closing bracket and comment around 624.
# We'll just remove the specific problematic lines if they exist
stray_code = """      // Supabase Authenticated mode: persist to database
      // Authenticated mode: persist to database
      }"""
content = content.replace(stray_code, "")

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
