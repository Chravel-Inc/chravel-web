import { supabase } from '@/integrations/supabase/client';
import { UNKNOWN_MEMBER_LABEL } from '@/lib/resolveDisplayName';

/**
 * Shared co-member name/avatar lookup.
 *
 * WHY THIS EXISTS
 * `profiles` carries exactly one SELECT policy — `auth.uid() = user_id` — and
 * `profiles_public` is `security_invoker`, so it inherits it. Any surface that
 * reads `profiles` / `profiles_public` to label *other* people therefore gets
 * NULL for every row but the viewer's own, and falls back to a placeholder.
 *
 * Trip rosters avoid this by reading `trip_members.display_name_snapshot`
 * directly. Surfaces that show names OUTSIDE a single roster — task creators,
 * calendar event creators, payment balances, join requests — have no snapshot to
 * read from, so they go through `get_co_member_profiles`: a SECURITY DEFINER
 * function that returns only user_id / display name / avatar, and only for users
 * who share a trip with the caller.
 *
 * Prefer the roster snapshot where one exists; use this for everything else.
 */
export interface CoMemberProfile {
  user_id: string;
  resolved_display_name: string;
  avatar_url: string | null;
}

/**
 * Batch-resolve display names for users the caller shares a trip with.
 *
 * Returns a Map keyed by user_id. Users the caller shares no trip with are
 * absent from the map by design — that gating is enforced server-side.
 */
export async function fetchCoMemberProfiles(
  userIds: readonly string[],
): Promise<Map<string, CoMemberProfile>> {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  if (unique.length === 0) return new Map();

  const { data, error } = await supabase.rpc('get_co_member_profiles', {
    p_user_ids: unique,
  });

  if (error) {
    // Name resolution is presentational — a failure here must not take down the
    // payment/task/calendar view that called it. Callers fall back to their own
    // label when a user is missing from the map.
    if (import.meta.env.DEV) {
      console.error('[fetchCoMemberProfiles] lookup failed:', error.message);
    }
    return new Map();
  }

  const rows = (data ?? []) as CoMemberProfile[];
  return new Map(rows.map(row => [row.user_id, row]));
}

/**
 * Resolve one display name from a map produced by {@link fetchCoMemberProfiles},
 * optionally preferring a snapshot the caller already has.
 *
 * Never returns a membership status such as "Former Member" — a person's name
 * does not change because they left a trip or closed their account.
 */
export function displayNameFor(
  userId: string,
  profiles: Map<string, CoMemberProfile>,
  snapshotName?: string | null,
): string {
  const snapshot = snapshotName?.trim();
  if (snapshot) return snapshot;

  return profiles.get(userId)?.resolved_display_name?.trim() || UNKNOWN_MEMBER_LABEL;
}
