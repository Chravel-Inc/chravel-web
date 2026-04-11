import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TripChannel, ChannelMessage } from '../../../types/roleChannels';
import { useToast } from '../../../hooks/use-toast';
import { getDemoChannelsForTrip } from '../../../data/demoChannelData';
import { VirtualizedMessageContainer } from '@/features/chat/components/VirtualizedMessageContainer';
import { MessageItem } from '@/features/chat/components/MessageItem';
import { ChatInput } from '@/features/chat/components/ChatInput';
import { InlineReplyComponent } from '@/features/chat/components/InlineReplyComponent';
import { useLinkPreviews } from '@/features/chat/hooks/useLinkPreviews';
import { useAuth } from '@/hooks/useAuth';
import { getMockAvatar } from '@/utils/mockAvatars';
import { useRoleAssignments } from '@/hooks/useRoleAssignments';
import { useStreamProChannel } from '@/hooks/stream/useStreamProChannel';
import { Button } from '@/components/ui/button';
import {
  mapChannelSendError,
  formatToastDescription,
  validateMessageContent,
} from '@/utils/channelErrors';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useRolePermissions } from '@/hooks/useRolePermissions';
import { Lock, LogOut, MoreVertical } from 'lucide-react';
import type { MessageResponse } from 'stream-chat';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChannelChatViewProps {
  channel: TripChannel;
  availableChannels?: TripChannel[];
  onBack?: () => void;
  onChannelChange?: (channel: TripChannel | null) => void;
}

export const ChannelChatView = ({
  channel,
  availableChannels = [],
  onBack: _onBack,
  onChannelChange,
}: ChannelChatViewProps) => {
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reactions, setReactions] = useState<
    Record<string, Record<string, { count: number; userReacted: boolean; users: string[] }>>
  >({});
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    text: string;
    senderName: string;
  } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { canPerformAction } = useRolePermissions(channel.tripId);
  const { leaveRole } = useRoleAssignments({ tripId: channel.tripId });

  const DEMO_TRIP_IDS = [
    'lakers-road-trip',
    'beyonce-cowboy-carter-tour',
    'eli-lilly-c-suite-retreat-2026',
  ];
  const isDemoChannel = DEMO_TRIP_IDS.includes(channel.tripId);

  const useStreamTransport = !isDemoChannel;
  const streamProChannel = useStreamProChannel(useStreamTransport ? channel.id : null);

  // Handle user leaving the channel/role (self-service)
  const handleLeaveChannel = async () => {
    if (!user?.id || !channel.requiredRoleId) {
      toast({
        title: 'Cannot leave channel',
        description: 'Unable to determine your role assignment',
        variant: 'destructive',
      });
      return;
    }

    setIsLeaving(true);
    try {
      // Use leaveRole for self-service removal (no admin permission required)
      await leaveRole(channel.requiredRoleId);
      toast({
        title: 'Left channel',
        description: `You have left the "${channel.channelName}" channel`,
      });
      setShowLeaveConfirm(false);
      // Navigate back to main messages
      if (onChannelChange) {
        onChannelChange(null);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error leaving channel:', error);
      toast({
        title: 'Failed to leave channel',
        description: 'An error occurred while leaving the channel',
        variant: 'destructive',
      });
    } finally {
      setIsLeaving(false);
    }
  };

  // Transform ChannelMessage to ChatMessage format for MessageItem
  const transportMessages = useMemo<ChannelMessage[]>(() => {
    if (!useStreamTransport) return messages;

    const streamMessages = streamProChannel.messages;
    const streamById = new Map<string, MessageResponse>(
      streamMessages.map(msg => [String(msg.id), msg as MessageResponse]),
    );

    return streamMessages.map(streamMsg => {
      const parentId = streamMsg.parent_id ?? undefined;
      const parent = parentId ? streamById.get(parentId) : undefined;
      const metadata = parent
        ? {
            replyTo: {
              id: String(parent.id),
              text: parent.text || '',
              sender: parent.user?.name || 'Unknown',
            },
          }
        : undefined;

      return {
        id: String(streamMsg.id),
        channelId: channel.id,
        senderId: streamMsg.user?.id || '',
        senderName: streamMsg.user?.name || 'Unknown',
        senderAvatar: streamMsg.user?.image,
        content: streamMsg.text || '',
        messageType: 'text',
        metadata,
        createdAt: streamMsg.created_at || new Date().toISOString(),
      };
    });
  }, [channel.id, messages, streamProChannel.messages, useStreamTransport]);

  // Handle opening a reply
  const handleOpenReply = useCallback(
    (messageId: string) => {
      const msg = transportMessages.find(m => m.id === messageId);
      if (!msg) return;
      setReplyingTo({
        id: msg.id,
        text: msg.content,
        senderName: msg.senderName,
      });
    },
    [transportMessages],
  );

  const clearReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Transform ChannelMessage to ChatMessage format for MessageItem
  const transportMessages = useMemo<ChannelMessage[]>(() => {
    if (!useStreamTransport) return messages;

    const streamMessages = streamProChannel.messages;
    const streamById = new Map<string, MessageResponse>(
      streamMessages.map(msg => [String(msg.id), msg as MessageResponse]),
    );

    return streamMessages.map(streamMsg => {
      const parentId = streamMsg.parent_id ?? undefined;
      const parent = parentId ? streamById.get(parentId) : undefined;
      const metadata = parent
        ? {
            replyTo: {
              id: String(parent.id),
              text: parent.text || '',
              sender: parent.user?.name || 'Unknown',
            },
          }
        : undefined;

      return {
        id: String(streamMsg.id),
        channelId: channel.id,
        senderId: streamMsg.user?.id || '',
        senderName: streamMsg.user?.name || 'Unknown',
        senderAvatar: streamMsg.user?.image,
        content: streamMsg.text || '',
        messageType: 'text',
        metadata,
        createdAt: streamMsg.created_at || new Date().toISOString(),
      };
    });
  }, [channel.id, messages, streamProChannel.messages, useStreamTransport]);

  const formattedMessages = useMemo(() => {
    return transportMessages.map(msg => {
      const metadata = msg.metadata as Record<string, unknown> | null;
      const replyTo = metadata?.replyTo as { id: string; text: string; sender: string } | undefined;

      return {
        id: msg.id,
        text: msg.content,
        sender: {
          id: msg.senderId,
          name: msg.senderName,
          avatar: getMockAvatar(msg.senderName),
        },
        createdAt: msg.createdAt,
        isBroadcast: metadata?.isBroadcast || msg.messageType === 'system',
        isPayment: false,
        tags: [] as string[],
        replyTo: replyTo || undefined,
      };
    });
  }, [transportMessages]);

  // Client-side link preview enrichment for channel messages
  const linkPreviews = useLinkPreviews(formattedMessages);

  // Merge link previews into formatted messages
  const messagesWithPreviews = useMemo(() => {
    return formattedMessages.map(msg => ({
      ...msg,
      linkPreview: linkPreviews[msg.id] || undefined,
    }));
  }, [formattedMessages, linkPreviews]);

  const streamReactionMap = useMemo(() => {
    if (!useStreamTransport || !user?.id) {
      return {};
    }

    return streamProChannel.messages.reduce<
      Record<string, Record<string, { count: number; userReacted: boolean; users: string[] }>>
    >((acc, streamMessage) => {
      const counts = (streamMessage.reaction_counts || {}) as Record<string, number>;
      const own = new Set((streamMessage.own_reactions || []).map(reaction => reaction.type));
      const latest = (streamMessage.latest_reactions || []) as Array<{
        type: string;
        user?: { id?: string };
      }>;

      const byType: Record<string, { count: number; userReacted: boolean; users: string[] }> = {};
      Object.entries(counts).forEach(([type, count]) => {
        const users = latest
          .filter(reaction => reaction.type === type && reaction.user?.id)
          .map(reaction => reaction.user!.id as string);
        byType[type] = {
          count,
          userReacted: own.has(type),
          users: Array.from(new Set(users)),
        };
      });

      acc[String(streamMessage.id)] = byType;
      return acc;
    }, {});
  }, [streamProChannel.messages, useStreamTransport, user?.id]);

  useEffect(() => {
    // Demo-only message hydration; non-demo channels are Stream-backed.
    if (!isDemoChannel) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { messagesByChannel } = getDemoChannelsForTrip(channel.tripId);
    const demoMessages = messagesByChannel.get(channel.id) || [];
    setMessages(demoMessages);
    setLoading(false);
  }, [channel.id, channel.tripId, isDemoChannel]);

  const handleSendMessage = async (isBroadcast = false) => {
    if (!inputMessage.trim() || sending) return;

    // Client-side validation
    const validationError = validateMessageContent(inputMessage);
    if (validationError) {
      toast({
        title: validationError.title,
        description: validationError.description,
        variant: 'destructive',
      });
      return;
    }

    // Guard: channel must be selected
    if (!channel?.id) {
      toast({
        title: 'No channel selected',
        description: 'Please select a channel before sending a message.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);

    // Check if this is a demo channel
    const DEMO_TRIP_IDS = [
      'lakers-road-trip',
      'beyonce-cowboy-carter-tour',
      'eli-lilly-c-suite-retreat-2026',
    ];
    if (DEMO_TRIP_IDS.includes(channel.tripId)) {
      // For demo channels, just add the message locally
      const demoMetadata: Record<string, unknown> = {};
      if (isBroadcast) demoMetadata.isBroadcast = true;
      if (replyingTo) {
        demoMetadata.replyTo = {
          id: replyingTo.id,
          text: replyingTo.text,
          sender: replyingTo.senderName,
        };
      }

      const newMsg: ChannelMessage = {
        id: `demo-msg-${Date.now()}`,
        channelId: channel.id,
        senderId: user?.id || 'demo-user',
        senderName: user?.displayName || 'You',
        content: inputMessage.trim(),
        messageType: isBroadcast ? 'system' : 'text',
        metadata: Object.keys(demoMetadata).length > 0 ? demoMetadata : undefined,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, newMsg]);
      setInputMessage('');
      clearReply();
      setSending(false);
      return;
    }

    try {
      if (useStreamTransport) {
        const parentId = replyingTo ? replyingTo.id : undefined;
        const sent = await streamProChannel.sendMessage(inputMessage.trim(), { parentId });
        if (!sent) {
          throw new Error('Failed to send via Stream');
        }
        setInputMessage('');
        clearReply();
        return;
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('[ChannelChatView] Send failed:', error);
      const mapped = mapChannelSendError(error);
      toast({
        title: mapped.title,
        description: formatToastDescription(mapped),
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReaction = useCallback(
    async (messageId: string, reactionType: string) => {
      if (!user?.id) return;

      if (isDemoChannel) {
        // Demo mode: local-only reactions
        setReactions(prev => {
          const updated = { ...prev };
          if (!updated[messageId]) updated[messageId] = {};
          const current = updated[messageId][reactionType] || {
            count: 0,
            userReacted: false,
            users: [],
          };
          const wasReacted = current.userReacted;
          updated[messageId][reactionType] = {
            count: wasReacted ? Math.max(0, current.count - 1) : current.count + 1,
            userReacted: !wasReacted,
            users: wasReacted
              ? current.users.filter(id => id !== user.id)
              : Array.from(new Set([...current.users, user.id])),
          };
          return updated;
        });
        return;
      }

      // Optimistic update (UI only — Stream is canonical for persistence)
      setReactions(prev => {
        const updated = { ...prev };
        if (!updated[messageId]) updated[messageId] = {};
        const current = updated[messageId][reactionType] || {
          count: 0,
          userReacted: false,
          users: [],
        };
        const wasReacted = current.userReacted;
        updated[messageId][reactionType] = {
          count: wasReacted ? Math.max(0, current.count - 1) : current.count + 1,
          userReacted: !wasReacted,
          users: wasReacted
            ? current.users.filter(id => id !== user.id)
            : Array.from(new Set([...current.users, user.id])),
        };
        return updated;
      });

      if (!streamProChannel.activeChannel) {
        return;
      }

      const ownReaction = streamProChannel.activeChannel.state.messages
        .find(msg => msg.id === messageId)
        ?.own_reactions?.some(r => r.type === reactionType);

      if (ownReaction) {
        await streamProChannel.activeChannel.deleteReaction(messageId, reactionType);
      } else {
        await streamProChannel.activeChannel.sendReaction(messageId, { type: reactionType });
      }
    },
    [user?.id, isDemoChannel, streamProChannel.activeChannel],
  );

  // Calculate member count from available channels, with direct DB fallback
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    // First try to get from available channels prop
    if (availableChannels && availableChannels.length > 0) {
      const currentChannel = availableChannels.find(c => c.id === channel.id);
      if (currentChannel?.memberCount && currentChannel.memberCount > 0) {
        setMemberCount(currentChannel.memberCount);
        return;
      }
    }

    // Fallback: query channel_members directly for an accurate count
    if (!channel?.id || isDemoChannel) return;

    const fetchMemberCount = async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { count, error } = await supabase
          .from('channel_members')
          .select('*', { count: 'exact', head: true })
          .eq('channel_id', channel.id);

        if (!error && count !== null && count > 0) {
          setMemberCount(count);
        } else {
          // Also count role-based members via user_trip_roles + channel_role_access
          const { data: roleAccessData } = await supabase
            .from('channel_role_access')
            .select('role_id')
            .eq('channel_id', channel.id);

          if (roleAccessData && roleAccessData.length > 0) {
            const roleIds = roleAccessData.map(r => r.role_id);
            const { data: roleMembers } = await supabase
              .from('user_trip_roles')
              .select('user_id')
              .eq('trip_id', channel.tripId)
              .in('role_id', roleIds);

            if (roleMembers) {
              const uniqueUsers = new Set(roleMembers.map(r => r.user_id));
              setMemberCount(uniqueUsers.size);
            }
          }
        }
      } catch (err) {
        if (import.meta.env.DEV)
          console.error('[ChannelChatView] Failed to fetch member count:', err);
      }
    };

    fetchMemberCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isDemoChannel derived from channel.tripId already in deps
  }, [channel?.id, channel?.tripId, availableChannels]);

  return (
    <>
      {/* Channel Header with Options */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-black/20"
        role="banner"
        aria-label={`Channel ${channel.channelName}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white/80">
            #{channel.channelName.toLowerCase().replace(/\s+/g, '-')}
          </span>
          <span
            className="text-xs bg-white/10 text-white/60 px-1.5 py-0.5 rounded-full"
            aria-label={`${memberCount} ${memberCount === 1 ? 'member' : 'members'}`}
          >
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
          {/* Channel permission indicator */}
          {!canPerformAction('channels', 'can_post') && (
            <span
              className="text-xs bg-gray-700/50 text-gray-400 px-1.5 py-0.5 rounded-full flex items-center gap-1"
              aria-label="View-only access"
            >
              <Lock size={10} />
              View only
            </span>
          )}
          {channel.requiredRoleName && (
            <span
              className="text-xs bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-full"
              aria-label={`Restricted to ${channel.requiredRoleName} role`}
            >
              {channel.requiredRoleName}
            </span>
          )}
        </div>

        {/* Channel Options Dropdown */}
        {!isDemoChannel && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-11 w-11 min-h-[44px] min-w-[44px] p-0 hover:bg-white/10"
                aria-label="Channel options"
              >
                <MoreVertical className="h-4 w-4 text-white/70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-900 border-white/10">
              <DropdownMenuItem
                onClick={() => setShowLeaveConfirm(true)}
                className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Leave Channel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Reuse VirtualizedMessageContainer */}
      <div className="flex-1">
        {useStreamTransport && streamProChannel.isLoading ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4" aria-label="Loading messages">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 bg-white/10 rounded w-24" />
                    <div className="h-2 bg-white/5 rounded w-16" />
                  </div>
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  {i % 2 === 0 && <div className="h-4 bg-white/10 rounded w-1/2" />}
                </div>
              </div>
            ))}
          </div>
        ) : !useStreamTransport && loading ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4" aria-label="Loading messages">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 bg-white/10 rounded w-24" />
                    <div className="h-2 bg-white/5 rounded w-16" />
                  </div>
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  {i % 2 === 0 && <div className="h-4 bg-white/10 rounded w-1/2" />}
                </div>
              </div>
            ))}
          </div>
        ) : transportMessages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-white/5 rounded-full p-4 mb-4">
              <Lock size={24} className="text-gray-500" />
            </div>
            <h3 className="text-sm font-medium text-white/80 mb-1">No messages yet</h3>
            <p className="text-xs text-gray-400 max-w-[240px]">
              Be the first to send a message in #
              {channel.channelName.toLowerCase().replace(/\s+/g, '-')}
            </p>
          </div>
        ) : (
          <VirtualizedMessageContainer
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- message shape differs between channel and chat systems
            messages={messagesWithPreviews as any}
            renderMessage={(message: any) => (
              <MessageItem
                message={message}
                reactions={
                  useStreamTransport ? streamReactionMap[message.id] : reactions[message.id]
                }
                onReaction={handleReaction}
                onReply={handleOpenReply}
              />
            )}
            onLoadMore={() => {}} // Add pagination later
            hasMore={false}
            isLoading={false}
            className="chat-scroll-container native-scroll px-3"
            autoScroll={true}
          />
        )}
      </div>

      {/* Reuse ChatInput with permission check */}
      <div className="bg-black/30 p-3 pb-[env(safe-area-inset-bottom)] md:pb-3">
        {replyingTo && (
          <InlineReplyComponent
            replyTo={{
              id: replyingTo.id,
              text: replyingTo.text,
              senderName: replyingTo.senderName,
            }}
            onCancel={clearReply}
          />
        )}
        {canPerformAction('channels', 'can_post') ? (
          <ChatInput
            inputMessage={inputMessage}
            onInputChange={setInputMessage}
            onSendMessage={handleSendMessage}
            onKeyPress={handleKeyPress}
            apiKey=""
            isTyping={sending}
            tripMembers={[]}
            hidePayments={true}
            isInChannelMode={true}
            isPro={true}
            safeAreaBottom={false}
            tripId={channel.tripId}
          />
        ) : (
          <div
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 flex items-center gap-2 text-gray-400"
            role="status"
            aria-label="View-only access"
          >
            <Lock size={16} aria-hidden="true" />
            <span className="text-sm">You have view-only access to this channel</span>
          </div>
        )}
      </div>

      {/* Leave Channel Confirmation Dialog */}
      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent className="bg-gray-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Leave &quot;{channel.channelName}&quot;?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to leave this channel?</p>
              <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                <li>You will lose access to this channel and its messages</li>
                <li>
                  You will be removed from the &quot;
                  {channel.requiredRoleName || channel.channelName}&quot; role
                </li>
                <li>An admin will need to re-add you if you want to rejoin</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full" disabled={isLeaving}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveChannel}
              disabled={isLeaving}
              className="rounded-full bg-red-600 hover:bg-red-700 text-white"
            >
              {isLeaving ? 'Leaving...' : 'Leave Channel'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
