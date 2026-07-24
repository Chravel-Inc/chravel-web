import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { validateInput, AcceptInviteSchema } from '../_shared/validation.ts';
import {
  createSecureResponse,
  createErrorResponse,
  createOptionsResponse,
} from '../_shared/securityHeaders.ts';
import { redactSensitiveToken } from '../_shared/security.ts';

serve(async req => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return createOptionsResponse(req);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('No authorization header', 401);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = validateInput(AcceptInviteSchema, body);

    if (!validation.success) {
      return createErrorResponse(`Validation error: ${validation.error}`, 400);
    }

    const { token } = validation.data;

    console.log('Accepting invite with token:', redactSensitiveToken(token));

    const { data: acceptanceResult, error: acceptError } = await supabase.rpc(
      'accept_organization_invite_secure',
      {
        p_token: token,
      },
    );

    if (acceptError) {
      console.error('Error accepting organization invite:', acceptError);
      throw new Error(acceptError.message || 'Failed to accept invitation');
    }

    console.log('Invite accepted successfully');

    return createSecureResponse({
      success: true,
      organizationId: acceptanceResult?.organization_id,
      seatId: acceptanceResult?.seat_id,
      alreadyMember: Boolean(acceptanceResult?.already_member),
    });
  } catch (error) {
    console.error('Error in accept-organization-invite:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return createErrorResponse(errorMessage);
  }
});
