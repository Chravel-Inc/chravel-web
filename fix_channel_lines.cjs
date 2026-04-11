const fs = require('fs');
const file = 'src/components/pro/channels/ChannelChatView.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// There's a duplicate declaration:
// 119-  // Transform ChannelMessage to ChatMessage format for MessageItem
// 120:  const transportMessages = useMemo<ChannelMessage[]>(() => {
// 121-    if (!useStreamTransport) return messages;
// 122-
// 123-  // Transform ChannelMessage to ChatMessage format for MessageItem
// 124:  const transportMessages = useMemo<ChannelMessage[]>(() => {

// Let's remove the block from line 119 to 157.
// Actually let's search for "const transportMessages = useMemo<ChannelMessage[]>(() => {"
const indexes = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const transportMessages = useMemo<ChannelMessage[]>(')) {
    indexes.push(i);
  }
}
console.log('Indexes of transportMessages:', indexes);

// It seems there are multiple. We only need one.
// Let's find the full block of the last one and keep it.
// The block ends at "  }, [channel.id, messages, streamProChannel.messages, useStreamTransport]);"
const endIndexes = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('}, [channel.id, messages, streamProChannel.messages, useStreamTransport]);')) {
    endIndexes.push(i);
  }
}
console.log('End indexes:', endIndexes);

// Remove the extra blocks:
if (indexes.length > 1) {
    // we want to keep only the LAST valid block.
    // So we can delete from the first index (and its preceding comment) up to the end of the second-to-last block
    const firstStartIndex = indexes[0] - 1; // including the comment
    const secondToLastEndIndex = endIndexes[endIndexes.length - 2];
    lines.splice(firstStartIndex, secondToLastEndIndex - firstStartIndex + 1);
}

// Also there's an error at line 709 about ")"
// Expected ")" but found ";"
// 707|      </>
// 708|    );
// 709|  };
// Wait, is the component properly closed? Let's check lines 700 to the end.
for (let i = Math.max(0, lines.length - 15); i < lines.length; i++) {
    console.log(i + ':', lines[i]);
}

fs.writeFileSync(file, lines.join('\n'));
