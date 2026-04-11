import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import {
  createSecureResponse,
  createErrorResponse,
  createOptionsResponse,
} from '../_shared/securityHeaders.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { verifyCronAuth } from '../_shared/cronGuard.ts';

/**
 * Edge function to send scheduled broadcasts
 * This should be called by a cron job (e.g., Supabase Cron or external scheduler)
 * every minute to check for broadcasts that need to be sent
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

    // Get current time (with 1 minute buffer to account for cron timing)
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    // Find broadcasts scheduled for sending
    const { data: scheduledBroadcasts, error: fetchError } = await supabase
      .from('broadcasts')
      .select('*')
      .eq('is_sent', false)
      .not('scheduled_for', 'is', null)
      .lte('scheduled_for', now.toISOString())
      .gte('scheduled_for', oneMinuteAgo.toISOString());

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

    // 1. Mark all as sent in one batch
    const broadcastIds = scheduledBroadcasts.map(b => b.id);
    const { error: updateError } = await supabase
      .from('broadcasts')
      .update({ is_sent: true })
      .in('id', broadcastIds);

    if (updateError) {
      console.error('Error batch updating broadcasts:', updateError);
      return createErrorResponse('Failed to update broadcasts status', 500);
    }

    // 2. Pre-fetch all trip members for all involved trips
    const tripIds = [...new Set(scheduledBroadcasts.map(b => b.trip_id))];
    const { data: allMembers, error: membersError } = await supabase
      .from('trip_members')
      .select('trip_id, user_id')
      .in('trip_id', tripIds)
      .eq('status', 'active');

    if (membersError) {
      console.error('Error fetching trip members:', membersError);
      return createErrorResponse('Failed to fetch trip members', 500);
    }

    // 3. Pre-fetch all push tokens for all involved users
    const allUserIds = [...new Set(allMembers?.map(m => m.user_id) || [])];
    const { data: allTokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('user_id, token')
      .in('user_id', allUserIds);

    if (tokensError) {
      console.error('Error fetching push tokens:', tokensError);
      return createErrorResponse('Failed to fetch push tokens', 500);
    }

    // Map data for easy lookup
    const membersByTrip = (allMembers || []).reduce((acc, curr) => {
      if (!acc[curr.trip_id]) acc[curr.trip_id] = [];
      acc[curr.trip_id].push(curr.user_id);
      return acc;
    }, {} as Record<string, string[]>);

    const tokensByUser = (allTokens || []).reduce((acc, curr) => {
      if (!acc[curr.user_id]) acc[curr.user_id] = [];
      acc[curr.user_id].push(curr.token);
      return acc;
    }, {} as Record<string, string[]>);

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each scheduled broadcast
    for (const broadcast of scheduledBroadcasts) {
      try {
        // Send push notifications if priority warrants it
        if (broadcast.priority === 'urgent' || broadcast.priority === 'reminder') {
          const tripMembers = membersByTrip[broadcast.trip_id] || [];
          // Filter out the creator in memory
          const notifyUserIds = tripMembers.filter(userId => userId !== broadcast.created_by);

          if (notifyUserIds.length > 0) {
            // Collect all tokens for these users
            const tokens = notifyUserIds.flatMap(userId => tokensByUser[userId] || []);

            if (tokens.length > 0) {
              // Invoke push notification function
              const { error: pushError } = await supabase.functions.invoke('push-notifications', {
                body: {
                  action: 'send_push',
                  userId: broadcast.created_by,
                  tokens,
                  title:
                    broadcast.priority === 'urgent'
                      ? '🚨 Urgent Broadcast'
                      : '📢 Scheduled Broadcast',
                  body: broadcast.message.substring(0, 100),
                  data: {
                    type: 'broadcast',
                    broadcastId: broadcast.id,
                    tripId: broadcast.trip_id,
                    url: `/trips/${broadcast.trip_id}/broadcasts`,
                  },
                },
              });

              if (pushError) {
                console.warn(`Failed to send push for broadcast ${broadcast.id}:`, pushError);
              }
            }
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
