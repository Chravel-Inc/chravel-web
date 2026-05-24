import type { MessageResponse } from 'stream-chat';

export type CanonicalMessageEventType = 'create' | 'edit' | 'delete' | 'react' | 'read';

export interface CanonicalMessageEvent {
  id: string;
  eventType: CanonicalMessageEventType;
  messageId: string;
  createdAtMs: number;
  sequence: number;
}

export const getMessageSortTimestampMs = (message: MessageResponse): number => {
  const parsed = Date.parse(message.created_at || '');
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const compareCanonicalMessageOrder = (a: MessageResponse, b: MessageResponse): number => {
  const byTimestamp = getMessageSortTimestampMs(a) - getMessageSortTimestampMs(b);
  if (byTimestamp !== 0) return byTimestamp;
  return (a.id || '').localeCompare(b.id || '');
};

export const sortMessagesWithCanonicalOrdering = (messages: MessageResponse[]): MessageResponse[] =>
  [...messages].sort(compareCanonicalMessageOrder);
