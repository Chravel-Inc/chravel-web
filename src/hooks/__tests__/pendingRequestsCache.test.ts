import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { tripKeys } from '@/lib/queryKeys';
import { invalidatePendingRequestState } from '../pendingRequestsCache';

describe('invalidatePendingRequestState', () => {
  it('invalidates required pending-request query keys consistently', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(undefined as never);

    await invalidatePendingRequestState(queryClient, { tripId: 'trip-123' });

    expect(invalidateSpy).toHaveBeenCalledTimes(4);
    expect(invalidateSpy).toHaveBeenNthCalledWith(1, { queryKey: ['pending-request-trip-cards'] });
    expect(invalidateSpy).toHaveBeenNthCalledWith(2, { queryKey: tripKeys.all });
    expect(invalidateSpy).toHaveBeenNthCalledWith(3, { queryKey: tripKeys.detail('trip-123') });
    expect(invalidateSpy).toHaveBeenNthCalledWith(4, { queryKey: tripKeys.members('trip-123') });
  });

  it('skips trip-scoped invalidations when no trip id is provided', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(undefined as never);

    await invalidatePendingRequestState(queryClient);

    expect(invalidateSpy).toHaveBeenCalledTimes(2);
    expect(invalidateSpy).toHaveBeenNthCalledWith(1, { queryKey: ['pending-request-trip-cards'] });
    expect(invalidateSpy).toHaveBeenNthCalledWith(2, { queryKey: tripKeys.all });
  });
});
