import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePendingRequestTripCards } from '../usePendingRequestTripCards';

const rpcMock = vi.fn();
const channelOnMock = vi.fn();
const removeChannelMock = vi.fn();
const channelMock = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
    from: () => {
      throw new Error('Unexpected table access');
    },
    channel: (...args: unknown[]) => channelMock(...args),
    removeChannel: (...args: unknown[]) => removeChannelMock(...args),
  },
}));

describe('usePendingRequestTripCards realtime', () => {
  let queryClient: QueryClient;

  const createWrapper =
    () =>
    ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    rpcMock.mockResolvedValue({ data: [], error: null });

    channelMock.mockImplementation(() => {
      const channel = {
        on: (...args: unknown[]) => {
          channelOnMock(...args);
          return channel;
        },
        subscribe: () => channel,
      };
      return channel;
    });
  });

  it('subscribes to own join-request changes and invalidates cards on events', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { unmount } = renderHook(() => usePendingRequestTripCards(false), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(channelMock).toHaveBeenCalledWith('pending_request_cards:user-1');
    });

    const [event, config, callback] = channelOnMock.mock.calls[0] as [
      string,
      { table: string; filter: string; event: string },
      () => void,
    ];
    expect(event).toBe('postgres_changes');
    expect(config.table).toBe('trip_join_requests');
    expect(config.filter).toBe('user_id=eq.user-1');
    expect(config.event).toBe('*');

    invalidateSpy.mockClear();
    callback();

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['pending-request-trip-cards'] }),
      );
    });

    unmount();
    expect(removeChannelMock).toHaveBeenCalledTimes(1);
  });

  it('does not subscribe in demo mode', async () => {
    renderHook(() => usePendingRequestTripCards(true), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(rpcMock).not.toHaveBeenCalled();
    });
    expect(channelMock).not.toHaveBeenCalled();
  });
});
