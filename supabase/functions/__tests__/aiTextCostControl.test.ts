import { describe, expect, it, vi } from 'vitest';
import {
  buildAiTextCostRejectionResponse,
  estimateAiTextTokens,
  reserveAiTextBudget,
} from '../_shared/concierge/aiTextCostControl.ts';
import type { CostControlClient } from '../_shared/costControl.ts';

function createClient(data: unknown, error: { message: string } | null = null) {
  return {
    rpc: vi.fn().mockResolvedValue({ data, error }),
  } as unknown as CostControlClient;
}

const reservationInput = {
  userId: 'user-1',
  usagePlan: 'frequent_chraveler' as const,
  monthlyTokenBudget: 1_000_000,
  estimatedTokens: 8_000,
  provider: 'gemini',
  model: 'gemini-test',
};

describe('AI text cost control', () => {
  it('estimates text, attachment, and bounded output tokens without counting base64 bytes', () => {
    expect(
      estimateAiTextTokens({
        systemInstruction: 'a'.repeat(400),
        messages: [{ content: 'b'.repeat(400) }],
        attachmentCount: 1,
        maxOutputTokens: 1_000,
      }),
    ).toBe(5_296);
  });

  it('reserves the existing monthly plan allowance atomically', async () => {
    const client = createClient([
      { allowed: true, reservation_id: 'reservation-1', daily_used: 8_000, monthly_used: 18_000 },
    ]);
    const result = await reserveAiTextBudget(client, reservationInput);
    expect(result.allowed).toBe(true);
    expect(client.rpc).toHaveBeenCalledWith(
      'reserve_cost_units',
      expect.objectContaining({
        p_feature: 'ai_text',
        p_daily_limit: 1_000_000,
        p_monthly_limit: 1_000_000,
        p_units: 8_000,
      }),
    );
  });

  it('returns stable exhaustion details without invoking a provider', async () => {
    const client = createClient([
      {
        allowed: false,
        reason: 'monthly_budget_exhausted',
        monthly_used: 999_000,
        monthly_reset_at: '2026-09-01T00:00:00Z',
      },
    ]);
    await expect(reserveAiTextBudget(client, reservationInput)).resolves.toEqual({
      allowed: false,
      code: 'AI_TEXT_BUDGET_EXHAUSTED',
      usedTokens: 999_000,
      tokenBudget: 1_000_000,
      resetAt: '2026-09-01T00:00:00Z',
    });
  });

  it('fails closed when the budget store is unavailable', async () => {
    const client = createClient(null, { message: 'database unavailable' });
    await expect(reserveAiTextBudget(client, reservationInput)).resolves.toMatchObject({
      allowed: false,
      code: 'AI_TEXT_COST_CONTROL_UNAVAILABLE',
    });
  });

  it('releases a reservation only when no provider invocation began', async () => {
    const client = createClient([{ allowed: true, reservation_id: 'reservation-1' }]);
    const result = await reserveAiTextBudget(client, reservationInput);
    if (!result.allowed) throw new Error('expected reservation');
    await result.tracker.finalizeFailure();
    expect(client.rpc).toHaveBeenLastCalledWith(
      'finalize_cost_units',
      expect.objectContaining({ p_release: true, p_actual_units: 8_000 }),
    );
  });

  it('commits the estimate when an invoked provider fails ambiguously', async () => {
    const client = createClient([{ allowed: true, reservation_id: 'reservation-1' }]);
    const result = await reserveAiTextBudget(client, reservationInput);
    if (!result.allowed) throw new Error('expected reservation');
    result.tracker.markProviderInvoked();
    await result.tracker.finalizeFailure();
    expect(client.rpc).toHaveBeenLastCalledWith(
      'finalize_cost_units',
      expect.objectContaining({ p_release: false, p_actual_units: 8_000 }),
    );
  });

  it('finalizes actual provider usage exactly once', async () => {
    const client = createClient([{ allowed: true, reservation_id: 'reservation-1' }]);
    const result = await reserveAiTextBudget(client, reservationInput);
    if (!result.allowed) throw new Error('expected reservation');
    result.tracker.markProviderInvoked();
    await result.tracker.finalizeSuccess(2_345);
    await result.tracker.finalizeFailure();
    expect(client.rpc).toHaveBeenCalledTimes(2);
    expect(client.rpc).toHaveBeenLastCalledWith(
      'finalize_cost_units',
      expect.objectContaining({ p_release: false, p_actual_units: 2_345 }),
    );
  });

  it('commits the conservative estimate when a successful provider omits usage metadata', async () => {
    const client = createClient([{ allowed: true, reservation_id: 'reservation-1' }]);
    const result = await reserveAiTextBudget(client, reservationInput);
    if (!result.allowed) throw new Error('expected reservation');
    result.tracker.markProviderInvoked();
    await result.tracker.finalizeSuccess(0);
    expect(client.rpc).toHaveBeenLastCalledWith(
      'finalize_cost_units',
      expect.objectContaining({ p_release: false, p_actual_units: 8_000 }),
    );
  });

  it('preserves the typed Concierge graceful-degradation response contract', async () => {
    const response = buildAiTextCostRejectionResponse(
      {},
      {
        code: 'AI_TEXT_COST_CONTROL_UNAVAILABLE',
        usedTokens: 0,
        tokenBudget: 600_000,
      },
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'cost_control_unavailable',
      code: 'AI_TEXT_COST_CONTROL_UNAVAILABLE',
      usage: { total_tokens: 0 },
    });
  });
});
