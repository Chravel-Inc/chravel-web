export type MembershipSyncAction = 'add' | 'remove';

const ADMIN_ROLES = new Set(['admin', 'owner', 'organizer']);

export function canActorSyncMembership(params: {
  actorUserId: string;
  actorRole: string | null;
  targetUserId: string;
  action: MembershipSyncAction;
}): boolean {
  const { actorUserId, actorRole, targetUserId, action } = params;

  if (actorUserId === targetUserId) {
    return true;
  }

  if (!actorRole) return false;
  if (!ADMIN_ROLES.has(actorRole)) return false;

  if (action === 'add' || action === 'remove') {
    return true;
  }

  return false;
}
