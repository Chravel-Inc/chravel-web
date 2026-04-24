type MembershipQueryError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

type MembershipQueryResult = {
  data: { user_id: string } | null;
  error: MembershipQueryError | null;
};

type MembershipQueryBuilder = {
  select(columns: string): MembershipQueryBuilder;
  eq(column: string, value: string): MembershipQueryBuilder;
  or(filter: string): MembershipQueryBuilder;
  maybeSingle(): Promise<MembershipQueryResult>;
};

type MembershipCapableSupabaseClient = {
  from(table: 'trip_members'): MembershipQueryBuilder;
};

export function isTripMemberActiveStatus(status: string | null | undefined): boolean {
  return status == null || status === 'active';
}

function isMissingStatusColumnError(error: MembershipQueryError | null): boolean {
  if (!error) return false;

  const combined = [error.message, error.details, error.hint].filter(Boolean).join(' ').toLowerCase();
  return combined.includes('status') && combined.includes('column');
}

async function queryTripMembership(
  supabase: MembershipCapableSupabaseClient,
  tripId: string,
  userId: string,
  requireActiveStatus: boolean,
): Promise<MembershipQueryResult> {
  const query = supabase.from('trip_members').select('user_id').eq('trip_id', tripId).eq('user_id', userId);

  if (requireActiveStatus) {
    return query.or('status.is.null,status.eq.active').maybeSingle();
  }

  return query.maybeSingle();
}

export async function hasActiveTripMembership(
  supabase: MembershipCapableSupabaseClient,
  tripId: string,
  userId: string,
): Promise<boolean> {
  const membershipResult = await queryTripMembership(supabase, tripId, userId, true);

  if (membershipResult.data) {
    return true;
  }

  if (!isMissingStatusColumnError(membershipResult.error)) {
    return false;
  }

  const legacyMembershipResult = await queryTripMembership(supabase, tripId, userId, false);
  return !!legacyMembershipResult.data && !legacyMembershipResult.error;
}
