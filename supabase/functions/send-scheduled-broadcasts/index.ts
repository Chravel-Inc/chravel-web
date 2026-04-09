import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import {
  createSecureResponse,
  createErrorResponse,
  createOptionsResponse,
} from '../_shared/securityHeaders.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { verifyCronAuth } from '../_shared/cronGuard.ts';

const BATCH_LIMIT = 50;

/**
 * Edge function to send scheduled broadcasts.
 * Called by pg_cron every minute. Picks up all broadcasts whose
 * scheduled_for has passed and that haven't been sent yet.
 */
serve(async req => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return createOptionsResponse(req);
  }

  try {
    // Verify cron/service caller authentication
    const guard = verifyCronAuth(req, corsHeaders);
    if (!guard.authorized) return guard.response!;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();

    // Find all unsent broadcasts whose scheduled time has passed.
    // No lower bound — if a previous cron tick was missed, we still pick them up.
    const { data: scheduledBroadcasts, error: fetchError } = await supabase
      .from('broadcasts')
      .select('*')
      .eq('is_sent', false)
      .not('scheduled_for', 'is', null)
      .lte('scheduled_for', now.toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(BATCH_LIMIT);

    if (fetchError) {
      console.error('Error fetching scheduled broadcasts:', fetchError);
      return createErrorResponse('Failed to fetch scheduled broadcasts', 500);
    }

    if (!scheduledBroadcasts || scheduledBroadcasts.length === 0) {
      return createSecureResponse({
        success: true,
        message: 'No scheduled broadcasts to send',
        count: 0,
      });
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each scheduled broadcast
    for (const broadcast of scheduledBroadcasts) {
      try {
        // Claim row: PostgREST returns no error when 0 rows match — must check count.
        const { data: claimed, error: updateError } = await supabase
          .from('broadcasts')
          .update({ is_sent: true })
          .eq('id', broadcast.id)
          .eq('is_sent', false)
          .select('id');

        if (updateError) {
          throw updateError;
        }

        if (!claimed || claimed.length === 0) {
          // Another tick already sent this row — do not count or enqueue duplicate work.
          continue;
        }

        // Get trip members to notify (exclude the sender)
        const { data: members, error: membersError } = await supabase
          .from('trip_members')
          .select('user_id')
          .eq('trip_id', broadcast.trip_id)
          .eq('status', 'active')
          .neq('user_id', broadcast.created_by);

        if (membersError) {
          await supabase
            .from('broadcasts')
            .update({ is_sent: false })
            .eq('id', broadcast.id)
            .eq('is_sent', true);
          throw membersError;
        }

        // Create in-app notifications for each trip member.
        // The DB trigger on notifications inserts into notification_deliveries,
        // and the dispatch-notification-deliveries cron job handles push/email/SMS.
        if (members && members.length > 0) {
          const notifications = members.map(m => ({
            user_id: m.user_id,
            type: 'broadcast',
            title: broadcast.priority === 'urgent' ? 'Urgent Broadcast' : 'Scheduled Broadcast',
            message: broadcast.message.substring(0, 200),
            trip_id: broadcast.trip_id,
            metadata: {
              category: 'broadcasts',
              broadcast_id: broadcast.id,
              priority: broadcast.priority,
              high_priority: broadcast.priority === 'urgent',
            },
            is_read: false,
            is_visible: true,
          }));

          const { error: notifError } = await supabase.from('notifications').insert(notifications);

          if (notifError) {
            const { error: rollbackError } = await supabase
              .from('broadcasts')
              .update({ is_sent: false })
              .eq('id', broadcast.id)
              .eq('is_sent', true);

            if (rollbackError) {
              console.error(
                `Failed to rollback is_sent for broadcast ${broadcast.id} after notification error:`,
                rollbackError,
              );
            }
            throw notifError;
          }
        }

        results.sent++;
      } catch (error) {
        console.error(`Error processing broadcast ${broadcast.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.failed++;
        results.errors.push(`Broadcast ${broadcast.id}: ${errorMessage}`);
      }
    }

    return createSecureResponse({
      success: true,
      message: `Processed ${scheduledBroadcasts.length} scheduled broadcasts`,
      results,
    });
  } catch (error) {
    console.error('Error in send-scheduled-broadcasts function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return createErrorResponse(errorMessage, 500);
  }
});
