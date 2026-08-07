import type { PurchaseType } from '@/billing/types';

export type EntitlementSelectorRow = {
  plan: string;
  status: string;
  source: string;
  purchase_type: PurchaseType;
  current_period_end: string | null;
  updated_at: string;
};

export type EffectiveEntitlement = {
  plan: string;
  status: string;
  purchaseType: PurchaseType;
  currentPeriodEnd: string | null;
  hasAccess: boolean;
  source: string;
};

const statusPriority = (status: string): number => {
  if (status === 'active') return 5;
  if (status === 'trialing') return 4;
  if (status === 'past_due') return 3;
  if (status === 'canceled') return 2;
  if (status === 'expired') return 1;
  return 0;
};

/**
 * Does this row currently grant access?
 *
 * `purchaseType` matters because passes and subscriptions expire differently. A subscription's
 * period end rolls forward on every renewal, so a stored date in the past usually means a RENEWAL
 * webhook is merely late — locking out a paying subscriber over webhook latency would be worse
 * than a few minutes of grace. A **pass** has one fixed, non-renewing window: once its end date
 * passes there is no legitimate way for it to still be valid, and treating `status='active'` as
 * sufficient meant a pass kept working until an EXPIRATION event arrived to revoke it. If that
 * event was dropped, delayed, or never configured to fire at all, the pass simply never ended.
 *
 * So passes are evaluated against their own end date, and only when we actually have one. A null
 * end date still grants access — the write paths guarantee passes get a computed expiry, and
 * failing closed here would lock out someone who genuinely paid.
 */
export const hasEffectiveAccess = (
  status: string,
  periodEnd: string | null,
  purchaseType?: PurchaseType,
): boolean => {
  if (purchaseType === 'pass' && periodEnd && new Date(periodEnd) <= new Date()) return false;
  if (status === 'active' || status === 'trialing' || status === 'past_due') return true;
  if (status === 'canceled' && periodEnd) return new Date(periodEnd) > new Date();
  return false;
};

/**
 * Priority rules:
 * 1) Prefer active/trialing/past_due/canceled-subscription over pass/free for feature gating.
 * 2) Fall back to best available row by status recency when no effective subscription exists.
 */
export const pickPrimaryEntitlement = (
  rows: EntitlementSelectorRow[] | null | undefined,
): EntitlementSelectorRow | null => {
  if (!rows || rows.length === 0) return null;

  const subscriptionRows = rows.filter(row => row.purchase_type === 'subscription');
  const effectiveSubscription = subscriptionRows.find(row =>
    hasEffectiveAccess(row.status, row.current_period_end, row.purchase_type),
  );
  if (effectiveSubscription) return effectiveSubscription;

  return [...rows].sort((a, b) => {
    const byStatus = statusPriority(b.status) - statusPriority(a.status);
    if (byStatus !== 0) return byStatus;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  })[0];
};

export const resolveEffectiveEntitlement = (
  rows: EntitlementSelectorRow[] | null | undefined,
): EffectiveEntitlement | null => {
  const primary = pickPrimaryEntitlement(rows);
  if (!primary) return null;

  return {
    plan: primary.plan,
    status: primary.status,
    purchaseType: primary.purchase_type,
    currentPeriodEnd: primary.current_period_end,
    hasAccess: hasEffectiveAccess(
      primary.status,
      primary.current_period_end,
      primary.purchase_type,
    ),
    source: primary.source,
  };
};
