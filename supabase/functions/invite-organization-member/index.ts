import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import {
  validateInput,
  InviteOrganizationMemberSchema,
  sanitizeEmail,
} from '../_shared/validation.ts';
import {
  createSecureResponse,
  createErrorResponse,
  createOptionsResponse,
} from '../_shared/securityHeaders.ts';

serve(async req => {
  const { createOptionsResponse, createErrorResponse, createSecureResponse } =
    await import('../_shared/securityHeaders.ts');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return createOptionsResponse(req);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('No authorization header', 401);
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (userError || !user) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = validateInput(InviteOrganizationMemberSchema, body);

    if (!validation.success) {
      return createErrorResponse(`Validation error: ${validation.error}`, 400);
    }

    const { organizationId, email, role } = validation.data;
    const sanitizedEmail = sanitizeEmail(email);

    console.log('Inviting member:', {
      organizationId,
      email: sanitizedEmail,
      role,
      invitedBy: user.id,
    });

    // Verify user is admin of the organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (
      membershipError ||
      !membership ||
      (membership.role !== 'admin' && membership.role !== 'owner')
    ) {
      throw new Error('Only organization admins can invite members');
    }

    // Generate unique invite token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invite record
    const { data: invite, error: inviteError } = await supabase
      .from('organization_invites')
      .insert({
        organization_id: organizationId,
        email: sanitizedEmail,
        role,
        invited_by: user.id,
        token,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invite:', inviteError);
      throw new Error('Failed to create invitation');
    }

    // Get organization details for email
    const { data: org } = await supabase
      .from('organizations')
      .select('display_name')
      .eq('id', organizationId)
      .single();

    // Build the accept-invite URL from the calling app's origin (falling back to the
    // configured SITE_URL, then the production default) — never a hardcoded preview domain.
    const appOrigin =
      req.headers.get('origin') || Deno.env.get('SITE_URL') || 'https://chravel.app';
    const inviteLink = `${appOrigin}/accept-invite/${token}`;

    console.log('Invite created successfully:', {
      inviteId: invite.id,
      email: sanitizedEmail,
      organizationName: org?.display_name,
      inviteLink,
    });

    // Deliver the invite email (best-effort). Token/link still returned if email fails
    // so admins can share manually — but we no longer silently skip delivery.
    let emailSent = false;
    let emailError: string | null = null;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resendFrom = Deno.env.get('RESEND_FROM_EMAIL') || 'support@chravelapp.com';
    const orgName = org?.display_name || 'an organization';

    if (resendApiKey) {
      try {
        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto;">
            <h2 style="color: #111;">You're invited to ${orgName} on Chravel</h2>
            <p style="color: #333; line-height: 1.5;">
              You've been invited to join <strong>${orgName}</strong> as a <strong>${role}</strong>.
              Click below to accept the invitation (expires in 7 days).
            </p>
            <p style="margin: 28px 0;">
              <a href="${inviteLink}"
                 style="background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">
                Accept invitation
              </a>
            </p>
            <p style="color:#666;font-size:13px;">Or paste this link into your browser:<br/>${inviteLink}</p>
          </div>
        `;
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: resendFrom,
            to: [sanitizedEmail],
            subject: `You're invited to ${orgName} on Chravel`,
            html,
          }),
        });
        if (!response.ok) {
          const body = await response.text();
          emailError = `Resend ${response.status}: ${body.substring(0, 200)}`;
          console.error('[invite-organization-member] email failed:', emailError);
        } else {
          emailSent = true;
        }
      } catch (sendErr) {
        emailError = sendErr instanceof Error ? sendErr.message : 'email send failed';
        console.error('[invite-organization-member] email exception:', emailError);
      }
    } else {
      emailError = 'RESEND_API_KEY not configured';
      console.warn('[invite-organization-member] skipping email — no RESEND_API_KEY');
    }

    return createSecureResponse({
      success: true,
      emailSent,
      emailError,
      invite: {
        id: invite.id,
        token,
        expiresAt: expiresAt.toISOString(),
        inviteLink,
      },
    });
  } catch (error) {
    console.error('Error in invite-organization-member:', error);
    return createErrorResponse(error instanceof Error ? error : new Error('Unknown error'));
  }
});
