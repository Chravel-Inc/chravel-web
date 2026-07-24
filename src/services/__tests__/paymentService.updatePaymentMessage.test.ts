/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { paymentService } from '../paymentService';
import { supabase } from '../../integrations/supabase/client';

vi.mock('../../integrations/supabase/client', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}));

/**
 * Builds a chainable Supabase query mock. `single` resolves to `result`, and the
 * chain itself is awaitable (thenable) so `await from(...).update(...).select(...)`
 * also resolves to `result`. Every chain method is a spy for assertions.
 */
function makeChain(result: { data: any; error: any }) {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    update: vi.fn(() => chain),
    order: vi.fn(() => chain),
    single: vi.fn().mockResolvedValue(result),
    then: (resolve: any) => resolve(result),
  };
  return chain;
}

describe('paymentService.updatePaymentMessage', () => {
  beforeEach(() => {
    // mockReset drains the mockReturnValueOnce queue so a test that returns early
    // (e.g. the conflict case) doesn't leak an unconsumed chain into the next test.
    (supabase.from as any).mockReset();
    (supabase.rpc as any).mockReset();
  });

  it('uses optimistic locking through the atomic payment edit RPC', async () => {
    const readChain = makeChain({ data: { version: 3 }, error: null });

    (supabase.from as any).mockReturnValueOnce(readChain);
    (supabase.rpc as any).mockResolvedValue({
      data: { success: true },
      error: null,
    });

    const ok = await paymentService.updatePaymentMessage('pay-1', { amount: 10 });

    expect(ok).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith('update_payment_message_atomic', {
      p_payment_id: 'pay-1',
      p_expected_version: 3,
      p_amount: 10,
      p_description: null,
    });
  });

  it('returns false on a version conflict and does not touch splits', async () => {
    const readChain = makeChain({ data: { version: 3 }, error: null });

    (supabase.from as any).mockReturnValueOnce(readChain);
    (supabase.rpc as any).mockResolvedValue({
      data: { success: false, reason: 'VERSION_CONFLICT' },
      error: null,
    });

    const ok = await paymentService.updatePaymentMessage('pay-1', { amount: 100 });

    expect(ok).toBe(false);
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });

  it('passes description-only edits through the atomic RPC without an amount change', async () => {
    const readChain = makeChain({ data: { version: 1 }, error: null });

    (supabase.from as any).mockReturnValueOnce(readChain);
    (supabase.rpc as any).mockResolvedValue({
      data: { success: true },
      error: null,
    });

    const ok = await paymentService.updatePaymentMessage('pay-1', { description: 'Updated label' });

    expect(ok).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith('update_payment_message_atomic', {
      p_payment_id: 'pay-1',
      p_expected_version: 1,
      p_amount: null,
      p_description: 'Updated label',
    });
  });
});
