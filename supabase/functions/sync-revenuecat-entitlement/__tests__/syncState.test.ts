import { describe, expect, it } from 'vitest';
import { deriveRevenueCatSyncStates, type RevenueCatSubscriberResponse } from '../syncState';

const activeResponse: RevenueCatSubscriberResponse = {
  request_date: '2026-06-26T16:00:00.000Z',
  subscriber: {
    original_app_user_id: '11111111-1111-1111-1111-111111111111',
    entitlements: {
      chravel_explorer: {
        expires_date: '2026-07-26T00:00:00.000Z',
        product_identifier: 'com.chravel.explorer.monthly',
      },
      chravel_pro_growth: {
        expires_date: '2026-08-26T00:00:00.000Z',
        product_identifier: 'com.chravel.pro.growth.monthly',
      },
    },
    subscriptions: {
      'com.chravel.explorer.monthly': {
        expires_date: '2026-07-26T00:00:00.000Z',
        period_type: 'normal',
      },
      'com.chravel.pro.growth.monthly': {
        expires_date: '2026-08-26T00:00:00.000Z',
        period_type: 'normal',
      },
    },
  },
};

describe('deriveRevenueCatSyncStates', () => {
  it('picks the highest-priority active subscription entitlement from the verified subscriber response', () => {
    const [subscriptionState, passState] = deriveRevenueCatSyncStates(
      activeResponse,
      new Date('2026-06-26T16:00:00.000Z'),
    );

    expect(subscriptionState).toMatchObject({
      purchaseType: 'subscription',
      plan: 'pro-growth',
      status: 'active',
      entitlementIds: ['chravel_explorer', 'chravel_pro_growth'],
      revenueCatCustomerId: '11111111-1111-1111-1111-111111111111',
    });
    expect(subscriptionState.currentPeriodEnd).toBe('2026-08-26T00:00:00.000Z');

    expect(passState).toEqual({
      purchaseType: 'pass',
      plan: 'free',
      status: 'expired',
      currentPeriodEnd: null,
      entitlementIds: [],
      revenueCatCustomerId: '11111111-1111-1111-1111-111111111111',
    });
  });

  it('marks trial subscriptions as trialing', () => {
    const [result] = deriveRevenueCatSyncStates(
      {
        ...activeResponse,
        subscriber: {
          ...activeResponse.subscriber,
          entitlements: {
            chravel_explorer: {
              expires_date: '2026-07-26T00:00:00.000Z',
              product_identifier: 'com.chravel.explorer.monthly',
            },
          },
          subscriptions: {
            'com.chravel.explorer.monthly': {
              expires_date: '2026-07-26T00:00:00.000Z',
              period_type: 'trial',
            },
          },
        },
      },
      new Date('2026-06-26T16:00:00.000Z'),
    );

    expect(result.status).toBe('trialing');
    expect(result.plan).toBe('explorer');
  });

  it('keeps access in a billing-issue grace period and marks the row past_due', () => {
    const [result] = deriveRevenueCatSyncStates(
      {
        ...activeResponse,
        subscriber: {
          ...activeResponse.subscriber,
          entitlements: {
            chravel_explorer: {
              expires_date: '2026-06-20T00:00:00.000Z',
              grace_period_expires_date: '2026-06-30T00:00:00.000Z',
              product_identifier: 'com.chravel.explorer.monthly',
            },
          },
          subscriptions: {
            'com.chravel.explorer.monthly': {
              expires_date: '2026-06-20T00:00:00.000Z',
              grace_period_expires_date: '2026-06-30T00:00:00.000Z',
              billing_issues_detected_at: '2026-06-21T00:00:00.000Z',
              period_type: 'normal',
            },
          },
        },
      },
      new Date('2026-06-26T16:00:00.000Z'),
    );

    expect(result).toMatchObject({
      plan: 'explorer',
      status: 'past_due',
      entitlementIds: ['chravel_explorer'],
    });
    expect(result.currentPeriodEnd).toBe('2026-06-30T00:00:00.000Z');
  });

  it('marks both rows expired when every entitlement is stale', () => {
    const result = deriveRevenueCatSyncStates(
      {
        ...activeResponse,
        subscriber: {
          ...activeResponse.subscriber,
          entitlements: {
            chravel_explorer: {
              expires_date: '2026-05-01T00:00:00.000Z',
              product_identifier: 'com.chravel.explorer.monthly',
            },
          },
          subscriptions: {
            'com.chravel.explorer.monthly': {
              expires_date: '2026-05-01T00:00:00.000Z',
              period_type: 'normal',
            },
          },
        },
      },
      new Date('2026-06-26T16:00:00.000Z'),
    );

    expect(result).toEqual([
      {
        purchaseType: 'subscription',
        plan: 'free',
        status: 'expired',
        currentPeriodEnd: null,
        entitlementIds: [],
        revenueCatCustomerId: '11111111-1111-1111-1111-111111111111',
      },
      {
        purchaseType: 'pass',
        plan: 'free',
        status: 'expired',
        currentPeriodEnd: null,
        entitlementIds: [],
        revenueCatCustomerId: '11111111-1111-1111-1111-111111111111',
      },
    ]);
  });

  it('persists trip passes in the pass lane instead of overwriting the subscription lane', () => {
    const [subscriptionState, passState] = deriveRevenueCatSyncStates(
      {
        ...activeResponse,
        subscriber: {
          ...activeResponse.subscriber,
          entitlements: {
            chravel_frequent_chraveler: {
              expires_date: '2026-09-24T00:00:00.000Z',
              product_identifier: 'com.chravel.frequentchraveler.pass90',
            },
          },
          subscriptions: {},
        },
      },
      new Date('2026-06-26T16:00:00.000Z'),
    );

    expect(subscriptionState).toEqual({
      purchaseType: 'subscription',
      plan: 'free',
      status: 'expired',
      currentPeriodEnd: null,
      entitlementIds: [],
      revenueCatCustomerId: '11111111-1111-1111-1111-111111111111',
    });
    expect(passState).toMatchObject({
      purchaseType: 'pass',
      plan: 'frequent-chraveler',
      status: 'active',
      entitlementIds: ['chravel_frequent_chraveler'],
    });
    expect(passState.currentPeriodEnd).toBe('2026-09-24T00:00:00.000Z');
  });

  it('fails closed when RevenueCat omits the entitlement product identifier', () => {
    const result = deriveRevenueCatSyncStates(
      {
        ...activeResponse,
        subscriber: {
          ...activeResponse.subscriber,
          entitlements: {
            chravel_explorer: {
              expires_date: '2026-07-26T00:00:00.000Z',
            },
          },
          subscriptions: {},
        },
      },
      new Date('2026-06-26T16:00:00.000Z'),
    );

    expect(result).toEqual([
      {
        purchaseType: 'subscription',
        plan: 'free',
        status: 'expired',
        currentPeriodEnd: null,
        entitlementIds: [],
        revenueCatCustomerId: '11111111-1111-1111-1111-111111111111',
      },
      {
        purchaseType: 'pass',
        plan: 'free',
        status: 'expired',
        currentPeriodEnd: null,
        entitlementIds: [],
        revenueCatCustomerId: '11111111-1111-1111-1111-111111111111',
      },
    ]);
  });

  it('does not treat refunded subscriptions as active even if RevenueCat still returns the entitlement', () => {
    const [subscriptionState] = deriveRevenueCatSyncStates(
      {
        ...activeResponse,
        subscriber: {
          ...activeResponse.subscriber,
          entitlements: {
            chravel_explorer: {
              expires_date: '2026-07-26T00:00:00.000Z',
              product_identifier: 'com.chravel.explorer.monthly',
            },
          },
          subscriptions: {
            'com.chravel.explorer.monthly': {
              expires_date: '2026-07-26T00:00:00.000Z',
              period_type: 'normal',
              refunded_at: '2026-06-25T00:00:00.000Z',
            },
          },
        },
      },
      new Date('2026-06-26T16:00:00.000Z'),
    );

    expect(subscriptionState).toEqual({
      purchaseType: 'subscription',
      plan: 'free',
      status: 'expired',
      currentPeriodEnd: null,
      entitlementIds: [],
      revenueCatCustomerId: '11111111-1111-1111-1111-111111111111',
    });
  });
});
