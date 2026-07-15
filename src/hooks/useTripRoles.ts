import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { TripRole } from '@/types/roleChannels';
import { useDemoMode } from './useDemoMode';
import { MockRolesService } from '@/services/mockRolesService';
import { useAuth } from './useAuth';
import { tripKeys, QUERY_CACHE_CONFIG } from '@/lib/queryKeys';

interface UseTripRolesProps {
  tripId: string;
  enabled?: boolean;
}

type TripRolesRealtimeEntry = {
  refCount: number;
  channel: RealtimeChannel;
  listeners: Set<() => void>;
};

const tripRolesRealtimeByTrip = new Map<string, TripRolesRealtimeEntry>();

function acquireTripRolesRealtime(tripId: string, onInvalidate: () => void): () => void {
  let entry = tripRolesRealtimeByTrip.get(tripId);
  if (!entry) {
    const listeners = new Set<() => void>();
    const channel = supabase
      .channel(`trip_roles:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_roles',
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          listeners.forEach(listener => listener());
        },
      )
      .subscribe();
    entry = { refCount: 0, channel, listeners };
    tripRolesRealtimeByTrip.set(tripId, entry);
  }

  entry.refCount += 1;
  entry.listeners.add(onInvalidate);

  return () => {
    const current = tripRolesRealtimeByTrip.get(tripId);
    if (!current) return;
    current.listeners.delete(onInvalidate);
    current.refCount -= 1;
    if (current.refCount <= 0) {
      void supabase.removeChannel(current.channel);
      tripRolesRealtimeByTrip.delete(tripId);
    }
  };
}

export async function fetchTripRoles(tripId: string, isDemoMode: boolean): Promise<TripRole[]> {
  if (isDemoMode) {
    const mockRoles = MockRolesService.getRolesForTrip(tripId);
    return mockRoles || [];
  }

  const { data, error } = await supabase
    .from('trip_roles')
    .select(
      `
      *,
      trip_channels:trip_channels!required_role_id(
        id,
        channel_name,
        is_archived
      )
    `,
    )
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const rolesWithCounts = await Promise.all(
    (data || []).map(async role => {
      const { count, error: countError } = await supabase
        .from('user_trip_roles')
        .select('*', { count: 'exact', head: true })
        .eq('trip_id', tripId)
        .eq('role_id', role.id);

      if (countError) throw countError;

      return {
        id: role.id,
        tripId: role.trip_id,
        roleName: role.role_name,
        description: role.description || '',
        permissionLevel: role.permission_level as 'view' | 'edit' | 'admin',
        featurePermissions: role.feature_permissions as unknown as TripRole['featurePermissions'],
        createdBy: role.created_by,
        createdAt: role.created_at,
        updatedAt: role.updated_at,
        memberCount: count || 0,
        channels: (role.trip_channels || []) as unknown as TripRole['channels'],
      };
    }),
  );

  return rolesWithCounts;
}

export const useTripRoles = ({ tripId, enabled = true }: UseTripRolesProps) => {
  const { isDemoMode } = useDemoMode();
  const { user, authState, isHydrated } = useAuth();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const authReady = isDemoMode || (isHydrated && authState === 'authenticated' && !!user?.id);
  const queryEnabled = enabled && !!tripId && authReady;
  const rolesQueryKey = tripKeys.tripRoles(tripId, isDemoMode);

  const {
    data: roles = [],
    isLoading,
    isFetching,
    refetch,
    isError,
    error,
  } = useQuery({
    queryKey: rolesQueryKey,
    queryFn: () => fetchTripRoles(tripId, isDemoMode),
    enabled: queryEnabled,
    staleTime: QUERY_CACHE_CONFIG.tripRoles.staleTime,
    gcTime: QUERY_CACHE_CONFIG.tripRoles.gcTime,
    refetchOnWindowFocus: QUERY_CACHE_CONFIG.tripRoles.refetchOnWindowFocus,
  });

  const isInitialLoading = queryEnabled && isLoading && roles.length === 0;

  useEffect(() => {
    if (isError && error) {
      toast.error('Failed to load roles');
    }
  }, [isError, error]);

  // Ref-counted realtime invalidation — multiple Team-tab surfaces mount this hook;
  // tearing down one instance must not remove the channel for the rest.
  useEffect(() => {
    if (!queryEnabled || !tripId || isDemoMode) return;

    const release = acquireTripRolesRealtime(tripId, () => {
      queryClient.invalidateQueries({ queryKey: rolesQueryKey });
    });

    return release;
  }, [tripId, queryEnabled, isDemoMode, queryClient, rolesQueryKey]);

  const promoteInvalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: rolesQueryKey });
  }, [rolesQueryKey, queryClient]);

  const createRole = useCallback(
    async (
      roleName: string,
      permissionLevel: 'view' | 'edit' | 'admin' = 'edit',
      featurePermissions?: TripRole['featurePermissions'],
    ) => {
      setIsProcessing(true);

      try {
        if (isDemoMode) {
          const existingRoles = MockRolesService.getRolesForTrip(tripId) || [];
          const newRole: TripRole = {
            id: `mock-role-${tripId}-${Date.now()}`,
            tripId,
            roleName,
            description: '',
            permissionLevel,
            featurePermissions: (featurePermissions ?? {}) as TripRole['featurePermissions'],
            createdBy: user?.id || 'demo-user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            memberCount: 0,
          };

          const updatedRoles = [...existingRoles, newRole];
          localStorage.setItem(
            'demo_pro_trip_roles',
            JSON.stringify({
              ...JSON.parse(localStorage.getItem('demo_pro_trip_roles') || '{}'),
              [tripId]: updatedRoles,
            }),
          );

          toast.success('✅ Role created successfully');
          await promoteInvalidate();
          return { success: true, message: 'Role created', role_id: newRole.id };
        }

        const { data, error } = await supabase.rpc('create_trip_role' as const, {
          _trip_id: tripId,
          _role_name: roleName,
          _permission_level: permissionLevel,
          _feature_permissions: (featurePermissions || null) as any,
        });

        if (error) throw error;

        const result = data as { success: boolean; message: string; role_id?: string };
        if (!result.success) throw new Error(result.message);

        toast.success('✅ Role created successfully');
        await promoteInvalidate();
        return result;
      } catch (err) {
        if (import.meta.env.DEV) console.error('Error creating role:', err);
        toast.error(err instanceof Error ? err.message : 'Failed to create role');
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [tripId, isDemoMode, user?.id, promoteInvalidate],
  );

  const updateRole = useCallback(
    async (
      roleId: string,
      updates: {
        roleName?: string;
        permissionLevel?: 'view' | 'edit' | 'admin';
        featurePermissions?: TripRole['featurePermissions'];
      },
    ) => {
      setIsProcessing(true);

      try {
        if (isDemoMode) {
          const existingRoles = MockRolesService.getRolesForTrip(tripId) || [];
          const updatedRoles = existingRoles.map(r => {
            if (r.id !== roleId) return r;
            return {
              ...r,
              ...(updates.roleName !== undefined ? { roleName: updates.roleName } : {}),
              ...(updates.permissionLevel !== undefined
                ? { permissionLevel: updates.permissionLevel }
                : {}),
              ...(updates.featurePermissions !== undefined
                ? { featurePermissions: updates.featurePermissions }
                : {}),
              updatedAt: new Date().toISOString(),
            };
          });

          localStorage.setItem(
            'demo_pro_trip_roles',
            JSON.stringify({
              ...JSON.parse(localStorage.getItem('demo_pro_trip_roles') || '{}'),
              [tripId]: updatedRoles,
            }),
          );

          toast.success('Role updated successfully');
          await promoteInvalidate();
          return { success: true, message: 'Role updated' };
        }

        const updatePayload: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        if (updates.roleName !== undefined) {
          updatePayload.role_name = updates.roleName;
        }
        if (updates.permissionLevel !== undefined) {
          updatePayload.permission_level = updates.permissionLevel;
        }
        if (updates.featurePermissions !== undefined) {
          updatePayload.feature_permissions = updates.featurePermissions;
        }

        // RLS on trip_roles enforces that only trip admins can update
        const { error } = await supabase.from('trip_roles').update(updatePayload).eq('id', roleId);

        if (error) throw error;

        toast.success('Role updated successfully');
        await promoteInvalidate();
        return { success: true, message: 'Role updated' };
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update role');
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [tripId, isDemoMode, promoteInvalidate],
  );

  const deleteRole = useCallback(
    async (roleId: string) => {
      setIsProcessing(true);

      try {
        if (isDemoMode) {
          const existingRoles = MockRolesService.getRolesForTrip(tripId) || [];
          const updatedRoles = existingRoles.filter(r => r.id !== roleId);

          localStorage.setItem(
            'demo_pro_trip_roles',
            JSON.stringify({
              ...JSON.parse(localStorage.getItem('demo_pro_trip_roles') || '{}'),
              [tripId]: updatedRoles,
            }),
          );

          toast.success('Role deleted successfully');
          await promoteInvalidate();
          return { success: true, message: 'Role deleted' };
        }

        const { data, error } = await supabase.rpc('delete_trip_role' as const, {
          _role_id: roleId,
        });

        if (error) throw error;

        const result = data as { success: boolean; message: string };
        if (!result.success) throw new Error(result.message);

        toast.success('Role deleted successfully');
        await promoteInvalidate();
        return result;
      } catch (err) {
        if (import.meta.env.DEV) console.error('Error deleting role:', err);
        toast.error(err instanceof Error ? err.message : 'Failed to delete role');
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [tripId, isDemoMode, promoteInvalidate],
  );

  return {
    roles,
    isLoading: isInitialLoading,
    isFetching,
    isProcessing,
    isError,
    error,
    createRole,
    updateRole,
    deleteRole,
    refetch,
  };
};
