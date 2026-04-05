import re

with open('src/features/chat/hooks/useChatReadReceipts.ts', 'r') as f:
    content = f.read()

import_str = "import { markMessagesAsRead, subscribeToReadReceipts, getMessagesReadStatus } from '@/services/readReceiptService';"
content = content.replace("import { markMessagesAsRead, subscribeToReadReceipts } from '@/services/readReceiptService';", import_str)


fetch_effect = """
  // Fetch read statuses for own messages (only when own message count changes)
  const ownMessageCountRef = useRef(0);
  useEffect(() => {
    if (isDemoMode || !userId || liveMessages.length === 0) return;

    const ownMessages = liveMessages.filter(msg => msg.user_id === userId);
    if (ownMessages.length === ownMessageCountRef.current) return;
    ownMessageCountRef.current = ownMessages.length;

    const ownMessageIds = ownMessages.map(msg => msg.id);
    if (ownMessageIds.length === 0) return;

    getMessagesReadStatus(ownMessageIds)
      .then(statuses => setReadStatusesByMessage(prev => ({ ...prev, ...statuses })))
      .catch(e => {
        if (import.meta.env.DEV) {
          console.error('Failed to fetch read statuses', e);
        }
      });
  }, [liveMessages, userId, isDemoMode]);

"""

content = content.replace("  return { readStatusesByMessage, setReadStatusesByMessage };", fetch_effect + "  return { readStatusesByMessage, setReadStatusesByMessage };")


with open('src/features/chat/hooks/useChatReadReceipts.ts', 'w') as f:
    f.write(content)
