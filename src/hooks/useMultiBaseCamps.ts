import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface BaseCampRecord {
  id: string;
  trip_id: string;
  address: string;
  place_name?: string | null;
  label?: string | null;
  lat?: number | null;
  lng?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  order_index: number;
}

const keys = {
  trip: (tripId: string) => ['tripBaseCamps', tripId] as const,
  personal: (tripId: string, userId: string) => ['personalBaseCamps', tripId, userId] as const,
};

export const useTripBaseCamps = (tripId: string) =>
  useQuery({
    queryKey: keys.trip(tripId),
    enabled: !!tripId,
    queryFn: async (): Promise<BaseCampRecord[]> => {
      const { data, error } = await supabase
        .from('trip_base_camps')
        .select('*')
        .eq('trip_id', tripId)
        .order('order_index', { ascending: true })
        .order('start_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as BaseCampRecord[];
    },
  });

export const usePersonalBaseCamps = (tripId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: keys.personal(tripId, user?.id ?? 'anon'),
    enabled: !!tripId && !!user,
    queryFn: async (): Promise<BaseCampRecord[]> => {
      const { data, error } = await supabase
        .from('trip_personal_base_camps')
        .select('*')
        .eq('trip_id', tripId)
        .eq('user_id', user!.id)
        .order('order_index', { ascending: true })
        .order('start_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as BaseCampRecord[];
    },
  });
};

export const useCreateTripBaseCamp = (tripId: string) => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: Partial<BaseCampRecord> & { address: string }) => {
      const { data, error } = await supabase
        .from('trip_base_camps')
        .insert({ ...payload, trip_id: tripId, created_by: user?.id })
        .select('*')
        .single();
      if (error) throw error;
      return data as BaseCampRecord;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.trip(tripId) }),
  });
};
