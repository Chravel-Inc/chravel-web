import { formatDistanceToNow } from 'date-fns';
import type { NotificationItem } from '@/store/notificationRealtimeStore';

/**
 * True when a notifications row means the current user was approved into a trip
 * (invalidate dashboard trip list).
 */
export function isJoinApprovedNotificationRow(row: Record<string, unknown>): boolean {
  const metadata = (row.metadata as Record<string, unknown>) || {};
  const action = String(metadata.action ?? '').toLowerCase();
  const type = String(row.type ?? '').toLowerCase();
  const title = String(row.title ?? '').toLowerCase();
  return (
    action === 'join_approved' ||
    type === 'join_approved' ||
    type === 'join_request_approved' ||
    title.includes('join request approved')
  );
}

export function mapRowToNotification(row: Record<string, unknown>): NotificationItem {
  const metadata = (row.metadata as Record<string, unknown>) || {};
  return {
    id: row.id as string,
    type: (row.type || 'system') as NotificationItem['type'],
    title: (row.title as string) || '',
    description: (row.message as string) || '',
    tripId: (metadata.trip_id as string) || (row.trip_id as string) || '',
    tripName: (metadata.trip_name as string) || '',
    timestamp: formatDistanceToNow(new Date((row.created_at as string) || Date.now()), {
      addSuffix: true,
    }),
    isRead: (row.is_read as boolean) || false,
    isHighPriority: row.type === 'broadcast',
    data: metadata,
  };
}
