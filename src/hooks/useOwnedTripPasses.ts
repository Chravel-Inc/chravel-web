import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getCustomerInfo,
  ownedTripPassProductIds,
} from '@/integrations/revenuecat/revenuecatClient';
import { isIOSNativeShell } from '@/utils/platformDetection';

export type OwnedTripPassesStatus = 'idle' | 'loading' | 'ready' | 'unavailable';

interface UseOwnedTripPassesOptions {
  /** Only query while the purchase surface is actually visible. */
  enabled?: boolean;
  isDemoMode?: boolean;
}

export interface OwnedTripPassesState {
  /** Trip Pass SKUs this Apple ID has already bought, whether or not still active. */
  ownedProductIds: string[];
  status: OwnedTripPassesStatus;
  /** True only when ownership is known AND this SKU cannot be bought again. */
  isOwned: (productId: string) => boolean;
  refresh: () => void;
}

/**
 * Which Trip Passes this Apple ID has already bought.
 *
 * Trip Passes are Non-consumable in App Store Connect, which Apple treats as owned permanently.
 * A repeat purchase is resolved without charging and without granting, so the pass window never
 * reopens — offering the buy button again leads to a dead end where the customer taps, is told
 * nothing useful, and gets nothing. This lets the purchase surface hide that path and point at a
 * subscription instead.
 *
 * Deliberately iOS-only. On web the passes are sold through Stripe, which has no ownership model
 * and repurchases fine — gating there would block a sale that works.
 *
 * Fails OPEN. If RevenueCat is unreachable or unconfigured, `status` is 'unavailable' and
 * `isOwned` returns false for everything, so the button stays live. An unnecessary purchase
 * attempt now ends in an accurate ALREADY_OWNED message from `classifyPurchaseGrant`; wrongly
 * hiding the button from a first-time buyer would cost a sale with no such recovery.
 */
export function useOwnedTripPasses(options: UseOwnedTripPassesOptions = {}): OwnedTripPassesState {
  const { enabled = true, isDemoMode = false } = options;
  const [ownedProductIds, setOwnedProductIds] = useState<string[]>([]);
  const [status, setStatus] = useState<OwnedTripPassesStatus>('idle');
  const [reloadToken, setReloadToken] = useState(0);
  const inFlight = useRef(false);

  useEffect(() => {
    // Apple's ownership model is the only reason to ask; skip entirely elsewhere.
    if (!enabled || isDemoMode || !isIOSNativeShell()) {
      setStatus('idle');
      setOwnedProductIds([]);
      return;
    }

    let cancelled = false;
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus('loading');

    void (async () => {
      try {
        const result = await getCustomerInfo(isDemoMode);
        if (cancelled) return;
        if (!result.success || !result.data) {
          setStatus('unavailable');
          setOwnedProductIds([]);
          return;
        }
        setOwnedProductIds(ownedTripPassProductIds(result.data));
        setStatus('ready');
      } catch {
        if (cancelled) return;
        setStatus('unavailable');
        setOwnedProductIds([]);
      } finally {
        inFlight.current = false;
      }
    })();

    return () => {
      cancelled = true;
      inFlight.current = false;
    };
  }, [enabled, isDemoMode, reloadToken]);

  const isOwned = useCallback(
    (productId: string) => status === 'ready' && ownedProductIds.includes(productId),
    [status, ownedProductIds],
  );

  const refresh = useCallback(() => setReloadToken(t => t + 1), []);

  return { ownedProductIds, status, isOwned, refresh };
}
