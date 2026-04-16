/**
 * Stream Channel Type Permission Setup — Supabase Edge Function
 *
 * One-time setup function that configures Stream channel type permissions
 * via the server-side SDK. These permissions cannot be set through the
 * Stream dashboard UI and must be configured programmatically.
 *
 * POST /stream-setup-permissions
 * Headers:
 *   Authorization: Bearer <supabase-jwt>
 *   X-Admin-Secret: <STREAM_ADMIN_SECRET>
 * Returns: { success: true, results: [...] }
 *
 * Security: Requires BOTH a valid JWT AND the STREAM_ADMIN_SECRET header.
 * This prevents any authenticated user from mutating app-wide channel types.
 *
 * Run once after Stream app creation. Safe to re-run (idempotent).
 *
 * Concierge requirement: this setup upserts deterministic Stream principal
 * `ai-concierge-bot` (AI Concierge). Concierge channel flows rely on this
 * principal being present in Stream.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { StreamChat } from 'npm:stream-chat';
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireSecrets, createMissingSecretResponse } from '../_shared/validateSecrets.ts';
import { configureStreamPermissionsAndPrincipal } from './setup.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async req => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const secrets = requireSecrets(['STREAM_API_KEY', 'STREAM_API_SECRET', 'STREAM_ADMIN_SECRET']);
    const STREAM_API_KEY = secrets['STREAM_API_KEY'];
    const STREAM_API_SECRET = secrets['STREAM_API_SECRET'];
    const STREAM_ADMIN_SECRET = secrets['STREAM_ADMIN_SECRET'];

    // ── Admin secret gate — prevents any authenticated user from calling ──
    const adminSecret = req.headers.get('X-Admin-Secret');
    if (!adminSecret || adminSecret !== STREAM_ADMIN_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Forbidden — valid X-Admin-Secret header required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // ── Auth (require authenticated user) ─────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
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
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Setup Stream permissions ──────────────────────────────────────────
    const serverClient = StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);

    const results = await configureStreamPermissionsAndPrincipal(serverClient);

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing required secret')) {
      return createMissingSecretResponse(error, corsHeaders);
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[stream-setup-permissions] Error:', message);

    return new Response(JSON.stringify({ error: 'Failed to configure Stream permissions' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
