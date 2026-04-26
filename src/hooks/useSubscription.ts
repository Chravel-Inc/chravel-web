import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  resolveEffectiveEntitlement,
  hasEffectiveAccess,
  type EntitlementSelectorRow,
} from '@/lib/entitlements/selectors';
import { getPlanFlags } from '@/lib/entitlements/planFlags';
import { getTierFromProductId } from '@/constants/stripe';

export interface Subscription {
  plan:
    | 'free'
    | 'explorer'
    | 'frequent-chraveler'
    | 'pro-starter'
    | 'pro-growth'
    | 'pro-enterprise';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired' | 'inactive';
  productId?: string | null;
  currentPeriodEnd?: string | null;
  purchaseType?: 'subscription' | 'pass' | null;
}

/**
 * Hook to manage user subscription status.
 *
 * Checks user_entitlements first (source of truth populated by webhooks),
 * then falls back to profiles table for legacy compatibility.
 */
export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const checkSubscription = async () => {
      try {
        // Primary: check user_entitlements table (populated by Stripe webhook / RevenueCat sync)
        const { data: entitlementRows, error: entError } = await supabase
          .from('user_entitlements')
          .select('plan, status, current_period_end, purchase_type, source, updated_at')
          .eq('user_id', user.id)
          .in('purchase_type', ['subscription', 'pass'])
          .order('updated_at', { ascending: false });

        const entitlement = resolveEffectiveEntitlement(
          entitlementRows as EntitlementSelectorRow[],
        );

        if (!entError && entitlement && entitlement.plan !== 'free') {
          const plan = entitlement.plan as Subscription['plan'];
          const status = entitlement.status as Subscription['status'];
          const periodEnd = entitlement.currentPeriodEnd || null;
          const isStillAccessible = entitlement.hasAccess;

          setSubscription({
            plan: isStillAccessible ? plan : 'free',
            status: isStillAccessible ? status : 'expired',
            currentPeriodEnd: periodEnd,
            purchaseType: (entitlement.purchaseType as Subscription['purchaseType']) || null,
          });
          setLoading(false);
          return;
        }

        // Fallback: check profiles table (legacy path)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('subscription_status, subscription_product_id, subscription_end')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profile) {
          setSubscription({ plan: 'free', status: 'inactive' });
          setLoading(false);
          return;
        }

        let plan: Subscription['plan'] = 'free';
        const productId = profile.subscription_product_id;
        const subStatus = profile.subscription_status;

        const isActive =
          subStatus === 'active' || subStatus === 'trialing' || subStatus === 'past_due';

        if (isActive && productId) {
          plan = getTierFromProductId(productId) as Subscription['plan'];
        }

        setSubscription({
          plan,
          status: isActive ? (subStatus as Subscription['status']) : 'inactive',
          productId,
          currentPeriodEnd: profile.subscription_end || null,
        });
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('Subscription check error:', err);
        }
        setSubscription({ plan: 'free', status: 'inactive' });
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user]);

  const plan = subscription?.plan ?? 'free';
  const status = subscription?.status ?? 'inactive';
  const isActive = hasEffectiveAccess(status, subscription?.currentPeriodEnd ?? null);
  const flags = getPlanFlags(plan, isActive);

  return {
    subscription,
    loading,
    // Convenience booleans (explicit semantics)
    isPaid: flags.isPaid,
    isExplorer: flags.isExplorer,
    isFrequentChraveler: flags.isFrequentChraveler,
    isOrgPro: flags.isOrgPro,
    /** @deprecated Use isPaid or isOrgPro depending on intent. */
    isPro: flags.isOrgPro,
    isProStarter: plan === 'pro-starter' && isActive,
    isProGrowth: plan === 'pro-growth' && isActive,
    isEnterprise: plan === 'pro-enterprise' && isActive,
    isActive,
    isTrialing: status === 'trialing',
    isPastDue: status === 'past_due',
    isCanceled: status === 'canceled',
    isFree: !flags.isPaid,
  };
}
