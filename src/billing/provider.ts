/**
 * Billing provider routing — single source of truth for which payment backend
 * handles checkout on each platform.
 *
 * Policy (confirmed 2026-07-30):
 * - Web / PWA / desktop → Stripe Checkout only (no RevenueCat Web Billing / `rcb_*` keys)
 * - iOS native → RevenueCat + Apple IAP when `APPLE_IAP_ENABLED`
 * - Android native → RevenueCat + Google Play when `GOOGLE_BILLING_ENABLED`
 *
 * The legacy `src/config/revenuecat.ts` web-billing path (`@revenuecat/purchases-js`,
 * `VITE_REVENUECAT_API_KEY`) was removed; native config lives in `src/constants/revenuecat.ts`.
 */

import { BILLING_FLAGS } from '@/billing/config';
import { isRevenueCatConfigured, REVENUECAT_ENABLED } from '@/constants/revenuecat';
import type { NativeBillingPlatform } from '@/utils/platformDetection';

export type BillingProvider = 'stripe' | 'revenuecat' | 'none';

export interface BillingProviderContext {
  platform: NativeBillingPlatform;
}

/**
 * Returns the active checkout provider for the given platform.
 * Web always resolves to Stripe — RevenueCat is native-only in this codebase.
 */
export function getBillingProvider(context: BillingProviderContext): BillingProvider {
  const { platform } = context;

  if (platform === 'web') {
    return 'stripe';
  }

  if (platform === 'ios') {
    if (!BILLING_FLAGS.APPLE_IAP_ENABLED || !REVENUECAT_ENABLED) {
      return BILLING_FLAGS.FALLBACK_TO_WEB ? 'stripe' : 'none';
    }
    if (isRevenueCatConfigured('ios')) {
      return 'revenuecat';
    }
    return BILLING_FLAGS.FALLBACK_TO_WEB ? 'stripe' : 'none';
  }

  if (platform === 'android') {
    if (!BILLING_FLAGS.GOOGLE_BILLING_ENABLED || !REVENUECAT_ENABLED) {
      return BILLING_FLAGS.FALLBACK_TO_WEB ? 'stripe' : 'none';
    }
    if (isRevenueCatConfigured('android')) {
      return 'revenuecat';
    }
    return BILLING_FLAGS.FALLBACK_TO_WEB ? 'stripe' : 'none';
  }

  return 'stripe';
}

/**
 * Guard rail: RevenueCat Web Billing must stay disabled. The deleted
 * `src/config/revenuecat.ts` path must not be reintroduced without an explicit
 * product decision and audit update.
 */
export function isWebRevenueCatBillingEnabled(): boolean {
  return false;
}
