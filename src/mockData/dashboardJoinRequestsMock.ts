import type { DashboardJoinRequest } from '@/hooks/useDashboardJoinRequests';
import { mockMyPendingRequests } from '@/mockData/pendingRequestsMock';
import { mockPendingRequests } from '@/mockData/joinRequests';
import { tripsData } from '@/data/tripsData';
import { proTripMockData } from '@/data/proTripMockData';

function tripRowForDemoTripId(tripId: string): DashboardJoinRequest['trip'] | undefined {
  const consumer = tripsData.find(t => t.id.toString() === tripId);
  if (consumer) {
    return {
      id: consumer.id.toString(),
      name: consumer.title,
      destination: consumer.location,
      start_date: '',
      cover_image_url: consumer.coverPhoto,
      trip_type: 'consumer',
    };
  }
  const pro = proTripMockData[tripId];
  if (pro) {
    return {
      id: tripId,
      name: pro.title,
      destination: pro.location,
      start_date: '',
      cover_image_url: pro.coverPhoto,
      trip_type: 'pro',
    };
  }
  return undefined;
}

/**
 * Demo dashboard: outbound rows (you requested to join) + inbound (others requested your trips).
 */
export function getDemoDashboardJoinRequests(): DashboardJoinRequest[] {
  const outbound: DashboardJoinRequest[] = mockMyPendingRequests.map(req => ({
    id: req.id,
    trip_id: req.trip_id,
    user_id: 'demo-current-user',
    requested_at: req.requested_at,
    direction: 'outbound' as const,
    trip: req.trip
      ? {
          id: req.trip.id,
          name: req.trip.name,
          destination: req.trip.destination,
          start_date: req.trip.start_date,
          cover_image_url: req.trip.cover_image_url,
          trip_type: 'consumer',
        }
      : undefined,
  }));

  const inbound: DashboardJoinRequest[] = [];
  for (const [tripId, requests] of Object.entries(mockPendingRequests)) {
    for (const r of requests) {
      inbound.push({
        id: r.id,
        trip_id: r.trip_id,
        user_id: r.user_id,
        requested_at: r.requested_at,
        direction: 'inbound',
        requesterLabel: r.profile?.display_name || 'Guest',
        trip: tripRowForDemoTripId(tripId),
      });
    }
  }

  const combined = [...outbound, ...inbound];
  combined.sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime());
  return combined;
}
