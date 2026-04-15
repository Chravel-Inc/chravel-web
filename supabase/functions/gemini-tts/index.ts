import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { pickPrimaryEntitlement } from '../_shared/entitlementSelection.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_TTS_API_KEY') || Deno.env.get('GEMINI_API_KEY');
const GEMINI_TTS_MODEL = (
  Deno.env.get('GEMINI_TTS_MODEL') || 'gemini-3.1-flash-tts-preview'
).trim();
const VOICE_TTS_FREE_FOR_ALL = (Deno.env.get('VOICE_TTS_FREE_FOR_ALL') ?? 'true') !== 'false';

const DEFAULT_VOICE = 'Kore';
const MAX_TEXT_CHARS = 1800;
const MAX_STYLE_CHARS = 160;
const FREE_TIER_DAILY_LIMIT = 30;
const EXPLORER_TIER_DAILY_LIMIT = 100;

const CONCIERGE_STYLE_DEFAULT = 'warm, calm, concise premium travel concierge voice';
const STRIP_MARKDOWN_REGEX = /[`*_>#~\[\]\(\)\-|]/g;
const STRIP_URL_REGEX = /\bhttps?:\/\/\S+/gi;
const STRIP_CODE_BLOCK_REGEX = /```[\s\S]*?```/g;

const isActiveEntitlement = (status?: string | null, periodEnd?: string | null): boolean => {
  if (status !== 'active' && status !== 'trialing') return false;
  if (!periodEnd) return true;
  const parsed = Date.parse(periodEnd);
  if (Number.isNaN(parsed)) return true;
  return parsed > Date.now();
};

const mapPlanToDailyLimit = (plan?: string | null): number | null => {
  if (!plan || plan === 'free') return FREE_TIER_DAILY_LIMIT;
  if (plan === 'explorer' || plan === 'plus') return EXPLORER_TIER_DAILY_LIMIT;
  return null;
};

const sanitizeTtsText = (raw: string): string => {
  return raw
    .replace(STRIP_CODE_BLOCK_REGEX, ' ')
    .replace(STRIP_URL_REGEX, ' ')
    .replace(STRIP_MARKDOWN_REGEX, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

type GeminiPart = {
  inlineData?: {
    mimeType?: string;
    data?: string;
  };
  data?: string;
  mimeType?: string;
};

const getAudioPart = (payload: any): GeminiPart | null => {
  const parts: GeminiPart[] =
    payload?.candidates?.[0]?.content?.parts && Array.isArray(payload.candidates[0].content.parts)
      ? payload.candidates[0].content.parts
      : [];
  for (const part of parts) {
    if (part?.inlineData?.data) return part;
    if (part?.data && typeof part.data === 'string') return part;
  }
  return null;
};

serve(async req => {
  const corsHeaders = getCorsHeaders(req);
  const startedAt = Date.now();

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Authorization required' }), {
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
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: {
    text?: string;
    voiceName?: string;
    style?: string;
    tripId?: string;
    messageId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const sanitizedText = sanitizeTtsText(body.text || '').slice(0, MAX_TEXT_CHARS);
  if (!sanitizedText) {
    return new Response(JSON.stringify({ error: 'text is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const voiceName = (body.voiceName || DEFAULT_VOICE).trim() || DEFAULT_VOICE;
  const style = (body.style || CONCIERGE_STYLE_DEFAULT)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_STYLE_CHARS);

  const today = new Date().toISOString().slice(0, 10);
  if (!VOICE_TTS_FREE_FOR_ALL) {
    const { data: entitlementRows } = await supabase
      .from('user_entitlements')
      .select('user_id, plan, status, current_period_end, purchase_type, updated_at')
      .eq('user_id', user.id)
      .in('purchase_type', ['subscription', 'pass'])
      .order('updated_at', { ascending: false });

    const entitlementData = pickPrimaryEntitlement(entitlementRows || []);
    const dailyLimit: number | null =
      entitlementData &&
      isActiveEntitlement(entitlementData.status, entitlementData.current_period_end)
        ? mapPlanToDailyLimit(entitlementData.plan)
        : mapPlanToDailyLimit(
            (
              await supabase
                .from('profiles')
                .select('app_role')
                .eq('user_id', user.id)
                .maybeSingle()
            ).data?.app_role,
          );

    const { data: usageRow } = await supabase
      .from('tts_usage')
      .select('request_count')
      .eq('user_id', user.id)
      .eq('usage_date', today)
      .maybeSingle();

    const currentCount = usageRow?.request_count ?? 0;
    if (dailyLimit !== null && currentCount >= dailyLimit) {
      return new Response(
        JSON.stringify({
          error: 'Daily TTS limit reached. Upgrade to Pro for expanded voice responses.',
          limit: dailyLimit,
          used: currentCount,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
  }

  try {
    const promptText = style ? `[${style}] ${sanitizedText}` : sanitizedText;
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: promptText }],
            },
          ],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName,
                },
              },
            },
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      const text = await geminiRes.text().catch(() => '');
      console.error('[gemini-tts] Gemini TTS error:', geminiRes.status, text);
      return new Response(JSON.stringify({ error: 'Gemini TTS request failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = await geminiRes.json();
    const audioPart = getAudioPart(payload);
    const audioBase64 = audioPart?.inlineData?.data || audioPart?.data;
    const mimeType = audioPart?.inlineData?.mimeType || audioPart?.mimeType || 'audio/wav';

    if (!audioBase64) {
      return new Response(JSON.stringify({ error: 'Gemini TTS returned no audio data' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const bytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
    const { error: upsertError } = await supabase.rpc('increment_tts_usage', {
      p_user_id: user.id,
      p_date: today,
    });

    if (upsertError) {
      console.warn('[gemini-tts] Failed to increment usage:', upsertError.message);
    }

    const latencyMs = Date.now() - startedAt;
    console.log(
      `[gemini-tts] success user=${user.id} trip=${body.tripId || 'none'} message=${body.messageId || 'none'} chars=${sanitizedText.length} latency_ms=${latencyMs} model=${GEMINI_TTS_MODEL} voice=${voiceName}`,
    );

    return new Response(bytes as unknown as BodyInit, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': mimeType,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[gemini-tts] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Unable to synthesize speech right now' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
