import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/utils/platformDetection', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/platformDetection')>();
  return {
    ...actual,
    isNativeWebView: vi.fn(),
  };
});

import { isNativeWebView } from '@/utils/platformDetection';

vi.mock('../stripe', () => ({
  StripeProvider: class {
    platform = 'web' as const;
    name = 'Stripe';
    isAvailable() {
      return true;
    }
    async getProducts() {
      return [];
    }
    async purchase() {
      return { success: true };
    }
    async restorePurchases() {
      return null;
    }
    async openManagement() {}
    async verifyEntitlements() {
      return {
        entitlements: new Set(),
        tier: 'free' as const,
        source: 'stripe' as const,
      };
    }
  },
}));

vi.mock('../iap', () => ({
  AppleIAPProvider: class {
    platform = 'ios' as const;
    name = 'Apple IAP';
    isAvailable() {
      return false;
    }
    async getProducts() {
      return [];
    }
    async purchase() {
      return { success: false, errorCode: 'IAP_NOT_AVAILABLE' as const };
    }
    async restorePurchases() {
      return null;
    }
    async openManagement() {}
    async verifyEntitlements() {
      return {
        entitlements: new Set(),
        tier: 'free' as const,
        source: 'apple' as const,
      };
    }
  },
}));
import {
  detectBillingPlatform,
  getPlatform,
  isNativePlatform,
  canUseWebCheckout,
  getBillingProvider,
} from '../index';

const mockIsNativeWebView = vi.mocked(isNativeWebView);

function setUserAgent(userAgent: string) {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: userAgent,
    configurable: true,
  });
}

describe('billing platform detection', () => {
  beforeEach(() => {
    mockIsNativeWebView.mockReset();
    mockIsNativeWebView.mockReturnValue(false);
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X)');
  });

  it('detects android when running in native webview with Android UA', () => {
    const platform = detectBillingPlatform(
      'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro Build/UP1A; wv)',
      true,
    );

    expect(platform).toBe('android');
  });

  it('detects ios when running in native webview with iOS UA', () => {
    const platform = detectBillingPlatform(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
      true,
    );

    expect(platform).toBe('ios');
  });

  it('defaults to web outside native webview', () => {
    const platform = detectBillingPlatform(
      'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro Build/UP1A; wv)',
      false,
    );

    expect(platform).toBe('web');
  });

  it('treats webview marker as android when Android token is absent from UA', () => {
    const platform = detectBillingPlatform('MyApp/1.0 (Linux; Custom; wv)', true);

    expect(platform).toBe('android');
  });

  it('does not route native shell with stripped OS UA to web (Play billing guard)', () => {
    const platform = detectBillingPlatform('ChravelNative/42 EmbeddedWebKit', true);

    expect(platform).toBe('android');
  });

  it('detects ios for WKWebView-style ua without iPhone|iPad|iPod token', () => {
    const ua =
      'Mozilla/5.0 AppleWebKit/605.1.15 (KHTML, like Gecko) Chravel/1.0 Mobile/15E148';
    const platform = detectBillingPlatform(ua, true);

    expect(platform).toBe('ios');
  });

  it('reports native platform only when runtime resolves ios/android', () => {
    mockIsNativeWebView.mockReturnValue(true);
    setUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro Build/UP1A; wv)');

    expect(getPlatform()).toBe('android');
    expect(isNativePlatform()).toBe(true);
  });
});

describe('android web checkout policy guard', () => {
  beforeEach(() => {
    mockIsNativeWebView.mockReturnValue(true);
    setUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro Build/UP1A; wv)');
  });

  it('blocks web checkout for android consumer tiers', () => {
    expect(canUseWebCheckout('explorer')).toBe(false);
    expect(canUseWebCheckout('frequent-chraveler')).toBe(false);
  });

  it('allows web checkout for android pro tiers (B2B exemption)', () => {
    expect(canUseWebCheckout('pro-starter')).toBe(true);
  });

  it('returns unavailable provider for android consumer purchases', async () => {
    const provider = getBillingProvider('explorer');

    expect(provider.platform).toBe('android');
    expect(provider.isAvailable()).toBe(false);

    const purchase = await provider.purchase({
      productId: 'com.chravel.explorer.monthly',
      tier: 'explorer',
      billingCycle: 'monthly',
      purchaseType: 'subscription',
    });

    expect(purchase.success).toBe(false);
    expect(purchase.errorCode).toBe('IAP_NOT_AVAILABLE');
  });
});
