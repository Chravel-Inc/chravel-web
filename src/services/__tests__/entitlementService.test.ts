import { describe, it, expect, vi, beforeEach } from 'vitest';

const { maybeSingleMock, orderMock, inMock, eqMock, selectMock, fromMock } = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const order = vi.fn();
  const inFilter = vi.fn(() => ({ order }));
  const eq = vi.fn(() => ({ eq, in: inFilter, maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return {
    maybeSingleMock: maybeSingle,
    orderMock: order,
    inMock: inFilter,
    eqMock: eq,
    selectMock: select,
    fromMock: from,
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: fromMock,
  },
}));

import { resolveEffectiveTier } from '../entitlementService';

describe('resolveEffectiveTier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockImplementation(() => ({ select: selectMock }));
    selectMock.mockImplementation(() => ({ eq: eqMock }));
    eqMock.mockImplementation(() => ({ eq: eqMock, in: inMock, maybeSingle: maybeSingleMock }));
    inMock.mockImplementation(() => ({ order: orderMock }));
  });

  it('returns paid subscription tier from user_entitlements when active', async () => {
    orderMock.mockResolvedValueOnce({
      data: [
        {
          plan: 'pro-growth',
          status: 'active',
          current_period_end: null,
          purchase_type: 'subscription',
          source: 'stripe',
          updated_at: new Date().toISOString(),
        },
      ],
    });
    maybeSingleMock.mockResolvedValueOnce({ data: null });

    const tier = await resolveEffectiveTier('user-1');

    expect(tier).toBe('pro-growth');
  });

  it('returns free when entitlement is expired and no legacy profile is active', async () => {
    orderMock.mockResolvedValueOnce({
      data: [
        {
          plan: 'frequent-chraveler',
          status: 'expired',
          current_period_end: null,
          purchase_type: 'subscription',
          source: 'stripe',
          updated_at: new Date().toISOString(),
        },
      ],
    });
    maybeSingleMock.mockResolvedValueOnce({
      data: { subscription_status: 'inactive', subscription_product_id: null },
    });

    const tier = await resolveEffectiveTier('user-2');

    expect(tier).toBe('free');
  });

  it('falls back to free when entitlements row and legacy profile are missing', async () => {
    orderMock.mockResolvedValueOnce({ data: null });
    maybeSingleMock.mockResolvedValueOnce({ data: null });

    const tier = await resolveEffectiveTier('user-3');

    expect(tier).toBe('free');
  });
});
