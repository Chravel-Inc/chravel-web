import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  isStreamChatActive,
  isStreamConfigured,
  shouldUseLegacyChatSync,
} from '../streamTransportGuards';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('streamTransportGuards', () => {
  it('treats blank Stream API keys as not configured', () => {
    vi.stubEnv('VITE_STREAM_API_KEY', '   ');

    expect(isStreamConfigured()).toBe(false);
    expect(shouldUseLegacyChatSync()).toBe(true);
  });

  it('treats non-empty Stream API keys as configured', () => {
    vi.stubEnv('VITE_STREAM_API_KEY', 'stream-key');

    expect(isStreamConfigured()).toBe(true);
    expect(shouldUseLegacyChatSync()).toBe(false);
  });

  it('is active only when configured and connected', () => {
    vi.stubEnv('VITE_STREAM_API_KEY', 'stream-key');

    expect(isStreamChatActive('user-1')).toBe(true);
    expect(isStreamChatActive('')).toBe(false);
  });
});
