import type { ChatMessage } from '../hooks/useChatComposer';

export type PinnedChatMessage = ChatMessage & {
  pinnedAt?: string;
};

/**
 * Stream may deliver updated message snapshots more than once while events settle.
 * Keep only one entry per message id and return newest pinned-first order.
 */
export function derivePinnedMessages(messages: Array<ChatMessage & { isPinned?: boolean }>) {
  const dedupedById = new Map<string, PinnedChatMessage>();

  for (const message of messages) {
    if (!message.isPinned) {
      dedupedById.delete(message.id);
      continue;
    }
    dedupedById.set(message.id, {
      ...message,
      pinnedAt: (message as { pinnedAt?: string }).pinnedAt,
    });
  }

  return Array.from(dedupedById.values()).sort((a, b) => {
    const aPinnedAt = Date.parse(a.pinnedAt || a.createdAt || '');
    const bPinnedAt = Date.parse(b.pinnedAt || b.createdAt || '');
    return bPinnedAt - aPinnedAt;
  });
}
