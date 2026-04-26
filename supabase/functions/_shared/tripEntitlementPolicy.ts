export type EffectiveTripPlan =
  | 'free'
  | 'explorer'
  | 'frequent-chraveler'
  | 'pro-starter'
  | 'pro-growth'
  | 'pro-enterprise';

export type EntitlementStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';
export type TripType = 'consumer' | 'pro' | 'event';

export type PlanResolutionInput = {
  entitlement: {
    plan: string | null;
    status: string | null;
    current_period_end: string | null;
  } | null;
  legacyProfile: {
    subscription_status: string | null;
    subscription_product_id: string | null;
  } | null;
};

export type EntitlementRow = {
  plan: string | null;
  status: string | null;
  current_period_end: string | null;
  purchase_type: string | null;
  updated_at: string | null;
};

export type TripCreationCounts = {
  consumerActiveCount: number;
  freeProTripsUsed: number;
  freeEventsUsed: number;
  freeProTripLimit: number;
  freeEventLimit: number;
};

export type TripCreationDecision = {
  allowed: boolean;
  errorCode?:
    | 'TRIP_LIMIT_REACHED'
    | 'UPGRADE_REQUIRED_PRO_TRIP'
    | 'UPGRADE_REQUIRED_EVENT'
    | 'EXPLORER_PRO_TRIP_REQUIRES_EXPLICIT_OVERRIDE';
};

const PAID_TIERS = new Set<EffectiveTripPlan>([
  'explorer',
  'frequent-chraveler',
  'pro-starter',
  'pro-growth',
  'pro-enterprise',
]);

export const normalizePlan = (rawPlan: string | null | undefined): EffectiveTripPlan => {
  if (
    rawPlan === 'explorer' ||
    rawPlan === 'frequent-chraveler' ||
    rawPlan === 'pro-starter' ||
    rawPlan === 'pro-growth' ||
    rawPlan === 'pro-enterprise'
  ) {
    return rawPlan;
  }

  return 'free';
};

export const hasEffectiveAccess = (
  status: EntitlementStatus,
  currentPeriodEnd: string | null,
): boolean => {
  if (status === 'active' || status === 'trialing' || status === 'past_due') return true;
  if (status === 'canceled' && currentPeriodEnd) {
    return new Date(currentPeriodEnd) > new Date();
  }
  return false;
};

const statusPriority = (status: string | null | undefined): number => {
  if (status === 'active') return 5;
  if (status === 'trialing') return 4;
  if (status === 'past_due') return 3;
  if (status === 'canceled') return 2;
  if (status === 'expired') return 1;
  return 0;
};

/**
 * Keep edge entitlement row selection consistent with client selectors.
 * 1) Prefer any subscription row with effective access.
 * 2) Otherwise pick best status, then most recently updated.
 */
export const pickPrimaryEntitlementRow = (
  rows: EntitlementRow[] | null | undefined,
): EntitlementRow | null => {
  if (!rows || rows.length === 0) return null;

  const subscriptionRows = rows.filter(row => row.purchase_type === 'subscription');
  const effectiveSubscription = subscriptionRows.find(row =>
    hasEffectiveAccess(
      ((row.status as EntitlementStatus | null) ?? 'expired') as EntitlementStatus,
      row.current_period_end,
    ),
  );
  if (effectiveSubscription) return effectiveSubscription;

  return [...rows].sort((a, b) => {
    const byStatus = statusPriority(b.status) - statusPriority(a.status);
    if (byStatus !== 0) return byStatus;
    const aUpdatedAt = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const bUpdatedAt = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    return bUpdatedAt - aUpdatedAt;
  })[0];
};

const inferLegacyPlan = (
  legacyProfile: PlanResolutionInput['legacyProfile'],
): EffectiveTripPlan => {
  if (!legacyProfile || legacyProfile.subscription_status !== 'active') return 'free';
  if (legacyProfile.subscription_product_id?.includes('explorer')) return 'explorer';
  return 'frequent-chraveler';
};

export const resolveEffectiveTripPlan = ({ entitlement, legacyProfile }: PlanResolutionInput) => {
  if (entitlement) {
    const normalizedPlan = normalizePlan(entitlement.plan);
    const status = (entitlement.status as EntitlementStatus | null) ?? 'expired';
    if (
      hasEffectiveAccess(status, entitlement.current_period_end) &&
      PAID_TIERS.has(normalizedPlan)
    ) {
      return normalizedPlan;
    }
  }

  return inferLegacyPlan(legacyProfile);
};

export const evaluateTripCreationPermission = ({
  plan,
  tripType,
  counts,
  explorerProTripOverride = false,
}: {
  plan: EffectiveTripPlan;
  tripType: TripType;
  counts: TripCreationCounts;
  explorerProTripOverride?: boolean;
}): TripCreationDecision => {
  if (plan === 'free') {
    if (tripType === 'consumer' && counts.consumerActiveCount >= 3) {
      return { allowed: false, errorCode: 'TRIP_LIMIT_REACHED' };
    }

    if (tripType === 'pro' && counts.freeProTripsUsed >= counts.freeProTripLimit) {
      return { allowed: false, errorCode: 'UPGRADE_REQUIRED_PRO_TRIP' };
    }

    if (tripType === 'event' && counts.freeEventsUsed >= counts.freeEventLimit) {
      return { allowed: false, errorCode: 'UPGRADE_REQUIRED_EVENT' };
    }
  }

  if (plan === 'explorer' && tripType === 'pro' && !explorerProTripOverride) {
    return { allowed: false, errorCode: 'EXPLORER_PRO_TRIP_REQUIRES_EXPLICIT_OVERRIDE' };
  }

  return { allowed: true };
};

export const canRestoreArchivedTrip = ({
  plan,
  activeConsumerCount,
}: {
  plan: EffectiveTripPlan;
  activeConsumerCount: number;
}): boolean => {
  if (plan !== 'free') return true;
  return activeConsumerCount < 3;
};
