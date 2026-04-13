import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { createHmac } from 'node:crypto';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STREAM_WEBHOOK_SECRET = Deno.env.get('STREAM_WEBHOOK_SECRET') || '';

type StreamWebhookEvent = {
  type?: string;
  id?: string;
  created_at?: string;
  message?: {
    id?: string;
    text?: string;
    user?: { id?: string; name?: string };
    cid?: string;
  };
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
  const provided = signatureHeader.replace(/^sha256=/, '').trim();
  return safeCompare(expected, provided);
}

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

  const signature =
    req.headers.get('x-signature') ||
    req.headers.get('X-Signature') ||
    req.headers.get('signature');

  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing signature header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const payload = await req.text();
  if (!verifySignature(payload, signature)) {
    return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const event = JSON.parse(payload) as StreamWebhookEvent;
  const eventType = event.type || 'unknown';
  const eventId = event.id || `${eventType}:${event.message?.id || crypto.randomUUID()}`;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { error: idempotencyError } = await supabase.from('webhook_events').insert({
    event_id: eventId,
    event_type: `stream:${eventType}`,
    processed_at: new Date().toISOString(),
  });

  if (idempotencyError?.code === '23505') {
    return new Response(JSON.stringify({ ok: true, duplicate: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (idempotencyError) {
    console.warn('[stream-webhook] idempotency insert failed:', idempotencyError.message);
  }

  if (eventType === 'message.new' && event.message?.id) {
    const channelId = event.message.cid || '';
    const tripId = channelId.startsWith('chravel-trip:trip-')
      ? channelId.replace('chravel-trip:trip-', '')
      : null;

    if (tripId) {
      const { data: members } = await supabase
        .from('trip_members')
        .select('user_id')
        .eq('trip_id', tripId)
        .or('status.is.null,status.eq.active');

      const senderId = event.message.user?.id;
      const recipients = (members || [])
        .map(member => member.user_id)
        .filter(userId => !!userId && userId !== senderId);

      if (recipients.length > 0) {
        const notificationRows = recipients.map(userId => ({
          user_id: userId,
          type: 'chat_message',
          title: event.message?.user?.name || 'New message',
          message: event.message?.text || 'sent a message',
          trip_id: tripId,
          metadata: {
            source: 'stream-webhook',
            stream_message_id: event.message?.id,
            stream_event_type: eventType,
          },
        }));

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notificationRows);

        if (notificationError) {
          console.error('[stream-webhook] notification insert failed:', notificationError.message);
        }
      }
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
