import { supabase } from '@/integrations/supabase/client';

export interface ScheduledMessage {
  id: string;
  trip_id: string;
  content: string;
  sendAt: string;
  priority: 'urgent' | 'reminder' | 'fyi';
  created_at?: string;
}

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

      return (data || []).map(b => ({
        id: b.id,
        trip_id: b.trip_id,
        content: b.message,
        sendAt: b.scheduled_for,
        priority: b.priority as 'urgent' | 'reminder' | 'fyi',
      }));
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
