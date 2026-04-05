import re

with open('src/features/chat/components/TripChat.tsx', 'r') as f:
    content = f.read()

import_str = "import { useChatReadReceipts } from '../hooks/useChatReadReceipts';\n"
if "import { useChatReadReceipts }" not in content:
    content = content.replace("import { useChatReactions }", import_str + "import { useChatReactions }")

with open('src/features/chat/components/TripChat.tsx', 'w') as f:
    f.write(content)
