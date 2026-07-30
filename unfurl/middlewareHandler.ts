import { isLikelyHtmlCrawler } from './crawlerDetection';

export const UNFURL_ORIGIN = 'https://p.chravel.app';

export type UnfurlMiddlewareDecision =
  | { action: 'proxy'; destination: string }
  | { action: 'pass' };

/**
 * Decide whether chravel.app should proxy an unfurl path to the branded
 * unfurl service (p.chravel.app) before the SPA catch-all runs.
 *
 * Trip share links (/t/:id) always proxy so iMessage/Slack get per-trip OG tags.
 * Invite short links (/j/:code) always proxy; OG HTML meta-refreshes humans to /join/:code.
 * Legacy /join/:code links proxy only for crawlers so real browsers still hit the SPA.
 */
export function resolveUnfurlMiddlewareDecision(
  pathname: string,
  userAgent: string | null,
): UnfurlMiddlewareDecision {
  const tripMatch = pathname.match(/^\/t\/([^/]+)\/?$/);
  if (tripMatch?.[1]) {
    return {
      action: 'proxy',
      destination: `${UNFURL_ORIGIN}/t/${encodeURIComponent(tripMatch[1])}`,
    };
  }

  const inviteMatch = pathname.match(/^\/j\/([^/]+)\/?$/);
  if (inviteMatch?.[1]) {
    return {
      action: 'proxy',
      destination: `${UNFURL_ORIGIN}/j/${encodeURIComponent(inviteMatch[1])}`,
    };
  }

  const joinMatch = pathname.match(/^\/join\/([^/]+)\/?$/);
  if (joinMatch?.[1] && isLikelyHtmlCrawler(userAgent)) {
    return {
      action: 'proxy',
      destination: `${UNFURL_ORIGIN}/j/${encodeURIComponent(joinMatch[1])}`,
    };
  }

  return { action: 'pass' };
}

export async function proxyUnfurlDestination(
  destination: string,
  request: Request,
  userAgent: string | null,
): Promise<Response> {
  const requestUrl = new URL(request.url);
  const upstreamUrl = new URL(destination);
  upstreamUrl.search = requestUrl.search;

  const upstream = await fetch(upstreamUrl.toString(), {
    method: request.method,
    headers: {
      'User-Agent': userAgent ?? 'chravel-unfurl-middleware',
      Accept: request.headers.get('accept') ?? 'text/html,application/xhtml+xml',
    },
    redirect: 'manual',
  });

  const body = await upstream.text();
  const headers = new Headers(upstream.headers);
  headers.set('Vary', 'User-Agent');

  const contentType = headers.get('content-type') ?? '';
  if (!contentType.includes('text/html')) {
    headers.set('Content-Type', 'text/html; charset=utf-8');
  }

  return new Response(body, {
    status: upstream.status,
    headers,
  });
}
