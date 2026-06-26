export interface DirectPushAuthorizationInput {
  callerId: string;
  requestedUserIds: string[];
  callerTripIds: string[];
  sharedUserIds: string[];
}

export interface DirectPushAuthorizationResult {
  authorizedUserIds: string[];
  unauthorizedUserIds: string[];
}

export function authorizeDirectPushUserIds({
  callerId,
  requestedUserIds,
  callerTripIds,
  sharedUserIds,
}: DirectPushAuthorizationInput): DirectPushAuthorizationResult {
  const authorizedUserIds = Array.from(new Set(requestedUserIds));
  const nonSelfTargets = authorizedUserIds.filter(userId => userId !== callerId);

  if (nonSelfTargets.length === 0) {
    return { authorizedUserIds, unauthorizedUserIds: [] };
  }

  if (callerTripIds.length === 0) {
    return { authorizedUserIds, unauthorizedUserIds: nonSelfTargets };
  }

  const sharedUserIdSet = new Set(sharedUserIds);
  const unauthorizedUserIds = nonSelfTargets.filter(userId => !sharedUserIdSet.has(userId));

  return { authorizedUserIds, unauthorizedUserIds };
}
