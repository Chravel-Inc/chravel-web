// Feature Flags Admin
//
// Super-admin-only endpoint to LIST and UPDATE runtime feature flags
// (`public.feature_flags`). Writes go through the service-role client because the
// table's RLS grants mutation to `service_role` only. Super-admin status is
// verified SERVER-SIDE against `public.super_admins` (user_id = the JWT-verified
// caller, revoked_at IS NULL) — a client-supplied role/email is never trusted.
//
// Not registered in supabase/config.toml, so it inherits Supabase's default
// `verify_jwt = true` (matches stream-canary-guard, generate-trip-cover, etc.).
//
// Request body: { action: 'list' } | { action: 'update', key, enabled?, rollout_percentage? }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireAuth } from '../_shared/requireAuth.ts';
import { requireSecrets } from '../_shared/validateSecrets.ts';

const FLAG_COLUMNS = 'key, enabled, rollout_percentage, description, updated_at';

function json(payload: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors);

  let secrets: Record<string, string>;
  try {
    secrets = requireSecrets(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : 'Missing required secrets' },
      500,
      cors,
    );
  }

  // Server-verified identity (validates the JWT and returns the real user).
  const auth = await requireAuth(req, cors);
  if (auth.error) return auth.response;

  const admin = createClient(secrets.SUPABASE_URL, secrets.SUPABASE_SERVICE_ROLE_KEY);

  // Authorization: durable, DB-backed super-admin check. Never trust client input.
  const { data: superAdmin, error: superAdminErr } = await admin
    .from('super_admins')
    .select('user_id')
    .eq('user_id', auth.user.id)
    .is('revoked_at', null)
    .maybeSingle();

  if (superAdminErr) {
    console.error('[feature-flags-admin] super-admin lookup failed:', superAdminErr.message);
    return json({ error: 'Authorization check failed' }, 500, cors);
  }
  if (!superAdmin) {
    return json({ error: 'Forbidden' }, 403, cors);
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const action = typeof body.action === 'string' ? body.action : 'list';

  if (action === 'list') {
    const { data, error } = await admin
      .from('feature_flags')
      .select(FLAG_COLUMNS)
      .order('key', { ascending: true });
    if (error) return json({ error: error.message }, 500, cors);
    return json({ flags: data ?? [] }, 200, cors);
  }

  if (action === 'update') {
    const key = typeof body.key === 'string' ? body.key.trim() : '';
    if (!key) return json({ error: 'key is required' }, 400, cors);

    const patch: Record<string, unknown> = {};
    if (typeof body.enabled === 'boolean') patch.enabled = body.enabled;
    if (body.rollout_percentage !== undefined) {
      const pct = Number(body.rollout_percentage);
      if (!Number.isInteger(pct) || pct < 0 || pct > 100) {
        return json(
          { error: 'rollout_percentage must be an integer between 0 and 100' },
          400,
          cors,
        );
      }
      patch.rollout_percentage = pct;
    }
    if (Object.keys(patch).length === 0) {
      return json(
        { error: 'Nothing to update (provide enabled and/or rollout_percentage)' },
        400,
        cors,
      );
    }

    const { data, error } = await admin
      .from('feature_flags')
      .update(patch)
      .eq('key', key)
      .select(FLAG_COLUMNS)
      .maybeSingle();
    if (error) return json({ error: error.message }, 500, cors);
    if (!data) return json({ error: `Flag "${key}" not found` }, 404, cors);
    return json({ flag: data }, 200, cors);
  }

  return json({ error: `Unknown action: ${action}` }, 400, cors);
});
