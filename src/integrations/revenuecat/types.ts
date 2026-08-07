/**
 * RevenueCat TypeScript Types
 *
 * Simplified types for RevenueCat responses
 */

import type { SubscriptionTier } from '@/billing/types';

/**
 * Platform detection result
 */
export type RevenueCatPlatform = 'ios' | 'android' | 'web';

/**
 * Entitlement status from RevenueCat
 */
export interface RevenueCatEntitlementInfo {
  identifier: string;
  isActive: boolean;
  willRenew: boolean;
  periodType: 'normal' | 'trial' | 'intro';
  latestPurchaseDate: string | null;
  originalPurchaseDate: string | null;
  expirationDate: string | null;
  productIdentifier: string;
  isSandbox: boolean;
  unsubscribeDetectedAt: string | null;
  billingIssueDetectedAt: string | null;
}

/**
 * Customer info from RevenueCat
 */
export interface RevenueCatCustomerInfo {
  originalAppUserId: string;
  activeSubscriptions: string[];
  allPurchasedProductIdentifiers: string[];
  entitlements: {
    active: Record<string, RevenueCatEntitlementInfo>;
    all: Record<string, RevenueCatEntitlementInfo>;
  };
  firstSeen: string;
  latestExpirationDate: string | null;
  managementURL: string | null;
  nonSubscriptionTransactions: unknown[];
  originalPurchaseDate: string | null;
  requestDate: string;
}

/**
 * Package from RevenueCat offerings
 */
export interface RevenueCatPackage {
  identifier: string;
  packageType: 'MONTHLY' | 'ANNUAL' | 'WEEKLY' | 'LIFETIME' | 'CUSTOM';
  product: {
    identifier: string;
    title: string;
    description: string;
    price: number;
    priceString: string;
    currencyCode: string;
  };
  offeringIdentifier: string;
}

/**
 * Offering from RevenueCat
 */
export interface RevenueCatOffering {
  identifier: string;
  serverDescription: string;
  metadata: Record<string, unknown>;
  availablePackages: RevenueCatPackage[];
  monthly: RevenueCatPackage | null;
  annual: RevenueCatPackage | null;
  lifetime: RevenueCatPackage | null;
}

/**
 * Offerings response
 */
export interface RevenueCatOfferings {
  current: RevenueCatOffering | null;
  all: Record<string, RevenueCatOffering>;
}

/**
 * Result of RevenueCat operations
 */
export interface RevenueCatResult<T = unknown> {
  success: boolean;
  supported: boolean;
  data?: T;
  error?: string;
  errorCode?:
    | 'NOT_CONFIGURED'
    | 'NOT_SUPPORTED'
    | 'CANCELLED'
    | 'NETWORK_ERROR'
    /**
     * The store resolved the purchase but the customer already owns this product and its access
     * window has passed. Apple treats a non-consumable as owned forever: it resolves the repeat
     * purchase without charging and without granting, so a Trip Pass cannot be bought twice.
     */
    | 'ALREADY_OWNED'
    /**
     * The store resolved the purchase but no entitlement was granted, and the customer does not
     * own the product either — the product is not attached to an entitlement in the RevenueCat
     * dashboard. A configuration fault, not a user error.
     */
    | 'NOT_GRANTED'
    | 'UNKNOWN';
}

/**
 * Purchase result
 */
export interface RevenueCatPurchaseResult extends RevenueCatResult<RevenueCatCustomerInfo> {
  transactionId?: string;
}

/**
 * Derived plan from RevenueCat entitlements
 */
export interface DerivedPlan {
  tier: SubscriptionTier;
  status: 'active' | 'trialing' | 'expired' | 'canceled';
  currentPeriodEnd: Date | null;
  source: 'revenuecat';
  entitlements: string[];
}

/**
 * Sync request to edge function
 */
export interface SyncEntitlementsRequest {
  customerInfo: {
    originalAppUserId: string;
    entitlements: {
      active: Record<string, { isActive: boolean; expirationDate: string | null }>;
    };
    latestExpirationDate: string | null;
  };
}

/**
 * Sync response from edge function
 */
export interface SyncEntitlementsResponse {
  success: boolean;
  plan: SubscriptionTier;
  status: 'active' | 'trialing' | 'expired' | 'canceled';
  currentPeriodEnd: string | null;
  entitlements: string[];
  error?: string;
}
