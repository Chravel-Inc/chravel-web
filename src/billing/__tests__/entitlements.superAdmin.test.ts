import { describe, it, expect, vi, beforeEach } from 'vitest';

const getUserMock = vi.fn();
const rpcMock = vi.fn();
const invokeMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: (...args: unknown[]) => getUserMock(...args) },
    rpc: (...args: unknown[]) => rpcMock(...args),
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
  },
}));

// Env allowlist contains a single known admin email so we can exercise the
// no-flicker env failsafe independently of the server RPC.
vi.mock('@/constants/admins', () => ({
  SUPER_ADMIN_EMAILS: ['env-admin@example.com'],
}));

import { getEntitlements } from '@/billing/entitlements';

describe('getEntitlements super-admin resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('grants full entitlements when the server is_super_admin RPC returns true', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u1', email: 'someone@example.com' } } });
    rpcMock.mockResolvedValue({ data: true, error: null });

    const ent = await getEntitlements('u1');

    expect(rpcMock).toHaveBeenCalledWith('is_super_admin');
    expect(ent.tier).toBe('pro-enterprise');
    expect(ent.source).toBe('none'); // admin bypass, not a real subscription
    expect(ent.entitlements.has('trips_unlimited')).toBe(true);
    // Super-admin short-circuits: no need to consult the subscription edge fn.
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('grants full entitlements via the env allowlist even when the RPC returns false', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u2', email: 'env-admin@example.com' } } });
    rpcMock.mockResolvedValue({ data: false, error: null });

    const ent = await getEntitlements('u2');

    expect(ent.tier).toBe('pro-enterprise');
    expect(ent.entitlements.has('compliance_audit')).toBe(true);
  });

  it('fails closed: RPC error + non-allowlisted email does not grant super-admin', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u3', email: 'user@example.com' } } });
    rpcMock.mockResolvedValue({ data: null, error: { message: 'boom' } });
    invokeMock.mockResolvedValue({ data: { subscribed: false }, error: null });

    const ent = await getEntitlements('u3');

    expect(ent.tier).toBe('free');
    expect(invokeMock).toHaveBeenCalledWith('check-subscription');
  });

  it('resolves a normal subscription for non-admins (RPC false)', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u4', email: 'paid@example.com' } } });
    rpcMock.mockResolvedValue({ data: false, error: null });
    invokeMock.mockResolvedValue({
      data: { subscribed: true, tier: 'explorer', subscription_end: null },
      error: null,
    });

    const ent = await getEntitlements('u4');

    expect(ent.tier).toBe('explorer');
    expect(ent.source).toBe('stripe');
  });
});
