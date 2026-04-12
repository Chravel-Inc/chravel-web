import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetUser = vi.fn();

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
    from: vi.fn(),
  },
}));

import { roleChannelService } from '../roleChannelService';

describe('roleChannelService stream canonical guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_STREAM_API_KEY', '');
  });

  it('returns null and does not call Supabase when stream is configured', async () => {
    vi.stubEnv('VITE_STREAM_API_KEY', 'stream-key');

    const result = await roleChannelService.sendChannelMessage('channel-1', 'hello');

    expect(result).toBeNull();
    expect(mockGetUser).not.toHaveBeenCalled();
  });
});
