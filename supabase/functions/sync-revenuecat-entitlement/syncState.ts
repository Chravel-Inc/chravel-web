import {
  ENTITLEMENT_TO_PLAN,
  PLAN_PRIORITY,
  type EntitlementStatus,
} from '../revenuecat-webhook/eventState.ts';

export interface RevenueCatSubscriberEntitlement {
  expires_date: string | null;
  grace_period_expires_date?: string | null;
  product_identifier?: string | null;
}

export interface RevenueCatSubscriberSubscription {
  expires_date: string | null;
  grace_period_expires_date?: string | null;
  period_type?: string | null;
  billing_issues_detected_at?: string | null;
  unsubscribe_detected_at?: string | null;
  refunded_at?: string | null;
}

export interface RevenueCatSubscriberResponse {
  request_date: string;
  subscriber: {
    original_app_user_id?: string | null;
    entitlements?: Record<string, RevenueCatSubscriberEntitlement>;
    subscriptions?: Record<string, RevenueCatSubscriberSubscription>;
  };
}

export interface DerivedRevenueCatSyncState {
  purchaseType: 'subscription' | 'pass';
  plan: string;
  status: EntitlementStatus;
  currentPeriodEnd: string | null;
  entitlementIds: string[];
  revenueCatCustomerId: string | null;
}

function parseIsoDate(value: string | null | undefined): number | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function resolveAccessEndTimestamp(
  expiresAt: string | null | undefined,
  gracePeriodExpiresAt: string | null | undefined,
): number | null {
  const expiresAtMs = parseIsoDate(expiresAt);
  const gracePeriodExpiresAtMs = parseIsoDate(gracePeriodExpiresAt);

  if (expiresAtMs === null && gracePeriodExpiresAtMs === null) {
    return null;
  }

  return Math.max(
    expiresAtMs ?? Number.NEGATIVE_INFINITY,
    gracePeriodExpiresAtMs ?? Number.NEGATIVE_INFINITY,
  );
}

function isPassProduct(productIdentifier: string | null | undefined): boolean {
  return productIdentifier?.includes('.pass') ?? false;
}

function isCurrentlyActiveEntitlement(
  entitlement: RevenueCatSubscriberEntitlement,
  subscriptions: Record<string, RevenueCatSubscriberSubscription>,
  nowMs: number,
): boolean {
  if (!entitlement.product_identifier) {
    return false;
  }

  const linkedSubscription = subscriptions[entitlement.product_identifier];
  if (linkedSubscription?.refunded_at) {
    return false;
  }

  const purchaseType = isPassProduct(entitlement.product_identifier) ? 'pass' : 'subscription';
  const accessEndTimestamp = resolveAccessEndTimestamp(
    entitlement.expires_date,
    entitlement.grace_period_expires_date,
  );

  if (accessEndTimestamp === null) {
    return purchaseType === 'subscription';
  }

  return accessEndTimestamp > nowMs;
}

function isCurrentlyActiveSubscription(
  subscription: RevenueCatSubscriberSubscription,
  nowMs: number,
): boolean {
  const accessEndTimestamp = resolveAccessEndTimestamp(
    subscription.expires_date,
    subscription.grace_period_expires_date,
  );
  if (accessEndTimestamp === null) {
    return false;
  }

  return accessEndTimestamp > nowMs;
}

function derivePlanFromActiveEntitlements(entitlementIds: string[]): string {
  let plan = 'free';

  for (const entitlementId of entitlementIds) {
    const mappedPlan = ENTITLEMENT_TO_PLAN[entitlementId];
    if (mappedPlan && PLAN_PRIORITY.indexOf(mappedPlan) > PLAN_PRIORITY.indexOf(plan)) {
      plan = mappedPlan;
    }
  }

  return plan;
}

function deriveStatusFromActiveSubscriptions(
  subscriptions: RevenueCatSubscriberSubscription[],
): EntitlementStatus {
  if (subscriptions.some(subscription => subscription.billing_issues_detected_at)) {
    return 'past_due';
  }

  if (subscriptions.some(subscription => subscription.period_type?.toLowerCase() === 'trial')) {
    return 'trialing';
  }

  if (subscriptions.some(subscription => subscription.unsubscribe_detected_at)) {
    return 'canceled';
  }

  return 'active';
}

function deriveStateForPurchaseType(
  purchaseType: 'subscription' | 'pass',
  entitlementEntries: Array<[string, RevenueCatSubscriberEntitlement]>,
  subscriptions: Record<string, RevenueCatSubscriberSubscription>,
  revenueCatCustomerId: string | null,
  nowMs: number,
): DerivedRevenueCatSyncState {
  const entitlementIds = entitlementEntries.map(([entitlementId]) => entitlementId);
  const plan = derivePlanFromActiveEntitlements(entitlementIds);

  const activeSubscriptionProductIds = new Set(
    entitlementEntries
      .map(([, entitlement]) => entitlement.product_identifier ?? null)
      .filter((productIdentifier): productIdentifier is string => Boolean(productIdentifier)),
  );

  const activeSubscriptions = Object.entries(subscriptions)
    .filter(([productIdentifier, subscription]) => {
      if (!activeSubscriptionProductIds.has(productIdentifier)) {
        return false;
      }

      return isCurrentlyActiveSubscription(subscription, nowMs);
    })
    .map(([, subscription]) => subscription)
    .filter(subscription => !subscription.refunded_at);

  const currentPeriodEndTimestamp = entitlementEntries.reduce<number | null>(
    (latestEnd, [, entitlement]) => {
      const entitlementEnd = resolveAccessEndTimestamp(
        entitlement.expires_date,
        entitlement.grace_period_expires_date,
      );

      if (entitlementEnd === null) {
        return latestEnd;
      }

      if (latestEnd === null) {
        return entitlementEnd;
      }

      return Math.max(latestEnd, entitlementEnd);
    },
    null,
  );

  const currentPeriodEnd =
    currentPeriodEndTimestamp === null ? null : new Date(currentPeriodEndTimestamp).toISOString();

  const status: EntitlementStatus =
    entitlementIds.length === 0
      ? 'expired'
      : deriveStatusFromActiveSubscriptions(activeSubscriptions);

  return {
    purchaseType,
    plan,
    status,
    currentPeriodEnd,
    entitlementIds,
    revenueCatCustomerId,
  };
}

export function deriveRevenueCatSyncStates(
  response: RevenueCatSubscriberResponse,
  now: Date = new Date(),
): DerivedRevenueCatSyncState[] {
  const nowMs = now.getTime();
  const entitlements = response.subscriber.entitlements ?? {};
  const subscriptions = response.subscriber.subscriptions ?? {};
  const activeEntitlementEntries = Object.entries(entitlements).filter(([, entitlement]) =>
    isCurrentlyActiveEntitlement(entitlement, subscriptions, nowMs),
  );
  const revenueCatCustomerId = response.subscriber.original_app_user_id ?? null;

  const subscriptionEntries = activeEntitlementEntries.filter(
    ([, entitlement]) => !isPassProduct(entitlement.product_identifier),
  );
  const passEntries = activeEntitlementEntries.filter(([, entitlement]) =>
    isPassProduct(entitlement.product_identifier),
  );

  return [
    deriveStateForPurchaseType(
      'subscription',
      subscriptionEntries,
      subscriptions,
      revenueCatCustomerId,
      nowMs,
    ),
    deriveStateForPurchaseType('pass', passEntries, subscriptions, revenueCatCustomerId, nowMs),
  ];
}
