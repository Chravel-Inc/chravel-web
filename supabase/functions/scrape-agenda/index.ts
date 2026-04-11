/**
 * Scrape Agenda Edge Function
 *
 * Uses Firecrawl (headless browser) as primary scraper for full JS rendering,
 * falls back to raw fetch() for sites that don't need JS.
 * Sends content to Gemini for structured agenda session extraction.
 *
 * Key differences from scrape-schedule:
 * - Returns agenda-specific fields: title, description, date, start_time, end_time, location, track, speakers
 * - Does NOT filter by future dates (conferences may list undated sessions)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { validateExternalHttpsUrl } from '../_shared/validation.ts';
import {
  invokeChatModel,
  extractTextFromChatResponse,
  DEFAULT_GEMINI_FLASH_MODEL,
} from '../_shared/gemini.ts';
import { scrapeUrlContentForAi, getScrapeContentTypeLabel } from '../_shared/urlScraper.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

interface AgendaSession {
  title: string;
  description?: string;
  session_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  track?: string;
  speakers?: string[];
}

/** Max characters of content to send to Gemini */
const MAX_CONTENT_LENGTH = 1_000_000;

serve(async req => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── Auth ──
    const authHeader = req.headers.get('Authorization');
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

    // ── Parse input ──
    const body = await req.json();
    let { url } = body;

    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    url = url.trim();
    if (url.startsWith('http://')) url = url.replace('http://', 'https://');
    if (!url.startsWith('https://')) url = 'https://' + url;

    if (!validateExternalHttpsUrl(url)) {
      return new Response(
        JSON.stringify({ error: 'URL must be HTTPS and external (no internal/private networks)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`[scrape-agenda] Processing URL: ${url}`);

    // ── Scrape: Firecrawl -> raw fetch -> reader proxy fallback ──
    let contentForAI = '';
    const scrapeResult = await scrapeUrlContentForAi(url, { logPrefix: 'scrape-agenda' });
    if (!scrapeResult) {
      return new Response(
        JSON.stringify({
          error:
            'Could not access this website. The page appears to block automated fetches. Try uploading a screenshot or PDF instead.',
          scrape_method: 'blocked',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    contentForAI = scrapeResult.content;
    const scrapeMethod: 'firecrawl' | 'fetch' | 'reader_proxy' = scrapeResult.method;

    // ── Cap content ──
    if (contentForAI.length > MAX_CONTENT_LENGTH) {
      console.log(
        `[scrape-agenda] Truncating from ${contentForAI.length} to ${MAX_CONTENT_LENGTH} chars`,
      );
      contentForAI = contentForAI.substring(0, MAX_CONTENT_LENGTH);
    }

    console.log(
      `[scrape-agenda] Sending ${contentForAI.length} chars to Gemini (via ${scrapeMethod})`,
    );

    // ── Send to Gemini for extraction (45s timeout) ──
    const contentType = getScrapeContentTypeLabel(scrapeMethod);

    const systemPrompt = `You are an expert at extracting event agenda sessions, show dates, tour dates, and scheduled performances from websites.

Extract ALL sessions, talks, panels, workshops, performances, shows, tour dates, and scheduled items from this ${contentType}.

For each session, extract ONLY the fields that are CLEARLY PRESENT in the source. Do NOT guess, fabricate, or infer missing data.

Available fields:
- title (REQUIRED): The session/talk/show/performance name exactly as shown
- description: Session description IF explicitly present. OMIT if not shown.
- session_date: YYYY-MM-DD format IF a specific date is shown. OMIT if not shown.
- start_time: HH:MM in 24-hour format IF clearly listed. OMIT if not shown.
- end_time: HH:MM in 24-hour format IF clearly listed. OMIT if not shown.
- location: Room name, stage name, venue, or city IF shown. OMIT if not shown.
- track: Category/track name IF shown (e.g., "Interactive", "Music", "Workshop", "Main Stage"). OMIT if not shown.
- speakers: Array of speaker/presenter/performer names IF listed. OMIT if not shown.

CRITICAL RULES:
1. Only include fields that are EXPLICITLY present in the source material.
2. Do NOT fabricate descriptions, categories, or speaker names.
3. Do NOT guess times or dates that aren't clearly shown.
4. If a field is not present in the source, OMIT it entirely from the object (do not include it as null or empty string).
5. Return ONLY a valid JSON array of objects. No markdown, no explanation, just the JSON array.
6. If no sessions are found, return an empty array: []
7. Extract ALL sessions, not just a sample. Include every session you can find.
8. Look through ALL the content to find events — check every section, table, list, and data block.
9. For tour/show websites, each show date at a different venue counts as a separate session.

Example output (showing different levels of available data):
[
  {"title": "The Future of AI in Music", "session_date": "2026-03-14", "start_time": "14:00", "end_time": "15:00", "location": "Room 4AB", "track": "Interactive", "speakers": ["Jane Doe", "John Smith"], "description": "A panel discussion exploring how AI is transforming music creation."},
  {"title": "Nurse John Live", "session_date": "2026-05-10", "start_time": "20:00", "location": "The Improv, Hollywood CA"},
  {"title": "Opening Ceremony", "start_time": "09:00", "location": "Main Stage"},
  {"title": "Networking Lunch"}
]`;

    let rawContent = '';
    try {
      const aiResult = await invokeChatModel({
        model: DEFAULT_GEMINI_FLASH_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Extract ALL agenda sessions, show dates, and scheduled events from this ${contentType}:\n\n${contentForAI}`,
          },
        ],
        temperature: 0.1,
        maxTokens: 32000,
        timeoutMs: 45_000,
      });
      rawContent = extractTextFromChatResponse(aiResult.raw, aiResult.provider);
      console.log(`[scrape-agenda] AI provider=${aiResult.provider} model=${aiResult.model}`);
    } catch (aiError) {
      const message = aiError instanceof Error ? aiError.message : String(aiError);
      console.error(`[scrape-agenda] AI extraction error: ${message}`);

      if (message.includes('429')) {
        return new Response(
          JSON.stringify({ error: 'AI service is busy. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      if (message.includes('402')) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      return new Response(JSON.stringify({ error: 'AI service error. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[scrape-agenda] AI response length: ${rawContent.length}`);

    // ── Parse AI response ──
    let sessions: AgendaSession[] = [];
    try {
      let jsonStr = rawContent.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
      else if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
      jsonStr = jsonStr.trim();

      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        sessions = parsed;
      } else if (parsed && Array.isArray(parsed.sessions)) {
        sessions = parsed.sessions;
      } else if (parsed && Array.isArray(parsed.results)) {
        sessions = parsed.results;
      } else {
        console.error('[scrape-agenda] AI did not return an array-like payload');
        sessions = [];
      }

      // Filter out entries without a title
      sessions = sessions.filter(
        s => s.title && typeof s.title === 'string' && s.title.trim().length > 0,
      );

      // Clean up each session — remove empty/null fields
      sessions = sessions.map(s => {
        const clean: AgendaSession = { title: s.title.trim() };
        if (s.description && s.description.trim()) clean.description = s.description.trim();
        if (s.session_date && s.session_date.trim()) clean.session_date = s.session_date.trim();
        if (s.start_time && s.start_time.trim()) clean.start_time = s.start_time.trim();
        if (s.end_time && s.end_time.trim()) clean.end_time = s.end_time.trim();
        if (s.location && s.location.trim()) clean.location = s.location.trim();
        if (s.track && s.track.trim()) clean.track = s.track.trim();
        if (s.speakers && Array.isArray(s.speakers) && s.speakers.length > 0) {
          clean.speakers = s.speakers
            .filter(sp => sp && typeof sp === 'string' && sp.trim())
            .map(sp => sp.trim());
          if (clean.speakers.length === 0) delete clean.speakers;
        }
        return clean;
      });
    } catch (parseErr) {
      console.error(
        '[scrape-agenda] Failed to parse AI JSON:',
        parseErr,
        'Raw:',
        rawContent.substring(0, 500),
      );
      return new Response(
        JSON.stringify({
          error:
            'Could not extract agenda data from this page. Try uploading a screenshot or PDF instead.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`[scrape-agenda] Found ${sessions.length} sessions (via ${scrapeMethod})`);

    if (sessions.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'No agenda sessions found on this page. Make sure the URL points to an agenda or schedule page.',
          sessions: [],
          source_url: url,
          scrape_method: scrapeMethod,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        sessions,
        sessions_found: sessions.length,
        source_url: url,
        scrape_method: scrapeMethod,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      console.error('[scrape-agenda] Request timed out');
      return new Response(
        JSON.stringify({
          error:
            'The request took too long to process. Try a simpler URL or upload a screenshot/PDF instead.',
        }),
        { status: 408, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } },
      );
    }

    console.error('[scrape-agenda] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } },
    );
  }
});
