// SEO dashboard backend — Google Search Console (live) + optional Semrush KD enrichment.
// Super-admin only.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireAuth } from '../_shared/requireAuth.ts';
import { isSuperAdminEmail } from '../_shared/superAdmins.ts';

const GSC = 'https://connector-gateway.lovable.dev/google_search_console/webmasters/v3';

interface SearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

async function gscFetch(path: string, init: RequestInit = {}) {
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');
  const gscKey = Deno.env.get('GOOGLE_SEARCH_CONSOLE_API_KEY');
  if (!lovableKey) throw new Error('LOVABLE_API_KEY not configured');
  if (!gscKey) throw new Error('GOOGLE_SEARCH_CONSOLE_API_KEY not configured (link the GSC connector)');

  const res = await fetch(`${GSC}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      'X-Connection-Api-Key': gscKey,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    throw new Error(`GSC ${res.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  }
  return body as Record<string, unknown>;
}

async function searchAnalytics(siteUrl: string, body: Record<string, unknown>) {
  const encoded = encodeURIComponent(siteUrl);
  const data = await gscFetch(`/sites/${encoded}/searchAnalytics/query`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return (data?.rows as SearchAnalyticsRow[]) || [];
}

// Lightweight Semrush keyword difficulty enrichment (optional — needs SEMRUSH_API_KEY).
async function semrushKD(keywords: string[], database = 'us'): Promise<Record<string, number>> {
  const key = Deno.env.get('SEMRUSH_API_KEY');
  if (!key || keywords.length === 0) return {};
  const out: Record<string, number> = {};
  // Semrush phrase_kdi: 1 keyword/call. Cap to top 25 to stay cheap.
  const top = keywords.slice(0, 25);
  await Promise.all(top.map(async (kw) => {
    try {
      const url = `https://api.semrush.com/?type=phrase_kdi&key=${key}&phrase=${encodeURIComponent(kw)}&database=${database}&export_columns=Kd`;
      const res = await fetch(url);
      if (!res.ok) return;
      const text = (await res.text()).trim();
      const lines = text.split('\n');
      if (lines.length >= 2) {
        const v = parseFloat(lines[1]);
        if (!Number.isNaN(v)) out[kw] = v;
      }
    } catch { /* swallow per-keyword */ }
  }));
  return out;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const auth = await requireAuth(req, corsHeaders);
    if (auth.error) return auth.response;
    if (!isSuperAdminEmail(auth.user.email)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, siteUrl, days = 28 } = await req.json().catch(() => ({} as Record<string, unknown>));
    const lookback = Math.min(Math.max(Number(days) || 28, 7), 90);
    const startDate = daysAgoISO(lookback);
    const endDate = todayISO();

    if (action === 'list_sites') {
      const data = await gscFetch('/sites');
      const entries = (data?.siteEntry as Array<{ siteUrl: string; permissionLevel: string }>) || [];
      return new Response(JSON.stringify({ sites: entries }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!siteUrl || typeof siteUrl !== 'string') {
      return new Response(JSON.stringify({ error: 'siteUrl required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'overview') {
      const [byQuery, byPage, byDate] = await Promise.all([
        searchAnalytics(siteUrl, { startDate, endDate, dimensions: ['query'], rowLimit: 250 }),
        searchAnalytics(siteUrl, { startDate, endDate, dimensions: ['page'], rowLimit: 100 }),
        searchAnalytics(siteUrl, { startDate, endDate, dimensions: ['date'], rowLimit: 1000 }),
      ]);

      const keywords = byQuery.map(r => ({
        query: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      }));

      // Top keywords for KD enrichment
      const kdMap = await semrushKD(keywords.slice(0, 25).map(k => k.query));

      const pages = byPage.map(r => ({
        url: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      }));

      const trend = byDate.map(r => ({
        date: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
      }));

      // Opportunities: position 11–20 with meaningful impressions, sorted by impressions
      const opportunities = keywords
        .filter(k => k.position >= 11 && k.position <= 20 && k.impressions >= 10)
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 25)
        .map(k => ({ ...k, kd: kdMap[k.query] ?? null }));

      const totals = trend.reduce(
        (acc, d) => ({ clicks: acc.clicks + d.clicks, impressions: acc.impressions + d.impressions }),
        { clicks: 0, impressions: 0 },
      );

      return new Response(JSON.stringify({
        siteUrl, startDate, endDate,
        totals: {
          ...totals,
          ctr: totals.impressions ? totals.clicks / totals.impressions : 0,
        },
        keywords: keywords.map(k => ({ ...k, kd: kdMap[k.query] ?? null })),
        pages,
        trend,
        opportunities,
        semrushEnabled: !!Deno.env.get('SEMRUSH_API_KEY'),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('seo-dashboard error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
