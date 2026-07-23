import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode } from 'react';
import { useSuperAdmin } from '../useSuperAdmin';

// Hoisted so the vi.mock factories (which are hoisted above imports) can close
// over mutable state we set per test.
const rpcMock = vi.hoisted(() => vi.fn());
const state = vi.hoisted(() => ({
  adminEmails: [] as string[],
  user: null as null | { id: string; email: string },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: state.user }),
}));

vi.mock('@/constants/admins', () => ({
  get SUPER_ADMIN_EMAILS() {
    return state.adminEmails;
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: (...args: unknown[]) => rpcMock(...args) },
}));

function createWrapper() {
  // retry:false so a queryFn throw surfaces immediately instead of retrying.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, queryClient };
}

describe('useSuperAdmin', () => {
  beforeEach(() => {
    rpcMock.mockReset();
    state.adminEmails = [];
    state.user = { id: 'admin-1', email: 'server-admin@example.com' };
  });

  it('resolves a server-only super admin from the is_super_admin RPC', async () => {
    rpcMock.mockResolvedValue({ data: true, error: null });
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSuperAdmin(), { wrapper });

    await waitFor(() => expect(result.current.isSuperAdmin).toBe(true));
    expect(rpcMock).toHaveBeenCalledWith('is_super_admin');
  });

  it('retains the last-good true when a background refetch errors', async () => {
    // First fetch succeeds → server admin.
    rpcMock.mockResolvedValueOnce({ data: true, error: null });
    const { wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => useSuperAdmin(), { wrapper });
    await waitFor(() => expect(result.current.isSuperAdmin).toBe(true));

    // A transient RPC error on refetch must NOT drop the admin to non-admin:
    // the queryFn rethrows, so React Query keeps the prior `data` (true).
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'network blip' } });
    await act(async () => {
      await queryClient.refetchQueries({ queryKey: ['is-super-admin', 'admin-1'] }).catch(() => {});
    });

    expect(result.current.isSuperAdmin).toBe(true);
  });

  it('fails closed to the env allowlist when the first fetch errors', async () => {
    // No prior success → no retained value → non-allowlisted user stays non-admin.
    rpcMock.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSuperAdmin(), { wrapper });

    await waitFor(() => expect(rpcMock).toHaveBeenCalled());
    expect(result.current.isSuperAdmin).toBe(false);
  });

  it('treats an env-allowlisted email as super admin even if the RPC errors', async () => {
    state.adminEmails = ['founder@chravel.com'];
    state.user = { id: 'founder-1', email: 'Founder@Chravel.com  ' };
    rpcMock.mockResolvedValue({ data: null, error: { message: 'down' } });
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSuperAdmin(), { wrapper });

    // envMatch is synchronous (case-insensitive + trimmed) and independent of the RPC.
    expect(result.current.isSuperAdmin).toBe(true);
  });

  it('returns false and never calls the RPC when unauthenticated', async () => {
    state.user = null;
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSuperAdmin(), { wrapper });

    expect(result.current.isSuperAdmin).toBe(false);
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
