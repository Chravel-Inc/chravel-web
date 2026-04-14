import { useState, useEffect, useCallback } from 'react';
import type { EntitlementInfo } from '@revenuecat/purchases-js';
import { getCustomerInfo } from '@/integrations/revenuecat/revenuecatClient';

interface CustomerInfoShape {
  entitlements: {
    active: Record<string, EntitlementInfo>;
  };
}

interface UseRevenueCatSubscriptionReturn {
  /** Whether the user has an active subscription */
  isSubscribed: boolean;
  /** Whether subscription data is loading */
  loading: boolean;
  /** Active entitlements */
  entitlements: Record<string, EntitlementInfo>;
  /** Full customer info from RevenueCat */
  customerInfo: CustomerInfoShape | null;
  /** Check if user has a specific entitlement */
  hasEntitlement: (entitlementId: string) => boolean;
  /** Refresh subscription status */
  refresh: () => Promise<void>;
  /** Error if any occurred */
  error: string | null;
}

/**
 * Adapter-backed subscription hook.
 * Native IAP runtime is owned by chravel-mobile, web returns unsupported.
 */
export const useRevenueCatSubscription = (
  entitlementId = 'pro',
): UseRevenueCatSubscriptionReturn => {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfoShape | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomerInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getCustomerInfo();
      if (result.success && result.data) {
        setCustomerInfo(result.data as CustomerInfoShape);
        return;
      }

      setCustomerInfo(null);
      if (result.errorCode && result.errorCode !== 'NOT_SUPPORTED') {
        setError(result.error || 'Failed to check subscription status');
      }
    } catch (err) {
      if (import.meta.env.DEV)
        console.error('[useRevenueCatSubscription] Error fetching customer info:', err);
      setError('Failed to check subscription status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomerInfo();
  }, [fetchCustomerInfo]);

  const hasEntitlement = useCallback(
    (id: string): boolean => {
      if (!customerInfo) return false;
      return !!customerInfo.entitlements.active[id];
    },
    [customerInfo],
  );

  const isSubscribed = customerInfo ? !!customerInfo.entitlements.active[entitlementId] : false;
  const entitlements = customerInfo?.entitlements.active || {};

  return {
    isSubscribed,
    loading,
    entitlements,
    customerInfo,
    hasEntitlement,
    refresh: fetchCustomerInfo,
    error,
  };
};
