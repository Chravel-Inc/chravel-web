/**
 * Enforce a user block at the Stream Chat layer.
 *
 * Blocking was previously a client-side message filter only: the blocked user's messages still
 * arrived over realtime and were merely hidden in whichever client had the block list loaded, so a
 * second device or a fresh session showed everything. That is weak for an App Store 1.2 safety
 * control.
 *
 * This applies a per-blocker Stream MUTE, which is:
 *   - server-side, so it holds across every device and session the blocker uses;
 *   - asymmetric, matching "I don't want to see this person" — both users remain legitimate members
 *     of their shared trips (a ban would evict someone from a trip they belong to, which is a
 *     moderator action, not a personal one);
 *   - reversible: unblocking unmutes.
 *
 * Authorization: the caller can only ever act on their OWN block list, and the desired state is
 * re-derived from the user_blocks table rather than trusted from the request body — so a forged
 * request cannot mute someone the caller has not actually blocked.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { StreamChat } from 'npm:stream-chat';
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireAuth } from '../_shared/requireAuth.ts';
import { requireSecrets, createMissingSecretResponse } from '../_shared/validateSecrets.ts';

interface SyncBlockBody {
  blockedUserId?: string;
}

Deno.serve(async req => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const secrets = requireSecrets([
      'STREAM_API_KEY',
      'STREAM_API_SECRET',
      'SUPABASE_SERVICE_ROLE_KEY',
    ]);

    const auth = await requireAuth(req, corsHeaders);
    if (auth.response) return auth.response;
    const caller = auth.user!;

    let body: SyncBlockBody;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const blockedUserId = typeof body.blockedUserId === 'string' ? body.blockedUserId.trim() : '';
    if (!blockedUserId) {
      return new Response(JSON.stringify({ error: 'blockedUserId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (blockedUserId === caller.id) {
      return new Response(JSON.stringify({ error: 'Cannot block yourself' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Derive the desired state from the database, never from the request. The caller's own block
    // row is the single source of truth, so a forged call cannot mute an arbitrary user.
    const { data: blockRow, error: blockErr } = await admin
      .from('user_blocks')
      .select('blocker_id')
      .eq('blocker_id', caller.id)
      .eq('blocked_id', blockedUserId)
      .maybeSingle();

    if (blockErr) {
      console.error('[sync-user-block] block lookup failed:', blockErr.message);
      return new Response(JSON.stringify({ error: 'Failed to read block state' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const shouldMute = !!blockRow;
    const stream = StreamChat.getInstance(secrets['STREAM_API_KEY'], secrets['STREAM_API_SECRET']);

    if (shouldMute) {
      await stream.muteUser(blockedUserId, caller.id);
    } else {
      await stream.unmuteUser(blockedUserId, caller.id);
    }

    return new Response(JSON.stringify({ success: true, muted: shouldMute }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing required secret')) {
      return createMissingSecretResponse(error, getCorsHeaders(req));
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[sync-user-block] error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
