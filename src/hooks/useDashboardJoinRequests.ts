import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getDemoDashboardJoinRequests } from '@/mockData/dashboardJoinRequestsMock';

/** Trip summary embedded on a pending join request row */
export interface DashboardJoinRequestTrip {
  id: string;
  name: string;
  destination: string;
  start_date: string;
  cover_image_url?: string;
  trip_type?: string | null;
}

/**
 * Pending join request visible on the home dashboard (RLS: own requests + inbound for trips you admin/member on).
 */
export interface DashboardJoinRequest {
  id: string;
  trip_id: string;
  user_id: string;
  requested_at: string;
  direction: 'outbound' | 'inbound';
  /** For inbound rows: best-effort display name for the requester */
  requesterLabel?: string;
  trip?: DashboardJoinRequestTrip;
}

type TripJoinRow = {
  id: string;
  name: string;
  destination: string;
  start_date: string;
  cover_image_url?: string | null;
  trip_type?: string | null;
};

type JoinRequestRow = {
  id: string;
  trip_id: string;
  user_id: string;
  requested_at?: string | null;
  created_at?: string | null;
  requester_name?: string | null;
  requester_email?: string | null;
  trips?: TripJoinRow | TripJoinRow[] | null;
};

type CancelOwnJoinRequestResult = {
  success?: boolean;
  message?: string;
};

export function mapCancelOwnJoinRequestResult(data: CancelOwnJoinRequestResult | null): {
  success: boolean;
  message?: string;
} {
  if (!data) return { success: false, message: 'Unable to cancel request.' };
  if (data.success) return { success: true };
  return { success: false, message: data.message || 'Unable to cancel request.' };
}

export function splitJoinRequestsByDirection(rows: DashboardJoinRequest[]): {
  outbound: DashboardJoinRequest[];
  inbound: DashboardJoinRequest[];
} {
  const outbound: DashboardJoinRequest[] = [];
  const inbound: DashboardJoinRequest[] = [];
  for (const row of rows) {
    if (row.direction === 'inbound') inbound.push(row);
    else outbound.push(row);
  }
  return { outbound, inbound };
}

export function getJoinRequestRequestedAt(row: {
  requested_at?: string | null;
  created_at?: string | null;
}): string {
  return row.requested_at || row.created_at || new Date(0).toISOString();
}

function mapRowToDashboardRequest(
  row: JoinRequestRow,
  currentUserId: string,
): DashboardJoinRequest {
  const tripRelation = row.trips;
  const tripData = Array.isArray(tripRelation) ? tripRelation[0] : tripRelation;
  const direction: 'outbound' | 'inbound' = row.user_id === currentUserId ? 'outbound' : 'inbound';

  const requesterLabel =
    direction === 'inbound'
      ? row.requester_name || row.requester_email?.split('@')[0] || 'Someone'
      : undefined;

  return {
    id: row.id,
    trip_id: row.trip_id,
    user_id: row.user_id,
    requested_at: getJoinRequestRequestedAt(row),
    direction,
    requesterLabel,
    trip: tripData
      ? {
          id: tripData.id,
          name: tripData.name,
          destination: tripData.destination,
          start_date: tripData.start_date,
          cover_image_url: tripData.cover_image_url ?? undefined,
          trip_type: tripData.trip_type,
        }
      : undefined,
  };
}

/**
 * Fetches all pending trip_join_requests the current user can see via RLS:
 * - Outbound: rows where user_id = auth user (trips you asked to join)
 * - Inbound: rows for trips where you are creator, trip_admin, or member (consumer)
 */
export function useDashboardJoinRequests(isDemoMode = false) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<DashboardJoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(!isDemoMode && !!user?.id);

  const fetchRequests = useCallback(async () => {
    if (isDemoMode) {
      setRequests(getDemoDashboardJoinRequests());
      setIsLoading(false);
      return;
    }

    if (!user?.id) {
      setRequests([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const { data: joinedData, error: joinedError } = await supabase
        .from('trip_join_requests')
        .select(
          `
          id,
          trip_id,
          user_id,
          requested_at,
          requester_name,
          requester_email,
          trips (
            id,
            name,
            destination,
            start_date,
            cover_image_url,
            trip_type
          )
        `,
        )
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (!joinedError) {
        const mapped = (joinedData as unknown as JoinRequestRow[] | null)?.map(r =>
          mapRowToDashboardRequest(r, user.id),
        );
        setRequests(mapped ?? []);
        return;
      }

      console.warn(
        '[useDashboardJoinRequests] joined fetch failed, retrying with compatibility fallback:',
        joinedError,
      );

      const { data: baseData, error: baseError } = await supabase
        .from('trip_join_requests')
        .select(
          `
          id,
          trip_id,
          user_id,
          requested_at,
          created_at,
          requester_name,
          requester_email
        `,
        )
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (baseError) {
        console.error('[useDashboardJoinRequests] fallback fetch error:', baseError);
        setRequests([]);
        return;
      }

      const baseRows = (baseData as unknown as JoinRequestRow[] | null) ?? [];
      if (baseRows.length === 0) {
        setRequests([]);
        return;
      }

      const tripIds = Array.from(new Set(baseRows.map(row => row.trip_id).filter(Boolean)));
      let tripById = new Map<string, TripJoinRow>();

      if (tripIds.length > 0) {
        const { data: tripsData, error: tripsError } = await supabase
          .from('trips')
          .select('id, name, destination, start_date, cover_image_url, trip_type')
          .in('id', tripIds);

        if (!tripsError && tripsData) {
          tripById = new Map(tripsData.map(trip => [trip.id, trip as TripJoinRow]));
        }
      }

      const mapped = baseRows.map(row =>
        mapRowToDashboardRequest(
          {
            ...row,
            trips: tripById.get(row.trip_id) ?? null,
          },
          user.id,
        ),
      );
      setRequests(mapped);
    } catch (e) {
      console.error('[useDashboardJoinRequests]', e);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isDemoMode]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (isDemoMode || !user?.id) return;

    const channel = supabase
      .channel(`dashboard_join_requests:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_join_requests',
        },
        () => {
          fetchRequests();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, isDemoMode, fetchRequests]);

  const cancelOutboundRequest = useCallback(
    async (requestId: string): Promise<{ success: boolean; message?: string }> => {
      if (!user?.id) {
        return { success: false, message: 'You must be logged in to cancel requests.' };
      }

      if (isDemoMode) {
        setRequests(prev =>
          prev.filter(request => !(request.id === requestId && request.direction === 'outbound')),
        );
        return { success: true };
      }

      // typed RPC shim until supabase types are regenerated
      const rpc = supabase.rpc.bind(supabase) as unknown as <T>(
        fn: string,
        params?: Record<string, string>,
      ) => Promise<{ data: T | null; error: { message?: string } | null }>;

      const { data, error } = await rpc<CancelOwnJoinRequestResult>('cancel_own_join_request', {
        _request_id: requestId,
      });

      if (error) {
        return { success: false, message: error.message || 'Failed to cancel request.' };
      }

      const result = mapCancelOwnJoinRequestResult(data);
      if (!result.success) return result;

      setRequests(prev => prev.filter(request => request.id !== requestId));
      return { success: true };
    },
    [isDemoMode, user?.id],
  );

  return {
    requests,
    isLoading,
    refetch: fetchRequests,
    cancelOutboundRequest,
  };
}
