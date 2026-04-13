import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { createHmac } from 'node:crypto';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STREAM_WEBHOOK_SECRET = Deno.env.get('STREAM_WEBHOOK_SECRET') || '';
const STREAM_API_KEY = Deno.env.get('STREAM_API_KEY') || '';

type StreamWebhookEvent = {
  type?: string;
  id?: string;
  created_at?: string;
  cid?: string;
  channel_type?: string;
  channel_id?: string;
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
  const provided = signatureHeader
    .replace(/^sha256=/i, '')
    .trim()
    .toLowerCase();
  return safeCompare(expected, provided);
}

function resolveTripIdFromEvent(event: StreamWebhookEvent): string | null {
  const resolvedCid =
    event.cid ||
    (event.channel_type && event.channel_id ? `${event.channel_type}:${event.channel_id}` : null) ||
    event.message?.cid ||
    '';

  if (!resolvedCid.startsWith('chravel-trip:trip-')) return null;
  return resolvedCid.replace('chravel-trip:trip-', '');
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

  const signature = req.headers.get('x-signature') || req.headers.get('signature');
  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing signature header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const requestApiKey = req.headers.get('x-api-key') || '';
  if (STREAM_API_KEY && requestApiKey && requestApiKey !== STREAM_API_KEY) {
    return new Response(JSON.stringify({ error: 'Invalid api key header' }), {
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

  let event: StreamWebhookEvent;
  try {
    event = JSON.parse(payload) as StreamWebhookEvent;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const eventType = event.type || 'unknown';
  const webhookId = req.headers.get('x-webhook-id') || req.headers.get('X-Webhook-Id');
  const eventId =
    webhookId || event.id || `${eventType}:${event.message?.id || crypto.randomUUID()}`;

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
    console.error('[stream-webhook] idempotency insert failed:', idempotencyError.message);
    return new Response(JSON.stringify({ error: 'Failed to persist webhook idempotency record' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (eventType === 'message.new' && event.message?.id) {
    const tripId = resolveTripIdFromEvent(event);

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
            stream_webhook_id: webhookId || null,
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
