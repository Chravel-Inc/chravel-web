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

type ErrorCode =
  | 'invalid_method'
  | 'auth_required'
  | 'auth_invalid'
  | 'invalid_trip_id'
  | 'membership_verification_failed'
  | 'membership_required'
  | 'stream_api_failure';

type ReasonCode =
  | 'invalid_http_method'
  | 'authentication_required'
  | 'authentication_invalid'
  | 'trip_id_missing'
  | 'trip_membership_check_failed'
  | 'trip_membership_required'
  | 'stream_membership_sync_failed'
  | 'stream_membership_synced';

function jsonResponse(
  payload: Record<string, unknown>,
  status: number,
  corsHeaders: Record<string, string>,
) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(
  corsHeaders: Record<string, string>,
  status: number,
  code: ErrorCode,
  reasonCode: ReasonCode,
  reason: string,
) {
  return jsonResponse({ success: false, code, reasonCode, reason }, status, corsHeaders);
}

serve(async req => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse(
      corsHeaders,
      405,
      'invalid_method',
      'invalid_http_method',
      'Method not allowed',
    );
  }

  try {
    const secrets = requireSecrets(['STREAM_API_KEY', 'STREAM_API_SECRET']);

    const STREAM_API_KEY = secrets['STREAM_API_KEY'];
    const STREAM_API_SECRET = secrets['STREAM_API_SECRET'];

    // ── Auth ──────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse(
        corsHeaders,
        401,
        'auth_required',
        'authentication_required',
        'Authentication required',
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return errorResponse(
        corsHeaders,
        401,
        'auth_invalid',
        'authentication_invalid',
        'Invalid authentication',
      );
    }

    // ── Parse body ────────────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const tripId = body?.tripId as string | undefined;

    if (!tripId || typeof tripId !== 'string') {
      return errorResponse(
        corsHeaders,
        400,
        'invalid_trip_id',
        'trip_id_missing',
        'tripId is required',
      );
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
      return errorResponse(
        corsHeaders,
        500,
        'membership_verification_failed',
        'trip_membership_check_failed',
        'Failed to verify membership',
      );
    }

    if (!membership) {
      return errorResponse(
        corsHeaders,
        403,
        'membership_required',
        'trip_membership_required',
        'User is not a member of this trip',
      );
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

    return jsonResponse(
      { success: true, code: 'ok', reasonCode: 'stream_membership_synced' },
      200,
      corsHeaders,
    );
  } catch (err) {
    if (err instanceof Error && err.message.includes('Missing required secret')) {
      return createMissingSecretResponse(err, corsHeaders);
    }

    const reason = err instanceof Error ? err.message : 'Internal server error';
    return errorResponse(
      corsHeaders,
      500,
      'stream_api_failure',
      'stream_membership_sync_failed',
      reason,
    );
  }
});
