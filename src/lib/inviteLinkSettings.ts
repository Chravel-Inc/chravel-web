export type AppliedInviteSettings = {
  requireApproval: boolean;
  expireIn7Days: boolean;
  maxUses: number | null;
};

export function normalizeInviteMaxUses(maxUses?: number | null): number | null {
  return typeof maxUses === 'number' && Number.isInteger(maxUses) && maxUses > 0 ? maxUses : null;
}

export function buildAppliedInviteSettings(
  requireApproval: boolean,
  expireIn7Days: boolean,
  maxUses?: number | null,
): AppliedInviteSettings {
  return {
    requireApproval,
    expireIn7Days,
    maxUses: normalizeInviteMaxUses(maxUses),
  };
}

export function areInviteSettingsEqual(
  applied: AppliedInviteSettings | null,
  current: AppliedInviteSettings,
): boolean {
  if (!applied) return false;
  return (
    applied.requireApproval === current.requireApproval &&
    applied.expireIn7Days === current.expireIn7Days &&
    applied.maxUses === current.maxUses
  );
}
