import { LARGE_LIST_THRESHOLDS } from './largeListThresholds';

/** Keep the newest messages when client state exceeds the retention cap. */
export function capRetainedMessages<T>(
  messages: T[],
  maxCount: number = LARGE_LIST_THRESHOLDS.maxRetainedChatMessages,
): T[] {
  if (messages.length <= maxCount) return messages;
  return messages.slice(messages.length - maxCount);
}
