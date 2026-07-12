/**
 * stream-broadcast-guard — Stream "Before Message Send" hook.
 *
 * Server-side enforcement of the broadcast permission model. The client UX
 * gate (ChatInput/TripChat) hides the Broadcast toggle from non-admins on
 * pro/event trips, but a forged client could still call Stream directly with
 * message_type='broadcast'. This hook runs inside Stream's send pipeline for
 * every message: unauthorized broadcast markers are stripped so the message
 * delivers as a normal chat message.
 *
 * OPERATOR SETUP (one-time, Stream dashboard): App settings → Webhooks →
 * "Before Message Send Hook" → set this function's URL and enable
 * "webhook v2" signing. Uses the same STREAM_WEBHOOK_SECRET as stream-webhook.
 * Until configured, nothing calls this endpoint and behavior is unchanged.
 *
 * Failure posture: FAIL-OPEN. Chat send is the app's most critical path — on
 * any DB error or unexpected payload this returns the message unmodified
 * rather than blocking sends. The guard is best-effort defense in depth on
 * top of the client gate, not an availability risk.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { createHmac } from 'node:crypto';
import {
  isBroadcastFlagged,
  isGuardedChannelType,
  senderMayBroadcast,
  stripBroadcastMarkers,
  tripIdFromChannelId,
  type GuardMessage,
} from './policy.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STREAM_WEBHOOK_SECRET = Deno.env.get('STREAM_WEBHOOK_SECRET') || '';

type BeforeSendPayload = {
  message?: GuardMessage & { user?: { id?: string } };
  user?: { id?: string };
  channel_type?: string;
  channel_id?: string;
  cid?: string;
};

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function verifySignature(payload: string, signatureHeader: string): boolean {
  if (!STREAM_WEBHOOK_SECRET) return false;
  const expected = createHmac('sha256', STREAM_WEBHOOK_SECRET).update(payload).digest('hex');
  const provided = signatureHeader
    .replace(/^sha256=/i, '')
    .trim()
    .toLowerCase();
  return safeCompare(expected, provided);
}

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
    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  }

  const rawBody = await req.text();

  // Authenticity: this endpoint makes an allow/strip decision only (no side
  // effects), but an unauthenticated caller must still not be able to probe
  // it. Reject bad/missing signatures outright when the secret is configured.
  const signature =
    req.headers.get('x-signature') ||
    req.headers.get('X-Signature') ||
    req.headers.get('signature');
  if (!STREAM_WEBHOOK_SECRET) {
    console.error('[stream-broadcast-guard] STREAM_WEBHOOK_SECRET not configured; passing through');
  } else if (!signature || !verifySignature(rawBody, signature)) {
    return jsonResponse({ error: 'Invalid webhook signature' }, 401, corsHeaders);
  }

  let payload: BeforeSendPayload;
  try {
    payload = JSON.parse(rawBody) as BeforeSendPayload;
  } catch {
    return jsonResponse({ error: 'Invalid JSON payload' }, 400, corsHeaders);
  }

  const message = payload.message;
  // Pass-through response shape for the Before Message Send hook: echo the
  // (possibly modified) message back with 200.
  const passThrough = () => jsonResponse({ message: message ?? {} }, 200, corsHeaders);

  try {
    if (!message || !isBroadcastFlagged(message)) return passThrough();

    const cid = payload.cid || '';
    const channelType = payload.channel_type || cid.split(':')[0] || '';
    const channelId = payload.channel_id || cid.split(':')[1] || '';
    if (!isGuardedChannelType(channelType)) return passThrough();

    const tripId = tripIdFromChannelId(channelId);
    const senderId = payload.user?.id || message.user?.id || '';
    if (!tripId || !senderId) return passThrough();

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const [{ data: trip, error: tripError }, { data: member, error: memberError }] =
      await Promise.all([
        adminClient.from('trips').select('trip_type').eq('id', tripId).maybeSingle(),
        adminClient
          .from('trip_members')
          .select('role')
          .eq('trip_id', tripId)
          .eq('user_id', senderId)
          .maybeSingle(),
      ]);

    // Fail-open on lookup errors — never block chat sends on a guard hiccup.
    if (tripError || memberError) {
      console.error('[stream-broadcast-guard] lookup failed; passing through', {
        tripId,
        tripError: tripError?.message,
        memberError: memberError?.message,
      });
      return passThrough();
    }

    if (senderMayBroadcast(trip?.trip_type, member?.role)) return passThrough();

    console.warn('[stream-broadcast-guard] stripped unauthorized broadcast markers', {
      tripId,
      senderId,
      tripType: trip?.trip_type ?? 'consumer',
      senderRole: member?.role ?? null,
    });
    return jsonResponse({ message: stripBroadcastMarkers(message) }, 200, corsHeaders);
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown error';
    console.error('[stream-broadcast-guard] Error; passing through:', messageText);
    return passThrough();
  }
});
