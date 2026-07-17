// Bootstrap founder super-admin rows into public.super_admins from the
// SUPER_ADMIN_BOOTSTRAP_EMAILS secret. Idempotent (ON CONFLICT DO NOTHING).
//
// Auth: caller must already be a super admin (server-verified via
// public.is_super_admin()) OR the request must be made with the service_role
// key. This prevents any authenticated user from probing / triggering it.
//
// Emails are NEVER stored in source control — the roster lives in the
// SUPER_ADMIN_BOOTSTRAP_EMAILS env secret and, once seeded, in the
// public.super_admins table (the runtime source of truth).

import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

const json = (req: Request, body: unknown, status = 200) => {
  const corsHeaders = getCorsHeaders(req);
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

function parseEmails(raw: string | undefined): string[] {
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(/[,\s]+/)
        .map(e => e.trim().toLowerCase())
        .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)),
    ),
  );
}

Deno.serve(async req => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(req, { error: 'method_not_allowed' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  const ROSTER_RAW = Deno.env.get('SUPER_ADMIN_BOOTSTRAP_EMAILS');

  if (!SUPABASE_URL || !SERVICE_ROLE || !ANON_KEY) {
    return json(req, { error: 'missing_supabase_env' }, 500);
  }

  // AuthZ: allow either service_role Bearer OR an authenticated existing super-admin.
  const authHeader = req.headers.get('Authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  let authorized = false;
  if (bearer && bearer === SERVICE_ROLE) {
    authorized = true;
  } else if (bearer) {
    const asUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${bearer}` } },
    });
    const { data: claims, error: claimsErr } = await asUser.auth.getClaims(bearer);
    if (!claimsErr && claims?.claims?.sub) {
      const { data: isAdmin } = await asUser.rpc('is_super_admin');
      if (isAdmin === true) authorized = true;
    }
  }

  if (!authorized) return json(req, { error: 'unauthorized' }, 401);

  const emails = parseEmails(ROSTER_RAW);
  if (emails.length === 0) {
    return json(
      req,
      { error: 'no_bootstrap_emails', hint: 'Set SUPER_ADMIN_BOOTSTRAP_EMAILS secret.' },
      400,
    );
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const rows = emails.map(email => ({ email, note: 'bootstrap' }));
  const { data, error } = await admin
    .from('super_admins')
    .upsert(rows, { onConflict: 'email', ignoreDuplicates: true })
    .select('email');

  if (error) return json(req, { error: 'upsert_failed', detail: error.message }, 500);

  return json(req, { ok: true, seeded: emails.length, inserted: data?.length ?? 0 });
});
