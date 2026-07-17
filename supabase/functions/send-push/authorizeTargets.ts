/**
 * Pure authorization helpers for send-push target resolution.
 * Kept free of Deno/Supabase imports so vitest can cover IDOR edges.
 */

export type PushAuthDecision =
  | { ok: true; targetUserIds: string[] }
  | { ok: false; status: 403; error: string };

/**
 * When tripId is present, targets must be active trip members only.
 * Client-supplied userIds are intersected with the trip roster (never trusted alone).
 */
export function authorizeTripPushTargets(params: {
  callerUserId: string;
  callerIsActiveMember: boolean;
  tripMemberUserIds: string[];
  requestedUserIds?: string[];
  excludeUserId?: string;
}): PushAuthDecision {
  if (!params.callerIsActiveMember) {
    return {
      ok: false,
      status: 403,
      error: 'You must be a trip member to send notifications',
    };
  }

  const tripMemberSet = new Set(params.tripMemberUserIds);
  let targetUserIds =
    params.requestedUserIds && params.requestedUserIds.length > 0
      ? params.requestedUserIds.filter(id => tripMemberSet.has(id))
      : [...tripMemberSet];

  if (params.excludeUserId) {
    targetUserIds = targetUserIds.filter(id => id !== params.excludeUserId);
  }

  return { ok: true, targetUserIds };
}

/**
 * userIds-only path: allow self, or users who share at least one trip with the caller.
 * Rejects arbitrary cross-tenant push spam.
 */
export function authorizeSharedTripPushTargets(params: {
  callerUserId: string;
  requestedUserIds: string[];
  sharedTripUserIds: string[];
  excludeUserId?: string;
}): PushAuthDecision {
  const allowed = new Set<string>([params.callerUserId, ...params.sharedTripUserIds]);
  const unauthorized = params.requestedUserIds.filter(id => !allowed.has(id));

  if (unauthorized.length > 0) {
    return {
      ok: false,
      status: 403,
      error: 'You can only send notifications to yourself or users you share a trip with',
    };
  }

  let targetUserIds = [...params.requestedUserIds];
  if (params.excludeUserId) {
    targetUserIds = targetUserIds.filter(id => id !== params.excludeUserId);
  }

  return { ok: true, targetUserIds };
}
