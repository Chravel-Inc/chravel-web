import { supabase } from '@/integrations/supabase/client';

/**
 * Broadcasts live in two systems on purpose:
 *  - Stream message (message_type 'broadcast') → renders in chat
 *  - `broadcasts` table row → notify_on_broadcast() trigger fans out
 *    notifications to every trip member (fanout_event_key dedup), and
 *    search/export read from this table.
 *
 * The table trigger is the ONLY notification-generation path for broadcasts
 * (stream-webhook stays mention-only), so a chat broadcast that skips the
 * table row notifies nobody and is invisible to search/export. Callers that
 * send the Stream message must mirror the row here.
 */
export async function recordBroadcastMirror(params: {
  tripId: string;
  message: string;
  createdBy: string;
  priority?: 'normal' | 'urgent';
}): Promise<void> {
  const { error } = await supabase.from('broadcasts').insert({
    trip_id: params.tripId,
    created_by: params.createdBy,
    message: params.message,
    priority: params.priority ?? 'normal',
    is_sent: true,
  });
  if (error) throw error;
}
