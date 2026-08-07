import { describe, expect, it, vi } from 'vitest';
import {
  fetchWithTimeout,
  reserveVoiceCost,
  voiceErrorResponse,
  type CostControlClient,
} from '../_shared/costControl.ts';

function clientReturning(data: unknown, error: { message: string } | null = null) {
  return {
    rpc: vi.fn().mockResolvedValue({ data, error }),
  } as unknown as CostControlClient;
}

describe('voice cost control', () => {
  it('returns a reservation from the atomic RPC', async () => {
    const client = clientReturning([{ allowed: true, reservation_id: 'reservation-1' }]);
    await expect(
      reserveVoiceCost(client, {
        userId: 'user-1',
        feature: 'voice_tts',
        provider: 'provider',
        units: 12.2,
        dailyLimit: 100,
        monthlyLimit: 1_000,
      }),
    ).resolves.toEqual({
      allowed: true,
      reservation: { id: 'reservation-1', userId: 'user-1' },
    });
    expect(client.rpc).toHaveBeenCalledWith(
      'reserve_cost_units',
      expect.objectContaining({ p_units: 13 }),
    );
  });

  it('returns the stable budget code and reset time when exhausted', async () => {
    const client = clientReturning([
      {
        allowed: false,
        reason: 'daily_budget_exhausted',
        daily_reset_at: '2026-08-08T00:00:00Z',
      },
    ]);
    await expect(
      reserveVoiceCost(client, {
        userId: 'user-1',
        feature: 'voice_stt',
        provider: 'provider',
        units: 100,
        dailyLimit: 100,
        monthlyLimit: 1_000,
      }),
    ).resolves.toEqual({
      allowed: false,
      code: 'VOICE_BUDGET_EXHAUSTED',
      resetAt: '2026-08-08T00:00:00Z',
    });
  });

  it('fails closed when the ledger is unavailable', async () => {
    const client = clientReturning(null, { message: 'database unavailable' });
    await expect(
      reserveVoiceCost(client, {
        userId: 'user-1',
        feature: 'voice_realtime',
        provider: 'provider',
        units: 300,
        dailyLimit: 900,
        monthlyLimit: 2_700,
      }),
    ).resolves.toEqual({ allowed: false, code: 'VOICE_COST_CONTROL_UNAVAILABLE' });
  });

  it('returns stable feature-off and rate-limit degradation envelopes', async () => {
    const disabled = voiceErrorResponse('VOICE_FEATURE_DISABLED', {});
    expect(disabled.status).toBe(503);
    await expect(disabled.json()).resolves.toMatchObject({
      code: 'VOICE_FEATURE_DISABLED',
      error: 'Voice is paused right now. Continue by typing.',
    });
    expect(voiceErrorResponse('VOICE_RATE_LIMITED', {}).status).toBe(429);
  });

  it('propagates caller cancellation to the paid request', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn((_input, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
      });
    }) as typeof fetch;
    const controller = new AbortController();
    const request = fetchWithTimeout('https://provider.test', {}, 5_000, controller.signal);
    controller.abort(new DOMException('cancelled', 'AbortError'));
    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
    globalThis.fetch = originalFetch;
  });

  it('aborts a stalled upstream request at the configured timeout', async () => {
    vi.useFakeTimers();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn((_input, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
      });
    }) as typeof fetch;
    const request = fetchWithTimeout('https://provider.test', {}, 100);
    const assertion = expect(request).rejects.toMatchObject({ name: 'TimeoutError' });
    await vi.advanceTimersByTimeAsync(100);
    await assertion;
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });
});
