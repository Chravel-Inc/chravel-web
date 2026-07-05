/**
 * Vercel Edge Function for Invite Link OG Previews
 *
 * vercel.json rewrites BOTH /join/:code and /j/:code here for every user agent, so
 * this handler must branch:
 * - Crawlers (Slack/iMessage/Twitter/...) do not execute JavaScript → proxy the
 *   Supabase generate-invite-preview edge function, which returns static HTML with
 *   per-trip OG tags.
 * - Real browsers → serve the SPA shell (index.html) so React Router renders the
 *   interactive JoinTrip flow at the same URL. Serving the OG HTML to humans would
 *   meta-refresh back to /join/:code and loop forever through this same rewrite.
 */

import { isLikelyHtmlCrawler } from '../unfurl/crawlerDetection';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response(
      `<!DOCTYPE html>
<html>
<head>
  <title>Invalid Invite - ChravelApp</title>
  <meta property="og:title" content="Invalid Invite Link" />
  <meta property="og:description" content="This invite link is missing or invalid." />
  <meta property="og:site_name" content="ChravelApp" />
</head>
<body>
  <h1>Invalid Invite Link</h1>
  <p>The invite code is missing from this URL.</p>
</body>
</html>`,
      {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      },
    );
  }

  const safeCode = encodeURIComponent(code);
  const userAgent = request.headers.get('User-Agent');

  if (!isLikelyHtmlCrawler(userAgent)) {
    try {
      // /index.html only matches the SPA catch-all rewrite (which excludes api/),
      // so this internal fetch cannot recurse into this handler.
      const spa = await fetch(`${url.origin}/index.html`);
      if (spa.ok) {
        return new Response(await spa.text(), {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store',
            Vary: 'User-Agent',
          },
        });
      }
    } catch {
      // Fall through to the crawler/OG path — degraded, but its CTA link still
      // gives humans a way into the app.
    }
  }

  try {
    // Proxy to Supabase generate-invite-preview edge function
    const supabaseUrl =
      `https://jmjiyekmxwsxkfnqwyaa.supabase.co/functions/v1/generate-invite-preview` +
      `?code=${safeCode}` +
      `&canonicalUrl=${encodeURIComponent(`${url.origin}/j/${safeCode}`)}`;

    const upstream = await fetch(supabaseUrl, {
      method: 'GET',
      headers: {
        'User-Agent': userAgent || 'Vercel Edge Function',
        Accept: 'text/html',
      },
    });

    const body = await upstream.text();

    return new Response(body, {
      status: upstream.status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
        Vary: 'User-Agent',
      },
    });
  } catch (error) {
    console.error('Error fetching invite preview:', error);

    return new Response(
      `<!DOCTYPE html>
<html>
<head>
  <title>Trip Invite - ChravelApp</title>
  <meta property="og:title" content="You're Invited!" />
  <meta property="og:description" content="Join this trip on ChravelApp - The Group Chat Travel App" />
  <meta property="og:site_name" content="ChravelApp" />
  <meta property="og:image" content="https://chravel.app/chravel-logo.png" />
</head>
<body>
  <h1>You're Invited to a Trip!</h1>
  <p>Open this link in ChravelApp to join.</p>
  <a href="https://chravel.app/join/${safeCode}">Join Trip</a>
</body>
</html>`,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8', Vary: 'User-Agent' },
      },
    );
  }
}
