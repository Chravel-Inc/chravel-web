import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('shouldUseLegacyChatSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_STREAM_API_KEY', '');
  });

  it('returns true when Stream is not configured', async () => {
    const { shouldUseLegacyChatSync } = await import('../globalSyncProcessor');
    expect(shouldUseLegacyChatSync()).toBe(true);
  });

  it('returns false when Stream is configured (regardless of connection timing)', async () => {
    vi.stubEnv('VITE_STREAM_API_KEY', 'stream-key');
    const { shouldUseLegacyChatSync } = await import('../globalSyncProcessor');
    expect(shouldUseLegacyChatSync()).toBe(false);
  });
});
