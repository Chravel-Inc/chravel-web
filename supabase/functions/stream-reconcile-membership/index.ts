import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { StreamChat } from 'npm:stream-chat';
import { getCorsHeaders } from '../_shared/cors.ts';
import { verifyCronAuth } from '../_shared/cronGuard.ts';
import { requireSecrets, createMissingSecretResponse } from '../_shared/validateSecrets.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CHANNEL_TYPES = ['chravel-trip', 'chravel-broadcast'] as const;

type ChannelType = (typeof CHANNEL_TYPES)[number];

type ReasonCode =
  | 'invalid_http_method'
  | 'authentication_required'
  | 'authentication_invalid'
  | 'trip_id_missing'
  | 'trip_membership_required'
  | 'trip_membership_check_failed'
  | 'reconcile_completed'
  | 'reconcile_failed';

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
  code: string,
  reasonCode: ReasonCode,
  reason: string,
) {
  return jsonResponse({ success: false, code, reasonCode, reason }, status, corsHeaders);
}

function getChannelId(channelType: ChannelType, tripId: string) {
  return channelType === 'chravel-trip' ? `trip-${tripId}` : `broadcast-${tripId}`;
}

async function reconcileChannelMembership(params: {
  stream: StreamChat;
  channelType: ChannelType;
  tripId: string;
  expectedUserIds: string[];
}) {
  const { stream, channelType, tripId, expectedUserIds } = params;
  const channelId = getChannelId(channelType, tripId);
  const channel = stream.channel(channelType, channelId, { trip_id: tripId });
  await channel.create();

  const streamMembersResponse = await channel.queryMembers(
    {},
    { created_at: 1 },
    {
      limit: Math.max(expectedUserIds.length + 10, 50),
    },
  );

  const streamMembers = new Set(
    (streamMembersResponse.members || [])
      .map(member => member.user_id || member.user?.id)
      .filter((userId): userId is string => typeof userId === 'string' && userId.length > 0),
  );

  const missingMembers = expectedUserIds.filter(userId => !streamMembers.has(userId));
  if (missingMembers.length > 0) {
    await channel.addMembers(missingMembers);
  }

  return {
    channelType,
    channelId,
    expectedCount: expectedUserIds.length,
    missingBeforeRepair: missingMembers.length,
    repairedCount: missingMembers.length,
  };
}

serve(async req => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
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
    const stream = StreamChat.getInstance(secrets['STREAM_API_KEY'], secrets['STREAM_API_SECRET']);

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let scopedTripId: string | null = null;

    if (req.method === 'GET') {
      const guard = verifyCronAuth(req, corsHeaders);
      if (!guard.authorized) return guard.response!;
      const url = new URL(req.url);
      scopedTripId = url.searchParams.get('tripId');
    } else {
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

      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const {
        data: { user },
        error: authError,
      } = await userClient.auth.getUser(authHeader.replace('Bearer ', ''));

      if (authError || !user) {
        return errorResponse(
          corsHeaders,
          401,
          'auth_invalid',
          'authentication_invalid',
          'Invalid authentication',
        );
      }

      const body = await req.json().catch(() => ({}));
      scopedTripId = typeof body?.tripId === 'string' ? body.tripId.trim() : '';
      if (!scopedTripId) {
        return errorResponse(
          corsHeaders,
          400,
          'invalid_trip_id',
          'trip_id_missing',
          'tripId is required',
        );
      }

      const { data: membership, error: membershipError } = await adminClient
        .from('trip_members')
        .select('trip_id')
        .eq('trip_id', scopedTripId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (membershipError) {
        return errorResponse(
          corsHeaders,
          500,
          'membership_verification_failed',
          'trip_membership_check_failed',
          'Failed to verify trip membership',
        );
      }
      if (!membership) {
        return errorResponse(
          corsHeaders,
          403,
          'membership_required',
          'trip_membership_required',
          'User is not a trip member',
        );
      }
    }

    const tripIds =
      scopedTripId && scopedTripId.length > 0
        ? [scopedTripId]
        : ((await adminClient.from('trip_members').select('trip_id').limit(5000)).data?.reduce<
            string[]
          >((acc, row) => {
            if (typeof row.trip_id === 'string' && !acc.includes(row.trip_id)) {
              acc.push(row.trip_id);
            }
            return acc;
          }, []) ?? []);

    const results: Array<Record<string, unknown>> = [];
    let repairedTotal = 0;

    for (const tripId of tripIds) {
      const { data: members, error: membersError } = await adminClient
        .from('trip_members')
        .select('user_id')
        .eq('trip_id', tripId);

      if (membersError) {
        throw new Error(`Failed to load trip members for ${tripId}`);
      }

      const expectedUserIds = (members || [])
        .map(row => row.user_id)
        .filter((userId): userId is string => typeof userId === 'string' && userId.length > 0);

      const tripChannelResults = [];
      for (const channelType of CHANNEL_TYPES) {
        const channelResult = await reconcileChannelMembership({
          stream,
          channelType,
          tripId,
          expectedUserIds,
        });
        repairedTotal += channelResult.repairedCount;
        tripChannelResults.push(channelResult);
      }

      results.push({
        tripId,
        expectedMemberCount: expectedUserIds.length,
        channels: tripChannelResults,
      });
    }

    return jsonResponse(
      {
        success: true,
        code: 'ok',
        reasonCode: 'reconcile_completed',
        reconciledTrips: tripIds.length,
        repairedMembersTotal: repairedTotal,
        results,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing required secret')) {
      return createMissingSecretResponse(error, corsHeaders);
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(corsHeaders, 500, 'stream_reconcile_failed', 'reconcile_failed', message);
  }
});
