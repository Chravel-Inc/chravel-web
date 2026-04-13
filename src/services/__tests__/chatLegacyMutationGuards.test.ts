import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fromMock, onAuthStateChangeMock, getUserMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  onAuthStateChangeMock: vi.fn(),
  getUserMock: vi.fn(),
}));

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
    auth: {
      onAuthStateChange: (...args: unknown[]) => onAuthStateChangeMock(...args),
      getUser: (...args: unknown[]) => getUserMock(...args),
    },
  },
}));

import {
  deleteChatMessage,
  editChatMessage,
  sendChatMessage,
  sendRichChatMessage,
} from '../chatService';
import { systemMessageService } from '../systemMessageService';

describe('legacy chat DB mutation guards in stream-configured mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_STREAM_API_KEY', 'stream-key');
  });

  it('blocks direct trip chat DB mutations in chatService', async () => {
    await expect(sendChatMessage({ trip_id: 'trip-1', content: 'hello' })).rejects.toMatchObject({
      code: 'STREAM_CANONICAL_TRANSPORT',
    });
    await expect(
      sendRichChatMessage({ trip_id: 'trip-1', content: 'hello' }),
    ).rejects.toMatchObject({
      code: 'STREAM_CANONICAL_TRANSPORT',
    });
    await expect(editChatMessage('msg-1', 'edited')).rejects.toMatchObject({
      code: 'STREAM_CANONICAL_TRANSPORT',
    });
    await expect(deleteChatMessage('msg-1')).rejects.toMatchObject({
      code: 'STREAM_CANONICAL_TRANSPORT',
    });

    expect(fromMock).not.toHaveBeenCalled();
  });

  it('blocks systemMessageService trip_chat_messages writes in stream-configured mode', async () => {
    const result = await systemMessageService.createSystemMessage(
      'trip-1',
      'task_created',
      'Task added',
    );

    expect(result).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
    expect(getUserMock).not.toHaveBeenCalled();
  });
});
