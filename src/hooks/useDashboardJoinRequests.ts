import {
  shouldBackfillOnSubscribe,
  shouldRefreshOnForeground,
} from './utils/realtimeBackfillPolicy';

export const shouldRefreshJoinRequestsOnForeground = shouldRefreshOnForeground;
export const shouldBackfillJoinRequestsOnSubscribe = shouldBackfillOnSubscribe;

/** Trip summary embedded on a pending join request row */
export interface DashboardJoinRequestTrip {
  id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date?: string | null;
  member_count?: number | null;
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
  requested_at?: string;
  created_at?: string;
  direction: 'outbound' | 'inbound';
  /** For inbound rows: best-effort display name for the requester */
  requesterLabel?: string;
  trip?: DashboardJoinRequestTrip;
}

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

/**
 * Contract helper for admin/reviewer surfaces.
 *
 * Only inbound rows (requests from other users) are moderation actions.
 * Outbound rows are context-only and MUST NOT power Home Requests cards/counters.
 */
export function getInboundAdminReviewRequests(
  rows: DashboardJoinRequest[],
): DashboardJoinRequest[] {
  return rows.filter(row => row.direction === 'inbound');
}

export function getJoinRequestRequestedAt(row: {
  requested_at?: string | null;
  created_at?: string | null;
}): string | undefined {
  return row.requested_at ?? row.created_at ?? undefined;
}

function parseJoinRequestTime(value?: string): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function sortJoinRequestsByRecency(rows: DashboardJoinRequest[]): DashboardJoinRequest[] {
  return [...rows].sort((a, b) => {
    const aTime = parseJoinRequestTime(a.requested_at ?? a.created_at);
    const bTime = parseJoinRequestTime(b.requested_at ?? b.created_at);

    if (aTime !== null && bTime !== null && aTime !== bTime) return bTime - aTime;
    if (aTime !== null && bTime === null) return -1;
    if (aTime === null && bTime !== null) return 1;
    return a.id.localeCompare(b.id);
  });
}

export function getJoinRequestDisplayLabel(row: {
  requested_at?: string | null;
  created_at?: string | null;
}): string {
  const timestamp = row.requested_at ?? row.created_at;
  if (!timestamp) return 'Requested date unavailable';
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return 'Requested date unavailable';
  return `Requested ${parsed.toLocaleDateString()}`;
}
