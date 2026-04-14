import { supabase } from '@/integrations/supabase/client';
import {
  resolveEffectiveEntitlement,
  type EntitlementSelectorRow,
} from '@/lib/entitlements/selectors';
import { getTierFromProductId } from '@/constants/stripe';

export type EffectiveTier =
  | 'free'
  | 'explorer'
  | 'frequent-chraveler'
  | 'pro-starter'
  | 'pro-growth'
  | 'pro-enterprise';

const PAID_TIERS = new Set<EffectiveTier>([
  'explorer',
  'frequent-chraveler',
  'pro-starter',
  'pro-growth',
  'pro-enterprise',
]);

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
  if (!profile.subscription_product_id) return 'free';
  return normalizeTier(getTierFromProductId(profile.subscription_product_id));
}

/**
 * Resolve effective tier for client-side UX limits.
 * Source-of-truth is user_entitlements; profiles fallback is kept for legacy rows.
 */
export async function resolveEffectiveTier(userId: string): Promise<EffectiveTier> {
  const { data: entitlementRows } = await supabase
    .from('user_entitlements')
    .select('plan, status, current_period_end, purchase_type, source, updated_at')
    .eq('user_id', userId)
    .in('purchase_type', ['subscription', 'pass'])
    .order('updated_at', { ascending: false });

  const entitlement = resolveEffectiveEntitlement(entitlementRows as EntitlementSelectorRow[]);
  if (entitlement) {
    const normalizedTier = normalizeTier(entitlement.plan);
    if (entitlement.hasAccess && PAID_TIERS.has(normalizedTier)) {
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
