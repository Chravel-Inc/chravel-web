/**
 * Shared Pro checkout entry for marketing surfaces (ForTeams, PricingSection)
 * and in-app Pro upgrade CTAs. Mirrors ConsumerBillingSection / ProUpgradeModal.
 */

import { toast } from 'sonner';
import { createCheckoutSession } from '@/billing/checkout';
import {
  detectNativeBillingPlatform,
  isIOSNativeShell,
  isNativeWebView,
} from '@/utils/platformDetection';
import { purchaseProSubscription } from '@/integrations/revenuecat/revenuecatClient';

export type ProCheckoutTier = 'pro-starter' | 'pro-growth' | 'pro-enterprise';

const ENTERPRISE_MAILTO = 'mailto:billing@chravelapp.com?subject=Enterprise%20Inquiry';

const DEMO_MAILTO = 'mailto:support@chravelapp.com?subject=Chravel%20Pro%20Demo';

/** Open Calendly when configured; otherwise fall back to sales email. */
export function openProDemoScheduler(): void {
  const calendlyUrl = import.meta.env.VITE_CALENDLY_DEMO_URL as string | undefined;
  if (calendlyUrl && /^https:\/\//i.test(calendlyUrl)) {
    window.open(calendlyUrl, '_blank', 'noopener,noreferrer');
    return;
  }
  window.location.href = DEMO_MAILTO;
}

export async function startProCheckout(tier: ProCheckoutTier): Promise<void> {
  if (tier === 'pro-enterprise') {
    window.location.href = ENTERPRISE_MAILTO;
    return;
  }

  if (isIOSNativeShell()) {
    const result = await purchaseProSubscription(tier, 'monthly');
    if (result.success) {
      toast.success('ChravelApp Pro activated!');
    } else if (result.errorCode === 'CANCELLED') {
      // user cancelled — silent
    } else if (!result.supported) {
      toast.error('In-app purchases are not available on this device.');
    } else {
      toast.error(result.error || 'Failed to start purchase.');
    }
    return;
  }

  try {
    const data = await createCheckoutSession({
      tier,
      platform: detectNativeBillingPlatform(navigator.userAgent || '', isNativeWebView()),
    });
    if (data?.url) {
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('Failed to create checkout session');
    }
  } catch (error) {
    toast.error(
      `Failed to start checkout: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
