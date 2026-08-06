/**
 * unsubscribe-email
 *
 * One-click email unsubscribe. Two entry paths:
 *  - POST { token } — invoked by the public /unsubscribe SPA page via
 *    supabase.functions.invoke (anon key satisfies any platform JWT gate, so
 *    this path works with zero config.toml changes).
 *  - GET ?token=    — direct hit; requires `[functions.unsubscribe-email]
 *    verify_jwt = false` in supabase/config.toml (protected file, owner edit —
 *    tracked in the parity baseline). Falls back to a redirect when invalid.
 *
 * Token integrity is the authorization: an HMAC derived from the service key
 * (_shared/unsubscribeToken.ts). A token only ever unsubscribes its own user.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { verifyUnsubscribeToken } from '../_shared/unsubscribeToken.ts';

const SETTINGS_URL = 'https://chravel.app/settings';

function html(body: string, status = 200): Response {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Chravel</title><style>body{font-family:-apple-system,system-ui,sans-serif;background:#0d0d0f;color:#eee;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}main{max-width:26rem;padding:2rem;text-align:center}a{color:#c49746}</style></head><body><main>${body}</main></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

async function unsubscribe(userId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { error } = await supabase
    .from('notification_preferences')
    .upsert({ user_id: userId, email_enabled: false }, { onConflict: 'user_id' });

  if (error) {
    console.error('[unsubscribe-email] preference update failed:', error.message);
    return { ok: false, error: 'update_failed' };
  }
  return { ok: true };
}

serve(async req => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // SPA path: POST { token } from the /unsubscribe page.
  if (req.method === 'POST') {
    let token = '';
    try {
      const body = await req.json();
      token = typeof body?.token === 'string' ? body.token : '';
    } catch {
      token = '';
    }

    const userId = token ? await verifyUnsubscribeToken(token) : null;
    if (!userId) {
      return new Response(JSON.stringify({ ok: false, error: 'invalid_token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await unsubscribe(userId);
    return new Response(JSON.stringify(result), {
      status: result.ok ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Direct-link path (needs verify_jwt=false in config.toml).
  if (req.method === 'GET') {
    const token = new URL(req.url).searchParams.get('token') ?? '';
    const userId = token ? await verifyUnsubscribeToken(token) : null;

    if (!userId) {
      return new Response(null, { status: 302, headers: { Location: SETTINGS_URL } });
    }

    const result = await unsubscribe(userId);
    if (!result.ok) {
      return html(
        `<h1>Something went wrong</h1><p>We couldn't update your preferences. Please try again from <a href="${SETTINGS_URL}">notification settings</a>.</p>`,
        500,
      );
    }

    return html(
      `<h1>You're unsubscribed</h1><p>You'll no longer receive email notifications from Chravel.</p><p>Changed your mind? Re-enable them any time in <a href="${SETTINGS_URL}">notification settings</a>.</p>`,
    );
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
});
