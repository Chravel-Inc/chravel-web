/**
 * Fetch OG Metadata Edge Function
 *
 * Fetches Open Graph metadata from URLs to avoid CORS issues
 * Used by Media > URLs tab to show rich previews
 *
 * @module supabase/functions/fetch-og-metadata
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import {
  FetchOGMetadataSchema,
  validateInput,
  validateExternalUrlBeforeFetch,
} from '../_shared/validation.ts';

interface OGMetadata {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  type?: string;
  url?: string;
  error?: string;
}

serve(async req => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate request body with Zod schema (SSRF protection)
    const rawBody = await req.json();
    const validation = validateInput(FetchOGMetadataSchema, rawBody);

    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { url } = validation.data;

    // DNS rebinding protection: resolve hostname and validate resolved IPs
    if (!(await validateExternalUrlBeforeFetch(url))) {
      return new Response(
        JSON.stringify({ error: 'URL must be HTTPS and external (no internal/private networks)' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Fetch the HTML content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ChravelBot/1.0; +https://chravel.com)',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
      // Allow redirects — initial URL is already validated by validateExternalUrlBeforeFetch()
      // and this edge function runs in Deno Deploy, isolated from internal infra.
      // redirect: 'error' was blocking legitimate sites that redirect (www, path normalization, CDN).
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const metadata: OGMetadata = {};

    // Extract OG tags using regex.
    // Many sites emit attributes in either order (property then content, or content then property),
    // so we check both orderings for each tag.
    const matchOgTag = (tag: string): RegExpMatchArray | null =>
      html.match(new RegExp(`<meta\\s+property=["']${tag}["']\\s+content=["']([^"']+)["']`, 'i')) ||
      html.match(new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+property=["']${tag}["']`, 'i'));

    const matchNameTag = (name: string): RegExpMatchArray | null =>
      html.match(new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']+)["']`, 'i')) ||
      html.match(new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+name=["']${name}["']`, 'i'));

    const ogTitleMatch =
      matchOgTag('og:title') ||
      matchNameTag('twitter:title') ||
      html.match(/<title>([^<]+)<\/title>/i);
    if (ogTitleMatch) metadata.title = ogTitleMatch[1].trim();

    const ogDescriptionMatch =
      matchOgTag('og:description') ||
      matchNameTag('twitter:description') ||
      matchNameTag('description');
    if (ogDescriptionMatch) metadata.description = ogDescriptionMatch[1].trim();

    const ogImageMatch = matchOgTag('og:image') || matchNameTag('twitter:image');
    if (ogImageMatch) {
      const imageUrl = ogImageMatch[1].trim();
      // Resolve relative URLs
      metadata.image = imageUrl.startsWith('http') ? imageUrl : new URL(imageUrl, url).toString();
    }

    const ogSiteNameMatch = matchOgTag('og:site_name');
    if (ogSiteNameMatch) metadata.siteName = ogSiteNameMatch[1].trim();

    const ogTypeMatch = matchOgTag('og:type');
    if (ogTypeMatch) metadata.type = ogTypeMatch[1].trim();

    metadata.url = url;

    return new Response(JSON.stringify(metadata), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[fetch-og-metadata] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch metadata from the provided URL.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
