import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getStreamClientMock } = vi.hoisted(() => ({
  getStreamClientMock: vi.fn(() => null),
}));

vi.mock('@/services/stream/streamClient', () => ({
  getStreamClient: getStreamClientMock,
}));

describe('shouldUseLegacyChatSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_STREAM_API_KEY', '');
    getStreamClientMock.mockReturnValue(null);
  });

  it('returns true when Stream is not fully active', async () => {
    const { shouldUseLegacyChatSync } = await import('../globalSyncProcessor');
    expect(shouldUseLegacyChatSync()).toBe(true);

    vi.stubEnv('VITE_STREAM_API_KEY', 'stream-key');
    getStreamClientMock.mockReturnValue(null);
    expect(shouldUseLegacyChatSync()).toBe(true);
  });

  it('returns false when Stream is configured and connected', async () => {
    vi.stubEnv('VITE_STREAM_API_KEY', 'stream-key');
    getStreamClientMock.mockReturnValue({ userID: 'user-1' });
    const { shouldUseLegacyChatSync } = await import('../globalSyncProcessor');
    expect(shouldUseLegacyChatSync()).toBe(false);
  });
});
