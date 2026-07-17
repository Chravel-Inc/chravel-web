/**
 * Canonical trip/event deletion decision engine.
 *
 * Single source of truth for "what happens when a user removes a trip from their view."
 * All UI entry points (TripCard, TripGrid swipe, EventCard, MobileDetail pages)
 * MUST route through this service — never call archiveService directly for deletion.
 */
import { leaveTripForUser } from './archiveService';
import { removeMemberFromTripChannels } from './stream/streamMembershipSync';

export type DeletionAction = 'archived' | 'left';

export interface DeletionResult {
  action: DeletionAction;
  tripId: string;
}

export interface DeletionContext {
  tripId: string;
  userId: string;
  /** Retained for callers that branch on creator vs member UX copy. */
  isCreator: boolean;
  isDemoMode?: boolean;
}

/**
 * Removes the current user from a trip via the leave_trip RPC.
 * - Member leaves → soft-deleted membership, trip stays active for others.
 * - Creator leaves with others remaining → admin transfer, trip stays active.
 * - Last member leaves → trip archived server-side.
 *
 * Client-side trips.is_archived updates are blocked by RLS column pinning, so
 * all delete-for-me / leave flows must use this RPC path.
 */
export async function executeDeleteTrip(ctx: DeletionContext): Promise<DeletionResult> {
  const { tripId, userId, isCreator } = ctx;

  if (import.meta.env.DEV) {
    console.log('[tripDeletionService] executeDeleteTrip', {
      tripId,
      userId,
      isCreator,
    });
  }

  const result = await leaveTripForUser(tripId);

  removeMemberFromTripChannels(tripId, userId).catch(() => {
    // Non-fatal — membership is already committed in Supabase.
  });

  return { action: result.action, tripId };
}
