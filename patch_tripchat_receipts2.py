import re

with open('src/features/chat/components/TripChat.tsx', 'r') as f:
    content = f.read()

# I will replace the state initialization with the hook call.
# Then remove the large block from `// Refs for incremental read receipt tracking (declared before effects that use them)`
# up to `    const liveFormattedMessages = useMemo(() => {`


hook_call = """
    const { readStatusesByMessage, setReadStatusesByMessage } = useChatReadReceipts(
      demoMode.isDemoMode,
      user?.id,
      resolvedTripId,
      liveMessages
    );
"""
content = content.replace("const [readStatusesByMessage, setReadStatusesByMessage] = useState<Record<string, any[]>>({});", hook_call)


start_str = "    // Refs for incremental read receipt tracking (declared before effects that use them)"
end_str = "    const liveFormattedMessages = useMemo(() => {"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + content[end_idx:]


with open('src/features/chat/components/TripChat.tsx', 'w') as f:
    f.write(content)
