import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import {
  createSecureResponse,
  createErrorResponse,
  createOptionsResponse,
} from '../_shared/securityHeaders.ts';
import { BroadcastCreateSchema, validateInput } from '../_shared/validation.ts';
import { sanitizeErrorForClient, logError } from '../_shared/errorHandling.ts';
import { checkRateLimit } from '../_shared/security.ts';

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return createOptionsResponse(req);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Authentication required', 401);
    }

    // Get user from auth token
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Validate and sanitize input
    const requestBody = await req.json();
    const validation = validateInput(BroadcastCreateSchema, requestBody);

    if (!validation.success) {
      logError('BROADCAST_CREATE_VALIDATION', validation.error, { userId: user.id });
      return createErrorResponse(validation.error, 400);
    }

    const { trip_id, content, location, tag, scheduled_time } = validation.data;

    // Per-user-per-trip broadcast rate limit: 5 per minute (anti-spam)
    const broadcastRlResult = await checkRateLimit(
      supabase,
      `broadcasts-create:${user.id}:${trip_id}`,
      5,
      60,
      user.id,
      'broadcasts-create',
    );
    if (!broadcastRlResult.allowed) {
      return createErrorResponse('Too many broadcasts. Please wait before sending another.', 429);
    }

    // Verify user is a member of the trip
    const { data: membership, error: membershipError } = await supabase
      .from('trip_members')
      .select('role')
      .eq('trip_id', trip_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (membershipError || !membership) {
      throw new Error('User is not a member of this trip');
    }

    // Trip-type broadcast policy (mirrors the client gate in TripChat):
    // consumer trips are open to any active member; pro/event trips gate
    // broadcasts to admins/organizers/owners, the trip creator, or a
    // trip_admins row. This endpoint runs with the service role, so the
    // check must live here — RLS is bypassed. NOTE: no first-party client
    // calls this function today (UI broadcasts go through Stream; the
    // concierge inserts into `broadcasts` with the caller's JWT), but it is
    // deployed and callable, so it must enforce the same policy.
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('trip_type, created_by')
      .eq('id', trip_id)
      .single();

    if (tripError || !trip) {
      return createErrorResponse('Trip not found', 404);
    }

    const tripType = trip.trip_type ?? 'consumer';
    if (tripType === 'pro' || tripType === 'event') {
      const elevatedRole = ['admin', 'organizer', 'owner'].includes(membership.role ?? '');
      const isCreator = trip.created_by === user.id;
      let isTripAdmin = false;
      if (!elevatedRole && !isCreator) {
        const { data: adminRow } = await supabase
          .from('trip_admins')
          .select('id')
          .eq('trip_id', trip_id)
          .eq('user_id', user.id)
          .maybeSingle();
        isTripAdmin = !!adminRow;
      }
      if (!elevatedRole && !isCreator && !isTripAdmin) {
        return createErrorResponse('Only trip admins can send broadcasts on this trip', 403);
      }
    }

    // Get user profile for sender info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('user_id', user.id)
      .single();

    const senderName = profile?.display_name || user.email?.split('@')[0] || 'Unknown User';
    const senderAvatar = profile?.avatar_url || '';

    // Create broadcast in database
    const { data: broadcast, error: broadcastError } = await supabase
      .from('broadcasts')
      .insert({
        trip_id,
        sender_id: user.id,
        sender_name: senderName,
        sender_avatar: senderAvatar,
        content,
        location: location || null,
        tag: tag || 'chill',
        scheduled_time: scheduled_time ? new Date(scheduled_time).toISOString() : null,
      })
      .select()
      .single();

    if (broadcastError) {
      console.error('Error creating broadcast:', broadcastError);
      throw new Error('Failed to create broadcast');
    }

    return createSecureResponse({
      success: true,
      broadcast,
    });
  } catch (error) {
    logError('BROADCAST_CREATE', error);
    return createErrorResponse(sanitizeErrorForClient(error), 500);
  }
});
