import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { StreamChat } from 'npm:stream-chat';
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireSecrets, createMissingSecretResponse } from '../_shared/validateSecrets.ts';
import { canActorSyncMembership, type MembershipSyncAction } from './authorization.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type SyncPayload = {
  action?: MembershipSyncAction;
  tripId?: string;
  userId?: string;
};

const isNonEmpty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

serve(async req => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const secrets = requireSecrets(['STREAM_API_KEY', 'STREAM_API_SECRET']);
    const STREAM_API_KEY = secrets['STREAM_API_KEY'];
    const STREAM_API_SECRET = secrets['STREAM_API_SECRET'];

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const {
      data: { user: actor },
      error: authError,
    } = await authSupabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !actor) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = (await req.json().catch(() => ({}))) as SyncPayload;
    const action = payload.action;
    const tripId = payload.tripId?.trim();
    const targetUserId = payload.userId?.trim();

    if (
      (action !== 'add' && action !== 'remove') ||
      !isNonEmpty(tripId) ||
      !isNonEmpty(targetUserId)
    ) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: actorMember, error: actorMembershipError } = await adminSupabase
      .from('trip_members')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', actor.id)
      .or('status.is.null,status.eq.active')
      .maybeSingle();

    if (actorMembershipError || !actorMember) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'add') {
      const { data: targetMember } = await adminSupabase
        .from('trip_members')
        .select('user_id')
        .eq('trip_id', tripId)
        .eq('user_id', targetUserId)
        .or('status.is.null,status.eq.active')
        .maybeSingle();

      if (!targetMember) {
        return new Response(JSON.stringify({ error: 'Target user is not an active trip member' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const allowed = canActorSyncMembership({
      actorUserId: actor.id,
      actorRole: actorMember.role ?? null,
      targetUserId,
      action,
    });

    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const streamServer = StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);
    const tripChannel = streamServer.channel('chravel-trip', `trip-${tripId}`);
    const broadcastChannel = streamServer.channel('chravel-broadcast', `broadcast-${tripId}`);

    if (action === 'add') {
      await tripChannel.addMembers([targetUserId]);
      await broadcastChannel.addMembers([targetUserId]);
    } else {
      await tripChannel.removeMembers([targetUserId]);
      await broadcastChannel.removeMembers([targetUserId]);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing required secret')) {
      return createMissingSecretResponse(error, corsHeaders);
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[stream-sync-membership] Error:', message);

    return new Response(JSON.stringify({ error: 'Failed to sync Stream membership' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
