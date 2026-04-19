import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStreamTripChat } from '../useStreamTripChat';
import { supabase } from '@/integrations/supabase/client';

const sendMessageMock = vi.fn();
const watchMock = vi.fn();
const queryMock = vi.fn();
const stopWatchingMock = vi.fn();
const onMock = vi.fn();
const offMock = vi.fn();

const mockChannel = {
  watch: watchMock,
  query: queryMock,
  stopWatching: stopWatchingMock,
  on: onMock,
  off: offMock,
  sendMessage: sendMessageMock,
};

vi.mock('@/services/stream/streamClient', () => ({
  connectStreamClient: vi.fn().mockResolvedValue({
    userID: 'user-1',
    channel: vi.fn(() => mockChannel),
  }),
  getStreamApiKey: vi.fn(() => 'stream-key'),
  getStreamClient: vi.fn(() => ({
    userID: 'user-1',
    channel: vi.fn(() => mockChannel),
  })),
  onStreamClientConnected: vi.fn(() => () => {}),
  onStreamClientConnectionStatusChange: vi.fn(() => () => {}),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
          })),
        })),
      })),
    })),
  },
  SUPABASE_PROJECT_URL: 'https://test.supabase.co',
  SUPABASE_PUBLIC_API_KEY: 'test-publishable-key',
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('useStreamTripChat send path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    watchMock.mockResolvedValue({ messages: [], membership: { user_id: 'user-1' } });
    queryMock.mockResolvedValue({ messages: [] });
    sendMessageMock.mockResolvedValue({
      message: { id: 'msg-1', text: 'hello', created_at: new Date().toISOString() },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('sendMessageAsync awaits real sendMessage and uses HTTP response for immediate UI update', async () => {
    const { result } = renderHook(() => useStreamTripChat('trip-abc', { enabled: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let settled = false;
    await act(async () => {
      void result.current.sendMessageAsync('hello', 'You').then(() => {
        settled = true;
      });
    });

    expect(settled).toBe(true);
    expect(result.current.isCreating).toBe(false);
    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    // Message should appear in local state from HTTP response
    expect(result.current.messages).toHaveLength(1);
  });

  it('sendMessageAsync throws on rejected sendMessage so caller can restore draft', async () => {
    sendMessageMock.mockRejectedValue(new Error('Not a member'));

    const { result } = renderHook(() => useStreamTripChat('trip-abc', { enabled: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let caughtError: Error | null = null;
    await act(async () => {
      try {
        await result.current.sendMessageAsync('hello', 'You');
      } catch (err) {
        caughtError = err as Error;
      }
    });

    expect(caughtError).toBeTruthy();
    expect(caughtError!.message).toBe('Not a member');
    expect(result.current.isCreating).toBe(false);
  });

  it('retries without mentions when Stream denies CreateMention permission', async () => {
    sendMessageMock
      .mockRejectedValueOnce(
        new Error('StreamChat error code 17: ... action CreateMention ... not allowed'),
      )
      .mockResolvedValueOnce({
        message: {
          id: 'msg-mentions-fallback',
          text: 'hello',
          created_at: new Date().toISOString(),
        },
      });

    const { result } = renderHook(() => useStreamTripChat('trip-abc', { enabled: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.sendMessageAsync(
        'hello',
        'You',
        undefined,
        undefined,
        'user-1',
        undefined,
        'text',
        undefined,
        ['user-2'],
      );
    });

    expect(sendMessageMock).toHaveBeenCalledTimes(2);
    expect(sendMessageMock.mock.calls[0]?.[0]?.mentioned_users).toEqual(['user-2']);
    expect(sendMessageMock.mock.calls[1]?.[0]?.mentioned_users).toBeUndefined();
    expect(result.current.messages).toHaveLength(1);
  });

  it('strips legacy reply ids before sending to Stream parent_id', async () => {
    const { result } = renderHook(() => useStreamTripChat('trip-abc', { enabled: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.sendMessage(
        'hello',
        'You',
        undefined,
        undefined,
        'user-1',
        undefined,
        'text',
        'legacy-1',
      );
    });

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(sendMessageMock.mock.calls[0]?.[0]?.parent_id).toBeUndefined();
  });

  it('continues to channel.watch when stream-join-channel aborts', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { access_token: 'jwt-token' } },
      error: null,
    } as Awaited<ReturnType<typeof supabase.auth.getSession>>);

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('signal is aborted without reason'));

    const { result } = renderHook(() => useStreamTripChat('trip-abc', { enabled: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(watchMock).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    fetchSpy.mockRestore();
  });

  it('recovers deterministically when initial ReadChannel fails then ensure-membership succeeds', async () => {
    watchMock
      .mockRejectedValueOnce(
        new Error(
          "StreamChat error code 17: GetOrCreateChannel failed with error: User 'abc' is not allowed to perform action ReadChannel",
        ),
      )
      .mockResolvedValueOnce({
        membership: { user_id: 'user-1' },
        messages: [
          { id: 'msg-recovered', text: 'Recovered', created_at: new Date().toISOString() },
        ],
      });

    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: { success: true, code: 'ok' },
      error: null,
    } as Awaited<ReturnType<typeof supabase.functions.invoke>>);

    const { result } = renderHook(() => useStreamTripChat('trip-abc', { enabled: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith('stream-ensure-membership', {
      body: { tripId: 'trip-abc', userId: 'user-1' },
    });
    expect(watchMock).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
    expect(result.current.messages[0]?.id).toBe('msg-recovered');
  });

  it('surfaces stable user-facing error when ensure-membership fails', async () => {
    watchMock.mockRejectedValue(
      new Error(
        "StreamChat error code 17: GetOrCreateChannel failed with error: User 'abc' is not allowed to perform action ReadChannel",
      ),
    );

    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: { success: false, code: 'membership_required', reason: 'User is not a trip member' },
      error: null,
    } as Awaited<ReturnType<typeof supabase.functions.invoke>>);

    const { result } = renderHook(() => useStreamTripChat('trip-abc', { enabled: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error?.message).toBe(
      'We could not verify your trip chat access. Please refresh and try again.',
    );
    expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);
  });
});
