import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode } from 'react';
import { useTripNotificationMute } from '../useTripNotificationMute';

const rpcMock = vi.fn();
const maybeSingleMock = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'member@example.com' } }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () => maybeSingleMock(),
          }),
        }),
      }),
    }),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useTripNotificationMute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads the caller-own membership row and reports muted state', async () => {
    maybeSingleMock.mockResolvedValue({ data: { notifications_muted: true }, error: null });

    const { result } = renderHook(() => useTripNotificationMute('trip-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.muted).toBe(true);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('toggles via the set_trip_notifications_muted RPC with the inverted value', async () => {
    maybeSingleMock.mockResolvedValue({ data: { notifications_muted: false }, error: null });
    rpcMock.mockResolvedValue({ data: { success: true, muted: true }, error: null });

    const { result } = renderHook(() => useTripNotificationMute('trip-1'), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.toggleMute());

    await waitFor(() =>
      expect(rpcMock).toHaveBeenCalledWith('set_trip_notifications_muted', {
        p_trip_id: 'trip-1',
        p_muted: true,
      }),
    );
  });

  it('rolls back the optimistic flip when the RPC rejects the caller', async () => {
    maybeSingleMock.mockResolvedValue({ data: { notifications_muted: false }, error: null });
    rpcMock.mockResolvedValue({ data: { success: false, error: 'NOT_A_MEMBER' }, error: null });

    const { result } = renderHook(() => useTripNotificationMute('trip-1'), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.toggleMute());

    // Optimistic flip happens, then rolls back to unmuted on error
    await waitFor(() => expect(result.current.isToggling).toBe(false));
    await waitFor(() => expect(result.current.muted).toBe(false));
  });

  it('fails open to unmuted when the membership read errors', async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: { message: 'rls denied' } });

    const { result } = renderHook(() => useTripNotificationMute('trip-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.muted).toBe(false);
  });

  it('never queries without a tripId (auth-hydration gate)', async () => {
    const { result } = renderHook(() => useTripNotificationMute(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.muted).toBe(false);
    act(() => result.current.toggleMute());
    expect(rpcMock).not.toHaveBeenCalled();
    expect(maybeSingleMock).not.toHaveBeenCalled();
  });
});
