import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BroadcastComposer } from './BroadcastComposer';
import { BroadcastList } from './BroadcastList';
import { BroadcastFilters } from './BroadcastFilters';
import { Radio, Clock, X } from 'lucide-react';
import { beyonceCowboyCarterTour } from '@/data/pro-trips/beyonceCowboyCarterTour';
import { useDemoMode } from '@/hooks/useDemoMode';
import { useParams } from 'react-router-dom';
import { detectTripTier } from '@/utils/tripTierDetector';
import { useBroadcastFilters } from '../hooks/useBroadcastFilters';
import { broadcastService } from '@/services/broadcastService';
import type { Broadcast } from '@/services/broadcastService';
import { tripKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';
import { useFeatureFlag } from '@/lib/featureFlags';
import { getStreamClient } from '@/services/stream/streamClient';
import { useStreamBroadcasts } from '../../../hooks/stream/useStreamBroadcasts';

const participants = beyonceCowboyCarterTour.participants;

interface BroadcastData {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  location?: string;
  category: 'chill' | 'logistics' | 'urgent' | 'emergency';
  recipients: string;
  responses: {
    coming: number;
    wait: number;
    cant: number;
  };
  userResponse?: 'coming' | 'wait' | 'cant';
}

function mapPriorityToCategory(
  priority: string | null,
): 'chill' | 'logistics' | 'urgent' | 'emergency' {
  switch (priority) {
    case 'urgent':
      return 'urgent';
    case 'reminder':
      return 'logistics';
    case 'fyi':
    default:
      return 'chill';
  }
}

function mapBroadcastToDisplay(
  b: Broadcast,
): BroadcastData & { scheduledFor?: string; createdBy?: string } {
  const metadata = (b.metadata as Record<string, unknown>) || {};
  return {
    id: b.id,
    sender: 'Organizer',
    message: b.message,
    timestamp: new Date(b.created_at),
    location: (metadata.location as string) || undefined,
    category: mapPriorityToCategory(b.priority),
    recipients: (metadata.recipients as string) || 'everyone',
    responses: { coming: 0, wait: 0, cant: 0 },
    scheduledFor: b.scheduled_for,
    createdBy: b.created_by,
  };
}

export const Broadcasts = () => {
  const { tripId, eventId, proTripId } = useParams();
  const { isDemoMode } = useDemoMode();
  const queryClient = useQueryClient();

  const [userResponses, setUserResponses] = useState<Record<string, 'coming' | 'wait' | 'cant'>>(
    {},
  );

  const currentTripId = tripId || eventId || proTripId || 'default-trip';
  const tripTier = detectTripTier(currentTripId);

  const { priority, setPriority, applyFilters, hasActiveFilters, clearFilters } =
    useBroadcastFilters();

  // 🔀 STREAM ROUTING: Use Stream for broadcast delivery when flag is on
  const streamFlagEnabled = useFeatureFlag('stream-chat-broadcasts', false);
  const streamConnected = !!getStreamClient()?.userID;
  const useStream = streamFlagEnabled && streamConnected && !isDemoMode;
  const streamBroadcasts = useStreamBroadcasts(useStream ? currentTripId : undefined);

  const [demoBroadcasts, setDemoBroadcasts] = useState<BroadcastData[]>([
    {
      id: 'mock-1',
      sender: 'Sarah Chen',
      message: 'Just booked my flight, landing at 3:30 on Friday',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      category: 'logistics' as const,
      recipients: 'everyone',
      responses: { coming: 5, wait: 0, cant: 1 },
    },
  ]);

  const { data: dbBroadcasts = [], isLoading } = useQuery({
    queryKey: tripKeys.broadcasts(currentTripId),
    queryFn: () => broadcastService.getTripBroadcasts(currentTripId),
    enabled: !!currentTripId && !isDemoMode,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (isDemoMode || !currentTripId) return;
    const unsub = broadcastService.subscribeToBroadcasts(currentTripId, newBroadcast => {
      queryClient.setQueryData<Broadcast[]>(tripKeys.broadcasts(currentTripId), (prev = []) => [
        newBroadcast,
        ...prev,
      ]);
    });
    return () => {
      unsub();
    };
  }, [currentTripId, isDemoMode, queryClient]);

  const broadcasts: BroadcastData[] = isDemoMode
    ? demoBroadcasts
    : useStream
      ? streamBroadcasts.broadcasts.map((sb: any) => ({
          id: sb.id,
          sender: sb.sender ?? sb.user?.name ?? 'Unknown',
          message: sb.message ?? sb.text ?? '',
          timestamp: new Date(sb.createdAt ?? sb.created_at),
          category: mapPriorityToCategory(sb.priority ?? sb.extra_data?.priority),
          recipients: ((sb.metadata ?? sb.extra_data)?.recipients as string) || 'everyone',
          responses: { coming: 0, wait: 0, cant: 0 },
        }))
      : dbBroadcasts.map(mapBroadcastToDisplay);

  const handleNewBroadcast = (newBroadcast: {
    message: string;
    location?: string;
    category: 'chill' | 'logistics' | 'urgent';
    recipients: string;
  }) => {
    if (isDemoMode) {
      const broadcast: BroadcastData = {
        id: Date.now().toString(),
        sender: 'You',
        message: newBroadcast.message,
        timestamp: new Date(),
        location: newBroadcast.location,
        category: newBroadcast.category,
        recipients: newBroadcast.recipients,
        responses: { coming: 0, wait: 0, cant: 0 },
      };
      setDemoBroadcasts(prev => [broadcast, ...prev]);
    } else {
      if (useStream) {
        const priority =
          newBroadcast.category === 'urgent'
            ? 'urgent'
            : newBroadcast.category === 'logistics'
              ? 'important'
              : 'fyi';
        streamBroadcasts
          .sendBroadcast(newBroadcast.message, priority, {
            recipients: newBroadcast.recipients,
            location: newBroadcast.location,
          })
          .catch(() => {});
      }
      queryClient.invalidateQueries({ queryKey: tripKeys.broadcasts(currentTripId) });
    }
  };

  const handleResponse = (broadcastId: string, response: 'coming' | 'wait' | 'cant') => {
    const _prevResponse = userResponses[broadcastId];
    setUserResponses(prev => ({ ...prev, [broadcastId]: response }));

    // Persist response to database as a reaction
    if (!isDemoMode) {
      broadcastService.addReaction(broadcastId, response).catch(() => {
        // Revert on failure (best-effort)
      });
    }
  };

  const handleDeleteBroadcast = useCallback(
    async (broadcastId: string) => {
      if (isDemoMode) {
        setDemoBroadcasts(prev => prev.filter(b => b.id !== broadcastId));
        return;
      }

      // Soft-delete by updating the broadcast
      const success = await broadcastService.updateBroadcast(broadcastId, {
        is_sent: false,
        metadata: { deleted: true },
      });

      if (success) {
        queryClient.setQueryData<Broadcast[]>(tripKeys.broadcasts(currentTripId), (prev = []) =>
          prev.filter(b => b.id !== broadcastId),
        );
        toast.success('Broadcast deleted');
      } else {
        toast.error('Failed to delete broadcast');
      }
    },
    [isDemoMode, currentTripId, queryClient],
  );

  const handleEditBroadcast = useCallback(
    async (broadcastId: string, newMessage: string) => {
      if (isDemoMode) {
        setDemoBroadcasts(prev =>
          prev.map(b => (b.id === broadcastId ? { ...b, message: newMessage } : b)),
        );
        return;
      }

      const success = await broadcastService.updateBroadcast(broadcastId, {
        message: newMessage,
      });

      if (success) {
        queryClient.setQueryData<Broadcast[]>(tripKeys.broadcasts(currentTripId), (prev = []) =>
          prev.map(b => (b.id === broadcastId ? { ...b, message: newMessage } : b)),
        );
        toast.success('Broadcast updated');
      } else {
        toast.error('Failed to update broadcast');
      }
    },
    [isDemoMode, currentTripId, queryClient],
  );

  const recentBroadcasts = broadcasts.filter(broadcast => {
    const hoursDiff = (Date.now() - new Date(broadcast.timestamp).getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 48;
  });

  const filteredBroadcasts = applyFilters(recentBroadcasts);

  // Fetch scheduled (pending) broadcasts separately since they're filtered out of the main feed
  const { data: scheduledBroadcasts = [] } = useQuery({
    queryKey: [...tripKeys.broadcasts(currentTripId), 'scheduled'],
    queryFn: () => broadcastService.getScheduledBroadcasts(currentTripId),
    enabled: !!currentTripId && !isDemoMode,
    staleTime: 30 * 1000,
  });

  const handleCancelScheduled = useCallback(
    async (broadcastId: string) => {
      const success = await broadcastService.cancelScheduledBroadcast(broadcastId);
      if (success) {
        queryClient.invalidateQueries({
          queryKey: [...tripKeys.broadcasts(currentTripId), 'scheduled'],
        });
        toast.success('Scheduled broadcast cancelled');
      } else {
        toast.error('Failed to cancel scheduled broadcast');
      }
    },
    [currentTripId, queryClient],
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-6">
        <Radio size={24} className="text-blue-400 flex-shrink-0" />
        <div>
          <h2 className="text-xl font-semibold text-white">Broadcasts</h2>
          <p className="text-slate-400 text-sm">Quick updates and alerts for the group</p>
        </div>
      </div>

      {/* Scheduled broadcasts indicator */}
      {scheduledBroadcasts.length > 0 && (
        <div className="mb-4 p-3 bg-blue-600/10 border border-blue-500/30 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
            <Clock size={14} />
            <span>
              {scheduledBroadcasts.length} scheduled broadcast
              {scheduledBroadcasts.length > 1 ? 's' : ''} pending
            </span>
          </div>
          {scheduledBroadcasts.map(sb => (
            <div
              key={sb.id}
              className="flex items-center justify-between gap-2 pl-6 text-xs text-slate-300"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Clock size={10} className="text-slate-500 flex-shrink-0" />
                <span className="truncate">
                  {sb.message.substring(0, 60)}
                  {sb.message.length > 60 ? '...' : ''}
                </span>
                <span className="text-slate-500 flex-shrink-0">
                  {sb.scheduled_for
                    ? new Date(sb.scheduled_for).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : ''}
                </span>
              </div>
              <button
                onClick={() => handleCancelScheduled(sb.id)}
                className="text-slate-500 hover:text-red-400 flex-shrink-0 p-1"
                title="Cancel scheduled broadcast"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <BroadcastComposer
        participants={participants}
        tripTier={tripTier}
        tripId={currentTripId}
        onSend={handleNewBroadcast}
      />

      <BroadcastFilters
        priority={priority}
        onPriorityChange={setPriority}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />

      {!isDemoMode && isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 gold-gradient-spinner" />
        </div>
      ) : (
        <BroadcastList
          broadcasts={filteredBroadcasts}
          userResponses={userResponses}
          onRespond={handleResponse}
          onDelete={handleDeleteBroadcast}
          onEdit={handleEditBroadcast}
        />
      )}

      {recentBroadcasts.length > 0 && (
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
            <Clock size={12} />
            Showing broadcasts from the last 48 hours
          </div>
        </div>
      )}
    </div>
  );
};
