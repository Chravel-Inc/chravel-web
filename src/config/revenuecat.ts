import type { Purchases as PurchasesType } from '@revenuecat/purchases-js';

let Purchases: typeof PurchasesType | null = null;
import { isLovablePreview } from '@/utils/env';

const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY || '';

/**
 * RevenueCat Web Billing keys use the rcb_ prefix.
 * Native app keys (appl_/goog_/amaz_/stripe_) will throw if passed to purchases-js.
 */
export const canInitializeRevenueCat = (
  apiKey: string = REVENUECAT_API_KEY,
  preview: boolean = isLovablePreview(),
): boolean => {
  if (preview) return false;

  const normalizedKey = apiKey.trim();
  if (!normalizedKey) return false;

  return normalizedKey.startsWith('rcb_');
};

/**
 * Generates a unique anonymous user ID for RevenueCat.
 * Uses crypto.randomUUID if available, falls back to timestamp + random.
 */
export const generateAnonymousUserId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `anon_${crypto.randomUUID()}`;
  }
  // Fallback: crypto exists but lacks randomUUID (e.g. some older WebView builds).
  // Guard crypto.getRandomValues separately — if crypto itself is absent the outer
  // condition already passed (typeof crypto !== 'undefined' was true).
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `anon_${hex}`;
  }
  // Last-resort fallback for environments with no Web Crypto API at all.
  // We throw an error instead of using Math.random() as it is not cryptographically secure
  // and could lead to predictable IDs and subscription hijacking.
  throw new Error('Web Crypto API is required for secure ID generation');
};

/**
 * Gets or creates an anonymous user ID, persisting it in localStorage.
 */
const getOrCreateUserId = (): string => {
  const STORAGE_KEY = 'revenuecat_user_id';

  try {
    const existingId = localStorage.getItem(STORAGE_KEY);
    if (existingId) {
      return existingId;
    }

    const newId = generateAnonymousUserId();
    localStorage.setItem(STORAGE_KEY, newId);
    return newId;
  } catch {
    // localStorage unavailable (e.g., private browsing)
    return generateAnonymousUserId();
  }
};

let isInitialized = false;

/**
 * Initializes RevenueCat SDK with anonymous user ID.
 * Safe to call multiple times - will only initialize once.
 */
export const initRevenueCat = async (): Promise<void> => {
  if (isInitialized || !canInitializeRevenueCat()) {
    return;
  }

  const userId = getOrCreateUserId();
  if (!Purchases) {
    const module = await import('@revenuecat/purchases-js');
    Purchases = module.Purchases;
  }
  Purchases.configure(REVENUECAT_API_KEY, userId);
  isInitialized = true;
};

/**
 * Returns the RevenueCat Purchases instance.
 * Must be called after initRevenueCat().
 */
export const getPurchases = (): typeof PurchasesType | null => Purchases;
