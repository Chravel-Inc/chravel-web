import re

with open('src/features/chat/components/TripChat.tsx', 'r') as f:
    content = f.read()

# Replace the specific ending structure
content = content.replace("    );\n  },\n);", "    );\n  }\n);")

with open('src/features/chat/components/TripChat.tsx', 'w') as f:
    f.write(content)
