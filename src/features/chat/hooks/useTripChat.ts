import { useStreamTripChat } from '@/hooks/stream/useStreamTripChat';

/**
 * useTripChat — Stream-backed trip chat entrypoint.
 * Supabase chat path has been fully deprecated.
 */
export const useTripChat = (tripId: string | undefined, options?: { enabled?: boolean }) => {
  const isEnabled = options?.enabled !== false;
  return useStreamTripChat(tripId, { enabled: isEnabled });
};
