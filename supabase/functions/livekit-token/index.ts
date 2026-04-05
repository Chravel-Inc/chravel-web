/**
 * LiveKit Token Generator — Supabase Edge Function
 *
 * Authenticates the user via their Supabase JWT, then generates a LiveKit room
 * token that auto-dispatches the voice agent. The room is ephemeral (one per
 * voice session) and auto-closes after 30s empty.
 *
 * POST /livekit-token
 * Body: { tripId: string }
 * Returns: { token: string, wsUrl: string, roomName: string }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AccessToken } from 'livekit-server-sdk';
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireSecrets } from '../_shared/validateSecrets.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async req => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Validate required secrets — requireSecrets() throws on missing keys
  let LIVEKIT_API_KEY: string;
  let LIVEKIT_API_SECRET: string;
  let LIVEKIT_URL: string;
  try {
    const secrets = requireSecrets(['LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET', 'LIVEKIT_URL']);
    LIVEKIT_API_KEY = secrets['LIVEKIT_API_KEY'];
    LIVEKIT_API_SECRET = secrets['LIVEKIT_API_SECRET'];
    LIVEKIT_URL = secrets['LIVEKIT_URL'];
  } catch (err) {
    console.error('[livekit-token] Missing secrets:', err);
    return new Response(JSON.stringify({ error: 'Service configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      console.error('[livekit-token] Auth failed:', authError?.message);
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[livekit-token] token:auth_verified', { userId: user.id });

    // ── Parse Request ──────────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const tripId = typeof body?.tripId === 'string' ? body.tripId.trim() : '';

    if (!tripId) {
      return new Response(JSON.stringify({ error: 'tripId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tripId)) {
      return new Response(JSON.stringify({ error: 'Invalid tripId format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Verify Trip Membership (RLS check) ─────────────────────────────────
    const { data: membership, error: memberError } = await supabase
      .from('trip_members')
      .select('trip_id')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberError || !membership) {
      console.error('[livekit-token] Membership check failed:', memberError?.message);
      return new Response(JSON.stringify({ error: 'Not a member of this trip' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Generate LiveKit Token ─────────────────────────────────────────────
    const shortId = crypto.randomUUID().split('-')[0];
    const roomName = `voice-${tripId}-${shortId}`;
    const ALLOWED_VOICES = ['Aoede', 'Charon', 'Fenrir', 'Kore', 'Puck'];
    const rawVoice = typeof body?.voice === 'string' ? body.voice : 'Charon';
    const voice = ALLOWED_VOICES.includes(rawVoice) ? rawVoice : 'Charon';

    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: user.id,
      name: user.user_metadata?.display_name || user.email || 'User',
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      roomCreate: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    // Set room metadata for the agent to read
    // The agent extracts tripId, userId, voice from this metadata
    (token as any).roomConfig = {
      metadata: JSON.stringify({
        tripId,
        userId: user.id,
        voice,
      }),
      emptyTimeout: 30, // Auto-close room after 30s empty
      agents: [
        {
          agentName: 'chravel-voice',
        } as any, // intentional: RoomAgentDispatch protobuf type requires full constructor; cast is safe for metadata-only usage
      ],
    };

    const jwt = await token.toJwt();

    console.log('[livekit-token] token:generated', {
      roomName,
      userId: user.id,
      tripId,
      voice,
    });

    return new Response(
      JSON.stringify({
        token: jwt,
        wsUrl: LIVEKIT_URL,
        roomName,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('[livekit-token] token:error', error);
    return new Response(JSON.stringify({ error: 'Failed to generate token' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
