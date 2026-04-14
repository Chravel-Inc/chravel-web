export type EntitlementRow = {
  user_id: string;
  plan: string;
  status: string;
  current_period_end: string | null;
  purchase_type: 'subscription' | 'pass';
  updated_at: string;
};

const statusPriority = (status: string): number => {
  if (status === 'active') return 5;
  if (status === 'trialing') return 4;
  if (status === 'past_due') return 3;
  if (status === 'canceled') return 2;
  if (status === 'expired') return 1;
  return 0;
};

export const hasEffectiveAccess = (status: string, periodEnd: string | null): boolean => {
  if (status === 'active' || status === 'trialing' || status === 'past_due') return true;
  if (status === 'canceled' && periodEnd) return new Date(periodEnd) > new Date();
  return false;
};

export const pickPrimaryEntitlement = (rows: EntitlementRow[]): EntitlementRow | null => {
  if (!rows.length) return null;

  const effectiveSubscription = rows.find(
    row =>
      row.purchase_type === 'subscription' &&
      hasEffectiveAccess(row.status, row.current_period_end),
  );
  if (effectiveSubscription) return effectiveSubscription;

  return [...rows].sort((a, b) => {
    const byStatus = statusPriority(b.status) - statusPriority(a.status);
    if (byStatus !== 0) return byStatus;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  })[0];
};

export const mapPrimaryEntitlementsByUser = (
  rows: EntitlementRow[] | null | undefined,
): Map<string, EntitlementRow> => {
  const byUser = new Map<string, EntitlementRow[]>();
  for (const row of rows || []) {
    const list = byUser.get(row.user_id) || [];
    list.push(row);
    byUser.set(row.user_id, list);
  }

  const result = new Map<string, EntitlementRow>();
  for (const [userId, userRows] of byUser.entries()) {
    const picked = pickPrimaryEntitlement(userRows);
    if (picked) result.set(userId, picked);
  }
  return result;
};
