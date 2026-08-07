// Concierge STT — auth-gated multipart proxy to Lovable AI Gateway transcriptions.
// Accepts an audio file, returns { transcript }. Keeps LOVABLE_API_KEY server-side.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireAuth } from '../_shared/requireAuth.ts';
import { isFeatureEnabled } from '../_shared/featureFlags.ts';
import { checkRateLimit } from '../_shared/security.ts';
import {
  fetchWithTimeout,
  finalizeVoiceCost,
  reserveVoiceCost,
  voiceErrorResponse,
} from '../_shared/costControl.ts';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const STT_MODEL = 'openai/gpt-4o-mini-transcribe';
const MAX_BYTES = 25 * 1024 * 1024; // 25 MiB — Gateway hard cap
const MIN_BYTES = 1024; // <1KB = silence/empty, reject locally
const DAILY_BYTE_LIMIT = 75 * 1024 * 1024; // conservative proxy for roughly 15 minutes/day
const MONTHLY_BYTE_LIMIT = 750 * 1024 * 1024;
const REQUESTS_PER_MINUTE = 5;
const UPSTREAM_TIMEOUT_MS = 45_000;

const EXT_BY_MIME: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/mp4': 'mp4',
  'audio/m4a': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/wave': 'wav',
  'audio/x-wav': 'wav',
  'audio/ogg': 'ogg',
};

function extFor(mime: string): string {
  const base = (mime || '').split(';')[0].trim().toLowerCase();
  return EXT_BY_MIME[base] ?? 'webm';
}

serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: cors });
  }

  const auth = await requireAuth(req, cors);
  if (auth.error) return auth.response;
  if (!(await isFeatureEnabled('cost_voice_stt', false))) {
    return voiceErrorResponse('VOICE_FEATURE_DISABLED', cors);
  }
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('authorization')! } },
  });
  const costClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const rateLimit = await checkRateLimit(
    supabase,
    `voice-stt:${auth.user.id}`,
    REQUESTS_PER_MINUTE,
    60,
    auth.user.id,
    'concierge-stt',
  );
  if (!rateLimit.allowed) return voiceErrorResponse('VOICE_RATE_LIMITED', cors, { status: 429 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch (err) {
    console.warn('[concierge-stt] Invalid multipart body:', err);
    return new Response(JSON.stringify({ error: 'Expected multipart/form-data' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const audio = form.get('audio');
  if (!(audio instanceof File) && !(audio instanceof Blob)) {
    return new Response(JSON.stringify({ error: 'Missing "audio" file part' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const size = (audio as Blob).size;
  if (size === 0 || size < MIN_BYTES) {
    return new Response(JSON.stringify({ error: 'Audio too short or empty' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
  if (size > MAX_BYTES) {
    return new Response(JSON.stringify({ error: 'Audio exceeds 25 MiB limit' }), {
      status: 413,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const reservation = await reserveVoiceCost(costClient, {
    userId: auth.user.id,
    feature: 'voice_stt',
    provider: 'lovable_openai',
    units: size,
    dailyLimit: DAILY_BYTE_LIMIT,
    monthlyLimit: MONTHLY_BYTE_LIMIT,
    metadata: { model: STT_MODEL },
  });
  if (!reservation.allowed)
    return voiceErrorResponse(reservation.code, cors, { resetAt: reservation.resetAt });

  if (!LOVABLE_API_KEY) {
    await finalizeVoiceCost(costClient, reservation.reservation, { release: true });
    console.error('[concierge-stt] LOVABLE_API_KEY missing');
    return new Response(
      JSON.stringify({ error: 'STT not configured', code: 'VOICE_NOT_CONFIGURED' }),
      {
        status: 503,
        headers: { ...cors, 'Content-Type': 'application/json' },
      },
    );
  }

  const mime =
    (audio instanceof File && audio.type) ||
    (typeof form.get('mimeType') === 'string' ? (form.get('mimeType') as string) : '') ||
    'audio/webm';
  const filename = `recording.${extFor(mime)}`;

  const upstream = new FormData();
  upstream.append('model', STT_MODEL);
  upstream.append('file', audio, filename);

  let res: Response;
  try {
    res = await fetchWithTimeout(
      'https://ai.gateway.lovable.dev/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
        body: upstream,
      },
      UPSTREAM_TIMEOUT_MS,
      req.signal,
    );
  } catch (err) {
    await finalizeVoiceCost(costClient, reservation.reservation, { release: true });
    if (req.signal.aborted)
      return voiceErrorResponse('VOICE_REQUEST_CANCELLED', cors, { status: 499 });
    if (err instanceof DOMException && err.name === 'TimeoutError')
      return voiceErrorResponse('VOICE_UPSTREAM_TIMEOUT', cors, { status: 504 });
    console.error('[concierge-stt] Gateway fetch failed:', err);
    return new Response(JSON.stringify({ error: 'Transcription service unreachable' }), {
      status: 502,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  if (!res.ok) {
    await finalizeVoiceCost(costClient, reservation.reservation, { release: true });
    const text = await res.text().catch(() => '');
    console.warn(`[concierge-stt] Gateway ${res.status}: ${text.slice(0, 500)}`);
    let message = `Transcription failed (${res.status})`;
    if (res.status === 402) message = 'AI credits exhausted. Please add credits to continue.';
    else if (res.status === 429) message = 'Rate limit reached. Try again in a moment.';
    else {
      try {
        const parsed = JSON.parse(text);
        if (parsed?.error?.message) message = parsed.error.message;
      } catch {
        /* keep default */
      }
    }
    return new Response(JSON.stringify({ error: message }), {
      status: res.status === 402 || res.status === 429 ? res.status : 502,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  let payload: { text?: string };
  try {
    payload = await res.json();
  } catch {
    await finalizeVoiceCost(costClient, reservation.reservation, { release: true });
    return new Response(JSON.stringify({ error: 'Invalid transcription response' }), {
      status: 502,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const transcript = (payload?.text ?? '').trim();
  if (!transcript) {
    await finalizeVoiceCost(costClient, reservation.reservation, { actualUnits: size });
    return new Response(JSON.stringify({ error: "Didn't catch that — try again." }), {
      status: 422,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  await finalizeVoiceCost(costClient, reservation.reservation, { actualUnits: size });

  return new Response(JSON.stringify({ transcript }), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});
