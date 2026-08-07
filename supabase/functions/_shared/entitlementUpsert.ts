export const USER_ENTITLEMENT_CONFLICT_TARGET = 'user_id,purchase_type';

export type EntitlementKeyRow = {
  user_id: string;
  purchase_type: 'subscription' | 'pass';
  plan: string;
};

/** Regex for App Store Trip Pass SKUs — keep in sync with src/constants/revenuecat.ts */
export const TRIP_PASS_PRODUCT_ID_RE = /trippass|\.pass\d+/i;

export type RevenueCatPurchaseType = 'subscription' | 'pass';

export function isTripPassProductId(productId: string | null | undefined): boolean {
  if (!productId) return false;
  return TRIP_PASS_PRODUCT_ID_RE.test(productId);
}

export function resolvePurchaseTypeForProductId(
  productId: string | null | undefined,
): RevenueCatPurchaseType {
  return isTripPassProductId(productId) ? 'pass' : 'subscription';
}

/**
 * How long each Trip Pass grants access. Keep in sync with
 * `REVENUECAT_PRICING.tripPasses.*.durationDays` in src/constants/revenuecat.ts —
 * `tripPassDurationParity.test.ts` fails the build if the two disagree.
 */
export const TRIP_PASS_DURATION_DAYS: Record<string, number> = {
  'com.chravel.trippass.explorer': 30,
  'com.chravel.trippass.frequent': 90,
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The expiry a Trip Pass must have, computed from OUR duration table rather than the store's.
 *
 * A Trip Pass sells a fixed window, but nothing in this system enforced that window: the expiry
 * came solely from RevenueCat, which derives it from a per-product duration configured in the
 * dashboard. With that duration unset, RevenueCat sends no expiry, both write paths stored
 * `current_period_end = null`, and `sync-revenuecat-entitlement` treats a null expiry as
 * `Infinity` — so a $39.99 30-day pass granted premium access permanently, and no EXPIRATION
 * event ever fired to end it. One unchecked dashboard field, no visible symptom until the revenue
 * never arrives.
 *
 * Duration is a product decision, so it belongs in code. This is the backstop: if the store gives
 * us an expiry we keep it (the store is authoritative when it speaks), and if it does not we
 * compute one. Returns null only for a product with no known duration, which cannot silently
 * become permanent access because callers treat that as "leave the store's value alone".
 */
export function resolveTripPassExpiry(
  productId: string | null | undefined,
  purchasedAtMs: number | null | undefined,
): string | null {
  if (!productId) return null;
  const days = TRIP_PASS_DURATION_DAYS[productId];
  if (!days) return null;
  const start = purchasedAtMs && Number.isFinite(purchasedAtMs) ? purchasedAtMs : Date.now();
  return new Date(start + days * DAY_MS).toISOString();
}

/**
 * Final expiry for an entitlement row: the store's value when present, ours when the store is
 * silent about a Trip Pass. Subscriptions are untouched — their period end genuinely comes from
 * the store and renews.
 */
export function resolveEntitlementPeriodEnd(args: {
  productId: string | null | undefined;
  storeExpiry: string | null;
  purchasedAtMs?: number | null;
}): string | null {
  const { productId, storeExpiry, purchasedAtMs } = args;
  if (storeExpiry) return storeExpiry;
  if (!isTripPassProductId(productId)) return null;
  return resolveTripPassExpiry(productId, purchasedAtMs ?? null);
}

/**
 * Test helper that models Postgres upsert semantics on (user_id, purchase_type).
 */
export const applyEntitlementUpserts = (rows: EntitlementKeyRow[]): EntitlementKeyRow[] => {
  const byKey = new Map<string, EntitlementKeyRow>();
  for (const row of rows) {
    byKey.set(`${row.user_id}:${row.purchase_type}`, row);
  }
  return [...byKey.values()];
};
