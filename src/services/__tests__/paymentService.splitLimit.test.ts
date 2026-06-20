/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { paymentService, checkPaymentSplitLimit, SPLIT_LIMIT_ERROR_CODE } from '../paymentService';
import { supabase } from '../../integrations/supabase/client';
import { resolveEffectiveTier } from '../entitlementService';

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock('../entitlementService', () => ({
  resolveEffectiveTier: vi.fn(),
}));

vi.mock('../chatAnalysisService', () => ({
  recordPaymentSplitPattern: vi.fn().mockResolvedValue(undefined),
}));

/** Chainable Supabase query mock; awaiting the chain resolves to `result`. */
function makeChain(result: Record<string, unknown>) {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    then: (resolve: any) => resolve(result),
  };
  return chain;
}

const TRIP_ID = 'trip-1';
const USER_ID = 'user-1';

const validPaymentData = {
  amount: 60,
  currency: 'USD',
  description: 'Dinner',
  splitCount: 3,
  splitParticipants: ['user-1', 'user-2', 'user-3'],
  paymentMethods: ['venmo'],
};

describe('payment split cap enforcement (FEATURE_LIMITS.payment_splitting)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.from as any).mockReset();
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { id: USER_ID } } },
      error: null,
    });
    (supabase.rpc as any).mockResolvedValue({ data: 'pay-123', error: null });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('blocks a free user who already authored 3 splits in the trip with a typed error', async () => {
    (resolveEffectiveTier as any).mockResolvedValue('free');
    const countChain = makeChain({ count: 3, error: null });
    (supabase.from as any).mockReturnValueOnce(countChain);

    const result = await paymentService.createPaymentMessage(TRIP_ID, USER_ID, validPaymentData);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe(SPLIT_LIMIT_ERROR_CODE);
    expect(result.error?.message).toMatch(/3 payment splits per trip/);
    expect(result.error?.message).toMatch(/upgrade/i);

    // The count is scoped to this trip AND this author.
    expect(supabase.from).toHaveBeenCalledWith('trip_payment_messages');
    expect(countChain.eq).toHaveBeenCalledWith('trip_id', TRIP_ID);
    expect(countChain.eq).toHaveBeenCalledWith('created_by', USER_ID);

    // The creation RPC is never reached.
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('allows a free user under the cap and proceeds to the creation RPC', async () => {
    (resolveEffectiveTier as any).mockResolvedValue('free');
    (supabase.from as any).mockReturnValueOnce(makeChain({ count: 2, error: null }));

    const result = await paymentService.createPaymentMessage(TRIP_ID, USER_ID, validPaymentData);

    expect(result.success).toBe(true);
    expect(result.paymentId).toBe('pay-123');
    expect(supabase.rpc).toHaveBeenCalledWith(
      'create_payment_with_splits_v2',
      expect.objectContaining({ p_trip_id: TRIP_ID, p_created_by: USER_ID }),
    );
  });

  it('never runs the count query for unlimited tiers — no behavior change for paid users', async () => {
    (resolveEffectiveTier as any).mockResolvedValue('frequent-chraveler');

    const result = await paymentService.createPaymentMessage(TRIP_ID, USER_ID, validPaymentData);

    expect(result.success).toBe(true);
    expect(supabase.from).not.toHaveBeenCalled();
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
  });

  it('fails OPEN when the count query errors — payment creation is not blocked', async () => {
    (resolveEffectiveTier as any).mockResolvedValue('free');
    (supabase.from as any).mockReturnValueOnce(
      makeChain({ count: null, error: { message: 'count failed' } }),
    );

    const result = await paymentService.createPaymentMessage(TRIP_ID, USER_ID, validPaymentData);

    expect(result.success).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
  });

  it('fails OPEN when tier resolution throws', async () => {
    (resolveEffectiveTier as any).mockRejectedValue(new Error('entitlements down'));

    const result = await paymentService.createPaymentMessage(TRIP_ID, USER_ID, validPaymentData);

    expect(result.success).toBe(true);
    expect(supabase.from).not.toHaveBeenCalled();
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
  });

  it('checkPaymentSplitLimit reports the limit and tier when blocked (explorer = 10)', async () => {
    (resolveEffectiveTier as any).mockResolvedValue('explorer');
    (supabase.from as any).mockReturnValueOnce(makeChain({ count: 10, error: null }));

    const check = await checkPaymentSplitLimit(TRIP_ID, USER_ID);

    expect(check).toEqual({ allowed: false, limit: 10, tier: 'explorer' });
  });
});
