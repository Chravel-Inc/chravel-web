/**
 * Vercel Edge Function: Proxy `/trip/:tripId/preview` to Supabase `generate-trip-preview`.
 *
 * Why Edge Function: iMessage/OG scrapers do not execute SPA JS, so we must serve OG tags
 * at the URL itself. Edge Functions use Web Standards API (no @vercel/node dependency).
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const tripId = url.searchParams.get('tripId');

  // DEV logging
  console.log('[trip-preview] Received request for tripId:', tripId);

  if (!tripId) {
    return new Response('Missing tripId', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  try {
    const canonicalUrl = url.toString();
    // Always send users to the primary app host for interactive join flow.
    // Branded unfurl hosts (e.g. p.chravel.app) are OG surfaces and should not
    // be used as the in-app destination.
    const appBaseUrl = 'https://chravel.app';

    // Proxy to Supabase generate-trip-preview edge function
    const supabaseProjectRef = 'jmjiyekmxwsxkfnqwyaa';
    const supabaseUrl =
      `https://${supabaseProjectRef}.supabase.co/functions/v1/generate-trip-preview` +
      `?tripId=${encodeURIComponent(tripId)}` +
      `&canonicalUrl=${encodeURIComponent(canonicalUrl)}` +
      `&appBaseUrl=${encodeURIComponent(appBaseUrl)}`;

    console.log('[trip-preview] Fetching from:', supabaseUrl);

    const upstream = await fetch(supabaseUrl, {
      method: 'GET',
      headers: {
        'User-Agent': request.headers.get('user-agent') ?? 'chravel-preview-proxy',
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.8',
      },
    });

    const body = await upstream.text();

    console.log('[trip-preview] Upstream status:', upstream.status, 'Body length:', body.length);

    const upstreamContentType = upstream.headers.get('content-type') ?? '';
    const bodyLooksHtml = /^\s*<(?:!doctype\s+html|html|head|meta|body)/i.test(body);

    // Always serve HTML as text/html so desktop browsers render preview pages correctly.
    // Some upstream/proxy hops can strip or rewrite content-type to text/plain, which causes
    // raw OG HTML source (and mojibake bullets) to display instead of rendering.
    const contentType = bodyLooksHtml
      ? 'text/html; charset=utf-8'
      : upstreamContentType || 'text/plain; charset=utf-8';

    // Build response with proper headers
    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
    };

    const cacheControl = upstream.headers.get('cache-control');
    if (cacheControl) {
      responseHeaders['Cache-Control'] = cacheControl;
    } else {
      // Default 5-minute cache for OG previews
      responseHeaders['Cache-Control'] = 'public, max-age=300, s-maxage=300';
    }

    return new Response(body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[trip-preview] Error:', message);

    return new Response(`Preview proxy error: ${message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
