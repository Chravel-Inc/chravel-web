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
