with open("src/services/stream/adapters/mappers/messageMapper.ts", "r") as f:
    content = f.read()

# Block 1
block1_search = """<<<<<<< HEAD
  const reactionMap: Record<string, { count: number; userReacted: boolean; users: string[] }> = {};
  if (msg.reaction_counts) {
    for (const [type, count] of Object.entries(msg.reaction_counts)) {
      reactionMap[type] = {
        count: count,
        userReacted: !!msg.own_reactions?.some(r => r.type === type),
        users:
          msg.latest_reactions?.filter(r => r.type === type).map(r => r.user?.id as string) || [],
=======
  // Extract reactions
  const reactions: Record<string, { count: number; userReacted: boolean; users: string[] }> = {};
  if (msg.reaction_counts) {
    for (const [type, count] of Object.entries(msg.reaction_counts)) {
      reactions[type] = {
        count: count as number,
        userReacted: false,
        users: [],
>>>>>>> origin/main
      };
    }
  }

<<<<<<< HEAD
=======
  // Populate users from latest_reactions
  if (msg.latest_reactions) {
    for (const reaction of msg.latest_reactions) {
      const type = reaction.type;
      if (!reactions[type]) {
        reactions[type] = { count: 0, userReacted: false, users: [] };
      }
      if (reaction.user?.id && !reactions[type].users.includes(reaction.user.id)) {
        reactions[type].users.push(reaction.user.id);
      }
    }
  }

  // Set own reaction flags
  if (msg.own_reactions) {
    for (const reaction of msg.own_reactions) {
      const type = reaction.type;
      if (!reactions[type]) {
        reactions[type] = { count: 0, userReacted: false, users: [] };
      }
      reactions[type].userReacted = true;
      if (reaction.user?.id && !reactions[type].users.includes(reaction.user.id)) {
        reactions[type].users.push(reaction.user.id);
      }
    }
  }

>>>>>>> origin/main"""
block1_replace = """  const reactionMap: Record<string, { count: number; userReacted: boolean; users: string[] }> = {};
  if (msg.reaction_counts) {
    for (const [type, count] of Object.entries(msg.reaction_counts)) {
      reactionMap[type] = {
        count: count as number,
        userReacted: !!msg.own_reactions?.some(r => r.type === type),
        users:
          msg.latest_reactions?.filter(r => r.type === type).map(r => r.user?.id as string) || [],
      };
    }
  }"""
content = content.replace(block1_search, block1_replace)

# Block 2
block2_search = """<<<<<<< HEAD
    reactions: reactionMap,
=======
    reactions: Object.keys(reactions).length > 0 ? reactions : undefined,
>>>>>>> origin/main"""
block2_replace = "    reactions: reactionMap,"
content = content.replace(block2_search, block2_replace)


with open("src/services/stream/adapters/mappers/messageMapper.ts", "w") as f:
    f.write(content)
