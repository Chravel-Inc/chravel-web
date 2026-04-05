import re

with open('src/features/chat/components/TripChat.tsx', 'r') as f:
    content = f.read()

# Add import
import_str = "import { useChatReactions } from '../hooks/useChatReactions';\n"
if "import { useChatReactions }" not in content:
    content = content.replace("import { MessageTypeBar } from './MessageTypeBar';", import_str + "import { MessageTypeBar } from './MessageTypeBar';")

# 1. Clean up the specific syntax error first
stray_code = """      // Supabase Authenticated mode: persist to database
      // Authenticated mode: persist to database
      }"""
content = content.replace(stray_code, "")

# 2. Extract reactions state
content = re.sub(
    r"\s*// @ts-ignore\s*const \[reactions, setReactions\] = useState<\s*Record<string, Record<string, \{ count: number; userReacted: boolean; users: string\[\] \}>>\s*>\(\{\}\);\n",
    "",
    content,
    flags=re.DOTALL
)

# 2a. also without @ts-ignore just in case
content = re.sub(
    r"\s*const \[reactions, setReactions\] = useState<\s*Record<string, Record<string, \{ count: number; userReacted: boolean; users: string\[\] \}>>\s*>\(\{\}\);\n",
    "",
    content,
    flags=re.DOTALL
)

# 3. Extract handleReaction method
start_str = "    const handleReaction = async (messageId: string, reactionType: string) => {"
end_str = "    };\n\n    // Handle opening a thread"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + content[end_idx:]


# 4. Insert hook usage
hook_usage = """
    const { reactions, setReactions, handleReaction } = useChatReactions(
      demoMode.isDemoMode,
      user?.id,
      liveMessages,
      toggleReaction
    );

"""
content = content.replace("    // Handle opening a thread", hook_usage + "    // Handle opening a thread")

with open('src/features/chat/components/TripChat.tsx', 'w') as f:
    f.write(content)
