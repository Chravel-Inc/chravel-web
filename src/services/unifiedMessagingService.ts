import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { ScheduledMessage, ScheduledMessagePriority } from '@/types/messaging';
import { isFeatureFlagEnabled } from '@/lib/featureFlags';

type BroadcastRow = Database['public']['Tables']['broadcasts']['Row'];
const isScheduledPriority = (value: string | null): value is ScheduledMessagePriority => {
  return value === 'urgent' || value === 'reminder' || value === 'fyi';
};

export const mapBroadcastRowToScheduledMessage = (row: BroadcastRow): ScheduledMessage => ({
  id: row.id,
  tripId: row.trip_id,
  content: row.message,
  senderId: row.created_by ?? 'system',
  senderName: 'System',
  sendAt: row.scheduled_for ?? row.created_at,
  isSent: row.is_sent ?? false,
  priority: isScheduledPriority(row.priority) ? row.priority : 'fyi',
  timestamp: row.created_at,
  isRead: false,
  isBroadcast: true,
  messageType: 'broadcast',
});

class UnifiedMessagingService {
  private schedulingDisabledLogged = false;

  private logSchedulingDisabledOnce() {
    if (!import.meta.env.DEV || this.schedulingDisabledLogged) return;

    this.schedulingDisabledLogged = true;
    console.info(
      '[UnifiedMessagingService] Broadcast scheduling is disabled via feature flag: broadcast-scheduling-enabled',
    );
  }

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
    priority: ScheduledMessagePriority = 'fyi',
  ): Promise<boolean> {
    try {
      const schedulingEnabled = await isFeatureFlagEnabled('broadcast-scheduling-enabled', false);
      if (!schedulingEnabled) {
        this.logSchedulingDisabledOnce();
        return false;
      }

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
