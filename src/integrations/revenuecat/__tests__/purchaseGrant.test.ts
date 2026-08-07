import { describe, expect, it, vi } from 'vitest';
import {
  classifyPurchaseGrant,
  hasPurchasedProduct,
  ownedTripPassProductIds,
} from '../revenuecatClient';
import {
  PRODUCT_ID_TO_ENTITLEMENT,
  REQUIRED_IOS_PRODUCT_IDS,
  REVENUECAT_ENTITLEMENTS,
  REVENUECAT_PRODUCTS,
  tripPassProductIdForTier,
} from '@/constants/revenuecat';
import type { RevenueCatCustomerInfo, RevenueCatEntitlementInfo } from '../types';

const PASS_ID = REVENUECAT_PRODUCTS.explorerPass30;
const PASS_ENTITLEMENT = REVENUECAT_ENTITLEMENTS.explorer;

function entitlement(
  identifier: string,
  isActive: boolean,
  productIdentifier: string,
): RevenueCatEntitlementInfo {
  return {
    identifier,
    isActive,
    willRenew: false,
    periodType: 'normal',
    latestPurchaseDate: '2026-06-01T00:00:00.000Z',
    originalPurchaseDate: '2026-06-01T00:00:00.000Z',
    expirationDate: isActive ? '2030-01-01T00:00:00.000Z' : '2026-07-01T00:00:00.000Z',
    productIdentifier,
    isSandbox: false,
    unsubscribeDetectedAt: null,
    billingIssueDetectedAt: null,
  };
}

function customerInfo(overrides: Partial<RevenueCatCustomerInfo> = {}): RevenueCatCustomerInfo {
  return {
    originalAppUserId: '11111111-1111-1111-1111-111111111111',
    activeSubscriptions: [],
    allPurchasedProductIdentifiers: [],
    entitlements: { active: {}, all: {} },
    firstSeen: '2026-06-01T00:00:00.000Z',
    latestExpirationDate: null,
    managementURL: null,
    nonSubscriptionTransactions: [],
    originalPurchaseDate: null,
    requestDate: '2026-08-07T00:00:00.000Z',
    ...overrides,
  };
}

describe('classifyPurchaseGrant', () => {
  it('accepts a purchase that activated the entitlement it sells', () => {
    const info = customerInfo({
      allPurchasedProductIdentifiers: [PASS_ID],
      entitlements: {
        active: { [PASS_ENTITLEMENT]: entitlement(PASS_ENTITLEMENT, true, PASS_ID) },
        all: { [PASS_ENTITLEMENT]: entitlement(PASS_ENTITLEMENT, true, PASS_ID) },
      },
    });

    expect(classifyPurchaseGrant(info, PASS_ID).granted).toBe(true);
  });

  /**
   * REGRESSION (2026-08-07): Trip Passes are Non-consumable in App Store Connect, so Apple treats
   * them as owned permanently. Buying one a second time resolves the StoreKit transaction WITHOUT
   * charging and WITHOUT granting — the pass window is computed from the original purchase date
   * and has long passed. purchaseByProductId returned `success: true` for any resolved
   * transaction, so the app cheerfully reported "Trip Pass activated! Premium features are
   * unlocking now" over an account that gained nothing.
   */
  it('rejects a repeat purchase of an owned pass whose window has passed', () => {
    const expired = entitlement(PASS_ENTITLEMENT, false, PASS_ID);
    const info = customerInfo({
      allPurchasedProductIdentifiers: [PASS_ID],
      entitlements: { active: {}, all: { [PASS_ENTITLEMENT]: expired } },
    });

    const verdict = classifyPurchaseGrant(info, PASS_ID);
    expect(verdict.granted).toBe(false);
    expect(verdict.errorCode).toBe('ALREADY_OWNED');
    expect(verdict.message).toMatch(/bought once/i);
  });

  /**
   * An App Store product with no entitlement attached in the RevenueCat dashboard resolves the
   * same way but leaves no trace in `entitlements.all`. Three products were in exactly this state
   * during the 2026-08-05 dashboard audit, so this is the observed shape, not a hypothetical.
   */
  it('rejects a purchase whose product is attached to no entitlement', () => {
    const info = customerInfo({ allPurchasedProductIdentifiers: [PASS_ID] });

    const verdict = classifyPurchaseGrant(info, PASS_ID);
    expect(verdict.granted).toBe(false);
    expect(verdict.errorCode).toBe('NOT_GRANTED');
  });

  it('distinguishes an owned-but-expired product from an unattached one', () => {
    const owned = customerInfo({
      entitlements: {
        active: {},
        all: { [PASS_ENTITLEMENT]: entitlement(PASS_ENTITLEMENT, false, PASS_ID) },
      },
    });
    const unattached = customerInfo();

    expect(classifyPurchaseGrant(owned, PASS_ID).errorCode).toBe('ALREADY_OWNED');
    expect(classifyPurchaseGrant(unattached, PASS_ID).errorCode).toBe('NOT_GRANTED');
  });

  it('fails OPEN for a product with no mapped entitlement', () => {
    // Blocking here would reject a real, charged purchase of a SKU added to the dashboard before
    // the map — strictly worse than not verifying it.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const info = customerInfo({ allPurchasedProductIdentifiers: ['com.chravel.unmapped.sku'] });

    expect(classifyPurchaseGrant(info, 'com.chravel.unmapped.sku').granted).toBe(true);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('accepts a subscription purchase that activated its entitlement', () => {
    const subId = REVENUECAT_PRODUCTS.proGrowthMonthly;
    const ent = REVENUECAT_ENTITLEMENTS.proGrowth;
    const info = customerInfo({
      activeSubscriptions: [subId],
      allPurchasedProductIdentifiers: [subId],
      entitlements: {
        active: { [ent]: entitlement(ent, true, subId) },
        all: { [ent]: entitlement(ent, true, subId) },
      },
    });

    expect(classifyPurchaseGrant(info, subId).granted).toBe(true);
  });
});

describe('PRODUCT_ID_TO_ENTITLEMENT', () => {
  it('maps every product the app requires on iOS', () => {
    for (const productId of REQUIRED_IOS_PRODUCT_IDS) {
      expect(
        PRODUCT_ID_TO_ENTITLEMENT[productId],
        `${productId} has no mapped entitlement, so a purchase of it cannot be verified.`,
      ).toBeTruthy();
    }
  });

  it('maps both Trip Passes to their consumer entitlement', () => {
    expect(PRODUCT_ID_TO_ENTITLEMENT[REVENUECAT_PRODUCTS.explorerPass30]).toBe(
      REVENUECAT_ENTITLEMENTS.explorer,
    );
    expect(PRODUCT_ID_TO_ENTITLEMENT[REVENUECAT_PRODUCTS.frequentChravelerPass90]).toBe(
      REVENUECAT_ENTITLEMENTS.frequentChraveler,
    );
  });
});

describe('trip pass ownership helpers', () => {
  it('reports a product the Apple ID has ever bought, active or not', () => {
    const info = customerInfo({ allPurchasedProductIdentifiers: [PASS_ID] });
    expect(hasPurchasedProduct(info, PASS_ID)).toBe(true);
    expect(hasPurchasedProduct(info, REVENUECAT_PRODUCTS.frequentChravelerPass90)).toBe(false);
    expect(hasPurchasedProduct(null, PASS_ID)).toBe(false);
  });

  it('lists only Trip Pass SKUs, ignoring subscriptions', () => {
    const info = customerInfo({
      allPurchasedProductIdentifiers: [
        PASS_ID,
        REVENUECAT_PRODUCTS.explorerMonthly,
        REVENUECAT_PRODUCTS.frequentChravelerPass90,
      ],
    });

    expect(ownedTripPassProductIds(info).sort()).toEqual(
      [PASS_ID, REVENUECAT_PRODUCTS.frequentChravelerPass90].sort(),
    );
  });
});

describe('tripPassProductIdForTier', () => {
  it('resolves each consumer tier to its pass SKU', () => {
    expect(tripPassProductIdForTier('explorer')).toBe(REVENUECAT_PRODUCTS.explorerPass30);
    expect(tripPassProductIdForTier('frequent-chraveler')).toBe(
      REVENUECAT_PRODUCTS.frequentChravelerPass90,
    );
  });
});
