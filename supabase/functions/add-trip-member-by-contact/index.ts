/**
 * Add an existing Chravel user to a trip by email or phone.
 *
 * Security:
 * - Caller must be authenticated
 * - Same invite mint authz: consumer = any active member; pro/event = creator/admin
 * - Target must already have an account (lookup via service-role RPC)
 * - Respects plan member capacity (is_trip_at_member_capacity)
 * - Does NOT create invite-link join requests — direct membership for known users
 *
 * Regression notes: does not touch trip fetch/auth hydration; capacity check fails closed
 * only when RPC returns true (RPC errors are logged and allowed, matching join-trip).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireAuth } from '../_shared/requireAuth.ts';
import { applyRateLimit } from '../_shared/rateLimitGuard.ts';

interface AddMemberBody {
  tripId?: string;
  email?: string;
  phone?: string;
}

function normalizePhoneDigits(raw: string): string {
  return raw.trim().replace(/\D/g, '');
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

  const auth = await requireAuth(req, corsHeaders);
  if (auth.response) return auth.response;
  const caller = auth.user!;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  let body: AddMemberBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const tripId = typeof body.tripId === 'string' ? body.tripId.trim() : '';
  const email =
    typeof body.email === 'string' && body.email.trim() ? body.email.trim().toLowerCase() : null;
  const phoneRaw = typeof body.phone === 'string' && body.phone.trim() ? body.phone.trim() : null;
  const phoneDigits = phoneRaw ? normalizePhoneDigits(phoneRaw) : null;

  if (!tripId) {
    return new Response(JSON.stringify({ error: 'tripId is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!email && !phoneDigits) {
    return new Response(JSON.stringify({ error: 'Provide email or phone for an existing user' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (email && !isValidEmail(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email address' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (phoneDigits && (phoneDigits.length < 7 || phoneDigits.length > 15)) {
    return new Response(JSON.stringify({ error: 'Invalid phone number' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // This endpoint distinguishes "no Chravel account" (404 USER_NOT_FOUND) from a successful add /
  // ALREADY_MEMBER, which makes it an email+phone -> account-existence oracle. Those distinct
  // responses are required for the feature's UX (the caller must know why an add failed), so the
  // enumeration risk is mitigated by capping probe volume instead: a real inviter adds a handful of
  // people, while enumeration needs bulk queries. DB-backed and fail-closed.
  const rateLimit = await applyRateLimit({
    identifier: `add-member-by-contact:${caller.id}`,
    maxRequests: 20,
    windowSeconds: 3600,
    corsHeaders,
    supabaseClient: supabase,
  });
  if (!rateLimit.allowed) return rateLimit.response!;

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, name, created_by, trip_type, is_archived')
    .eq('id', tripId)
    .maybeSingle();

  if (tripError || !trip) {
    return new Response(JSON.stringify({ error: 'Trip not found', error_code: 'TRIP_NOT_FOUND' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (trip.is_archived) {
    return new Response(
      JSON.stringify({ error: 'Trip is archived', error_code: 'TRIP_ARCHIVED' }),
      {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  const tripType = trip.trip_type || 'consumer';
  let authorized = trip.created_by === caller.id;

  if (!authorized && tripType === 'consumer') {
    const { data: member } = await supabase
      .from('trip_members')
      .select('id')
      .eq('trip_id', tripId)
      .eq('user_id', caller.id)
      .or('status.is.null,status.eq.active')
      .maybeSingle();
    authorized = !!member;
  } else if (!authorized) {
    const { data: admin } = await supabase
      .from('trip_admins')
      .select('id')
      .eq('trip_id', tripId)
      .eq('user_id', caller.id)
      .maybeSingle();
    authorized = !!admin;
  }

  if (!authorized) {
    return new Response(
      JSON.stringify({
        error: 'Only trip members (or admins on Pro/Event) can add people',
        error_code: 'ACCESS_DENIED',
      }),
      {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  const { data: atCapacity, error: capacityError } = await supabase.rpc(
    'is_trip_at_member_capacity',
    { p_trip_id: tripId },
  );
  if (capacityError) {
    console.warn('[add-trip-member-by-contact] capacity check failed:', capacityError.message);
  } else if (atCapacity === true) {
    return new Response(
      JSON.stringify({
        error:
          'This trip has reached its member limit. Upgrade the plan or remove members to add more.',
        error_code: 'TRIP_FULL',
      }),
      {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  const { data: targetUserId, error: lookupError } = await supabase.rpc(
    'lookup_user_id_by_contact',
    {
      p_email: email,
      p_phone_digits: phoneDigits,
    },
  );

  if (lookupError) {
    console.error('[add-trip-member-by-contact] lookup failed:', lookupError.message);
    return new Response(JSON.stringify({ error: 'Failed to look up user' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!targetUserId) {
    return new Response(
      JSON.stringify({
        error:
          'No Chravel account found for that email or phone. Ask them to create an account first, then try again — or share an invite link.',
        error_code: 'USER_NOT_FOUND',
      }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  if (targetUserId === caller.id) {
    return new Response(JSON.stringify({ error: 'You are already on this trip' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: existing } = await supabase
    .from('trip_members')
    .select('id, status')
    .eq('trip_id', tripId)
    .eq('user_id', targetUserId)
    .maybeSingle();

  if (existing && (existing.status === null || existing.status === 'active')) {
    return new Response(
      JSON.stringify({
        error: 'That person is already a member of this trip',
        error_code: 'ALREADY_MEMBER',
      }),
      {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, first_name, last_name, avatar_url')
    .eq('user_id', targetUserId)
    .maybeSingle();

  const displayName =
    (profile?.display_name && profile.display_name.trim()) ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() ||
    'Chravel User';

  if (existing && existing.status === 'left') {
    const { error: reactivateError } = await supabase
      .from('trip_members')
      .update({
        status: 'active',
        left_at: null,
        role: 'member',
        display_name_snapshot: displayName,
        avatar_url_snapshot: profile?.avatar_url ?? null,
      })
      .eq('id', existing.id);

    if (reactivateError) {
      console.error('[add-trip-member-by-contact] reactivate failed:', reactivateError.message);
      return new Response(JSON.stringify({ error: 'Failed to add member' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } else {
    const { error: insertError } = await supabase.from('trip_members').insert({
      trip_id: tripId,
      user_id: targetUserId,
      role: 'member',
      status: 'active',
      display_name_snapshot: displayName,
      avatar_url_snapshot: profile?.avatar_url ?? null,
    });

    if (insertError) {
      console.error('[add-trip-member-by-contact] insert failed:', insertError.message);
      return new Response(JSON.stringify({ error: 'Failed to add member' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  const tripLabel = typeof trip.name === 'string' && trip.name.trim() ? trip.name.trim() : 'a trip';

  await supabase.from('notifications').insert({
    user_id: targetUserId,
    title: `Added to ${tripLabel}`,
    message: `You were added to ${tripLabel} on Chravel.`,
    type: 'member_added',
    trip_id: tripId,
    metadata: {
      trip_id: tripId,
      trip_name: trip.name,
      added_by: caller.id,
      tab: 'chat',
      fanout_event_key: `member_added:${tripId}:${targetUserId}:${caller.id}`,
    },
  });

  return new Response(
    JSON.stringify({
      success: true,
      userId: targetUserId,
      displayName,
      avatarUrl: profile?.avatar_url ?? null,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
});
