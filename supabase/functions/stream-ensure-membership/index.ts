import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { StreamChat } from 'npm:stream-chat';
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireSecrets, createMissingSecretResponse } from '../_shared/validateSecrets.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const tripChannelId = (tripId: string) => `trip-${tripId}`;
const broadcastChannelId = (tripId: string) => `broadcast-${tripId}`;

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

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const tripId = typeof body?.tripId === 'string' ? body.tripId.trim() : '';

    if (!tripId) {
      return new Response(JSON.stringify({ error: 'tripId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: membership, error: membershipError } = await adminClient
      .from('trip_members')
      .select('trip_id')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError) {
      throw membershipError;
    }

    if (!membership) {
      return new Response(JSON.stringify({ error: 'User is not a trip member' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('display_name, first_name, last_name, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle();

    const displayName =
      profile?.display_name ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
      user.email?.split('@')[0] ||
      'Anonymous';

    const stream = StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);

    await stream.upsertUser({
      id: user.id,
      name: displayName,
      image: profile?.avatar_url || undefined,
      role: 'user',
    });

    await stream.channel('chravel-trip', tripChannelId(tripId)).addMembers([user.id]);
    await stream.channel('chravel-broadcast', broadcastChannelId(tripId)).addMembers([user.id]);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing required secret')) {
      return createMissingSecretResponse(error, corsHeaders);
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[stream-ensure-membership] Error:', message);

    return new Response(JSON.stringify({ error: 'Failed to ensure Stream membership' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
