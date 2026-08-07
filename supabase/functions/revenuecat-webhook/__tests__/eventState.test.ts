import { describe, expect, it } from 'vitest';
import {
  ENTITLEMENT_TO_PLAN,
  SUBSCRIPTION_EVENTS,
  deriveEntitlementFromEvent,
  derivePlanFromEntitlements,
  isStaleExpiration,
  isUnmappedGrantingPurchase,
  revenueCatIdempotencyKey,
  type RevenueCatEvent,
} from '../eventState';

const baseEvent: RevenueCatEvent = {
  id: 'evt-1',
  type: 'INITIAL_PURCHASE',
  app_user_id: 'rc-customer-1',
  original_app_user_id: '11111111-1111-1111-1111-111111111111',
  entitlement_ids: ['chravel_pro_growth'],
  expiration_at_ms: Date.parse('2030-01-01T00:00:00.000Z'),
};

describe('derivePlanFromEntitlements', () => {
  it('picks the highest-priority plan from active entitlements', () => {
    expect(derivePlanFromEntitlements(['chravel_explorer', 'chravel_pro_growth'])).toBe(
      'pro-growth',
    );
  });

  it('returns free when no entitlement maps', () => {
    expect(derivePlanFromEntitlements([])).toBe('free');
    expect(derivePlanFromEntitlements(['unknown_entitlement'])).toBe('free');
  });

  it('maps every known entitlement id to a plan', () => {
    for (const [id, plan] of Object.entries(ENTITLEMENT_TO_PLAN)) {
      expect(derivePlanFromEntitlements([id])).toBe(plan);
    }
  });
});

describe('deriveEntitlementFromEvent', () => {
  it('activates on purchase and renewal', () => {
    expect(deriveEntitlementFromEvent({ ...baseEvent, type: 'INITIAL_PURCHASE' }).status).toBe(
      'active',
    );
    expect(deriveEntitlementFromEvent({ ...baseEvent, type: 'RENEWAL' }).status).toBe('active');
  });

  it('marks trials as trialing', () => {
    const result = deriveEntitlementFromEvent({
      ...baseEvent,
      type: 'INITIAL_PURCHASE',
      period_type: 'TRIAL',
    });
    expect(result.status).toBe('trialing');
    expect(result.plan).toBe('pro-growth');
  });

  it('keeps access during billing issue (past_due grace) and pause', () => {
    expect(deriveEntitlementFromEvent({ ...baseEvent, type: 'BILLING_ISSUE' }).status).toBe(
      'past_due',
    );
    expect(deriveEntitlementFromEvent({ ...baseEvent, type: 'SUBSCRIPTION_PAUSED' }).status).toBe(
      'active',
    );
  });

  it('revokes access to free on expiration and refund', () => {
    const expired = deriveEntitlementFromEvent({ ...baseEvent, type: 'EXPIRATION' });
    expect(expired.status).toBe('expired');
    expect(expired.plan).toBe('free');

    const refunded = deriveEntitlementFromEvent({ ...baseEvent, type: 'REFUND' });
    expect(refunded.status).toBe('expired');
    expect(refunded.plan).toBe('free');
  });

  it('marks cancellation as canceled but retains plan until period end', () => {
    const result = deriveEntitlementFromEvent({ ...baseEvent, type: 'CANCELLATION' });
    expect(result.status).toBe('canceled');
    expect(result.plan).toBe('pro-growth');
  });

  it('serializes expiration timestamp to ISO', () => {
    expect(deriveEntitlementFromEvent(baseEvent).currentPeriodEnd).toBe('2030-01-01T00:00:00.000Z');
    expect(
      deriveEntitlementFromEvent({ ...baseEvent, expiration_at_ms: undefined }).currentPeriodEnd,
    ).toBeNull();
  });
});

describe('Trip Pass (non-subscription) purchases', () => {
  const passEvent: RevenueCatEvent = {
    ...baseEvent,
    type: 'NON_RENEWING_PURCHASE',
    product_id: 'com.chravel.trippass.explorer',
    entitlement_ids: ['chravel_explorer'],
    expiration_at_ms: Date.parse('2026-09-06T00:00:00.000Z'),
  };

  /**
   * REGRESSION (2026-08-07): Trip Passes are sold as non-subscription store products, so
   * RevenueCat fires NON_RENEWING_PURCHASE — never INITIAL_PURCHASE. The event was absent from
   * SUBSCRIPTION_EVENTS, so index.ts short-circuited every Trip Pass delivery with
   * `{skipped: true}` and no `purchase_type='pass'` row was ever written by the webhook. That
   * left the best-effort client-side sync as the only path, which logs a warning and still
   * reports the purchase successful when it fails — a dropped sync billed the customer for
   * nothing.
   */
  it('treats NON_RENEWING_PURCHASE as a state-affecting event', () => {
    expect(SUBSCRIPTION_EVENTS.has('NON_RENEWING_PURCHASE')).toBe(true);
  });

  it('grants the pass entitlement with its fixed expiry', () => {
    const result = deriveEntitlementFromEvent(passEvent);
    expect(result.status).toBe('active');
    expect(result.plan).toBe('explorer');
    expect(result.currentPeriodEnd).toBe('2026-09-06T00:00:00.000Z');
  });

  it('expires a lapsed pass like any other entitlement', () => {
    const result = deriveEntitlementFromEvent({ ...passEvent, type: 'EXPIRATION' });
    expect(result.status).toBe('expired');
    expect(result.plan).toBe('free');
  });
});

describe('isUnmappedGrantingPurchase (unattached-product guard)', () => {
  /**
   * An App Store product that is not attached to an entitlement in the RevenueCat dashboard
   * delivers a purchase event with empty `entitlement_ids`. derivePlanFromEntitlements returns
   * 'free' for that, which is correct for EXPIRATION but catastrophic for a purchase: writing it
   * would overwrite a live row with plan='free', revoking access the customer just paid for.
   * Buying a second pass while the first is still active is the concrete way this bites.
   */
  it('flags a purchase whose product grants no entitlement', () => {
    expect(isUnmappedGrantingPurchase({ type: 'NON_RENEWING_PURCHASE' }, 'free')).toBe(true);
    expect(isUnmappedGrantingPurchase({ type: 'INITIAL_PURCHASE' }, 'free')).toBe(true);
    expect(isUnmappedGrantingPurchase({ type: 'RENEWAL' }, 'free')).toBe(true);
  });

  it('allows a purchase that resolves to a real plan', () => {
    expect(isUnmappedGrantingPurchase({ type: 'NON_RENEWING_PURCHASE' }, 'explorer')).toBe(false);
    expect(isUnmappedGrantingPurchase({ type: 'INITIAL_PURCHASE' }, 'pro-growth')).toBe(false);
  });

  it('never blocks revocation events, which legitimately resolve to free', () => {
    expect(isUnmappedGrantingPurchase({ type: 'EXPIRATION' }, 'free')).toBe(false);
    expect(isUnmappedGrantingPurchase({ type: 'REFUND' }, 'free')).toBe(false);
    expect(isUnmappedGrantingPurchase({ type: 'CANCELLATION' }, 'free')).toBe(false);
  });

  it('derives free from an unattached pass purchase — the payload the guard exists for', () => {
    const unattached = deriveEntitlementFromEvent({
      ...baseEvent,
      type: 'NON_RENEWING_PURCHASE',
      product_id: 'com.chravel.trippass.explorer',
      entitlement_ids: [],
    });
    expect(unattached.plan).toBe('free');
    expect(isUnmappedGrantingPurchase({ type: 'NON_RENEWING_PURCHASE' }, unattached.plan)).toBe(
      true,
    );
  });
});

describe('isStaleExpiration (reorder guard)', () => {
  const now = '2026-05-24T00:00:00.000Z';

  it('flags an EXPIRATION when stored access still extends into the future', () => {
    // A late EXPIRATION arriving after a RENEWAL already extended access.
    expect(isStaleExpiration({ type: 'EXPIRATION' }, '2026-06-30T00:00:00.000Z', now)).toBe(true);
  });

  it('does not flag an EXPIRATION that matches expired access', () => {
    expect(isStaleExpiration({ type: 'EXPIRATION' }, '2026-05-01T00:00:00.000Z', now)).toBe(false);
    expect(isStaleExpiration({ type: 'EXPIRATION' }, null, now)).toBe(false);
  });

  it('never flags non-expiration events (refund revokes immediately)', () => {
    expect(isStaleExpiration({ type: 'REFUND' }, '2026-06-30T00:00:00.000Z', now)).toBe(false);
    expect(isStaleExpiration({ type: 'RENEWAL' }, '2026-06-30T00:00:00.000Z', now)).toBe(false);
  });
});

describe('revenueCatIdempotencyKey', () => {
  it('prefixes the event id so it cannot collide with Stripe event ids', () => {
    expect(revenueCatIdempotencyKey(baseEvent)).toBe('rc_evt-1');
  });

  it('falls back to a stable composite key when id is missing', () => {
    const key = revenueCatIdempotencyKey({
      ...baseEvent,
      id: undefined,
      event_timestamp_ms: 1717000000000,
    });
    expect(key).toBe('rc_11111111-1111-1111-1111-111111111111_INITIAL_PURCHASE_1717000000000');
  });
});
