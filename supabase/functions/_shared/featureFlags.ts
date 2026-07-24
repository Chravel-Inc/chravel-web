/**
 * Edge Function Feature Flags
 *
 * Reads runtime feature flags from the `feature_flags` Supabase table.
 * Use in edge functions to check kill switches before processing requests.
 *
 * Usage:
 *   import { isFeatureEnabled } from '../_shared/featureFlags.ts';
 *
 *   if (!await isFeatureEnabled('ai_concierge')) {
 *     return new Response(JSON.stringify({ error: 'Feature temporarily disabled' }), { status: 503 });
 *   }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Check if a feature flag is enabled.
 *
 * Returns `defaultValue` if the flag table is unreachable. The default is now
 * `false` (fail CLOSED): a kill switch must not silently re-enable a feature when
 * the flag store is unavailable, otherwise an operator's "disable" cannot be
 * relied upon during a database incident (CWE-636). Callers that genuinely prefer
 * availability over the security posture for a non-security flag may pass
 * `defaultValue = true` explicitly.
 */
export async function isFeatureEnabled(
  key: string,
  defaultValue: boolean = false,
): Promise<boolean> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.warn('[FEATURE_FLAGS] Missing Supabase credentials, using default:', defaultValue);
      return defaultValue;
    }

    const client = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await client
      .from('feature_flags')
      .select('enabled')
      .eq('key', key)
      .single();

    if (error || !data) {
      console.warn(`[FEATURE_FLAGS] Could not read flag "${key}":`, error?.message);
      return defaultValue;
    }

    return data.enabled;
  } catch (err) {
    console.warn(`[FEATURE_FLAGS] Error reading flag "${key}":`, err);
    return defaultValue;
  }
}

/**
 * Creates a 503 response for disabled features.
 */
export function createFeatureDisabledResponse(
  featureName: string,
  corsHeaders: Record<string, string> = {},
): Response {
  return new Response(
    JSON.stringify({
      error: `${featureName} is temporarily unavailable. Please try again later.`,
      feature_disabled: true,
    }),
    {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
}

// ---------------------------------------------------------------------------
// Gradual rollout (per-user cohort + percentage) — server mirror of
// `src/lib/featureFlags.ts` `useGradualFeature`. Use in edge functions that must
// gate a feature for a SPECIFIC authenticated user (cohort allowlist -> a
// deterministic slice of users -> everyone), not just an on/off kill switch.
// ---------------------------------------------------------------------------

export interface GradualFeatureUser {
  id?: string | null;
  email?: string | null;
}

/** Same deterministic 32-bit hash used client-side, so bucketing matches. */
function simpleHash(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface GradualFlagRow {
  enabled: boolean;
  rollout_percentage: number;
  cohort_domains: string[] | null;
  cohort_user_ids: string[] | null;
}

function resolveGradual(
  row: GradualFlagRow,
  user: GradualFeatureUser | null | undefined,
  key: string,
): boolean {
  if (!row.enabled) return false;

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

  // Anonymous callers can't be bucketed deterministically -> excluded until 100%.
  if (!userId) return false;
  const bucket = simpleHash(`${key}:${userId}`) % 100;
  return bucket < rollout;
}

/**
 * Whether a gradual-rollout feature is enabled for a specific user.
 *
 * Fails CLOSED (`defaultValue = false`) like `isFeatureEnabled`: an unreachable
 * flag store must not silently grant a gated feature. Includes a defensive
 * fallback for environments where the cohort-columns migration is not yet applied
 * (percentage rollout still works; cohorts treated as empty).
 */
export async function isFeatureEnabledForUser(
  key: string,
  user: GradualFeatureUser | null | undefined,
  defaultValue: boolean = false,
): Promise<boolean> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.warn('[FEATURE_FLAGS] Missing Supabase credentials, using default:', defaultValue);
      return defaultValue;
    }

    const client = createClient(supabaseUrl, supabaseKey);

    const full = await client
      .from('feature_flags')
      .select('enabled, rollout_percentage, cohort_domains, cohort_user_ids')
      .eq('key', key)
      .maybeSingle();

    let row: GradualFlagRow | null = null;
    if (!full.error && full.data) {
      row = full.data as GradualFlagRow;
    } else {
      const base = await client
        .from('feature_flags')
        .select('enabled, rollout_percentage')
        .eq('key', key)
        .maybeSingle();
      if (base.error || !base.data) {
        console.warn(`[FEATURE_FLAGS] Could not read flag "${key}":`, full.error?.message);
        return defaultValue;
      }
      row = {
        enabled: (base.data as { enabled: boolean }).enabled,
        rollout_percentage: (base.data as { rollout_percentage: number }).rollout_percentage,
        cohort_domains: null,
        cohort_user_ids: null,
      };
    }

    return resolveGradual(row, user, key);
  } catch (err) {
    console.warn(`[FEATURE_FLAGS] Error reading flag "${key}":`, err);
    return defaultValue;
  }
}
