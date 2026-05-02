import type { QueryClient } from '@tanstack/react-query';
import { tripKeys } from '@/lib/queryKeys';

/**
 * Keeps pending-request related surfaces in sync after join/cancel transitions.
 */
export async function invalidatePendingRequestState(
  queryClient: QueryClient,
  options?: { tripId?: string | null },
): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: ['pending-request-trip-cards'] });
  await queryClient.invalidateQueries({ queryKey: tripKeys.all });

  if (!options?.tripId) return;

  await queryClient.invalidateQueries({ queryKey: tripKeys.detail(options.tripId) });
  await queryClient.invalidateQueries({ queryKey: tripKeys.members(options.tripId) });
}
