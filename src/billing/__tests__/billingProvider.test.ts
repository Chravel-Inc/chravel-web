/**
 * Billing provider routing — locks the Stripe (web) vs RevenueCat (native) split
 * documented in PAYMENTS_AUDIT.md finding #3.
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { BILLING_FLAGS } from '@/billing/config';
import { getBillingProvider, isWebRevenueCatBillingEnabled } from '@/billing/provider';
import { getRevenueCatApiKey, isRevenueCatConfigured } from '@/constants/revenuecat';

describe('billing provider routing', () => {
  it('routes web checkout to Stripe only', () => {
    expect(getBillingProvider({ platform: 'web' })).toBe('stripe');
  });

  it('never enables RevenueCat on web (native-only)', () => {
    expect(isRevenueCatConfigured('web')).toBe(false);
    expect(getRevenueCatApiKey('web')).toBeNull();
    expect(isWebRevenueCatBillingEnabled()).toBe(false);
  });

  it('routes iOS to RevenueCat when Apple IAP is enabled and keys are configured', () => {
    if (!BILLING_FLAGS.APPLE_IAP_ENABLED) {
      expect(getBillingProvider({ platform: 'ios' })).toBe('stripe');
      return;
    }
    const provider = getBillingProvider({ platform: 'ios' });
    expect(['revenuecat', 'stripe']).toContain(provider);
    if (isRevenueCatConfigured('ios')) {
      expect(provider).toBe('revenuecat');
    }
  });

  it('routes Android to Stripe while Google Billing is disabled', () => {
    expect(BILLING_FLAGS.GOOGLE_BILLING_ENABLED).toBe(false);
    expect(getBillingProvider({ platform: 'android' })).toBe('stripe');
  });
});

describe('RevenueCat dual-config regression guards', () => {
  it('does not ship the deleted web-billing config module', () => {
    const legacyPath = resolve(process.cwd(), 'src/config/revenuecat.ts');
    expect(existsSync(legacyPath)).toBe(false);
  });

  it('does not depend on @revenuecat/purchases-js', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(deps['@revenuecat/purchases-js']).toBeUndefined();
  });

  it('does not document a web RevenueCat API key in .env.example', () => {
    const envExample = readFileSync(resolve(process.cwd(), '.env.example'), 'utf8');
    expect(envExample).not.toMatch(/VITE_REVENUECAT_API_KEY/);
    expect(envExample).toMatch(/VITE_REVENUECAT_IOS_API_KEY/);
  });
});
