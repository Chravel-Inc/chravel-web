import { supabase } from '@/integrations/supabase/client';

export type EffectiveTier =
  | 'free'
  | 'explorer'
  | 'frequent-chraveler'
  | 'pro-starter'
  | 'pro-growth'
  | 'pro-enterprise';

type EntitlementStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';

const PAID_TIERS = new Set<EffectiveTier>([
  'explorer',
  'frequent-chraveler',
  'pro-starter',
  'pro-growth',
  'pro-enterprise',
]);

function isEntitlementActive(status: EntitlementStatus, currentPeriodEnd: string | null): boolean {
  if (status === 'active' || status === 'trialing' || status === 'past_due') return true;
  if (status === 'canceled' && currentPeriodEnd) {
    return new Date(currentPeriodEnd) > new Date();
  }
  return false;
}

function normalizeTier(rawPlan: string | null | undefined): EffectiveTier {
  if (!rawPlan) return 'free';
  if (
    rawPlan === 'explorer' ||
    rawPlan === 'frequent-chraveler' ||
    rawPlan === 'pro-starter' ||
    rawPlan === 'pro-growth' ||
    rawPlan === 'pro-enterprise'
  ) {
    return rawPlan;
  }
  return 'free';
}

function inferTierFromLegacyProfile(profile: {
  subscription_status: string | null;
  subscription_product_id: string | null;
}): EffectiveTier {
  if (profile.subscription_status !== 'active') return 'free';
  if (profile.subscription_product_id?.includes('explorer')) return 'explorer';
  return 'frequent-chraveler';
}

/**
 * Resolve effective tier for client-side UX limits.
 * Source-of-truth is user_entitlements; profiles fallback is kept for legacy rows.
 */
export async function resolveEffectiveTier(userId: string): Promise<EffectiveTier> {
  const { data: entitlement } = await supabase
    .from('user_entitlements')
    .select('plan, status, current_period_end')
    .eq('user_id', userId)
    .eq('purchase_type', 'subscription')
    .maybeSingle();

  if (entitlement) {
    const normalizedTier = normalizeTier(entitlement.plan);
    const status = (entitlement.status as EntitlementStatus) || 'expired';
    const isActive = isEntitlementActive(status, entitlement.current_period_end);
    if (isActive && PAID_TIERS.has(normalizedTier)) {
      return normalizedTier;
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_product_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!profile) return 'free';
  return inferTierFromLegacyProfile(profile);
}
