import type { QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { tripKeys } from '@/lib/queryKeys';
import { syncTripMemberToStreamAndEmitMemberJoined } from '@/lib/streamTripMemberInlineActivity';

type RpcResult = {
  success: boolean;
  message: string;
  cleaned_up?: boolean;
  /**
   * Set when a stale/duplicate click hits an already-resolved request
   * (migration `20260623000000_idempotent_join_request_resolution`). The client treats
   * this as a handled no-op — info toast + cache refresh — never a scary error.
   */
  already_resolved?: boolean;
  trip_id?: string;
  user_id?: string;
  /** Present after migration `20260514194530_approve_join_request_member_inserted_flag` */
  member_inserted?: boolean;
} | null;

function invalidateTripJoinCaches(
  queryClient: QueryClient,
  tripId: string | undefined,
  mode: 'approve' | 'reject',
): void {
  queryClient.invalidateQueries({ queryKey: tripKeys.all });
  queryClient.invalidateQueries({ queryKey: ['proTrips'] });
  queryClient.invalidateQueries({ queryKey: ['events'] });
  // Match useJoinRequests: members list only refreshes on approve
  if (mode === 'approve' && tripId) {
    queryClient.invalidateQueries({ queryKey: tripKeys.members(tripId) });
  }
}

/**
 * Approve a pending trip join request (shared by trip UI and notification shortcuts).
 */
export async function approveJoinRequestById(
  queryClient: QueryClient,
  params: { requestId: string; tripId?: string },
): Promise<void> {
  const { requestId, tripId } = params;

  const { data, error } = await supabase.rpc('approve_join_request', {
    _request_id: requestId,
  });

  if (error) throw error;

  const result = data as RpcResult;

  // Stale/duplicate click on an already-resolved request — handled, not an error.
  if (result?.already_resolved) {
    toast.info(result.message || 'This request was already handled');
    invalidateTripJoinCaches(queryClient, tripId, 'approve');
    return;
  }

  if (result && !result.success) {
    if (result.cleaned_up) {
      toast.info(result.message || 'This request is no longer valid');
      invalidateTripJoinCaches(queryClient, tripId, 'approve');
      return;
    }
    throw new Error(result.message || 'Failed to approve request');
  }

  const resolvedTripId = result?.trip_id ?? tripId;
  const joiningUserId = result?.user_id;

  if (resolvedTripId && joiningUserId) {
    const { data: profile } = await supabase
      .from('profiles_public')
      .select('resolved_display_name, display_name, first_name, last_name')
      .eq('user_id', joiningUserId)
      .maybeSingle();

    let memberDisplayName: string | null = null;
    if (profile) {
      memberDisplayName =
        profile.resolved_display_name ||
        profile.display_name ||
        [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() ||
        null;
    }
    if (!memberDisplayName) {
      memberDisplayName = 'Someone';
    }

    const emitMemberJoinedMessage = result?.member_inserted !== false;

    try {
      await syncTripMemberToStreamAndEmitMemberJoined({
        tripId: resolvedTripId,
        joiningUserId,
        memberDisplayName,
        syncFailureContext: 'approve-join-request',
        emitMemberJoinedMessage,
      });
    } catch {
      // Stream sync / inline message are best-effort; membership in Postgres already succeeded.
    }
  }

  toast.success('✅ Request approved');
  invalidateTripJoinCaches(queryClient, tripId, 'approve');
}

/**
 * Reject a pending trip join request (shared by trip UI and notification shortcuts).
 */
export async function rejectJoinRequestById(
  queryClient: QueryClient,
  params: { requestId: string; tripId?: string },
): Promise<void> {
  const { requestId, tripId } = params;

  const { data, error } = await supabase.rpc('reject_join_request', {
    _request_id: requestId,
  });

  if (error) throw error;

  const result = data as RpcResult;

  // Stale/duplicate click on an already-resolved request — handled, not an error.
  if (result?.already_resolved) {
    toast.info(result.message || 'This request was already handled');
    invalidateTripJoinCaches(queryClient, tripId, 'reject');
    return;
  }

  if (result && !result.success) {
    throw new Error(result.message || 'Failed to reject request');
  }

  if (result?.cleaned_up) {
    toast.info(result.message || 'Invalid request removed');
  } else {
    toast.success('Request rejected');
  }

  invalidateTripJoinCaches(queryClient, tripId, 'reject');
}
