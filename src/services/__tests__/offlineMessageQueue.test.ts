import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { supabase } from '@/integrations/supabase/client';
import {
  clearQueue,
  getQueuedMessages,
  processQueue,
  queueMessage,
} from '@/services/offlineMessageQueue';

vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      from: vi.fn(),
    },
  };
});

describe('offlineMessageQueue', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_STREAM_API_KEY', '');
    await clearQueue();
  });

  it('treats client_message_id duplicate-key errors as success (legacy queue)', async () => {
    const fromMock = vi.mocked(supabase.from);

    const single = vi.fn().mockResolvedValue({
      data: null,
      error: {
        code: '23505',
        message:
          'duplicate key value violates unique constraint "idx_trip_chat_messages_client_dedupe" (client_message_id)',
      },
    });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));

    fromMock.mockReturnValue({ insert } as unknown as ReturnType<typeof supabase.from>);

    await queueMessage({
      trip_id: 'trip_1',
      content: 'Hello',
      author_name: 'Me',
      client_message_id: '00000000-0000-4000-8000-000000000000',
      privacy_mode: 'standard',
      message_type: 'text',
    } as unknown as Parameters<typeof queueMessage>[0]);

    const result = await processQueue();

    expect(result).toEqual({ success: 1, failed: 0, dropped: 0 });
    expect(await getQueuedMessages()).toEqual([]);
    expect(fromMock).toHaveBeenCalledWith('trip_chat_messages');
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it('drops queued legacy chat operations when Stream is configured', async () => {
    vi.stubEnv('VITE_STREAM_API_KEY', 'stream-key');

    await queueMessage({
      trip_id: 'trip_2',
      content: 'Legacy queued message',
      author_name: 'Me',
      client_message_id: '00000000-0000-4000-8000-000000000001',
      privacy_mode: 'standard',
      message_type: 'text',
    } as unknown as Parameters<typeof queueMessage>[0]);

    const result = await processQueue();

    expect(result).toEqual({ success: 0, failed: 0, dropped: 1 });
    expect(await getQueuedMessages()).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
