import { describe, it, expect, vi, beforeEach } from 'vitest';

// Reproduction/coverage for B10: the hardened update_trip_basecamp_with_version RPC returns
// HTTP 200 with { success: false, error } on an authorization/auth denial (it does not raise a
// PostgREST error). Before the fix, tryRpcBasecampUpdate only inspected `error` and `data.conflict`,
// so a denial was coerced to { success: true } and the UI showed "Basecamp saved!" while the DB was
// unchanged. These tests fail against the pre-fix code and pass with the success:false branch.

const rpcMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: (...args: unknown[]) => rpcMock(...args) },
}));
vi.mock('@/offline/cache', () => ({ cacheEntity: vi.fn(), getCachedEntity: vi.fn() }));
vi.mock('../systemMessageService', () => ({
  systemMessageService: { postBasecampChange: vi.fn(), postSystemMessage: vi.fn() },
}));

import { basecampService } from '../basecampService';

type RpcResult = { success: boolean; error?: string; conflict?: boolean };

const callTryRpc = (): Promise<RpcResult> =>
  (
    basecampService as unknown as {
      tryRpcBasecampUpdate: (
        tripId: string,
        currentVersion: number,
        basecamp: { name?: string; address: string },
        latitude: number | null,
        longitude: number | null,
        userId: string,
      ) => Promise<RpcResult>;
    }
  ).tryRpcBasecampUpdate('trip-1', 1, { address: '123 Main St' }, null, null, 'user-1');

describe('basecampService.tryRpcBasecampUpdate — success:false envelope (B10)', () => {
  beforeEach(() => rpcMock.mockReset());

  it('treats { success: false } as a failure, not a false success', async () => {
    rpcMock.mockResolvedValue({ data: { success: false, error: 'NOT_AUTHORIZED' }, error: null });
    const res = await callTryRpc();
    expect(res.success).toBe(false);
    expect(res.error).toBe('NOT_AUTHORIZED');
  });

  it('still reports success when the RPC succeeds', async () => {
    rpcMock.mockResolvedValue({ data: { success: true }, error: null });
    const res = await callTryRpc();
    expect(res.success).toBe(true);
  });

  it('reports an optimistic-lock conflict distinctly', async () => {
    rpcMock.mockResolvedValue({ data: { conflict: true, current_version: 5 }, error: null });
    const res = await callTryRpc();
    expect(res.success).toBe(false);
    expect(res.conflict).toBe(true);
  });
});
