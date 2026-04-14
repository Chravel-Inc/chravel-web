export const USER_ENTITLEMENT_CONFLICT_TARGET = 'user_id,purchase_type';

export type EntitlementKeyRow = {
  user_id: string;
  purchase_type: 'subscription' | 'pass';
  plan: string;
};

/**
 * Test helper that models Postgres upsert semantics on (user_id, purchase_type).
 */
export const applyEntitlementUpserts = (rows: EntitlementKeyRow[]): EntitlementKeyRow[] => {
  const byKey = new Map<string, EntitlementKeyRow>();
  for (const row of rows) {
    byKey.set(`${row.user_id}:${row.purchase_type}`, row);
  }
  return [...byKey.values()];
};
