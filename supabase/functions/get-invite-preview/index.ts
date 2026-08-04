import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { getCorsHeaders } from '../_shared/cors.ts';
import {
  checkRateLimit,
  getClientIp,
  readJsonBody,
  redactSensitiveToken,
} from '../_shared/security.ts';
import { resolveOgCoverImageUrl } from '../_shared/ogUtils.ts';

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-INVITE-PREVIEW] ${step}${detailsStr}`);
};

/**
 * Error codes for invite preview failures.
 * These map to the InviteErrorCode type in the frontend.
 */
type InvitePreviewErrorCode =
  | 'INVALID_LINK'
  | 'INVITE_NOT_FOUND'
  | 'INVITE_EXPIRED'
  | 'INVITE_INACTIVE'
  | 'INVITE_MAX_USES'
  | 'TRIP_NOT_FOUND'
  | 'TRIP_ARCHIVED'
  | 'TRIP_FULL'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

const INVITE_PREVIEW_RATE_LIMIT_MAX_REQUESTS = 60;
const INVITE_PREVIEW_RATE_LIMIT_WINDOW_SECONDS = 60;
const MAX_INVITE_CODE_LENGTH = 128;
const MAX_REQUEST_CONTENT_LENGTH_BYTES = 4 * 1024;

/** Sanitized itinerary row for pre-auth invitees (no descriptions / private notes). */
interface InvitePreviewItineraryItem {
  title: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  is_all_day: boolean | null;
}

interface InvitePreviewResponse {
  success: boolean;
  invite?: {
    trip_id: string;
    is_active: boolean;
    expires_at: string | null;
    max_uses: number | null;
    current_uses: number;
    require_approval: boolean;
  };
  trip?: {
    name: string;
    destination: string | null;
    start_date: string | null;
    end_date: string | null;
    cover_image_url: string | null;
    trip_type: string | null;
    member_count: number;
    /** Plan-based seat cap from get_trip_member_limit; null = unlimited. */
    member_limit?: number | null;
    at_capacity?: boolean;
  };
  /** Next upcoming events — read-only preview so invitees see value before signup. */
  itinerary_preview?: InvitePreviewItineraryItem[];
  /** Open polls peek — question + option count only (no vote tallies). */
  polls_preview?: Array<{ question: string; option_count: number }>;
  error?: string;
  error_code?: InvitePreviewErrorCode;
}

serve(async (req): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    logStep('Function started');

    const clientIp = getClientIp(req);

    // Create Supabase client with service role for elevated permissions
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    const rateLimit = await checkRateLimit(
      supabaseClient,
      `invite-preview:${clientIp}`,
      INVITE_PREVIEW_RATE_LIMIT_MAX_REQUESTS,
      INVITE_PREVIEW_RATE_LIMIT_WINDOW_SECONDS,
    );

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many invite preview requests. Please try again in a minute.',
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Get invite code from request body or query params
    let inviteCode: string | null = null;

    if (req.method === 'POST') {
      const requestBody = await readJsonBody<{ code?: string }>(
        req,
        MAX_REQUEST_CONTENT_LENGTH_BYTES,
      );

      if (requestBody.error) {
        const response: InvitePreviewResponse = {
          success: false,
          error: requestBody.error,
          error_code: 'INVALID_LINK',
        };
        return new Response(JSON.stringify(response), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      inviteCode = requestBody.data?.code ?? null;
    } else if (req.method === 'GET') {
      const url = new URL(req.url);
      inviteCode = url.searchParams.get('code');
    }

    const normalizedInviteCode = typeof inviteCode === 'string' ? inviteCode.trim() : '';

    if (!normalizedInviteCode || normalizedInviteCode.length > MAX_INVITE_CODE_LENGTH) {
      logStep('ERROR: No invite code provided');
      const response: InvitePreviewResponse = {
        success: false,
        error: 'This invite link appears to be malformed. Make sure you copied the full URL.',
        error_code: 'INVALID_LINK',
      };
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logStep('Looking up invite', { code: redactSensitiveToken(normalizedInviteCode), clientIp });

    // Fetch invite data
    const { data: invite, error: inviteError } = await supabaseClient
      .from('trip_invites')
      .select('*')
      .eq('code', normalizedInviteCode)
      .single();

    if (inviteError || !invite) {
      logStep('Invite not found', { error: inviteError?.message });
      const response: InvitePreviewResponse = {
        success: false,
        error: 'This invite link is invalid or has been deleted. Ask the host for a new link.',
        error_code: 'INVITE_NOT_FOUND',
      };
      return new Response(JSON.stringify(response), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logStep('Invite found', { tripId: invite.trip_id, isActive: invite.is_active });

    // Validate invite status
    if (!invite.is_active) {
      logStep('Invite is inactive');
      const response: InvitePreviewResponse = {
        success: false,
        error: 'The host has turned off this invite link. Contact them for a new one.',
        error_code: 'INVITE_INACTIVE',
      };
      return new Response(JSON.stringify(response), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      logStep('Invite has expired', { expiresAt: invite.expires_at });
      const response: InvitePreviewResponse = {
        success: false,
        error: 'This invite link has expired. Ask the host for a fresh link.',
        error_code: 'INVITE_EXPIRED',
      };
      return new Response(JSON.stringify(response), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (invite.max_uses && invite.current_uses >= invite.max_uses) {
      logStep('Max uses reached', { currentUses: invite.current_uses, maxUses: invite.max_uses });
      const response: InvitePreviewResponse = {
        success: false,
        error:
          'This invite link has been used the maximum number of times. Ask the host for a new link.',
        error_code: 'INVITE_MAX_USES',
      };
      return new Response(JSON.stringify(response), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Trip row + member count in parallel. Itinerary and open polls are trip-internal content and
    // are fetched separately, for authenticated viewers only (see below).
    const [tripResult, memberCountResult] = await Promise.all([
      supabaseClient
        .from('trips')
        .select(
          'id, name, destination, start_date, end_date, cover_image_url, trip_type, is_archived',
        )
        .eq('id', invite.trip_id)
        .single(),
      supabaseClient
        .from('trip_members')
        .select('*', { count: 'exact', head: true })
        .eq('trip_id', invite.trip_id),
    ]);

    const { data: trip, error: tripError } = tripResult;
    const memberCount = memberCountResult.count;

    if (tripError || !trip) {
      logStep('Trip not found', { error: tripError?.message });
      const response: InvitePreviewResponse = {
        success: false,
        error: 'This trip no longer exists. It may have been deleted by the organizer.',
        error_code: 'TRIP_NOT_FOUND',
      };
      return new Response(JSON.stringify(response), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if trip is archived
    if (trip.is_archived) {
      logStep('Trip is archived', { tripId: trip.id });
      const response: InvitePreviewResponse = {
        success: false,
        error: 'This trip has been archived and is no longer accepting new members.',
        error_code: 'TRIP_ARCHIVED',
      };
      return new Response(JSON.stringify(response), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Plan seat caps are enforced at join/approve; surface them on the preview
    // so invitees see TRIP_FULL before they request. No auth/hydration changes.
    const [{ data: memberLimit }, { data: atCapacity }] = await Promise.all([
      supabaseClient.rpc('get_trip_member_limit', { p_trip_id: trip.id }),
      supabaseClient.rpc('is_trip_at_member_capacity', { p_trip_id: trip.id }),
    ]);

    if (atCapacity === true) {
      logStep('Trip at capacity on preview', { tripId: trip.id, memberCount, memberLimit });
      const fullResponse: InvitePreviewResponse = {
        success: false,
        error:
          'This trip has reached its member limit. Ask the organizer to upgrade their plan or free a seat.',
        error_code: 'TRIP_FULL',
        trip: {
          name: trip.name,
          destination: trip.destination,
          start_date: trip.start_date,
          end_date: trip.end_date,
          cover_image_url: resolveOgCoverImageUrl(trip),
          trip_type: trip.trip_type,
          member_count: memberCount || 0,
          member_limit: typeof memberLimit === 'number' ? memberLimit : null,
          at_capacity: true,
        },
      };
      return new Response(JSON.stringify(fullResponse), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Itinerary and open-poll content is trip-internal. Possessing (or guessing) an invite code is
    // not authorization to read the group's schedule or poll questions, so these are returned only
    // to authenticated callers. The public fields above (name/destination/dates/cover) remain
    // unauthenticated so shared invite links still preview correctly.
    let itineraryPreview: InvitePreviewItineraryItem[] = [];
    let pollsPreview: Array<{ question: string; option_count: number }> = [];

    const previewAuthHeader = req.headers.get('Authorization');
    const previewToken = previewAuthHeader?.startsWith('Bearer ')
      ? previewAuthHeader.slice('Bearer '.length).trim()
      : '';
    let isAuthenticatedViewer = false;
    if (previewToken) {
      const { data: viewer } = await supabaseClient.auth.getUser(previewToken);
      isAuthenticatedViewer = !!viewer?.user;
    }

    if (isAuthenticatedViewer) {
      const [itineraryResult, pollsResult] = await Promise.all([
        supabaseClient
          .from('trip_events')
          .select('title, start_time, end_time, location, is_all_day')
          .eq('trip_id', invite.trip_id)
          .order('start_time', { ascending: true })
          .limit(8),
        supabaseClient
          .from('trip_polls')
          .select('question, options, status')
          .eq('trip_id', invite.trip_id)
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      itineraryPreview = (itineraryResult.data ?? []).map(
        (row: {
          title: string;
          start_time: string;
          end_time: string | null;
          location: string | null;
          is_all_day: boolean | null;
        }) => ({
          title: row.title,
          start_time: row.start_time,
          end_time: row.end_time,
          location: row.location,
          is_all_day: row.is_all_day,
        }),
      );
      pollsPreview = (pollsResult.data ?? []).map(
        (row: { question: string; options: unknown }) => ({
          question: row.question,
          option_count: Array.isArray(row.options) ? row.options.length : 0,
        }),
      );
    }

    logStep('Success', { tripName: trip.name, memberCount, memberLimit, isAuthenticatedViewer });

    const response: InvitePreviewResponse = {
      success: true,
      invite: {
        trip_id: invite.trip_id,
        is_active: invite.is_active,
        expires_at: invite.expires_at,
        max_uses: invite.max_uses,
        current_uses: invite.current_uses,
        require_approval: invite.require_approval || false,
      },
      trip: {
        name: trip.name,
        destination: trip.destination,
        start_date: trip.start_date,
        end_date: trip.end_date,
        cover_image_url: resolveOgCoverImageUrl(trip),
        trip_type: trip.trip_type,
        member_count: memberCount || 0,
        member_limit: typeof memberLimit === 'number' ? memberLimit : null,
        at_capacity: false,
      },
      itinerary_preview: itineraryPreview,
      polls_preview: pollsPreview,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in get-invite-preview', { message: errorMessage });
    const response: InvitePreviewResponse = {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      error_code: 'UNKNOWN_ERROR',
    };
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
