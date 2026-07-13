import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  roleChannelService,
  RoleChannel,
  RoleChannelMessage,
} from '../services/roleChannelService';
import { channelService } from '../services/channelService';
import { getDemoChannelsForTrip } from '../data/demoChannelData';
import { TripChannel, ChannelMessage } from '../types/roleChannels';
import { useDemoMode } from './useDemoMode';
import { MockRolesService } from '@/services/mockRolesService';
import { isDemoChannelTripId } from '@/constants/demoTrips';
import { supabase } from '@/integrations/supabase/client';

// Convert RoleChannel to TripChannel (used by callers that need TripChannel format)
const _convertToTripChannel = (channel: RoleChannel): TripChannel => ({
  id: channel.id,
  tripId: channel.tripId,
  channelName: channel.roleName,
  channelSlug: channel.roleName.toLowerCase().replace(/\s+/g, '-'),
  requiredRoleId: 'role-' + channel.id,
  requiredRoleName: channel.roleName,
  isPrivate: true,
  isArchived: false,
  memberCount: channel.memberCount || 0,
  createdBy: channel.createdBy,
  createdAt: channel.createdAt,
  updatedAt: channel.createdAt,
});
// Re-export for external use
export { _convertToTripChannel as convertToTripChannel };

// Convert ChannelMessage to RoleChannelMessage
const convertToRoleChannelMessage = (msg: ChannelMessage): RoleChannelMessage => ({
  id: msg.id,
  channelId: msg.channelId,
  senderId: msg.senderId,
  senderName: msg.senderName,
  senderAvatar: undefined,
  content: msg.content,
  createdAt: msg.createdAt,
});

export const useRoleChannels = (
  tripId: string | undefined,
  _userRole: string,
  roles?: string[],
) => {
  const { isDemoMode } = useDemoMode();
  const [availableChannels, setAvailableChannels] = useState<TripChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<TripChannel | null>(null);
  const [messages, setMessages] = useState<RoleChannelMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoMessages, setDemoMessages] = useState<Map<string, ChannelMessage[]>>(new Map());
  const isDemoTrip = isDemoMode && !!tripId && isDemoChannelTripId(tripId);

  // Load channels for this trip. `silent` skips the isLoading flash so
  // realtime-triggered refetches don't blank the channel list mid-view.
  const loadChannels = useCallback(
    async (opts?: { silent?: boolean }) => {
      // Non-pro trips (and unresolved routes) pass no tripId — nothing to load.
      if (!tripId) {
        setAvailableChannels([]);
        setIsLoading(false);
        return;
      }

      if (!opts?.silent) setIsLoading(true);
      setError(null);

      // DEMO MODE: Load from mock service
      if (isDemoMode || isDemoTrip) {
        // First try mock service (user-created channels)
        const mockChannels = MockRolesService.getChannelsForTrip(tripId);
        if (mockChannels && mockChannels.length > 0) {
          setAvailableChannels(mockChannels);
          setIsLoading(false);
          return;
        }

        // Fallback to demo channels with dynamic generation
        const { channels, messagesByChannel } = getDemoChannelsForTrip(tripId, roles);
        setAvailableChannels(channels);
        setDemoMessages(messagesByChannel);
        setIsLoading(false);
        return;
      }

      // AUTHENTICATED MODE: Fetch from database using proper role-based access check
      try {
        // Use channelService.getAccessibleChannels which properly checks user_trip_roles
        // and channel_role_access to return only channels the user has access to
        const accessibleChannels = await channelService.getAccessibleChannels(tripId);

        // If no channels found, user might not have a role yet - show empty state
        if (!accessibleChannels || accessibleChannels.length === 0) {
          setAvailableChannels([]);
          setIsLoading(false);
          return;
        }

        // Channels already come in TripChannel format from channelService
        setAvailableChannels(accessibleChannels);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load channels';
        // A failed silent (realtime-triggered) refetch keeps the last-known list —
        // blanking it here would falsely evict the active channel on a transient
        // network error.
        if (!opts?.silent) {
          setError(message);
          setAvailableChannels([]);
        }
      }

      setIsLoading(false);
    },
    [tripId, isDemoMode, isDemoTrip, roles],
  );

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  // Realtime: keep the channel list in sync with admin actions (create/rename/
  // archive/delete) and role membership changes made by other users.
  // channel_members and channel_role_access have no trip_id column to filter on,
  // but both are only ever mutated alongside trip_channels (channel CRUD) or
  // user_trip_roles (trigger-derived membership) — so subscribing to those two
  // trip-filtered tables covers every membership mutation path.
  useEffect(() => {
    if (!tripId || isDemoMode || isDemoTrip) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const debouncedReload = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => loadChannels({ silent: true }), 400);
    };

    const channel = supabase
      .channel(`trip_channels_rt:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_channels',
          filter: `trip_id=eq.${tripId}`,
        },
        debouncedReload,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_trip_roles',
          filter: `trip_id=eq.${tripId}`,
        },
        debouncedReload,
      )
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [tripId, isDemoMode, isDemoTrip, loadChannels]);

  // Evict a stale active channel: if the channel being viewed disappears from
  // the refreshed list (archived, deleted, or the viewer's role was removed),
  // close it instead of leaving a dead view mounted on a channel that will
  // reject the next send.
  useEffect(() => {
    if (!activeChannel || isLoading) return;
    if (!availableChannels.some(c => c.id === activeChannel.id)) {
      setActiveChannel(null);
      toast.error(
        `#${activeChannel.channelSlug || activeChannel.channelName} is no longer available`,
        {
          description: 'It was archived, deleted, or your role changed.',
        },
      );
    }
  }, [availableChannels, activeChannel, isLoading]);

  // Load messages when channel changes
  useEffect(() => {
    if (!activeChannel) {
      setMessages([]);
      return;
    }

    if (isDemoTrip) {
      // Load demo messages
      const channelMessages = demoMessages.get(activeChannel.id) || [];
      const roleChannelMessages = channelMessages.map(convertToRoleChannelMessage);
      setMessages(roleChannelMessages);
      return;
    }

    setMessages([]);
  }, [activeChannel, isDemoTrip, demoMessages]);

  const createChannel = async (roleName: string): Promise<boolean> => {
    const channel = await roleChannelService.createRoleChannel(tripId, roleName);
    if (channel) {
      await loadChannels();
      return true;
    }
    return false;
  };

  const deleteChannel = async (channelId: string): Promise<boolean> => {
    const success = await roleChannelService.deleteChannel(channelId);
    if (success) {
      if (activeChannel?.id === channelId) {
        setActiveChannel(null);
      }
      await loadChannels();
      return true;
    }
    return false;
  };

  const archiveChannel = async (channelId: string): Promise<boolean> => {
    const success = await channelService.archiveChannel(channelId);
    if (success) {
      if (activeChannel?.id === channelId) {
        setActiveChannel(null);
      }
      await loadChannels();
      return true;
    }
    return false;
  };

  const updateChannel = async (
    channelId: string,
    updates: { channelName?: string; description?: string; isPrivate?: boolean },
  ): Promise<boolean> => {
    const result = await channelService.updateChannel(channelId, updates);
    if (result) {
      await loadChannels();
      return true;
    }
    return false;
  };

  const sendMessage = async (content: string): Promise<boolean> => {
    if (!activeChannel) return false;

    if (isDemoTrip) {
      // For demo trips, just add the message to the local state
      const newMessage: RoleChannelMessage = {
        id: `demo-msg-${Date.now()}`,
        channelId: activeChannel.id,
        senderId: 'demo-user',
        senderName: 'You',
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, newMessage]);
      return true;
    }

    // Non-demo path is Stream-only in current architecture.
    return false;
  };

  return {
    availableChannels,
    activeChannel,
    messages,
    isLoading,
    error,
    setActiveChannel,
    createChannel,
    deleteChannel,
    archiveChannel,
    updateChannel,
    sendMessage,
    refreshChannels: loadChannels,
  };
};
