export interface TripAccessGuardResult {
  allowed: boolean;
  error?: string;
  status?: number;
}

/**
 * Shared trip-scoped access guard for concierge tool execution.
 * Keeps text + voice/tool bridge aligned on the same membership/privacy rules.
 */
export async function verifyConciergeTripAccess(
  supabase: any,
  tripId: string,
  userId: string,
): Promise<TripAccessGuardResult> {
  if (!tripId || !userId) {
    return { allowed: false, error: 'tripId and userId are required', status: 400 };
  }

  const { data: membership, error: membershipError } = await supabase
    .from('trip_members')
    .select('user_id')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .maybeSingle();

  if (membershipError || !membership) {
    return {
      allowed: false,
      error: 'Forbidden - you must be a member of this trip',
      status: 403,
    };
  }

  const { data: privacyConfig } = await supabase
    .from('trip_privacy_configs')
    .select('ai_access_enabled')
    .eq('trip_id', tripId)
    .maybeSingle();

  if (privacyConfig?.ai_access_enabled === false) {
    return {
      allowed: false,
      error: 'AI Concierge is disabled for this trip',
      status: 403,
    };
  }

  return { allowed: true };
}
