import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useDemoMode } from '@/hooks/useDemoMode';
import { extractInviteCodeFromLink, isDemoInviteCode } from '@/lib/inviteLinkUtils';
import { buildInviteLink } from '@/lib/unfurlConfig';
import { syncTripMemberToStreamAndEmitMemberJoined } from '@/lib/streamTripMemberInlineActivity';
import { parseFunctionsInvokeError } from '@/lib/parseFunctionsError';

interface UseInviteLinkProps {
  isOpen: boolean;
  tripName: string;
  expireIn7Days: boolean;
  /** Maximum number of joins for the invite. null/undefined = unlimited. */
  maxUses?: number | null;
  tripId?: string;
  proTripId?: string;
}

interface InviteLinkResult {
  copied: boolean;
  inviteLink: string;
  loading: boolean;
  isDemoMode: boolean;
  error: string | null;
  expiresAt: string | null;
  memberLimit: number | null;
  memberCount: number | null;
  regenerateInviteToken: () => Promise<void>;
  retryGenerate: () => Promise<void>;
  resendInvite: (recipientEmail?: string, recipientPhone?: string) => Promise<boolean>;
  addExistingMember: (contact: { email?: string; phone?: string }) => Promise<boolean>;
  handleCopyLink: () => Promise<void>;
  handleShare: () => Promise<void>;
  handleEmailInvite: () => void;
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isRealTripId = (tripIdValue: string): boolean => UUID_REGEX.test(tripIdValue);

// Generate a short branded invite code (e.g., "chravel7x9k2m")
// Uses crypto.getRandomValues() for cryptographically secure randomness
const generateBrandedCode = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const codeLength = 8;
  const charsetLength = chars.length;
  const maxUnbiased = Math.floor(256 / charsetLength) * charsetLength; // 252 for 36 chars

  let randomPart = '';
  const buffer = new Uint8Array(codeLength * 2); // extra space to reduce refills

  while (randomPart.length < codeLength) {
    crypto.getRandomValues(buffer);

    for (let i = 0; i < buffer.length && randomPart.length < codeLength; i++) {
      const byte = buffer[i];
      if (byte >= maxUnbiased) {
        continue; // reject to avoid modulo bias
      }
      const index = byte % charsetLength;
      randomPart += chars.charAt(index);
    }
  }

  return `chravel${randomPart}`;
};

// Check if a code already exists in the database using secure function
// This prevents enumeration attacks by only returning boolean, not table data
const checkCodeExists = async (code: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('check_invite_code_exists', {
      code_param: code,
    });

    if (error) {
      if (import.meta.env.DEV) console.error('[InviteLink] Error checking code existence:', error);
      // On error, assume code might exist to be safe (will retry with new code)
      return true;
    }

    return data === true;
  } catch (error) {
    if (import.meta.env.DEV) console.error('[InviteLink] Exception checking code:', error);
    return true; // Assume exists on error to prevent collision
  }
};

// Generate a unique branded code with collision detection
const generateUniqueCode = async (maxAttempts = 5): Promise<string> => {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateBrandedCode();
    const exists = await checkCodeExists(code);
    if (!exists) {
      return code;
    }
  }
  // Fallback to UUID if we can't generate a unique short code
  return crypto.randomUUID();
};

export const useInviteLink = ({
  isOpen,
  tripName,
  expireIn7Days,
  maxUses,
  tripId,
  proTripId,
}: UseInviteLinkProps): InviteLinkResult => {
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [memberLimit, setMemberLimit] = useState<number | null>(null);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const { isDemoMode } = useDemoMode();

  const refreshCapacity = useCallback(async (tripIdValue: string) => {
    if (!isRealTripId(tripIdValue)) {
      setMemberLimit(null);
      setMemberCount(null);
      return;
    }
    const [{ data: limit }, { data: tripRow }] = await Promise.all([
      supabase.rpc('get_trip_member_limit', { p_trip_id: tripIdValue }),
      supabase.from('trips').select('member_count').eq('id', tripIdValue).maybeSingle(),
    ]);
    setMemberLimit(typeof limit === 'number' ? limit : null);
    setMemberCount(typeof tripRow?.member_count === 'number' ? tripRow.member_count : null);
  }, []);

  // Generate invite link when modal opens
  useEffect(() => {
    if (isOpen) {
      generateTripLink();
      const actualTripId = proTripId || tripId;
      if (actualTripId) void refreshCapacity(actualTripId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- generateTripLink closure deps already covered by dep array
  }, [isOpen, expireIn7Days, maxUses, tripId, proTripId, isDemoMode, refreshCapacity]);

  const createInviteInDatabase = async (
    tripIdValue: string,
    inviteCode: string,
  ): Promise<boolean> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (import.meta.env.DEV) console.error('[InviteLink] User not authenticated');
        toast.error('Please log in to create invite links');
        return false;
      }

      // Verify trip exists and get trip type for permission branching
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('id, created_by, trip_type')
        .eq('id', tripIdValue)
        .single();

      if (tripError || !trip) {
        if (import.meta.env.DEV) console.error('[InviteLink] Trip not found:', tripError);
        toast.error('Trip not found in database. Make sure this is a real trip, not a demo trip.');
        return false;
      }

      // Normalize trip type: NULL or undefined = 'consumer' (legacy trips)
      const tripType = trip.trip_type || 'consumer';

      // Permission check branches by trip type
      if (tripType === 'consumer') {
        // Consumer trips: Any trip member can create invites
        if (trip.created_by !== user.id) {
          const { data: member } = await supabase
            .from('trip_members')
            .select('id')
            .eq('trip_id', tripIdValue)
            .eq('user_id', user.id)
            .maybeSingle();

          if (!member) {
            if (import.meta.env.DEV) console.error('[InviteLink] User is not a trip member');
            toast.error('Only trip members can create invite links');
            return false;
          }
        }
      } else {
        // Pro/Event trips: Only creator or admins can create invites
        if (trip.created_by !== user.id) {
          const { data: admin } = await supabase
            .from('trip_admins')
            .select('id')
            .eq('trip_id', tripIdValue)
            .eq('user_id', user.id)
            .maybeSingle();

          if (!admin) {
            if (import.meta.env.DEV)
              console.error('[InviteLink] User not authorized for pro/event trip');
            toast.error('Only trip admins can create invite links for this trip');
            return false;
          }
        }
      }

      // Only persist max_uses when a valid positive limit is set; omit the
      // column entirely when the limit is off so the invite stays unlimited.
      const normalizedMaxUses: number | null =
        typeof maxUses === 'number' && Number.isInteger(maxUses) && maxUses > 0 ? maxUses : null;

      const inviteData = {
        trip_id: tripIdValue,
        code: inviteCode,
        created_by: user.id,
        is_active: true,
        current_uses: 0,
        // Backend join policy is approval-only. Persist that canonical behavior even if
        // legacy UI state still surfaces a toggle.
        require_approval: true,
        expires_at: expireIn7Days
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          : null,
        ...(normalizedMaxUses !== null ? { max_uses: normalizedMaxUses } : {}),
      };

      const { error } = await supabase.from('trip_invites').insert([inviteData]);

      if (error) {
        if (import.meta.env.DEV) console.error('[InviteLink] Database insert error:', error);
        if (error.code === '42501' || error.message?.includes('RLS')) {
          toast.error(
            'Permission denied. You may not have access to create invites for this trip.',
          );
        } else {
          toast.error('Failed to create invite link. Please try again.');
        }
        return false;
      }

      if (import.meta.env.DEV)
        console.log('[InviteLink] Invite created successfully:', inviteCode.substring(0, 8));
      return true;
    } catch (error) {
      if (import.meta.env.DEV) console.error('[InviteLink] Unexpected error:', error);
      toast.error('An unexpected error occurred. Please try again.');
      return false;
    }
  };

  const generateTripLink = async () => {
    setLoading(true);
    setError(null);
    const actualTripId = proTripId || tripId;

    if (!actualTripId) {
      const msg = 'No trip ID provided';
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    // DEMO MODE: Generate demonstration links only for non-production demo trip IDs.
    // A signed-in user can still have the demo flag in localStorage after viewing
    // the app preview; UUID trips must always create DB-backed invites.
    // Use branded unfurl domain for rich OG previews
    if (isDemoMode && !isRealTripId(actualTripId)) {
      const demoInviteCode = `demo-${actualTripId}-${Date.now().toString(36)}`;
      setInviteLink(buildInviteLink(demoInviteCode));
      setExpiresAt(null);
      setLoading(false);
      toast.success('Demo invite link created!');
      return;
    }

    // AUTHENTICATED MODE: Validate and create real invite

    // Check if trip ID is a valid UUID (real trips have UUIDs, demo trips have mock IDs)
    if (!isRealTripId(actualTripId)) {
      if (import.meta.env.DEV)
        console.error('[InviteLink] Invalid trip ID format (not UUID):', actualTripId);
      const msg =
        'This appears to be a demo trip. Create a real trip to generate shareable invite links.';
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const msg = 'Please log in to create invite links';
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    // Generate a unique branded invite code (e.g., "chravel7x9k2m")
    const inviteCode = await generateUniqueCode();
    const created = await createInviteInDatabase(actualTripId, inviteCode);

    if (!created) {
      setError('Failed to create invite link. Please try again.');
      setLoading(false);
      return;
    }

    // Track expiry date for display
    const computedExpiresAt = expireIn7Days
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : null;
    setExpiresAt(computedExpiresAt);

    // Use branded unfurl domain for rich OG previews
    setInviteLink(buildInviteLink(inviteCode));
    setLoading(false);
    toast.success('Invite link created!');
  };

  const regenerateInviteToken = async () => {
    // Deactivate old invite if it exists (only for real invites)
    if (inviteLink && !isDemoMode) {
      try {
        const oldCode = extractInviteCodeFromLink(inviteLink);
        if (oldCode && !isDemoInviteCode(oldCode)) {
          await supabase.from('trip_invites').update({ is_active: false }).eq('code', oldCode);
        } else if (inviteLink && !oldCode) {
          if (import.meta.env.DEV)
            console.warn(
              '[InviteLink] Could not extract code from invite link for deactivation:',
              inviteLink.substring(0, 50),
            );
        }
      } catch (error) {
        if (import.meta.env.DEV)
          console.error('[InviteLink] Error deactivating old invite:', error);
      }
    }

    // Generate new invite link
    await generateTripLink();
  };

  const openMailtoInvite = (recipientEmail: string): void => {
    const subject = encodeURIComponent(`Join my trip: ${tripName}`);
    const body = encodeURIComponent(
      `Hi there!\n\nYou're invited to join my trip "${tripName}"!\n\n` +
        `Click here to join: ${inviteLink}\n\n` +
        `If you have ChravelApp installed, this link will open it directly. ` +
        `Otherwise, you can join through your browser!\n\nSee you there!`,
    );
    window.open(`mailto:${recipientEmail}?subject=${subject}&body=${body}`);
  };

  const resendInvite = async (
    recipientEmail?: string,
    recipientPhone?: string,
  ): Promise<boolean> => {
    if (!inviteLink) {
      toast.error('No invite link available. Please generate one first.');
      return false;
    }

    setLoading(true);
    try {
      if (recipientEmail) {
        // Prefer existing Resend path (send-email-with-retry). No new vendor signup.
        const html = `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;">
            <h2 style="color:#111;">You're invited to ${tripName} on Chravel</h2>
            <p style="color:#333;line-height:1.5;">
              Join the trip <strong>${tripName}</strong> using the link below.
            </p>
            <p style="margin:28px 0;">
              <a href="${inviteLink}"
                 style="background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">
                Open invite
              </a>
            </p>
            <p style="color:#666;font-size:13px;">Or paste this link:<br/>${inviteLink}</p>
          </div>
        `;
        const { data, error: sendError } = await supabase.functions.invoke(
          'send-email-with-retry',
          {
            body: {
              to: recipientEmail,
              subject: `You're invited to ${tripName} on Chravel`,
              content: html,
              tripId: proTripId || tripId,
            },
          },
        );

        if (!sendError && data?.success) {
          toast.success(`Invite email sent to ${recipientEmail}`);
          return true;
        }

        if (import.meta.env.DEV) {
          console.warn('[InviteLink] Resend path unavailable, falling back to mailto', sendError);
        }
        openMailtoInvite(recipientEmail);
        toast.success(`Opened email draft for ${recipientEmail}`);
        return true;
      } else if (recipientPhone) {
        const message = encodeURIComponent(
          `You're invited to join my trip "${tripName}"! ${inviteLink} (Opens in ChravelApp if installed)`,
        );
        window.open(`sms:${recipientPhone}?body=${message}`);
        toast.success(`Opened text draft for ${recipientPhone}`);
        return true;
      } else {
        toast.error('Please provide an email or phone number');
        return false;
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('[InviteLink] Error resending invite:', error);
      if (recipientEmail) {
        openMailtoInvite(recipientEmail);
        toast.success(`Opened email draft for ${recipientEmail}`);
        return true;
      }
      toast.error('Failed to resend invite. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addExistingMember = async (contact: {
    email?: string;
    phone?: string;
  }): Promise<boolean> => {
    const actualTripId = proTripId || tripId;
    if (!actualTripId || !isRealTripId(actualTripId)) {
      toast.error('Open a real trip to add members by email or phone.');
      return false;
    }
    if (isDemoMode && !isRealTripId(actualTripId)) {
      toast.error('Demo mode cannot add live members.');
      return false;
    }

    setLoading(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'add-trip-member-by-contact',
        {
          body: {
            tripId: actualTripId,
            email: contact.email,
            phone: contact.phone,
          },
        },
      );

      if (invokeError || !data?.success) {
        const parsed = await parseFunctionsInvokeError(invokeError, data);
        toast.error(parsed.message);
        if (parsed.errorCode === 'TRIP_FULL') {
          void refreshCapacity(actualTripId);
        }
        return false;
      }

      const userId = data.userId as string;
      const displayName = (data.displayName as string) || 'Chravel User';

      void syncTripMemberToStreamAndEmitMemberJoined({
        tripId: actualTripId,
        joiningUserId: userId,
        memberDisplayName: displayName,
        syncFailureContext: 'add-trip-member-by-contact',
      }).catch(() => {
        /* Stream sync is best-effort; membership already persisted */
      });

      toast.success(`Added ${displayName} to the trip`);
      void refreshCapacity(actualTripId);
      return true;
    } catch (error) {
      if (import.meta.env.DEV) console.error('[InviteLink] addExistingMember failed:', error);
      toast.error('Could not add that person. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      if (import.meta.env.DEV) console.error('[InviteLink] Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    if (!inviteLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my trip: ${tripName}`,
          text: `You're invited to join my trip "${tripName}"!`,
          url: inviteLink,
        });
      } catch (error) {
        if (import.meta.env.DEV) console.error('[InviteLink] Error sharing:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleEmailInvite = () => {
    if (!inviteLink) return;

    const subject = encodeURIComponent(`Join my trip: ${tripName}`);
    const body = encodeURIComponent(
      `Hi there!\n\nYou're invited to join my trip "${tripName}"!\n\n` +
        `Click here to join: ${inviteLink}\n\n` +
        `If you have ChravelApp installed, this link will open it directly. ` +
        `Otherwise, you can join through your browser!\n\nSee you there!`,
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const retryGenerate = useCallback(async () => {
    setError(null);
    await generateTripLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- generateTripLink uses stable state setters
  }, [isOpen, expireIn7Days, maxUses, tripId, proTripId, isDemoMode]);

  return {
    copied,
    inviteLink,
    loading,
    isDemoMode,
    error,
    expiresAt,
    memberLimit,
    memberCount,
    regenerateInviteToken,
    retryGenerate,
    resendInvite,
    addExistingMember,
    handleCopyLink,
    handleShare,
    handleEmailInvite,
  };
};
