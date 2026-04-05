import re

with open('src/features/chat/components/TripChat.tsx', 'r') as f:
    content = f.read()

import_str = "import { useChatReadReceipts } from '../hooks/useChatReadReceipts';\n"
if "import { useChatReadReceipts }" not in content:
    content = content.replace("import { useChatReactions }", import_str + "import { useChatReactions }")

# Extract state
content = re.sub(
    r"\s*const \[readStatusesByMessage, setReadStatusesByMessage\] = useState<Record<string, any\[\]>>\(\{\}\);\n",
    "",
    content,
    flags=re.DOTALL
)

# Replace the block of use effects
# We'll use a precise regex to remove everything from `// Refs for incremental read receipt tracking` to the end of the last `useEffect` that handles read receipts.
# Looking at the code:
# // Fetch read statuses for own messages (only when own message count changes)
# const ownMessageCountRef = useRef(0);
# ...

start_str = "    // Refs for incremental read receipt tracking (declared before effects that use them)"
end_str = "      if (ownMessageIds.length === 0) return;"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    # Actually wait, the "Fetch read statuses for own messages" effect uses getMessagesReadStatus
    # which we didn't extract into useChatReadReceipts!
    pass
