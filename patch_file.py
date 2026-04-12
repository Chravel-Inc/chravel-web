import re

with open('src/components/pro/channels/ChannelChatView.tsx', 'r') as f:
    content = f.read()

# Fix globalSyncProcessor.ts
with open('src/services/globalSyncProcessor.ts', 'r') as f:
    g_content = f.read()

# remove duplicate shouldUseLegacyChatSync in globalSyncProcessor
# The duplicate is lines 21-24:
# export function shouldUseLegacyChatSync(): boolean {
#   const streamConfigured = Boolean(import.meta.env.VITE_STREAM_API_KEY);
#   return !streamConfigured;
# }
pattern = r"export function shouldUseLegacyChatSync\(\): boolean \{\s*const streamConfigured = Boolean\(import\.meta\.env\.VITE_STREAM_API_KEY\);\s*return !streamConfigured;\s*\}"
g_content = re.sub(pattern, "", g_content, count=1)
with open('src/services/globalSyncProcessor.ts', 'w') as f:
    f.write(g_content)


# Fix ChannelChatView.tsx

# The code currently has:
#   const transportMessages = useMemo<ChannelMessage[]>(() => {
#     if (!useStreamTransport) return messages;
#
#   // Handle opening a reply
#   const handleOpenReply = useCallback(

# And lower down:
#   // Handle opening a reply
#   const handleOpenReply = useCallback(
# ...

# Wait, handleOpenReply and clearReply are literally duplicated inside the useMemo block?
# Let's extract exactly what's inside the useMemo, remove it, and we don't need to put it back since it's already duplicated below at line 244.

pattern_to_remove = r"  // Handle opening a reply\s*const handleOpenReply = useCallback\(\s*\(messageId: string\) => \{\s*const msg = transportMessages\.find\(m => m\.id === messageId\);\s*if \(!msg\) return;\s*setReplyingTo\(\{\s*id: msg\.id,\s*text: msg\.content,\s*senderName: msg\.senderName,\s*\}\);\s*\},\s*\[transportMessages\],\s*\);\s*const clearReply = useCallback\(\(\) => \{\s*setReplyingTo\(null\);\s*\}, \[\]\);\s*"

content = re.sub(pattern_to_remove, "", content)
with open('src/components/pro/channels/ChannelChatView.tsx', 'w') as f:
    f.write(content)
