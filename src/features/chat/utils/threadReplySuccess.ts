export interface ThreadReplySuccessState {
  parentMessageId: string;
}

export const createThreadReplySuccessState = (
  parentMessageId?: string | null,
): ThreadReplySuccessState | null => {
  if (!parentMessageId) return null;
  return { parentMessageId };
};

export const handleThreadReplySuccessCta = (
  state: ThreadReplySuccessState | null,
  onViewThread: (parentMessageId: string) => void,
): ThreadReplySuccessState | null => {
  if (!state?.parentMessageId) return null;
  onViewThread(state.parentMessageId);
  return null;
};
