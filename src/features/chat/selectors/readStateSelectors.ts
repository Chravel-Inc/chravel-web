import type { Channel } from 'stream-chat';

interface ChatMessageLike {
  id: string;
  user_id?: string;
  user?: { id?: string };
  created_at?: string | Date;
  createdAt?: string | Date;
  privacy_mode?: string;
  message_type?: string;
}

interface ReadStatusEntry {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string | Date;
  created_at: string | Date;
}

interface StreamReadState {
  last_read?: string | Date;
  unread_messages?: number;
}

const getMessageUserId = (message: ChatMessageLike): string | undefined =>
  message.user_id ?? message.user?.id;

const toDateOrNull = (value?: string | Date): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export function selectReadStatusesByMessage({
  messages,
  currentUserId,
  activeChannel,
}: {
  messages: ChatMessageLike[];
  currentUserId?: string;
  activeChannel?: Channel | null;
}): Record<string, ReadStatusEntry[]> {
  const streamReadState = activeChannel?.state?.read;
  if (!streamReadState) return {};

  const statusesByMessage: Record<string, ReadStatusEntry[]> = {};

  for (const message of messages) {
    if (!message.id) continue;

    const messageUserId = getMessageUserId(message);
    const messageCreatedAt = toDateOrNull(message.created_at ?? message.createdAt);
    if (!messageCreatedAt) continue;

    const statusesForMessage: ReadStatusEntry[] = [];

    for (const [readerId, readState] of Object.entries(streamReadState)) {
      const readerLastRead = toDateOrNull((readState as StreamReadState)?.last_read);
      if (!readerLastRead) continue;
      if (readerId === currentUserId || readerId === messageUserId) continue;
      if (readerLastRead < messageCreatedAt) continue;

      statusesForMessage.push({
        id: `${message.id}:${readerId}`,
        message_id: message.id,
        user_id: readerId,
        read_at: (readState as StreamReadState).last_read as string | Date,
        created_at: (readState as StreamReadState).last_read as string | Date,
      });
    }

    if (statusesForMessage.length > 0) {
      statusesByMessage[message.id] = statusesForMessage;
    }
  }

  return statusesByMessage;
}

export function splitUnreadFromStreamReadState({
  messages,
  userId,
  totalUnread,
  readState,
}: {
  messages: ChatMessageLike[];
  userId: string;
  totalUnread: number;
  readState?: StreamReadState;
}): { broadcastCount: number; messageUnreadCount: number } {
  if (!totalUnread) {
    return { broadcastCount: 0, messageUnreadCount: 0 };
  }

  const lastRead = toDateOrNull(readState?.last_read);
  if (!lastRead) {
    return { broadcastCount: 0, messageUnreadCount: totalUnread };
  }

  const unreadByMarker = messages.filter(message => {
    const senderId = getMessageUserId(message);
    if (!senderId || senderId === userId) return false;

    const createdAt = toDateOrNull(message.created_at);
    if (!createdAt) return false;

    return createdAt > lastRead;
  });

  if (unreadByMarker.length !== totalUnread) {
    return { broadcastCount: 0, messageUnreadCount: totalUnread };
  }

  const broadcastCount = unreadByMarker.filter(
    message => message.privacy_mode === 'broadcast' || message.message_type === 'broadcast',
  ).length;

  return {
    broadcastCount,
    messageUnreadCount: Math.max(0, totalUnread - broadcastCount),
  };
}
