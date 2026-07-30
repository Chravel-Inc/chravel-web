import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Free-tier "taste" allowance: 5 Smart Imports per account (lifetime) before
 * the paywall fires — regardless of trip count.
 *
 * Usage source of truth: `public.smart_import_usage`, written by the smart-import
 * edge functions via `check_and_increment_smart_import_usage` (account-wide sum).
 * This is a client-side presentation gate only — the server keeps enforcing its
 * own quota independently.
 */
export const FREE_SMART_IMPORT_TASTE_LIMIT = 5;

interface SmartImportUsageRow {
  usage_count: number | null;
}

export interface SmartImportTaste {
  usedCount: number;
  canUseFreeImport: boolean;
  remaining: number;
}

/** Pure gate logic — exported for unit tests. */
export const computeSmartImportTaste = (
  rows: SmartImportUsageRow[],
  limit: number = FREE_SMART_IMPORT_TASTE_LIMIT,
): SmartImportTaste => {
  const usedCount = rows.reduce(
    (total: number, row: SmartImportUsageRow) => total + Math.max(0, Number(row.usage_count ?? 0)),
    0,
  );
  const remaining = Math.max(limit - usedCount, 0);
  return { usedCount, canUseFreeImport: usedCount < limit, remaining };
};

const TASTE_FALLBACK: SmartImportTaste = {
  usedCount: 0,
  canUseFreeImport: true,
  remaining: FREE_SMART_IMPORT_TASTE_LIMIT,
};

export const smartImportTasteQueryKey = (userId?: string) => ['smart-import-taste', userId];

/**
 * Account-wide free Smart Import taste. `tripId` is accepted for call-site
 * compatibility (invalidate after an import on a trip) but does not scope the
 * count — usage is summed across all of the user's trips.
 */
export const useSmartImportTaste = (_tripId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: smartImportTasteQueryKey(user?.id),
    queryFn: async (): Promise<SmartImportTaste> => {
      if (!user?.id) return TASTE_FALLBACK;

      const { data: rows, error } = await supabase
        .from('smart_import_usage')
        .select('usage_count')
        .eq('user_id', user.id);

      if (error) {
        // Fail open: the server quota still enforces real limits.
        console.error('Failed to fetch smart import usage:', error);
        return TASTE_FALLBACK;
      }

      return computeSmartImportTaste((rows ?? []) as SmartImportUsageRow[]);
    },
    enabled: !!user?.id,
    staleTime: 10 * 1000,
  });

  const invalidateTaste = (): void => {
    void queryClient.invalidateQueries({
      queryKey: smartImportTasteQueryKey(user?.id),
    });
  };

  return {
    usedCount: data?.usedCount ?? 0,
    canUseFreeImport: data?.canUseFreeImport ?? true,
    remaining: data?.remaining ?? FREE_SMART_IMPORT_TASTE_LIMIT,
    isLoading,
    invalidateTaste,
  };
};
