import re

with open('src/features/chat/components/TripChat.tsx', 'r') as f:
    content = f.read()

# Make sure syntax is valid
# Delete the stray comment and bracket
content = re.sub(
    r"\s*// Authenticated mode: persist to database\s*\}\s*// Optimistic update",
    "\n      // Optimistic update",
    content
)

with open('src/features/chat/components/TripChat.tsx', 'w') as f:
    f.write(content)
