import { beforeEach, describe, expect, it, vi } from 'vitest';

const invokeMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => invokeMock(...args),
    },
  },
}));

import { syncMembershipViaServerFallback } from '../streamMembershipFallback';

describe('syncMembershipViaServerFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invokes stream-sync-membership with provided payload', async () => {
    invokeMock.mockResolvedValue({ error: null });

    await syncMembershipViaServerFallback({
      action: 'remove',
      tripId: 'trip-1',
      userId: 'user-2',
    });

    expect(invokeMock).toHaveBeenCalledWith('stream-sync-membership', {
      body: {
        action: 'remove',
        tripId: 'trip-1',
        userId: 'user-2',
      },
    });
  });

  it('throws when invoke returns an error', async () => {
    invokeMock.mockResolvedValue({ error: { message: 'bad request' } });

    await expect(
      syncMembershipViaServerFallback({
        action: 'add',
        tripId: 'trip-1',
        userId: 'user-3',
      }),
    ).rejects.toThrow('bad request');
  });
});
