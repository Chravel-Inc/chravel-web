with open('src/components/pro/channels/ChannelChatView.tsx', 'r') as f:
    content = f.read()

# Add clearReply back near handleOpenReply
clear_reply_code = """
  const clearReply = useCallback(() => {
    setReplyingTo(null);
  }, []);
"""

content = content.replace("  // Handle opening a reply\n  const handleOpenReply = useCallback(", clear_reply_code + "\n  // Handle opening a reply\n  const handleOpenReply = useCallback(")

with open('src/components/pro/channels/ChannelChatView.tsx', 'w') as f:
    f.write(content)
