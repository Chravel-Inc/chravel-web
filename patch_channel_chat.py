import re

with open('src/components/pro/channels/ChannelChatView.tsx', 'r') as f:
    content = f.read()

# Fix the syntax error around line 135
target = """      const metadata = parent
        ? {
            replyTo: {
              id: String(parent.id),
              text: parent.text || '',
              sender: parent.user?.name || 'Unknown',
      return {"""

replacement = """      const metadata = parent
        ? {
            replyTo: {
              id: String(parent.id),
              text: parent.text || '',
              sender: parent.user?.name || 'Unknown',
            },
          }
        : undefined;

      return {"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/pro/channels/ChannelChatView.tsx', 'w') as f:
        f.write(content)
    print("Fixed syntax error")
else:
    print("Target not found. Let's look closer.")
