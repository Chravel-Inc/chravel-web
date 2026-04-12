import { beforeEach, describe, expect, it, vi } from 'vitest';

const fromMock = vi.fn();
const channelMock = vi.fn();

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
    channel: (...args: unknown[]) => channelMock(...args),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

import { channelService } from '../channelService';
import { roleChannelService } from '../roleChannelService';

describe('legacy channel realtime guards in stream-configured mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_STREAM_API_KEY', 'stream-key');
  });

  it('channelService avoids Supabase reads/subscriptions', async () => {
    const messages = await channelService.getMessages('channel-1');
    const unsubscribe = channelService.subscribeToChannel('channel-1', vi.fn());

    expect(messages).toEqual([]);
    expect(typeof unsubscribe).toBe('function');
    expect(fromMock).not.toHaveBeenCalled();
    expect(channelMock).not.toHaveBeenCalled();
  });

  it('roleChannelService avoids Supabase reads/subscriptions', async () => {
    const messages = await roleChannelService.getChannelMessages('channel-1');
    const unsubscribe = roleChannelService.subscribeToChannel('channel-1', vi.fn());

    expect(messages).toEqual([]);
    expect(typeof unsubscribe).toBe('function');
    expect(fromMock).not.toHaveBeenCalled();
    expect(channelMock).not.toHaveBeenCalled();
  });
});
