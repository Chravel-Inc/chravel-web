/**
 * Runtime Feature Flags
 *
 * React hook for runtime feature flags backed by Supabase `feature_flags` table.
 * Enables kill switches that can disable features in < 1 minute without redeployment.
 *
 * Usage:
 *   import { useFeatureFlag } from '@/lib/featureFlags';
 *
 *   function MyComponent() {
 *     const isEnabled = useFeatureFlag('ai_concierge');
 *     if (!isEnabled) return <FeatureDisabledMessage />;
 *     return <AIConcierge />;
 *   }
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FeatureFlagRow {
  key: string;
  enabled: boolean;
  rollout_percentage: number;
}

async function fetchFeatureFlagRow(key: string): Promise<FeatureFlagRow | null> {
  // intentional: feature_flags table not yet in generated Supabase types
  const { data, error } = await (supabase as any)
    .from('feature_flags')
    .select('key, enabled, rollout_percentage')
    .eq('key', key)
    .single();

  if (error || !data) return null;
  return data as FeatureFlagRow;
}

function resolveFeatureFlagEnabled(data: FeatureFlagRow | null, defaultValue: boolean): boolean {
  if (!data) return defaultValue;
  if (!data.enabled) return false;

  // Percentage rollout (deterministic per flag key, not per user)
  if (data.rollout_percentage < 100) {
    const hash = simpleHash(data.key);
    return hash % 100 < data.rollout_percentage;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns whether a feature flag is enabled, along with whether the backing query
 * has settled yet. Use `isPending` to avoid acting on the `defaultValue` during the
 * first fetch (e.g. routing decisions that would flash the wrong screen).
 * Reads from Supabase `feature_flags` table with 60s cache.
 */
export function useFeatureFlagStatus(
  key: string,
  defaultValue: boolean = true,
): { enabled: boolean; isPending: boolean } {
  const { data, isPending } = useQuery({
    queryKey: ['feature-flag', key],
    queryFn: async (): Promise<FeatureFlagRow | null> => fetchFeatureFlagRow(key),
    staleTime: 60_000, // Cache for 1 minute — kill switch takes effect within 60s
    gcTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: true, // Re-check when user returns to tab
  });

  return { enabled: resolveFeatureFlagEnabled(data ?? null, defaultValue), isPending };
}

/**
 * Returns whether a feature flag is enabled.
 * Reads from Supabase `feature_flags` table with 60s cache.
 * Falls back to `defaultValue` if table is unreachable.
 */
export function useFeatureFlag(key: string, defaultValue: boolean = true): boolean {
  return useFeatureFlagStatus(key, defaultValue).enabled;
}

/**
 * Non-React helper for services that need runtime feature-flag checks.
 */
export async function isFeatureFlagEnabled(
  key: string,
  defaultValue: boolean = true,
): Promise<boolean> {
  const data = await fetchFeatureFlagRow(key);
  return resolveFeatureFlagEnabled(data, defaultValue);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simple deterministic hash for rollout percentage calculation */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// ---------------------------------------------------------------------------
// Gradual rollout (per-user cohort + percentage)
//
// Generalizes the per-user rollout pattern from
// `src/services/stream/streamCanary.ts` so ANY feature can ramp from an
// internal-tester cohort -> a deterministic slice of users -> everyone.
//
// Unlike `useFeatureFlag` (whose percentage is hashed per flag KEY, i.e.
// all-or-nothing across the whole user base), this buckets per USER
// (`hash(key:userId) % 100`) so a sub-100% rollout genuinely splits the
// audience and a given user's membership is stable across page loads.
//
// Fail-closed by design: an unreachable or disabled flag means the gated
// feature stays OFF (a new feature should never flash on during an incident).
// Existing `useFeatureFlag` callers are intentionally untouched.
// ---------------------------------------------------------------------------

/** Minimal user shape needed to resolve a gradual rollout. */
export interface GradualFeatureUser {
  id?: string | null;
  email?: string | null;
}

interface GradualFeatureFlagRow {
  key: string;
  enabled: boolean;
  rollout_percentage: number;
  cohort_domains: string[] | null;
  cohort_user_ids: string[] | null;
}

async function fetchGradualFlagRow(key: string): Promise<GradualFeatureFlagRow | null> {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('key, enabled, rollout_percentage, cohort_domains, cohort_user_ids')
    .eq('key', key)
    .maybeSingle();

  if (!error && data) return data as GradualFeatureFlagRow;

  // Defensive fallback: in an environment where the cohort-columns migration has
  // not been applied yet, the select above errors on the unknown columns. Retry
  // with the base columns so percentage rollout still works (cohorts = empty).
  const fallback = await supabase
    .from('feature_flags')
    .select('key, enabled, rollout_percentage')
    .eq('key', key)
    .maybeSingle();

  if (fallback.error || !fallback.data) return null;
  return {
    ...(fallback.data as Pick<GradualFeatureFlagRow, 'key' | 'enabled' | 'rollout_percentage'>),
    cohort_domains: null,
    cohort_user_ids: null,
  };
}

/**
 * Pure rollout decision — exported for direct unit testing (no network/query).
 * Order: disabled/absent -> off; cohort allowlist -> on; then deterministic
 * per-user percentage bucket.
 */
export function resolveGradualFeatureEnabled(
  row: GradualFeatureFlagRow | null,
  user: GradualFeatureUser | null | undefined,
  flagKey: string,
): boolean {
  if (!row || !row.enabled) return false;

  // Cohort allowlist — always in, regardless of rollout_percentage.
  const userId = user?.id ?? undefined;
  if (userId && Array.isArray(row.cohort_user_ids) && row.cohort_user_ids.includes(userId)) {
    return true;
  }
  const domain = user?.email?.split('@')[1]?.toLowerCase().trim();
  if (
    domain &&
    Array.isArray(row.cohort_domains) &&
    row.cohort_domains.some(d => d?.toLowerCase().trim() === domain)
  ) {
    return true;
  }

  const rollout = Math.max(0, Math.min(100, Number(row.rollout_percentage ?? 0)));
  if (rollout >= 100) return true;
  if (rollout <= 0) return false;

  // Anonymous users can't be bucketed deterministically, so they're excluded
  // from a partial rollout (they only see the feature once it reaches 100%).
  if (!userId) return false;
  const bucket = simpleHash(`${flagKey}:${userId}`) % 100;
  return bucket < rollout;
}

/**
 * Gradual-rollout flag with cohort + per-user percentage targeting, plus whether
 * the backing query has settled. Reads `feature_flags` with a 60s cache; the flag
 * row is cached per key (per-user resolution happens after fetch).
 */
export function useGradualFeatureStatus(
  flagKey: string,
  user: GradualFeatureUser | null | undefined,
): { enabled: boolean; isPending: boolean } {
  const { data, isPending } = useQuery({
    queryKey: ['gradual-feature-flag', flagKey],
    queryFn: async (): Promise<GradualFeatureFlagRow | null> => fetchGradualFlagRow(flagKey),
    staleTime: 60_000, // matches useFeatureFlag — kill switch takes effect within 60s
    gcTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: true,
  });

  return { enabled: resolveGradualFeatureEnabled(data ?? null, user, flagKey), isPending };
}

/**
 * Whether a gradual-rollout feature is enabled for this user. Returns `false`
 * while loading (fail-closed) so a gated feature never flashes on before the
 * flag resolves.
 */
export function useGradualFeature(
  flagKey: string,
  user: GradualFeatureUser | null | undefined,
): boolean {
  return useGradualFeatureStatus(flagKey, user).enabled;
}

/**
 * Non-React helper for services that need a one-shot gradual-rollout check.
 */
export async function isGradualFeatureEnabled(
  flagKey: string,
  user: GradualFeatureUser | null | undefined,
): Promise<boolean> {
  const row = await fetchGradualFlagRow(flagKey);
  return resolveGradualFeatureEnabled(row, user, flagKey);
}
