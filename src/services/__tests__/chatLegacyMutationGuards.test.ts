import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fromMock, onAuthStateChangeMock, getUserMock, getStreamClientMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  onAuthStateChangeMock: vi.fn(),
  getUserMock: vi.fn(),
  getStreamClientMock: vi.fn(),
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

vi.mock('../stream/streamClient', () => ({
  getStreamClient: () => getStreamClientMock(),
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
    systemMessageService._clearTripTypeCache();
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

  it('does NOT write trip_chat_messages from systemMessageService — Stream is the canonical sink', async () => {
    // Mock real-trip lookup as a consumer trip
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: { trip_type: 'consumer' } }) }),
      }),
    });
    // No connected Stream client → the service no-ops (returns false) instead of writing legacy
    getStreamClientMock.mockReturnValue(null);

    const result = await systemMessageService.createSystemMessage(
      '00000000-0000-0000-0000-000000000001',
      'task_created',
      'Task added',
    );

    expect(result).toBe(false);
    // Only the trip-type lookup may hit `from('trips')`; never `trip_chat_messages`
    const calls = fromMock.mock.calls.map(args => args[0]);
    expect(calls).not.toContain('trip_chat_messages');
  });
});
