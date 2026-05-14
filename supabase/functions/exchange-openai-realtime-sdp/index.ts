import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { getBearerToken } from '../_shared/authHeaders.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const DEFAULT_OPENAI_REALTIME_CALLS = 'https://api.openai.com/v1/realtime/calls';

/**
 * Only forward SDP to OpenAI's official host — prevents SSRF if a client tampers
 * with the optional sdpPostUrl copied from the minted session payload.
 */
function resolveOpenAiCallsUrl(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.startsWith('https://')) return DEFAULT_OPENAI_REALTIME_CALLS;
  try {
    const u = new URL(raw);
    if (u.hostname !== 'api.openai.com') return DEFAULT_OPENAI_REALTIME_CALLS;
    if (!u.pathname.startsWith('/v1/realtime/')) return DEFAULT_OPENAI_REALTIME_CALLS;
    return raw;
  } catch {
    return DEFAULT_OPENAI_REALTIME_CALLS;
  }
}

serve(async req => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const bearerToken = getBearerToken(authHeader);
  if (!bearerToken) {
    return new Response(JSON.stringify({ error: 'Invalid authentication header format' }), {
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
  } = await supabase.auth.getUser(bearerToken);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const body = await req.json().catch(() => ({}));
  const tripId = typeof body?.tripId === 'string' ? body.tripId.trim() : '';
  const sdpOffer = typeof body?.sdpOffer === 'string' ? body.sdpOffer : '';
  const ephemeralToken = typeof body?.ephemeralToken === 'string' ? body.ephemeralToken.trim() : '';

  if (!tripId) {
    return new Response(JSON.stringify({ error: 'tripId is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (!sdpOffer.trim()) {
    return new Response(JSON.stringify({ error: 'sdpOffer is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (!ephemeralToken) {
    return new Response(JSON.stringify({ error: 'ephemeralToken is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: membership } = await supabase
    .from('trip_members')
    .select('trip_id')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return new Response(JSON.stringify({ error: 'Not a member of this trip' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const sdpPostUrl = resolveOpenAiCallsUrl(body?.sdpPostUrl);

  const resp = await fetch(sdpPostUrl, {
    method: 'POST',
    body: sdpOffer,
    headers: {
      Authorization: `Bearer ${ephemeralToken}`,
      'Content-Type': 'application/sdp',
    },
  });

  const answerText = await resp.text();
  if (!resp.ok) {
    console.error('[exchange-openai-realtime-sdp] OpenAI SDP exchange failed', {
      status: resp.status,
      statusText: resp.statusText,
      tripId,
      userId: user.id,
      sdpPostUrl,
    });
    return new Response(JSON.stringify({ error: 'Voice connection failed' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ answerSdp: answerText }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
