import {
  hasEffectiveAccess,
  pickPrimaryEntitlement,
  type EntitlementRow,
} from '../_shared/entitlementSelection.ts';

export const ENTITLEMENT_STALE_WINDOW_MS = 6 * 60 * 60 * 1000;

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'expired'
  | 'inactive';

export type NormalizedSubscriptionResponse = {
  subscribed: boolean;
  tier: string;
  product_id: string | null;
  subscription_end: string | null;
  purchase_type: 'subscription' | 'pass' | null;
  status: SubscriptionStatus | null;
  current_period_end: string | null;
};

export const normalizeFromEntitlement = (
  row: EntitlementRow | null,
): NormalizedSubscriptionResponse => {
  if (!row) {
    return {
      subscribed: false,
      tier: 'free',
      product_id: null,
      subscription_end: null,
      purchase_type: null,
      status: null,
      current_period_end: null,
    };
  }

  const status = row.status as SubscriptionStatus;
  const currentPeriodEnd = row.current_period_end;
  const effectiveAccess = hasEffectiveAccess(row.status, currentPeriodEnd);

  return {
    subscribed: effectiveAccess && row.plan !== 'free',
    tier: effectiveAccess ? row.plan : 'free',
    product_id: null,
    subscription_end: currentPeriodEnd,
    purchase_type: row.purchase_type,
    status,
    current_period_end: currentPeriodEnd,
  };
};

export const shouldReconcileFromStripe = (
  rows: EntitlementRow[] | null | undefined,
  now: Date,
): { shouldReconcile: boolean; primary: EntitlementRow | null } => {
  const primary = pickPrimaryEntitlement(rows ?? []);
  if (!primary) return { shouldReconcile: true, primary: null };

  if (hasEffectiveAccess(primary.status, primary.current_period_end)) {
    return { shouldReconcile: false, primary };
  }

  if (primary.purchase_type !== 'subscription') {
    return { shouldReconcile: false, primary };
  }

  const updatedAtMs = Date.parse(primary.updated_at);
  const isStale =
    Number.isNaN(updatedAtMs) || now.getTime() - updatedAtMs > ENTITLEMENT_STALE_WINDOW_MS;

  return { shouldReconcile: isStale, primary };
};

export const normalizeStripeStatus = (status: string): SubscriptionStatus => {
  if (status === 'active') return 'active';
  if (status === 'trialing') return 'trialing';
  if (status === 'past_due') return 'past_due';
  if (status === 'canceled') return 'canceled';
  if (status === 'incomplete' || status === 'incomplete_expired' || status === 'unpaid') {
    return 'inactive';
  }
  return 'expired';
};
