import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { StreamChat } from 'npm:stream-chat';
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireSecrets, createMissingSecretResponse } from '../_shared/validateSecrets.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type ModerationAction = 'hide_message' | 'shadow_ban_user' | 'mute_user' | 'ban_user';

type RequestBody = {
  tripId?: string;
  messageId?: string;
  targetUserId?: string;
  action?: ModerationAction;
};

const ACTIONS = new Set<ModerationAction>([
  'hide_message',
  'shadow_ban_user',
  'mute_user',
  'ban_user',
]);

function jsonResponse(
  payload: Record<string, unknown>,
  status: number,
  corsHeaders: Record<string, string>,
) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async req => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, reason: 'Method not allowed' }, 405, corsHeaders);
  }

  try {
    const secrets = requireSecrets([
      'STREAM_API_KEY',
      'STREAM_API_SECRET',
      'SUPABASE_SERVICE_ROLE_KEY',
    ]);
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return jsonResponse({ success: false, reason: 'Authentication required' }, 401, corsHeaders);
    }

    const authedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await authedClient.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return jsonResponse({ success: false, reason: 'Invalid authentication' }, 401, corsHeaders);
    }

    const body = (await req.json().catch(() => ({}))) as RequestBody;
    if (!body.tripId || !body.messageId || !body.targetUserId || !body.action) {
      return jsonResponse(
        { success: false, reason: 'tripId, messageId, targetUserId and action are required' },
        400,
        corsHeaders,
      );
    }

    if (!ACTIONS.has(body.action)) {
      return jsonResponse(
        { success: false, reason: 'Invalid moderation action' },
        400,
        corsHeaders,
      );
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const [{ data: trip }, { data: adminMembership }, { data: memberRole }] = await Promise.all([
      adminClient.from('trips').select('created_by').eq('id', body.tripId).maybeSingle(),
      adminClient
        .from('trip_admins')
        .select('id')
        .eq('trip_id', body.tripId)
        .eq('user_id', user.id)
        .maybeSingle(),
      adminClient
        .from('trip_members')
        .select('role')
        .eq('trip_id', body.tripId)
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    const isAuthorized =
      trip?.created_by === user.id ||
      !!adminMembership ||
      ['admin', 'organizer', 'owner'].includes(memberRole?.role || '');

    if (!isAuthorized) {
      return jsonResponse(
        { success: false, reason: 'Insufficient permissions for moderation' },
        403,
        corsHeaders,
      );
    }

    const stream = StreamChat.getInstance(secrets['STREAM_API_KEY'], secrets['STREAM_API_SECRET']);

    if (body.action === 'hide_message') {
      await stream.deleteMessage(body.messageId);
    } else if (body.action === 'shadow_ban_user') {
      await stream.shadowBan(body.targetUserId, {
        reason: `Trip moderation action by ${user.id}`,
      });
    } else if (body.action === 'mute_user') {
      await stream.muteUser(body.targetUserId, user.id, { timeout: 60 * 24 });
    } else {
      await stream.banUser(body.targetUserId, {
        reason: `Trip moderation action by ${user.id}`,
        timeout: 60 * 24 * 7,
      });
    }

    await adminClient.from('admin_audit_logs').insert({
      admin_id: user.id,
      action: `stream_${body.action}`,
      trip_id: body.tripId,
      target_user_id: body.targetUserId,
      old_state: {
        message_id: body.messageId,
        action: body.action,
      },
      new_state: {
        applied: true,
        moderated_at: new Date().toISOString(),
      },
    });

    return jsonResponse({ success: true, action: body.action }, 200, corsHeaders);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing required secret')) {
      return createMissingSecretResponse(error, corsHeaders);
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ success: false, reason: message }, 500, corsHeaders);
  }
});
