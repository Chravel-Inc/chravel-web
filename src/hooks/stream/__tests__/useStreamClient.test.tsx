import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const connectStreamClientMock = vi.fn();
const disconnectStreamClientMock = vi.fn();
const getStreamApiKeyMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('@/services/stream/streamClient', () => ({
  connectStreamClient: (...args: unknown[]) => connectStreamClientMock(...args),
  disconnectStreamClient: (...args: unknown[]) => disconnectStreamClientMock(...args),
  getStreamApiKey: (...args: unknown[]) => getStreamApiKeyMock(...args),
}));

import { useStreamClient } from '../useStreamClient';

describe('useStreamClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStreamApiKeyMock.mockReturnValue('stream-key');
    useAuthMock.mockReturnValue({ user: { id: 'user-1' } });
  });

  it('sets a surfaced error when stream connect returns null client', async () => {
    connectStreamClientMock.mockResolvedValue(null);

    const { result } = renderHook(() => useStreamClient());

    await waitFor(() => {
      expect(result.current.isConnecting).toBe(false);
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBe('Stream connection unavailable. Chat may be degraded.');
  });
});
