import type { SubscriptionTier } from '@/billing/types';

export interface PlanFlags {
  isPaid: boolean;
  isExplorer: boolean;
  isFrequentChraveler: boolean;
  isOrgPro: boolean;
}

export function getPlanFlags(plan: SubscriptionTier, isActive: boolean): PlanFlags {
  if (!isActive) {
    return {
      isPaid: false,
      isExplorer: false,
      isFrequentChraveler: false,
      isOrgPro: false,
    };
  }

  return {
    isPaid: plan !== 'free',
    isExplorer: plan === 'explorer',
    isFrequentChraveler: plan === 'frequent-chraveler',
    isOrgPro: plan.startsWith('pro-'),
  };
}
