import { describe, it, expect, vi, beforeEach } from 'vitest';

const { maybeSingleMock, eqMock, selectMock, fromMock } = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const eq = vi.fn(() => ({ eq, maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { maybeSingleMock: maybeSingle, eqMock: eq, selectMock: select, fromMock: from };
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
    eqMock.mockImplementation(() => ({ eq: eqMock, maybeSingle: maybeSingleMock }));
  });

  it('returns paid subscription tier from user_entitlements when active', async () => {
    maybeSingleMock
      .mockResolvedValueOnce({
        data: { plan: 'pro-growth', status: 'active', current_period_end: null },
      })
      .mockResolvedValueOnce({ data: null });

    const tier = await resolveEffectiveTier('user-1');

    expect(tier).toBe('pro-growth');
  });

  it('returns free when entitlement is expired and no legacy profile is active', async () => {
    maybeSingleMock
      .mockResolvedValueOnce({
        data: { plan: 'frequent-chraveler', status: 'expired', current_period_end: null },
      })
      .mockResolvedValueOnce({
        data: { subscription_status: 'inactive', subscription_product_id: null },
      });

    const tier = await resolveEffectiveTier('user-2');

    expect(tier).toBe('free');
  });

  it('falls back to free when entitlements row and legacy profile are missing', async () => {
    maybeSingleMock.mockResolvedValueOnce({ data: null }).mockResolvedValueOnce({ data: null });

    const tier = await resolveEffectiveTier('user-3');

    expect(tier).toBe('free');
  });
});
