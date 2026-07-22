/**
 * Read Receipts Service
 * Tracks and syncs message read status across users.
 *
 * Messaging Architecture Review: Now includes trip_id in all upserts.
 */
import { supabase } from '@/integrations/supabase/client';

interface ReadStatusInsert {
  message_id: string;
  user_id: string;
  trip_id?: string | null;
  message_type: string;
  read_at: string;
}

/**
 * Mark multiple messages as read
 */
export async function markMessagesAsRead(
  messageIds: string[],
  tripId: string,
  userId: string,
): Promise<void> {
  const readStatuses: ReadStatusInsert[] = messageIds.map(messageId => ({
    message_id: messageId,
    user_id: userId,
    trip_id: tripId,
    message_type: 'trip',
    read_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('message_read_receipts').upsert(readStatuses, {
    onConflict: 'message_id,user_id',
  });

  if (error) {
    if (import.meta.env.DEV) console.error('Failed to mark messages as read:', error);
    throw error;
  }
}
