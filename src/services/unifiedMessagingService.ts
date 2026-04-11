import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { ScheduledMessage } from '@/types/messaging';

type BroadcastRow = Database['public']['Tables']['broadcasts']['Row'];
type ScheduledPriority = NonNullable<ScheduledMessage['priority']>;

const isScheduledPriority = (value: string | null): value is ScheduledPriority => {
  return value === 'urgent' || value === 'reminder' || value === 'fyi';
};

export const mapBroadcastRowToScheduledMessage = (row: BroadcastRow): ScheduledMessage => ({
  id: row.id,
  tripId: row.trip_id,
  content: row.message,
  sendAt: row.scheduled_for ?? row.created_at,
  isSent: row.is_sent ?? false,
  priority: isScheduledPriority(row.priority) ? row.priority : 'fyi',
  timestamp: row.created_at,
  isRead: false,
  isBroadcast: true,
  messageType: 'broadcast',
});

class UnifiedMessagingService {
  async getScheduledMessages(tripId?: string): Promise<ScheduledMessage[]> {
    try {
      // In a real app, this would query the unified scheduled messages table
      // For now, we'll query broadcasts that are scheduled for the future
      let query = supabase
        .from('broadcasts')
        .select('*')
        .not('scheduled_for', 'is', null)
        .gt('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true });

      if (tripId) {
        query = query.eq('trip_id', tripId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(mapBroadcastRowToScheduledMessage);
    } catch (error) {
      console.error('[UnifiedMessagingService] Error fetching scheduled messages:', error);
      return [];
    }
  }

  async scheduleMessage(
    tripId: string,
    content: string,
    sendAt: Date,
    priority: 'urgent' | 'reminder' | 'fyi' = 'fyi',
  ): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('broadcasts').insert({
        trip_id: tripId,
        message: content,
        priority: priority,
        scheduled_for: sendAt.toISOString(),
        is_sent: false,
        created_by: user.id,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[UnifiedMessagingService] Error scheduling message:', error);
      return false;
    }
  }
}

export const unifiedMessagingService = new UnifiedMessagingService();
