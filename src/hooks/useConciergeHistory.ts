import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useDemoMode } from '@/hooks/useDemoMode';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_CONCIERGE_HISTORY } from '@/mockData/demoConciergeMessages';
import type { ChatMessage } from '@/features/concierge/types';

/**
 * @deprecated Use ChatMessage from '@/features/concierge/types' instead.
 * Kept as alias for backward compatibility.
 */
export type ConciergeChatMessage = ChatMessage;

const VALID_TRIP_ID = /^[a-zA-Z0-9_-]{1,50}$/;

function isValidTripId(tripId: string): boolean {
  return !!tripId && tripId !== 'unknown' && tripId !== '' && VALID_TRIP_ID.test(tripId);
}

/**
 * Fetches the authenticated user's persisted AI concierge history for a trip.
 *
 * In demo mode, returns pre-seeded mock conversation data instead of
 * querying the database (no auth session exists in demo mode).
 *
 * Queries the `ai_queries` table directly (the previous RPC
 * `get_concierge_trip_history` does not exist in the database).
 *
 * Each row in `ai_queries` contains both the user's query and the assistant's
 * response, so we map each row into two ConciergeChatMessage entries.
 */
export function useConciergeHistory(tripId: string): {
  data: ConciergeChatMessage[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const { user } = useAuth();
  const { isDemoMode } = useDemoMode();
  const enabled = isValidTripId(tripId) && (!!user || isDemoMode);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['conciergeHistory', tripId, user?.id ?? 'anon', isDemoMode ? 'demo' : 'live'],
    queryFn: async (): Promise<ConciergeChatMessage[]> => {
      // Demo mode: return pre-seeded mock conversation data
      if (isDemoMode && DEMO_CONCIERGE_HISTORY[tripId]) {
        return DEMO_CONCIERGE_HISTORY[tripId];
      }

      if (!user?.id) return [];

      const { data: rows, error: queryError } = await supabase
        .from('ai_queries')
        .select('id, query_text, response_text, created_at, metadata')
        .eq('trip_id', tripId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (queryError) {
        throw new Error(queryError.message ?? 'Failed to fetch concierge history');
      }

      if (!rows || rows.length === 0) {
        return [];
      }

      const messages: ConciergeChatMessage[] = [];

      rows.forEach((row, idx) => {
        const ts = row.created_at ?? new Date().toISOString();

        // User message
        if (row.query_text) {
          messages.push({
            id: `history-user-${row.id}-${idx}`,
            type: 'user',
            content: row.query_text,
            timestamp: ts,
          });
        }

        // Assistant response — restore rich card data from metadata
        if (row.response_text) {
          const meta = (row as any).metadata as Record<string, unknown> | null;
          const assistantMsg: ConciergeChatMessage = {
            id: `history-assistant-${row.id}-${idx}`,
            type: 'assistant',
            content: row.response_text,
            timestamp: ts,
          };
          if (meta) {
            if (Array.isArray(meta.functionCallPlaces))
              assistantMsg.functionCallPlaces =
                meta.functionCallPlaces as ConciergeChatMessage['functionCallPlaces'];
            if (Array.isArray(meta.functionCallFlights))
              assistantMsg.functionCallFlights =
                meta.functionCallFlights as ConciergeChatMessage['functionCallFlights'];
            if (Array.isArray(meta.functionCallHotels))
              assistantMsg.functionCallHotels =
                meta.functionCallHotels as ConciergeChatMessage['functionCallHotels'];
            if (typeof meta.googleMapsWidget === 'string')
              assistantMsg.googleMapsWidget = meta.googleMapsWidget;
            if (typeof meta.googleMapsWidgetContextToken === 'string')
              assistantMsg.googleMapsWidgetContextToken = meta.googleMapsWidgetContextToken;
            if (Array.isArray(meta.conciergeActions))
              assistantMsg.conciergeActions =
                meta.conciergeActions as ConciergeChatMessage['conciergeActions'];
            if (Array.isArray(meta.sources))
              assistantMsg.sources = meta.sources as ConciergeChatMessage['sources'];
          }
          messages.push(assistantMsg);
        }
      });

      return messages;
    },
    enabled,
    staleTime: 30 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    data: data ?? [],
    isLoading: enabled ? isLoading : false,
    error: error as Error | null,
    refetch,
  };
}
