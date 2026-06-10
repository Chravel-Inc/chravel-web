import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Free-tier "taste" allowance: 1 Smart Import per trip before the paywall fires.
 *
 * Usage source of truth: `public.smart_import_usage`, written by the smart-import
 * edge functions (scrape-schedule, file-ai-parser, enhanced-ai-parser,
 * scrape-agenda, scrape-lineup) via `check_and_increment_smart_import_usage`.
 * Rows are keyed (user_id, trip_id, usage_month), so we sum `usage_count`
 * across months to get the per-trip total. RLS limits reads to the caller's
 * own rows. This is a client-side presentation gate only — the server keeps
 * enforcing its own per-plan monthly quota independently.
 */
export const FREE_SMART_IMPORT_TASTE_LIMIT = 1;

interface SmartImportUsageRow {
  usage_count: number | null;
}

export interface SmartImportTaste {
  usedCount: number;
  canUseFreeImport: boolean;
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
  return { usedCount, canUseFreeImport: usedCount < limit };
};

const TASTE_FALLBACK: SmartImportTaste = { usedCount: 0, canUseFreeImport: true };

export const smartImportTasteQueryKey = (tripId: string, userId?: string) => [
  'smart-import-taste',
  tripId,
  userId,
];

export const useSmartImportTaste = (tripId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: smartImportTasteQueryKey(tripId, user?.id),
    queryFn: async (): Promise<SmartImportTaste> => {
      if (!user?.id || !tripId) return TASTE_FALLBACK;

      const { data: rows, error } = await supabase
        .from('smart_import_usage')
        .select('usage_count')
        .eq('user_id', user.id)
        .eq('trip_id', tripId);

      if (error) {
        // Fail open: the server quota still enforces real limits.
        console.error('Failed to fetch smart import usage:', error);
        return TASTE_FALLBACK;
      }

      return computeSmartImportTaste((rows ?? []) as SmartImportUsageRow[]);
    },
    enabled: !!user?.id && !!tripId,
    staleTime: 10 * 1000,
  });

  const invalidateTaste = (): void => {
    void queryClient.invalidateQueries({
      queryKey: smartImportTasteQueryKey(tripId, user?.id),
    });
  };

  return {
    usedCount: data?.usedCount ?? 0,
    canUseFreeImport: data?.canUseFreeImport ?? true,
    isLoading,
    invalidateTaste,
  };
};
