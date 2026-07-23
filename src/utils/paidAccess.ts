export type PaidAccessTier =
  | 'free'
  | 'explorer'
  | 'frequent-chraveler'
  | 'pro-starter'
  | 'pro-growth'
  | 'pro-enterprise';

export type PaidAccessStatus = 'active' | 'trial' | 'expired' | 'inactive' | 'cancelled';

interface PaidAccessInput {
  tier?: PaidAccessTier | null;
  status?: PaidAccessStatus | null;
  /**
   * Server-verified super-admin flag. MUST originate from the server-authoritative
   * `public.is_super_admin()` RPC — i.e. `useSuperAdmin()` or
   * `useConsumerSubscription().isSuperAdmin`. Never pass a value derived from a
   * client-supplied `roles[]`; that would grant paid access from forgeable input.
   */
  isSuperAdmin?: boolean;
}

/**
 * Single source-of-truth for paid feature gating.
 * Any active/trial non-free tier (including trip passes mapped by check-subscription)
 * should be treated as paid access.
 */
export function hasPaidAccess({ tier, status, isSuperAdmin }: PaidAccessInput): boolean {
  if (isSuperAdmin) return true;

  const normalizedTier = tier ?? 'free';
  const normalizedStatus = status ?? 'inactive';

  if (normalizedTier === 'free') return false;

  return normalizedStatus === 'active' || normalizedStatus === 'trial';
}
