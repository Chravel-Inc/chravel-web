/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Atomic settlement contract tests (PLATFORM_AUDIT_CONSTITUTION L51-52/L153; REPORT §5 C4).
 *
 * Settlement is a one-way state transition (unsettled -> settled) that credits
 * money. The contract pinned here:
 *
 *   1. Every crediting mutation goes through exactly ONE RPC call
 *      (settle_payment_split / settle_payment_splits_for_debtor /
 *      unsettle_payment_split) — never a raw read-then-write on payment_splits.
 *      The RPC locks the parent payment row and guards on the current status,
 *      so concurrent duplicates cannot double-credit.
 *   2. The status guard IS the idempotency mechanism: a retry that loses the
 *      race gets ALREADY_SETTLED, which the service layer treats as success
 *      (the desired end state holds) instead of a user-facing failure.
 *   3. The only direct payment_splits write left in the client is the
 *      NON-crediting "mark as pending" transition, which is value-idempotent
 *      and scoped to the caller's own unsettled rows.
 *
 * True DB-level concurrency cannot be exercised in vitest; these tests pin the
 * single-RPC contract that makes the DB-side locking effective.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { paymentService } from '../paymentService';
import {
  settleSplitsForDebtor,
  markSplitsPending,
  ALREADY_SETTLED_ERROR_CODE,
} from '../paymentSettlementService';
import { supabase } from '../../integrations/supabase/client';

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: vi.fn(), getSession: vi.fn() },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock('../chatAnalysisService', () => ({
  recordPaymentSplitPattern: vi.fn().mockResolvedValue(undefined),
}));

const USER_ID = 'user-1';
const SPLIT_ID = 'split-1';
const PAYMENT_IDS = ['pay-1', 'pay-2'];
const DEBTOR_ID = 'debtor-1';

/** Chainable Supabase query mock; awaiting the chain resolves to `result`. */
function makeChain(result: Record<string, unknown>) {
  const chain: any = {
    select: vi.fn(() => chain),
    update: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    single: vi.fn().mockResolvedValue(result),
    then: (resolve: any) => resolve(result),
  };
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  (supabase.auth.getUser as any).mockResolvedValue({
    data: { user: { id: USER_ID } },
    error: null,
  });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('paymentService.settlePayment — atomic single-RPC settle', () => {
  it('settles via exactly one settle_payment_split RPC call and never writes payment_splits directly', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: { success: true, all_settled: false },
      error: null,
    });

    const ok = await paymentService.settlePayment(SPLIT_ID, 'venmo');

    expect(ok).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
    expect(supabase.rpc).toHaveBeenCalledWith('settle_payment_split', {
      p_split_id: SPLIT_ID,
      p_user_id: USER_ID,
      p_method: 'venmo',
    });
    // The race-prone read-then-write path must be gone.
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('treats ALREADY_SETTLED as idempotent success — a retry or concurrent duplicate cannot double-credit or surface an error', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: { success: false, error: 'ALREADY_SETTLED' },
      error: null,
    });

    const ok = await paymentService.settlePayment(SPLIT_ID, 'venmo');

    expect(ok).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('fails closed on RPC transport error without falling back to a raw update', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: null,
      error: { message: 'network down' },
    });

    const ok = await paymentService.settlePayment(SPLIT_ID, 'venmo');

    expect(ok).toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('fails closed when the RPC reports NOT_AUTHORIZED', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: { success: false, error: 'NOT_AUTHORIZED' },
      error: null,
    });

    const ok = await paymentService.settlePayment(SPLIT_ID, 'venmo');

    expect(ok).toBe(false);
  });

  it('does not call the RPC when unauthenticated', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const ok = await paymentService.settlePayment(SPLIT_ID, 'venmo');

    expect(ok).toBe(false);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});

describe('paymentService.unsettlePayment — atomic single-RPC unsettle', () => {
  it('unsettles via exactly one unsettle_payment_split RPC call — replaces the read-then-write path', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: { success: true, already_unsettled: false },
      error: null,
    });

    const ok = await paymentService.unsettlePayment(SPLIT_ID);

    expect(ok).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
    expect(supabase.rpc).toHaveBeenCalledWith('unsettle_payment_split', {
      p_split_id: SPLIT_ID,
    });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('treats already-unsettled as idempotent success', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: { success: true, already_unsettled: true },
      error: null,
    });

    const ok = await paymentService.unsettlePayment(SPLIT_ID);

    expect(ok).toBe(true);
  });

  it('fails closed on RPC error', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: null,
      error: { message: 'boom' },
    });

    const ok = await paymentService.unsettlePayment(SPLIT_ID);

    expect(ok).toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

describe('settleSplitsForDebtor — batch settle used by the settlement dialogs', () => {
  it('settles a payer/payee pair via exactly one settle_payment_splits_for_debtor RPC call', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: { success: true, settled_count: 2, already_settled_count: 0 },
      error: null,
    });

    const result = await settleSplitsForDebtor(PAYMENT_IDS, DEBTOR_ID, 'venmo');

    expect(result).toEqual({ success: true, settledCount: 2, alreadySettledCount: 0 });
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
    expect(supabase.rpc).toHaveBeenCalledWith('settle_payment_splits_for_debtor', {
      p_payment_message_ids: PAYMENT_IDS,
      p_debtor_user_id: DEBTOR_ID,
      p_method: 'venmo',
    });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('reports an idempotent success when everything was already settled by a concurrent caller', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: { success: true, settled_count: 0, already_settled_count: 2 },
      error: null,
    });

    const result = await settleSplitsForDebtor(PAYMENT_IDS, DEBTOR_ID, 'venmo');

    expect(result.success).toBe(true);
    expect(result.settledCount).toBe(0);
    expect(result.alreadySettledCount).toBe(2);
  });

  it('surfaces a typed error when the RPC rejects the caller', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: { success: false, error: 'NOT_AUTHORIZED' },
      error: null,
    });

    const result = await settleSplitsForDebtor(PAYMENT_IDS, DEBTOR_ID, 'venmo');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NOT_AUTHORIZED');
  });

  it('handles Supabase transport errors explicitly', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: null,
      error: { message: 'network down' },
    });

    const result = await settleSplitsForDebtor(PAYMENT_IDS, DEBTOR_ID, 'venmo');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('SETTLEMENT_FAILED');
    expect(result.error?.message).toMatch(/network down/);
  });

  it('no-ops without an RPC call when given no payment ids', async () => {
    const result = await settleSplitsForDebtor([], DEBTOR_ID, 'venmo');

    expect(result.success).toBe(true);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('exports the ALREADY_SETTLED code used by the RPC contract', () => {
    expect(ALREADY_SETTLED_ERROR_CODE).toBe('ALREADY_SETTLED');
  });
});

describe('markSplitsPending — non-crediting debtor transition stays guarded', () => {
  it('scopes the pending mark to the caller-as-debtor unsettled rows and never touches is_settled', async () => {
    const chain = makeChain({ data: null, error: null });
    (supabase.from as any).mockReturnValue(chain);

    const result = await markSplitsPending(PAYMENT_IDS, 'venmo');

    expect(result.success).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('payment_splits');
    expect(chain.update).toHaveBeenCalledWith({
      confirmation_status: 'pending',
      settlement_method: 'venmo',
    });
    expect(chain.in).toHaveBeenCalledWith('payment_message_id', PAYMENT_IDS);
    expect(chain.eq).toHaveBeenCalledWith('debtor_user_id', USER_ID);
    expect(chain.eq).toHaveBeenCalledWith('is_settled', false);
    // Crediting must never happen here — that is the RPC's job.
    const updatePayload = (chain.update as any).mock.calls[0][0];
    expect(updatePayload).not.toHaveProperty('is_settled');
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('fails when unauthenticated without issuing a write', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await markSplitsPending(PAYMENT_IDS, 'venmo');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NOT_AUTHENTICATED');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('returns the Supabase error explicitly instead of swallowing it', async () => {
    const chain = makeChain({ data: null, error: { message: 'rls denied' } });
    (supabase.from as any).mockReturnValue(chain);

    const result = await markSplitsPending(PAYMENT_IDS, 'venmo');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('MARK_PENDING_FAILED');
    expect(result.error?.message).toMatch(/rls denied/);
  });
});
