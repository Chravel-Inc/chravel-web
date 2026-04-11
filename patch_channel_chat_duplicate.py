import re

with open('src/components/pro/channels/ChannelChatView.tsx', 'r') as f:
    content = f.read()

# We need to remove the first two declarations of `transportMessages`.
# It looks like there's a big mess of duplicate blocks in this file from line 119 to 176.
# Let's write a regex to replace everything from the first `const transportMessages =`
# up to just before the last `const transportMessages =` at line 178

pattern = re.compile(r'  // Transform ChannelMessage to ChatMessage format for MessageItem\s+const transportMessages = useMemo.*?clearReply = useCallback\(\(\) => \{\s+setReplyingTo\(null\);\s+\},\s+\[\]\);\s+', re.DOTALL)

matches = pattern.findall(content)
if len(matches) > 0:
    content = content.replace(matches[0], "")
    with open('src/components/pro/channels/ChannelChatView.tsx', 'w') as f:
        f.write(content)
    print("Fixed duplicate declarations")
else:
    print("Could not find pattern. Let's do a more explicit replacement.")
