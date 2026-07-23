import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode } from 'react';
import { ConsumerSubscriptionProvider, useConsumerSubscription } from '../useConsumerSubscription';
import { useSuperAdmin } from '../useSuperAdmin';

const invokeMock = vi.fn();

// Authenticated user so the provider's initial check-subscription effect fires.
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'user@example.com' } }),
}));

// The provider must source super-admin status from this server-authoritative
// hook, never from a client email/role check of its own.
vi.mock('@/hooks/useSuperAdmin', () => ({
  useSuperAdmin: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
  },
}));

// Avoid native/Capacitor side effects on import; only the event name is used.
vi.mock('@/integrations/revenuecat/revenuecatClient', () => ({
  ENTITLEMENTS_UPDATED_EVENT: 'entitlements-updated',
}));

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ConsumerSubscriptionProvider>{children}</ConsumerSubscriptionProvider>
      </QueryClientProvider>
    );
  };
}

describe('useConsumerSubscription super-admin wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invokeMock.mockResolvedValue({
      data: { subscribed: false, status: null, tier: null, subscription_end: null },
      error: null,
    });
  });

  it('unlocks pro access from server-verified useSuperAdmin, even with no subscription', async () => {
    vi.mocked(useSuperAdmin).mockReturnValue({ isSuperAdmin: true });

    const { result } = renderHook(() => useConsumerSubscription(), { wrapper: createWrapper() });
    await waitFor(() => expect(invokeMock).toHaveBeenCalled());

    expect(result.current.isSuperAdmin).toBe(true);
    expect(result.current.isPlus).toBe(true);
    expect(result.current.isSubscribed).toBe(true);
    expect(result.current.canCreateProTrip).toBe(true);
    expect(result.current.proTripQuota).toBe(-1);
    expect(result.current.tier).toBe('frequent-chraveler');
    expect(result.current.proTier).toBe('pro-enterprise');
  });

  it('does not grant pro access when useSuperAdmin reports false', async () => {
    vi.mocked(useSuperAdmin).mockReturnValue({ isSuperAdmin: false });

    const { result } = renderHook(() => useConsumerSubscription(), { wrapper: createWrapper() });
    await waitFor(() => expect(invokeMock).toHaveBeenCalled());
    await waitFor(() => expect(result.current.tier).toBe('free'));

    expect(result.current.isSuperAdmin).toBe(false);
    expect(result.current.isPlus).toBe(false);
    expect(result.current.canCreateProTrip).toBe(false);
    expect(result.current.proTripQuota).toBe(0);
    expect(result.current.proTier).toBeNull();
  });
});
