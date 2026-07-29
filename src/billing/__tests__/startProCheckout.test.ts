import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/billing/checkout', () => ({
  createCheckoutSession: vi.fn(),
}));

vi.mock('@/integrations/revenuecat/revenuecatClient', () => ({
  purchaseProSubscription: vi.fn(),
}));

vi.mock('@/utils/platformDetection', () => ({
  isIOSNativeShell: vi.fn(() => false),
  isNativeWebView: vi.fn(() => false),
  detectNativeBillingPlatform: vi.fn(() => 'web'),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { createCheckoutSession } from '@/billing/checkout';
import { openProDemoScheduler, startProCheckout } from '../startProCheckout';

describe('startProCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom location.href assignment is stubbed via delete+define in some envs
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  it('routes enterprise to sales mailto', async () => {
    await startProCheckout('pro-enterprise');
    expect(window.location.href).toContain('mailto:billing@chravelapp.com');
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it('opens Stripe checkout for pro-starter on web', async () => {
    vi.mocked(createCheckoutSession).mockResolvedValue({ url: 'https://checkout.stripe.test/s' });
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    await startProCheckout('pro-starter');

    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ tier: 'pro-starter' }),
    );
    expect(openSpy).toHaveBeenCalledWith(
      'https://checkout.stripe.test/s',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('falls back to demo mailto when Calendly env is unset', () => {
    openProDemoScheduler();
    expect(window.location.href).toContain('mailto:support@chravelapp.com');
  });
});
