/**
 * Unified Entitlements Store
 *
 * Single source of truth for user subscription state.
 * Works across demo mode, RevenueCat (iOS/Android), and Stripe (web).
 * Super admins always get full access regardless of entitlements table.
 */

import { create } from 'zustand';
import type { SubscriptionTier, EntitlementId, PurchaseType } from '@/billing/types';
import { supabase } from '@/integrations/supabase/client';
import { TIER_ENTITLEMENTS } from '@/billing/config';
import { isSuperAdminEmail } from '@/utils/isSuperAdmin';
import { pickPrimaryEntitlement, type EntitlementSelectorRow } from '@/lib/entitlements/selectors';
import { getPlanFlags } from '@/lib/entitlements/planFlags';

export type EntitlementSource = 'revenuecat' | 'stripe' | 'admin' | 'demo' | 'none';
export type EntitlementStatus = 'active' | 'trialing' | 'past_due' | 'expired' | 'canceled';

/**
 * Determine if a status + period end combination means the user should still have access.
 *
 * - active / trialing: always has access
 * - past_due: has access (Stripe is retrying payment during grace period)
 * - canceled with future period end: has access until period expires
 * - canceled with past/no period end: no access
 * - expired: no access
 */
export function isEffectivelyActive(status: EntitlementStatus, periodEnd: Date | null): boolean {
  if (status === 'active' || status === 'trialing' || status === 'past_due') return true;
  if (status === 'canceled' && periodEnd && periodEnd > new Date()) return true;
  return false;
}

interface EntitlementsState {
  // State
  plan: SubscriptionTier;
  status: EntitlementStatus;
  source: EntitlementSource;
  currentPeriodEnd: Date | null;
  entitlements: Set<EntitlementId>;
  isLoading: boolean;
  lastSyncedAt: Date | null;
  /** User the current state was synced for — a different userId never hits the warm TTL path. */
  ownerUserId: string | null;
  error: string | null;
  purchaseType: PurchaseType;

  // Computed helpers
  isSubscribed: boolean;
  /** @deprecated Use isPaid or isOrgPro depending on intent. */
  isPro: boolean;
  isPaid: boolean;
  isExplorer: boolean;
  isFrequentChraveler: boolean;
  isOrgPro: boolean;
  isSuperAdmin: boolean;
  daysRemaining: number | null;

  // Actions
  refreshEntitlements: (
    userId: string,
    userEmail?: string,
    options?: { force?: boolean },
  ) => Promise<void>;
  setSuperAdminMode: () => void;
  setDemoMode: (enabled: boolean) => void;
  setFromStripe: (data: {
    tier: SubscriptionTier;
    status: string;
    periodEnd?: Date;
    purchaseType?: PurchaseType;
  }) => void;
  clear: () => void;
}

const DEFAULT_STATE = {
  plan: 'free' as SubscriptionTier,
  status: 'active' as EntitlementStatus,
  source: 'none' as EntitlementSource,
  currentPeriodEnd: null,
  entitlements: new Set<EntitlementId>(),
  isLoading: false,
  lastSyncedAt: null,
  ownerUserId: null as string | null,
  error: null,
  isSubscribed: false,
  isPro: false,
  isPaid: false,
  isExplorer: false,
  isFrequentChraveler: false,
  isOrgPro: false,
  isSuperAdmin: false,
  purchaseType: 'subscription' as PurchaseType,
  daysRemaining: null as number | null,
};

// Super admin gets all entitlements from the highest tier
const SUPER_ADMIN_TIER: SubscriptionTier = 'pro-enterprise';
const getSuperAdminEntitlements = (): Set<EntitlementId> => {
  // Combine all entitlements from all tiers for super admin
  const allEntitlements = new Set<EntitlementId>();
  Object.values(TIER_ENTITLEMENTS).forEach(tierEnts => {
    tierEnts.forEach(ent => allEntitlements.add(ent));
  });
  return allEntitlements;
};

type SetEntitlementsState = (partial: Partial<EntitlementsState>) => void;

async function performRefresh(
  userId: string,
  userEmail: string | undefined,
  set: SetEntitlementsState,
): Promise<void> {
  set({ isLoading: true, error: null });

  try {
    // SUPER ADMIN CHECK FIRST - email allowlist is the failsafe
    if (userEmail && isSuperAdminEmail(userEmail)) {
      if (import.meta.env.DEV)
        console.log('[EntitlementsStore] Super admin detected by email:', userEmail);
      set({
        ...getPlanFlags(SUPER_ADMIN_TIER, true),
        plan: SUPER_ADMIN_TIER,
        status: 'active',
        source: 'admin',
        currentPeriodEnd: null,
        entitlements: getSuperAdminEntitlements(),
        isLoading: false,
        lastSyncedAt: new Date(),
        ownerUserId: userId,
        error: null,
        isSubscribed: true,
        isPro: true,
        isSuperAdmin: true,
      });
      return;
    }

    // Check user_roles for enterprise_admin role (super admin)
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    // Cast to string for comparison since role is an enum
    const roles = rolesData?.map(r => String(r.role)) || [];
    const hasAdminRole = roles.includes('enterprise_admin');

    if (hasAdminRole) {
      if (import.meta.env.DEV) console.log('[EntitlementsStore] Super admin detected by role');
      set({
        ...getPlanFlags(SUPER_ADMIN_TIER, true),
        plan: SUPER_ADMIN_TIER,
        status: 'active',
        source: 'admin',
        currentPeriodEnd: null,
        entitlements: getSuperAdminEntitlements(),
        isLoading: false,
        lastSyncedAt: new Date(),
        ownerUserId: userId,
        error: null,
        isSubscribed: true,
        isPro: true,
        isSuperAdmin: true,
      });
      return;
    }

    // Fetch from user_entitlements table for regular users
    const { data: rows, error } = await supabase
      .from('user_entitlements')
      .select('*')
      .eq('user_id', userId)
      .in('purchase_type', ['subscription', 'pass'])
      .order('updated_at', { ascending: false });

    if (error) {
      if (import.meta.env.DEV) console.error('[EntitlementsStore] Fetch error:', error);
      set({ isLoading: false, error: error.message });
      return;
    }

    const data = pickPrimaryEntitlement(rows as EntitlementSelectorRow[] | null);

    if (data) {
      const plan = data.plan as SubscriptionTier;
      const status = data.status as EntitlementStatus;
      const tierEntitlements = TIER_ENTITLEMENTS[plan] || [];
      const pType = (data.purchase_type as PurchaseType) || 'subscription';
      const periodEnd = data.current_period_end ? new Date(data.current_period_end) : null;
      const isSubscribed = isEffectivelyActive(status, periodEnd);
      const planFlags = getPlanFlags(plan, isSubscribed);
      const daysLeft = periodEnd
        ? Math.max(0, Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

      set({
        plan,
        status,
        source: data.source as EntitlementSource,
        currentPeriodEnd: periodEnd,
        entitlements: new Set(tierEntitlements),
        isLoading: false,
        lastSyncedAt: new Date(),
        ownerUserId: userId,
        error: null,
        isSubscribed,
        isPro: planFlags.isOrgPro,
        isPaid: planFlags.isPaid,
        isExplorer: planFlags.isExplorer,
        isFrequentChraveler: planFlags.isFrequentChraveler,
        isOrgPro: planFlags.isOrgPro,
        isSuperAdmin: false,
        purchaseType: pType,
        daysRemaining: pType === 'pass' ? daysLeft : null,
      });
    } else {
      // No entitlements record - default to free
      set({
        ...DEFAULT_STATE,
        isLoading: false,
        lastSyncedAt: new Date(),
        ownerUserId: userId,
      });
    }
  } catch (err) {
    if (import.meta.env.DEV) console.error('[EntitlementsStore] Error:', err);
    set({ isLoading: false, error: 'Failed to load entitlements' });
  }
}

// Entitlements change rarely (purchases, plan changes) but useUnifiedEntitlements
// mounts in many components, each re-running the fetch. The TTL absorbs those
// duplicate hits at boot/navigation; purchase paths bypass it with force: true.
const ENTITLEMENTS_TTL_MS = 5 * 60 * 1000;

// Concurrent mounts during the same boot share one in-flight refresh.
let inFlightRefresh: { userId: string; promise: Promise<void> } | null = null;

// Write-generation guard: a refresh may only write state if no newer refresh,
// clear(), or demo/admin override started after it. Without this, a slow
// pre-purchase refresh resolving late overwrites a forced post-purchase one,
// and a previous user's in-flight refresh repopulates the store after
// sign-out cleared it.
let refreshGeneration = 0;

export const useEntitlementsStore = create<EntitlementsState>((set, get) => ({
  ...DEFAULT_STATE,

  refreshEntitlements: async (
    userId: string,
    userEmail?: string,
    options?: { force?: boolean },
  ) => {
    const force = options?.force ?? false;

    if (!force) {
      const { ownerUserId, lastSyncedAt, error: lastError } = get();
      const isFresh =
        ownerUserId === userId &&
        !lastError &&
        lastSyncedAt !== null &&
        Date.now() - lastSyncedAt.getTime() < ENTITLEMENTS_TTL_MS;
      if (isFresh) return;

      if (inFlightRefresh && inFlightRefresh.userId === userId) {
        return inFlightRefresh.promise;
      }
    }

    const myGeneration = ++refreshGeneration;
    const guardedSet: SetEntitlementsState = partial => {
      if (refreshGeneration === myGeneration) set(partial);
    };

    const refreshPromise = performRefresh(userId, userEmail, guardedSet);
    inFlightRefresh = { userId, promise: refreshPromise };
    try {
      await refreshPromise;
    } finally {
      if (inFlightRefresh?.promise === refreshPromise) {
        inFlightRefresh = null;
      }
    }
  },

  setSuperAdminMode: () => {
    // Invalidate any in-flight refresh so its late set() can't overwrite this.
    refreshGeneration += 1;
    set({
      ...getPlanFlags(SUPER_ADMIN_TIER, true),
      plan: SUPER_ADMIN_TIER,
      status: 'active',
      source: 'admin',
      currentPeriodEnd: null,
      entitlements: getSuperAdminEntitlements(),
      isLoading: false,
      error: null,
      isSubscribed: true,
      isPro: true,
      isSuperAdmin: true,
    });
  },

  setDemoMode: (enabled: boolean) => {
    // Invalidate any in-flight refresh so its late set() can't overwrite this.
    refreshGeneration += 1;
    if (enabled) {
      // Demo mode gets full access
      const demoTier: SubscriptionTier = 'frequent-chraveler';
      const tierEntitlements = TIER_ENTITLEMENTS[demoTier] || [];

      set({
        ...getPlanFlags(demoTier, true),
        plan: demoTier,
        status: 'active',
        source: 'demo',
        currentPeriodEnd: null,
        entitlements: new Set(tierEntitlements),
        isLoading: false,
        // Demo state is an override, never "synced" state: clear the TTL
        // stamps so the refresh after demo exit always hits the server —
        // otherwise a fresh pre-demo stamp keeps the demo plan alive for up
        // to 5 minutes after exiting (demo-mode contamination).
        lastSyncedAt: null,
        ownerUserId: null,
        error: null,
        isSubscribed: true,
        isPro: false,
      });
    } else {
      // Reset to default when demo mode is disabled
      set(DEFAULT_STATE);
    }
  },

  setFromStripe: data => {
    const tierEntitlements = TIER_ENTITLEMENTS[data.tier] || [];
    const validStatuses: EntitlementStatus[] = ['active', 'trialing', 'past_due', 'canceled'];
    const status: EntitlementStatus = validStatuses.includes(data.status as EntitlementStatus)
      ? (data.status as EntitlementStatus)
      : 'expired';
    const pType = data.purchaseType || 'subscription';
    const periodEnd = data.periodEnd || null;
    const isSubscribed = isEffectivelyActive(status, periodEnd);
    const planFlags = getPlanFlags(data.tier, isSubscribed);
    const daysLeft = periodEnd
      ? Math.max(0, Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

    set({
      plan: data.tier,
      status,
      source: 'stripe',
      currentPeriodEnd: periodEnd,
      entitlements: new Set(tierEntitlements),
      isLoading: false,
      lastSyncedAt: new Date(),
      error: null,
      isSubscribed,
      isPro: planFlags.isOrgPro,
      isPaid: planFlags.isPaid,
      isExplorer: planFlags.isExplorer,
      isFrequentChraveler: planFlags.isFrequentChraveler,
      isOrgPro: planFlags.isOrgPro,
      purchaseType: pType,
      daysRemaining: pType === 'pass' ? daysLeft : null,
    });
  },

  clear: () => {
    // Bump the generation so a previous user's in-flight refresh resolving
    // after sign-out cannot repopulate the cleared store.
    refreshGeneration += 1;
    inFlightRefresh = null;
    set(DEFAULT_STATE);
  },
}));
