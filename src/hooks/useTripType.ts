import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isConsumerTrip as isMockConsumerTrip } from '@/utils/tripTierDetector';

export type TripType = 'consumer' | 'pro' | 'event';

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

/**
 * DB-backed trip-type lookup. Falls back to the mock-ID detector for seeded
 * consumer trips (IDs '1'..'12') so demo content keeps working without a fetch.
 *
 * Use this anywhere we need to gate behavior on real (production) trip type —
 * `isConsumerTrip` from tripTierDetector returns true only for mock IDs and
 * must NOT be used for production trips.
 */
export function useTripType(tripId: string | undefined | null): {
  tripType: TripType | null;
  isConsumer: boolean;
  isLoading: boolean;
} {
  const isMockConsumer = !!tripId && isMockConsumerTrip(tripId);
  const enabled = !!tripId && isUuid(tripId);

  const { data, isLoading } = useQuery({
    queryKey: ['tripType', tripId],
    queryFn: async (): Promise<TripType | null> => {
      if (!tripId) return null;
      const { data, error } = await supabase
        .from('trips')
        .select('trip_type')
        .eq('id', tripId)
        .maybeSingle();
      if (error || !data) return null;
      return (data.trip_type as TripType | null) ?? 'consumer';
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  if (isMockConsumer) {
    return { tripType: 'consumer', isConsumer: true, isLoading: false };
  }

  return {
    tripType: data ?? null,
    isConsumer: data === 'consumer',
    isLoading: enabled && isLoading,
  };
}
