import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './useAuth';

const FREE_TIER_LIMIT = 1;

type UserTier = 'free' | 'explorer' | 'frequent-chraveler' | 'pro';

interface PdfUsageRpcRow {
  export_count: number | null;
  limit_count: number | null;
  remaining: number | null;
  can_export: boolean | null;
  is_unlimited: boolean | null;
}

interface IncrementPdfUsageRpcRow {
  used_count: number | null;
  remaining: number | null;
  incremented: boolean | null;
  limit_count: number | null;
  can_export: boolean | null;
}

export interface PdfExportUsage {
  exportCount: number;
  limit: number;
  remaining: number;
  hasExported: boolean;
  canExport: boolean;
}

const normalizeRow = <T extends Record<string, unknown>>(value: unknown): T | null => {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== 'object') return null;
  return row as T;
};

const getUsageFallback = (): PdfExportUsage => ({
  exportCount: 0,
  limit: FREE_TIER_LIMIT,
  remaining: FREE_TIER_LIMIT,
  hasExported: false,
  canExport: true,
});

export const usePdfExportUsage = (tripId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: usage,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['pdf-export-usage', tripId, user?.id],
    queryFn: async (): Promise<PdfExportUsage> => {
      if (!user?.id || !tripId) return getUsageFallback();

      const { data, error } = await supabase.rpc('get_trip_pdf_export_usage', {
        p_trip_id: tripId,
      });

      if (error) {
        console.error('Failed to fetch PDF export usage:', error);
        return getUsageFallback();
      }

      const rpcRow = normalizeRow<PdfUsageRpcRow>(data);
      if (!rpcRow) return getUsageFallback();

      const limit = rpcRow.limit_count === null ? -1 : rpcRow.limit_count;
      const exportCount = Math.max(0, Number(rpcRow.export_count ?? 0));
      const remaining =
        limit === -1 ? -1 : Math.max(0, Number(rpcRow.remaining ?? FREE_TIER_LIMIT - exportCount));
      const canExport =
        typeof rpcRow.can_export === 'boolean'
          ? rpcRow.can_export
          : limit === -1 || exportCount < FREE_TIER_LIMIT;

      return {
        exportCount,
        limit,
        remaining,
        hasExported: exportCount > 0,
        canExport,
      };
    },
    enabled: !!user?.id && !!tripId,
    staleTime: 10 * 1000,
  });

  const recordExport = useMutation({
    mutationFn: async () => {
      if (!user?.id || !tripId) return;

      const { data, error } = await supabase.rpc('increment_trip_pdf_export_usage', {
        p_trip_id: tripId,
      });

      if (error) {
        throw error;
      }

      const incrementRow = normalizeRow<IncrementPdfUsageRpcRow>(data);
      if (incrementRow?.incremented === false) {
        throw new Error('Free export limit reached for this trip');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-export-usage', tripId, user?.id] });
    },
  });

  const getUsageStatus = (): {
    status: 'available' | 'used' | 'unlimited';
    message: string;
  } => {
    if (!usage) {
      return { status: 'available', message: 'Loading...' };
    }

    if (usage.limit === -1) {
      return { status: 'unlimited', message: 'Unlimited exports' };
    }

    if (usage.hasExported) {
      return {
        status: 'used',
        message: `Free export used (${usage.exportCount}/${usage.limit})`,
      };
    }

    return {
      status: 'available',
      message: '1 free export available',
    };
  };

  const tier: UserTier = usage?.limit === -1 ? 'pro' : 'free';
  const isPaidUser = usage?.limit === -1;

  return {
    usage,
    isLoading,
    refetch,
    recordExport: recordExport.mutate,
    isRecording: recordExport.isPending,
    getUsageStatus,
    tier,
    isPaidUser,
    canExport: usage?.canExport ?? true,
  };
};
