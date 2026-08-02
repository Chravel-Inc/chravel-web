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
