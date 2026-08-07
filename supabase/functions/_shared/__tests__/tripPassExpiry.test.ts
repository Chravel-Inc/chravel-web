import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  TRIP_PASS_DURATION_DAYS,
  resolveEntitlementPeriodEnd,
  resolveTripPassExpiry,
} from '../entitlementUpsert.ts';
import { hasEffectiveAccess } from '../entitlementSelection.ts';

const EXPLORER_PASS = 'com.chravel.trippass.explorer';
const FREQUENT_PASS = 'com.chravel.trippass.frequent';
const DAY_MS = 24 * 60 * 60 * 1000;

describe('Trip Pass expiry fallback', () => {
  /**
   * REGRESSION (2026-08-07): a Trip Pass sells a fixed window, but nothing enforced it. The expiry
   * came solely from RevenueCat, which derives it from a per-product duration set in its
   * dashboard. With that duration unset, RevenueCat sends no expiration, both write paths stored
   * current_period_end = null, and sync-revenuecat-entitlement treated a null expiry as Infinity.
   * A one-off $39.99 30-day pass therefore granted premium access permanently, and no EXPIRATION
   * event ever fired to end it — a silent, total loss of subscription conversion caused by one
   * unchecked dashboard field.
   */
  it('computes an expiry when the store sends none', () => {
    const purchasedAt = Date.parse('2026-08-07T00:00:00.000Z');

    expect(resolveTripPassExpiry(EXPLORER_PASS, purchasedAt)).toBe(
      new Date(purchasedAt + 30 * DAY_MS).toISOString(),
    );
    expect(resolveTripPassExpiry(FREQUENT_PASS, purchasedAt)).toBe(
      new Date(purchasedAt + 90 * DAY_MS).toISOString(),
    );
  });

  it('never leaves a pass without an end date', () => {
    const periodEnd = resolveEntitlementPeriodEnd({
      productId: EXPLORER_PASS,
      storeExpiry: null,
      purchasedAtMs: Date.parse('2026-08-07T00:00:00.000Z'),
    });

    expect(periodEnd).not.toBeNull();
    expect(new Date(periodEnd as string).getTime()).toBeGreaterThan(
      Date.parse('2026-08-07T00:00:00.000Z'),
    );
  });

  it('defers to the store when the store provides an expiry', () => {
    const storeExpiry = '2026-09-01T00:00:00.000Z';
    expect(
      resolveEntitlementPeriodEnd({
        productId: EXPLORER_PASS,
        storeExpiry,
        purchasedAtMs: Date.parse('2026-08-07T00:00:00.000Z'),
      }),
    ).toBe(storeExpiry);
  });

  it('leaves subscriptions open-ended — only passes get a synthesized expiry', () => {
    expect(
      resolveEntitlementPeriodEnd({
        productId: 'com.chravel.explorer.monthly',
        storeExpiry: null,
        purchasedAtMs: Date.now(),
      }),
    ).toBeNull();
  });

  it('returns null for a pass-shaped product with no known duration', () => {
    // Callers treat null as "leave the store's value alone", so an unknown SKU cannot silently
    // acquire a wrong window — but it also must not invent one.
    expect(resolveTripPassExpiry('com.chravel.trippass.unknown', Date.now())).toBeNull();
  });

  it('falls back to now when the store omits a purchase date', () => {
    const before = Date.now();
    const expiry = resolveTripPassExpiry(EXPLORER_PASS, null);
    expect(expiry).not.toBeNull();
    expect(new Date(expiry as string).getTime()).toBeGreaterThanOrEqual(
      before + 30 * DAY_MS - 5000,
    );
  });
});

describe('hasEffectiveAccess — pass window is enforced at read time', () => {
  const past = new Date(Date.now() - DAY_MS).toISOString();
  const future = new Date(Date.now() + DAY_MS).toISOString();

  /**
   * The second half of the same regression: even with a correct end date stored, a pass stayed
   * valid because `status === 'active'` short-circuited before the date was consulted. Access
   * ended only when an EXPIRATION webhook arrived to flip the status — so a dropped, delayed, or
   * never-configured event left the pass live indefinitely.
   */
  it('denies an active pass whose window has closed', () => {
    expect(hasEffectiveAccess('active', past, 'pass')).toBe(false);
  });

  it('allows a pass still inside its window', () => {
    expect(hasEffectiveAccess('active', future, 'pass')).toBe(true);
  });

  it('grants a pass with no end date rather than locking out a payer', () => {
    // Write paths guarantee an expiry; failing closed here would punish someone who paid.
    expect(hasEffectiveAccess('active', null, 'pass')).toBe(true);
  });

  it('keeps subscriptions lenient so a late RENEWAL does not revoke a paying customer', () => {
    expect(hasEffectiveAccess('active', past, 'subscription')).toBe(true);
    expect(hasEffectiveAccess('active', past)).toBe(true);
  });

  it('still honours the canceled-until-period-end rule', () => {
    expect(hasEffectiveAccess('canceled', future, 'subscription')).toBe(true);
    expect(hasEffectiveAccess('canceled', past, 'subscription')).toBe(false);
  });

  it('never grants access on an expired status', () => {
    expect(hasEffectiveAccess('expired', future, 'pass')).toBe(false);
    expect(hasEffectiveAccess('expired', future, 'subscription')).toBe(false);
  });
});

describe('Trip Pass duration parity (edge ↔ frontend)', () => {
  /**
   * The durations are declared twice because edge functions cannot import from src/. A mismatch
   * would mean the pass the UI advertises and the pass the backend enforces are different
   * products, so pin them together rather than relying on a "keep in sync" comment.
   */
  it('matches REVENUECAT_PRICING.tripPasses in src/constants/revenuecat.ts', () => {
    const source = readFileSync(join(process.cwd(), 'src/constants/revenuecat.ts'), 'utf8');

    const read = (key: string): number => {
      const match = source.match(new RegExp(`${key}:\\s*\\{[^}]*durationDays:\\s*(\\d+)`));
      if (!match) throw new Error(`Could not read durationDays for '${key}'`);
      return Number(match[1]);
    };

    expect(TRIP_PASS_DURATION_DAYS[EXPLORER_PASS]).toBe(read('explorer'));
    expect(TRIP_PASS_DURATION_DAYS[FREQUENT_PASS]).toBe(read('frequentChraveler'));
  });

  it('declares a duration for every Trip Pass SKU the app sells', () => {
    const source = readFileSync(join(process.cwd(), 'src/constants/revenuecat.ts'), 'utf8');
    const passIds = [...source.matchAll(/'(com\.chravel\.trippass\.[a-z0-9.]+)'/g)].map(m => m[1]);

    expect(passIds.length).toBeGreaterThan(0);
    for (const id of new Set(passIds)) {
      expect(
        TRIP_PASS_DURATION_DAYS[id],
        `'${id}' is sold by the app but has no duration, so it would never expire.`,
      ).toBeGreaterThan(0);
    }
  });
});
