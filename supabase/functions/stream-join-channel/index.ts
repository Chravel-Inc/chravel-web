/**
 * stream-join-channel — Supabase Edge Function
 *
 * Verifies the authenticated user is a member of the given trip in Supabase,
 * then adds them as a `channel_member` in Stream server-side.
 *
 * This is the secure server-side path for Stream channel membership.
 * The client SDK cannot add members to `chravel-trip` channels because
 * the `user` role does not have `AddOwnChannelMembership` — all membership
 * mutations must go through this function.
 *
 * POST /stream-join-channel
 * Headers: Authorization: Bearer <supabase-jwt>
 * Body: { tripId: string }
 * Returns: { ok: true } | { error: string }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { StreamChat } from 'npm:stream-chat';
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireSecrets, createMissingSecretResponse } from '../_shared/validateSecrets.ts';

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
    const secrets = requireSecrets(['STREAM_API_KEY', 'STREAM_API_SECRET']);
    if ('error' in secrets) return createMissingSecretResponse(secrets.error, corsHeaders);

    const STREAM_API_KEY = secrets['STREAM_API_KEY'];
    const STREAM_API_SECRET = secrets['STREAM_API_SECRET'];

    // ── Auth ──────────────────────────────────────────────────────────────
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

    // ── Parse body ────────────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const tripId = body?.tripId as string | undefined;

    if (!tripId || typeof tripId !== 'string') {
      return new Response(JSON.stringify({ error: 'tripId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Verify Supabase membership ────────────────────────────────────────
    // The user must be an active trip member. RLS on trip_members enforces this
    // at the DB level — if the row doesn't exist or they don't have access, the
    // query returns no rows.
    const { data: membership, error: membershipError } = await supabase
      .from('trip_members')
      .select('id, role')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError) {
      return new Response(JSON.stringify({ error: 'Failed to verify membership' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!membership) {
      return new Response(JSON.stringify({ error: 'User is not a member of this trip' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Add user to Stream channels server-side ───────────────────────────
    const serverClient = StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);

    // Upsert the user in Stream (ensures profile is current, must come before channel ops)
    await serverClient.upsertUser({ id: user.id });

    const tripChannelId = `trip-${tripId}`;
    const broadcastChannelId = `broadcast-${tripId}`;

    // Add to trip chat channel.
    // channel.create() is idempotent — creates the channel if it doesn't exist yet,
    // returns existing state if it does. This prevents the error-code-16 failure
    // ("Can't find channel") that occurs when addMembers is called before the channel
    // has been initialised in Stream. The server client always has CreateChannel permission.
    const tripChannel = serverClient.channel('chravel-trip', tripChannelId, {
      trip_id: tripId,
      created_by_id: user.id,
    });
    await tripChannel.create();
    await tripChannel.addMembers([user.id]);

    // Add to broadcast channel (best-effort — channel may not exist yet)
    try {
      const broadcastChannel = serverClient.channel('chravel-broadcast', broadcastChannelId, {
        trip_id: tripId,
        created_by_id: user.id,
      });
      await broadcastChannel.create();
      await broadcastChannel.addMembers([user.id]);
    } catch {
      // Non-fatal: broadcast channel creation/join failure should not block trip chat
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
