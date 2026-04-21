/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { toast } from 'sonner';
import { useParams, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { Channel } from 'stream-chat';
import { demoModeService } from '@/services/demoModeService';
import { useDemoMode } from '@/hooks/useDemoMode';
import { useChatComposer } from '../hooks/useChatComposer';
import { useKeyboardHandler } from '@/hooks/useKeyboardHandler';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { ChatInput } from './ChatInput';
import { InlineReplyComponent } from './InlineReplyComponent';
import { VirtualizedMessageContainer } from './VirtualizedMessageContainer';
import { MessageItem } from './MessageItem';
import { MessageSkeleton } from '@/components/mobile/SkeletonLoader';
import { getMockAvatar, defaultAvatar } from '@/utils/mockAvatars';
import { useTripMembers } from '@/hooks/useTripMembers';
import { useTripChat } from '../hooks/useTripChat';
import { useAuth } from '@/hooks/useAuth';
import { hapticService } from '@/services/hapticService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';
import { useRoleChannels } from '@/hooks/useRoleChannels';
import { ChannelChatView } from '@/components/pro/channels/ChannelChatView';
import { TypingIndicator } from './TypingIndicator';
import { TypingIndicatorService } from '@/services/typingIndicatorService';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/mobile/PullToRefreshIndicator';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { parseMessage } from '@/services/chatContentParser';
import { useChatReadReceipts } from '../hooks/useChatReadReceipts';
import { useChatTypingIndicators } from '../hooks/useChatTypingIndicators';
import { useChatReactions } from '../hooks/useChatReactions';
import { MessageTypeBar } from './MessageTypeBar';
import { ChatSearchOverlay } from './ChatSearchOverlay';
import { useEffectiveSystemMessagePreferences } from '@/hooks/useSystemMessagePreferences';
import { useTripType } from '@/hooks/useTripType';
import { ThreadView } from './ThreadView';
import { useTripPrivacyConfig, getEffectivePrivacyMode } from '@/hooks/useTripPrivacyConfig';
import { useTripChatMode } from '@/hooks/useTripChatMode';
import { useLinkPreviews } from '../hooks/useLinkPreviews';
import { useBlockedUsers, useReportContent } from '@/hooks/useUserSafety';
import { getStreamClient } from '@/services/stream/streamClient';
import { messageEvents } from '@/telemetry/events';

interface TripChatProps {
  enableGroupChat?: boolean;
  showBroadcasts?: boolean;
  isEvent?: boolean;
  tripId?: string;
  isPro?: boolean; // 🆕 Flag to enable role channels for enterprise trips
  userRole?: string; // 🆕 User's role for channel access
  participants?: Array<{ id: string; name: string; role?: string }>; // 🆕 Participants with roles for channel generation
}

interface MockMessage {
  id: string;
  text: string;
  sender: { id: string; name: string; avatar?: string };
  createdAt: string;
  isAiMessage?: boolean;
  isBroadcast?: boolean;

  reactions?: { [key: string]: string[] };
  replyTo?: { id: string; text: string; sender: string };
  trip_type?: string;
  sender_name?: string;
  message_content?: string;
  delay_seconds?: number;
  timestamp_offset_days?: number;
  tags?: string[];
}

export const TripChat = React.memo(
  ({
    enableGroupChat: _enableGroupChat = true,
    showBroadcasts: _showBroadcasts = true,
    isEvent = false,
    tripId: tripIdProp,
    isPro = false,
    userRole = 'member',
    participants = [],
  }: TripChatProps) => {
    const [demoMessages, setDemoMessages] = useState<MockMessage[]>([]);

    const [_activeChannelId, _setActiveChannelId] = useState<string | null>(null);

    const [showSearchOverlay, setShowSearchOverlay] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [activeThreadMessage, setActiveThreadMessage] = useState<{
      id: string;
      content: string;
      authorName: string;
      authorAvatar?: string;
      createdAt: string;
      tripId: string;
    } | null>(null);
    const [failedMessages, setFailedMessages] = useState<
      Array<{
        id: string;
        text: string;
        authorName: string;
        messageType?: 'text' | 'broadcast' | 'payment' | 'system';
        createdAtMs: number;
      }>
    >([]);

    const { isOffline } = useOfflineStatus();
    const params = useParams<{ tripId?: string; proTripId?: string; eventId?: string }>();
    const location = useLocation();
    const resolvedTripId = useMemo(() => {
      return tripIdProp || params.tripId || params.proTripId || params.eventId || '';
    }, [tripIdProp, params.tripId, params.proTripId, params.eventId]);

    // Extract navigation context from notification click (if present)
    const chatNavigationContext = (
      location.state as {
        chatNavigationContext?: {
          source?: string;
          notificationId?: string;
          messageId?: string;
          channelId?: string;
          channelType?: string;
          openThreadId?: string;
        };
      } | null
    )?.chatNavigationContext;
    const targetMessageId = chatNavigationContext?.openThreadId || chatNavigationContext?.messageId;

    const demoMode = useDemoMode();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { blockedUserIds, blockUser: blockUserAction, isBlocking } = useBlockedUsers();
    const { reportContent: reportContentAction, isReporting } = useReportContent();

    // ⚡ PERFORMANCE: Skip expensive hooks in demo mode for numeric trip IDs
    const shouldSkipLiveChat = demoMode.isDemoMode && /^\d+$/.test(resolvedTripId);

    // Fetch privacy config for the trip
    const { data: privacyConfig } = useTripPrivacyConfig(
      shouldSkipLiveChat ? undefined : resolvedTripId,
    );

    // Live chat hooks - only initialize for authenticated trips
    const { tripMembers } = useTripMembers(shouldSkipLiveChat ? undefined : resolvedTripId);
    const {
      messages: liveMessages,
      isLoading: liveLoading,
      error: chatError,
      sendMessageAsync: sendTripMessage,
      isCreating: isSendingMessage,
      loadMore: loadMoreMessages,
      hasMore,
      isLoadingMore,
      toggleReaction,
      reload,
      activeChannel: streamActiveChannel,
    } = useTripChat(shouldSkipLiveChat ? undefined : resolvedTripId);

    const { isRefreshing, pullDistance } = usePullToRefresh({
      onRefresh: async () => {
        if (resolvedTripId) {
          if (reload) {
            await reload();
          }
          // Invalidate chat query cache to force fresh fetch
          await queryClient.invalidateQueries({ queryKey: ['tripChat', resolvedTripId] });
        }
      },
    });

    // Chat mode enforcement — UI layer (server-side RLS is authoritative)
    const {
      effectiveChatMode,
      canPost: canPostToChat,
      canUploadMedia,
      isLoading: chatModeLoading,
      userRole: chatModeUserRole,
    } = useTripChatMode(demoMode.isDemoMode ? undefined : resolvedTripId, user?.id, isEvent);

    const isUserAdmin =
      chatModeUserRole === 'admin' ||
      chatModeUserRole === 'organizer' ||
      chatModeUserRole === 'owner';

    // Role channels for pro trips
    const {
      availableChannels,
      activeChannel: roleActiveChannel,
      setActiveChannel: setRoleActiveChannel,
    } = useRoleChannels(isPro ? resolvedTripId : undefined, user?.id || '');

    // Typing indicators + read receipts — must be after all deps are declared
    const { typingUsers, typingServiceRef } = useChatTypingIndicators(
      demoMode.isDemoMode,
      resolvedTripId,
      user,
      effectiveChatMode,
      tripMembers.length,
      streamActiveChannel,
    );

    const { readStatusesByMessage } = useChatReadReceipts(
      demoMode.isDemoMode,
      user?.id,
      resolvedTripId,
      liveMessages,
      streamActiveChannel,
    );

    const streamClient = getStreamClient();

    // Extract Stream-canonical error fields for triage (always logged, even in prod).
    const extractStreamError = (
      error: unknown,
    ): { code?: number | string; status?: number; message: string; data?: unknown } => {
      const err = error as {
        code?: number | string;
        StatusCode?: number;
        status?: number;
        message?: string;
        response?: { data?: { code?: number | string; message?: string } };
      };
      return {
        code: err?.code ?? err?.response?.data?.code,
        status: err?.StatusCode ?? err?.status,
        message: err?.message ?? err?.response?.data?.message ?? 'Unknown Stream error',
        data: err?.response?.data,
      };
    };

    // Find the message-author id so we can pre-check ownership before calling Stream.
    const findMessageAuthorId = useCallback(
      (messageId: string): string | undefined => {
        const msg = liveMessages.find(m => String(m.id) === String(messageId));
        if (!msg) return undefined;
        const candidate = msg as unknown as {
          user?: { id?: string };
          user_id?: string;
          userId?: string;
          sender?: { id?: string };
          author_id?: string;
        };
        return (
          candidate.user?.id ??
          candidate.user_id ??
          candidate.userId ??
          candidate.sender?.id ??
          candidate.author_id
        );
      },
      [liveMessages],
    );

    const handleMessageEdit = useCallback(
      async (messageId: string, newContent: string) => {
        if (demoMode.isDemoMode) return;

        if (!streamClient) {
          toast.error('Chat connection unavailable. Please try again.');
          return;
        }

        // Defensive owner check — Stream rejects owner-scoped ops as 403 if mismatch.
        const authorId = findMessageAuthorId(messageId);
        if (authorId && streamClient.userID && authorId !== streamClient.userID) {
          toast.error('You can only edit your own messages');
          return;
        }

        try {
          await streamClient.updateMessage({
            id: messageId,
            text: newContent,
          });
        } catch (error) {
          const details = extractStreamError(error);
          console.error('[TripChat] Stream updateMessage failed:', {
            code: details.code,
            status: details.status,
            message: details.message,
            data: details.data,
            messageId,
          });
          const codeSuffix = details.code !== undefined ? ` (code ${details.code})` : '';
          toast.error(`Failed to edit message${codeSuffix}`);
        }
      },
      [demoMode.isDemoMode, streamClient, findMessageAuthorId],
    );

    const handleMessageDelete = useCallback(
      async (messageId: string) => {
        if (demoMode.isDemoMode) return;

        if (!streamClient) {
          toast.error('Chat connection unavailable. Please try again.');
          return;
        }

        const authorId = findMessageAuthorId(messageId);
        if (authorId && streamClient.userID && authorId !== streamClient.userID) {
          toast.error('You can only delete your own messages');
          return;
        }

        try {
          await streamClient.deleteMessage(messageId);
        } catch (error) {
          const details = extractStreamError(error);
          console.error('[TripChat] Stream deleteMessage failed:', {
            code: details.code,
            status: details.status,
            message: details.message,
            data: details.data,
            messageId,
          });
          const codeSuffix = details.code !== undefined ? ` (code ${details.code})` : '';
          toast.error(`Failed to delete message${codeSuffix}`);
        }
      },
      [demoMode.isDemoMode, streamClient, findMessageAuthorId],
    );

    // System message preferences — only meaningful for consumer trips. Use the
    // DB-backed tier detector so this works for real (UUID) trips, not just
    // seeded mock IDs.
    const { isConsumer } = useTripType(resolvedTripId);
    const { data: systemMessagePrefs } = useEffectiveSystemMessagePreferences(
      isConsumer ? resolvedTripId : '',
    );

    // Local mutable state derived from hasMore to avoid assigning to a const binding
    const [hasMoreState, setHasMoreState] = useState(hasMore);

    const {
      inputMessage,
      setInputMessage,
      messageFilter,
      setMessageFilter,
      replyingTo,
      setReply,
      clearReply,
      sendMessage,
      filterMessages,
    } = useChatComposer({ tripId: resolvedTripId, demoMode: demoMode.isDemoMode, isEvent });

    // Extract unique roles from participants for channel generation

    const reactionUserNamesById = useMemo(
      () => Object.fromEntries(tripMembers.map(member => [member.id, member.name])),
      [tripMembers],
    );

    const participantRoles = useMemo(() => {
      if (!isPro) return [];
      return [...new Set(participants.map(p => p.role).filter(Boolean))];
    }, [isPro, participants]);

    // Mobile-specific hooks
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const _containerRef = useRef<HTMLDivElement>(null);

    // Handle keyboard visibility for better UX
    const { isKeyboardVisible: _isKeyboardVisible } = useKeyboardHandler({
      preventZoom: true,
      adjustViewport: true,
      onShow: () => {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      },
    });

    // Swipe gestures for mobile navigation
    const swipeRef = useRef<HTMLDivElement>(null);
    useSwipeGesture(swipeRef, {
      onSwipeLeft: () => {
        // Handle swipe left gesture
        hapticService.light();
      },
      onSwipeRight: () => {
        // Handle swipe right gesture
        hapticService.light();
      },
      threshold: 50,
    });

    // Track unread counts with real-time updates
    const { broadcastCount, messageUnreadCount } = useUnreadCounts({
      tripId: resolvedTripId,
      messages: liveMessages,
      userId: user?.id || null,
      enabled: !demoMode.isDemoMode && !!user?.id,
      activeChannel: streamActiveChannel,
    });

    // Note: typing indicators are now fully handled by useChatTypingIndicators hook above

    const liveFormattedMessages = useMemo(() => {
      if (demoMode.isDemoMode) return [];

      // Create a map for quick message lookup for reply resolution
      const messageMap = new Map(liveMessages.map(msg => [msg.id, msg]));

      const topLevelMessages = liveMessages.filter(message => {
        const parentId = (message as any).parent_id || (message as any).reply_to_id;
        return !parentId;
      });

      const currentUserLastReadAt = user?.id
        ? streamActiveChannel?.state?.read?.[user.id]?.last_read
        : undefined;

      return topLevelMessages.map(message => {
        // Stream uses message.user, Supabase used message.user_id / message.author_name
        const streamUser = (message as any).user;
        const msgUserId = streamUser?.id || (message as any).user_id;
        const msgAuthorName = streamUser?.name || (message as any).author_name;
        const msgContent = (message as any).text || (message as any).content || '';
        const msgCreatedAt = (message as any).created_at || new Date().toISOString();
        const msgUpdatedAt = (message as any).updated_at || msgCreatedAt;
        const msgParentId = (message as any).parent_id || (message as any).reply_to_id;
        const customType = (message as any).message_type;
        const replyCount = Number((message as any).reply_count || 0);
        const latestReplyAt = (message as any).latest_reply_at as string | undefined;
        const latestReplies = ((message as any).latest_replies || []) as Array<{ text?: string }>;
        const latestReplyText =
          latestReplies.length > 0 ? latestReplies[latestReplies.length - 1]?.text || '' : '';
        const hasUnreadThreadReplies =
          replyCount > 0 &&
          Boolean(currentUserLastReadAt) &&
          Boolean(latestReplyAt) &&
          new Date(latestReplyAt as string) > new Date(currentUserLastReadAt as string);

        // Media attachment parsing from Stream
        let mediaType: string | undefined;
        let mediaUrl: string | undefined;
        let linkPreview: any = (message as any).link_preview;

        if ((message as any).attachments && (message as any).attachments.length > 0) {
          const firstAttachment = (message as any).attachments[0];
          if (firstAttachment.type === 'image') {
            mediaType = 'image';
            mediaUrl = firstAttachment.image_url || firstAttachment.asset_url;
          } else if (firstAttachment.type === 'video') {
            mediaType = 'video';
            mediaUrl = firstAttachment.asset_url;
          } else if (firstAttachment.type === 'file') {
            mediaType = 'file';
            mediaUrl = firstAttachment.asset_url;
          }

          // URL enrichment attachment = link preview
          const urlAttachment = (message as any).attachments.find(
            (a: any) => a.og_scrape_url || a.title_link,
          );
          if (urlAttachment && !linkPreview) {
            linkPreview = {
              url: urlAttachment.og_scrape_url || urlAttachment.title_link,
              title: urlAttachment.title,
              description: urlAttachment.text,
              image: urlAttachment.image_url || urlAttachment.thumb_url,
            };
          }
        } else {
          mediaType = (message as any).media_type;
          mediaUrl = (message as any).media_url;
        }

        // Reactions formatting from Stream native payload to expected shape
        const formattedReactions: Record<string, any> = {};
        if ((message as any).reaction_counts) {
          for (const [type, count] of Object.entries((message as any).reaction_counts)) {
            formattedReactions[type] = {
              count: count as number,
              userReacted: !!(message as any).own_reactions?.some((r: any) => r.type === type),
              users:
                (message as any).latest_reactions
                  ?.filter((r: any) => r.type === type)
                  .map((r: any) => r.user?.id) || [],
            };
          }
        }

        // Resolve replyTo context if parent_id exists
        let replyTo;
        if (msgParentId) {
          const parentMsg = messageMap.get(msgParentId);
          if (parentMsg) {
            const pStreamUser = (parentMsg as any).user;
            replyTo = {
              id: parentMsg.id,
              text: (parentMsg as any).text || (parentMsg as any).content,
              sender: pStreamUser?.name || (parentMsg as any).author_name,
            };
          }
        }

        // Map Stream's built-in read state
        const readStatuses: any[] = [];
        if (streamActiveChannel?.state?.read) {
          for (const [readerId, readState] of Object.entries(streamActiveChannel.state.read)) {
            // Check if the user read up to or past this message's timestamp
            const readAt = new Date(readState.last_read);
            const msgDate = new Date(msgCreatedAt);
            if (readAt >= msgDate && readerId !== user?.id && readerId !== msgUserId) {
              const member = tripMembers.find(m => m.id === readerId);
              if (member) {
                readStatuses.push({
                  user_id: readerId,
                  read_at: readState.last_read,
                  user: {
                    id: readerId,
                    display_name: member.name,
                    avatar_url: member.avatar,
                  },
                });
              }
            }
          }
        }

        return {
          id: message.id,
          text: msgContent,
          sender: {
            id: msgUserId || msgAuthorName || 'system',
            name: (() => {
              const member = tripMembers.find(m => m.id === (msgUserId || ''));
              if (member) return member.name;
              return msgAuthorName || 'System';
            })(),
            avatar: tripMembers.find(m => m.id === (msgUserId || ''))?.avatar || defaultAvatar,
            userId: msgUserId,
          },
          createdAt: msgCreatedAt,
          isBroadcast: customType === 'broadcast',
          isPayment: customType === 'payment',
          isEdited: msgCreatedAt !== msgUpdatedAt,
          editedAt: msgCreatedAt !== msgUpdatedAt ? msgUpdatedAt : undefined,
          tags: customType === 'system' ? (['system'] as string[]) : ([] as string[]),
          message_type: customType,
          system_event_type: (message as any).system_event_type,
          system_payload: (message as any).system_payload,
          linkPreview,
          replyTo,
          replyCount,
          threadPreviewSnippet: latestReplyText.trim() || undefined,
          hasUnreadThreadReplies,
          mediaType,
          mediaUrl,
          reactions:
            Object.keys(formattedReactions).length > 0
              ? formattedReactions
              : (message as any).reactions,
          readStatuses,
        };
      });
    }, [
      liveMessages,
      demoMode.isDemoMode,
      tripMembers,
      streamActiveChannel?.state?.read,
      user?.id,
    ]);

    const handleSendMessage = async (
      isBroadcast = false,
      isPayment = false,
      paymentData?: any,
      _linkPreview?: any,
      mentionedUserIds?: string[],
    ) => {
      // Transform paymentData if needed to match useChatComposer expectations
      let transformedPaymentData;
      if (isPayment && paymentData) {
        transformedPaymentData = {
          amount: paymentData.amount,
          currency: paymentData.currency,
          description: paymentData.description,
          splitCount: paymentData.splitCount,
          splitParticipants: paymentData.splitParticipants || [],
          paymentMethods: paymentData.paymentMethods || [],
        };
      }

      // Pass replyingTo ID if replying
      const message = await sendMessage({
        isBroadcast,
        isPayment,
        paymentData: transformedPaymentData,
      });

      if (!message) {
        return;
      }

      // Message send: light haptic (native-only, hard-gated).
      void hapticService.light();

      if (demoMode.isDemoMode) {
        setDemoMessages(prev => [...prev, message as MockMessage]);
        return;
      }

      const authorName = user?.displayName || user?.email?.split('@')[0] || 'You';
      const messageType = isBroadcast ? 'broadcast' : isPayment ? 'payment' : 'text';
      try {
        // Use actual privacy mode from trip config
        const effectivePrivacyMode = getEffectivePrivacyMode(privacyConfig);

        await sendTripMessage(
          message.text,
          authorName,
          undefined,
          undefined,
          user?.id,
          effectivePrivacyMode,
          messageType as 'text' | 'broadcast' | 'payment' | 'system',
          replyingTo?.id,
          mentionedUserIds,
        );

        // Auto-parse message for entities (dates, times, locations)
        if (message.text && message.text.trim().length > 10) {
          parseMessage(message.text, resolvedTripId).catch(parseError => {
            if (import.meta.env.DEV) {
              console.warn('[TripChat] Background message parsing failed:', parseError);
            }
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to send message';

        // Restore the draft so the user doesn't lose their message
        setInputMessage(message.text);

        setFailedMessages(prev => [
          ...prev,
          {
            id: `failed-${Date.now()}`,
            text: message.text,
            authorName,
            messageType: messageType as 'text' | 'broadcast' | 'payment' | 'system',
            createdAtMs: Date.now(),
          },
        ]);
        toast.error(isBroadcast ? 'Broadcast failed to send' : 'Message failed to send', {
          description: errorMsg,
        });
        if (import.meta.env.DEV) {
          console.error('[TripChat] Failed to send message:', error);
        }
      }
    };

    const handleRetryFailedMessage = useCallback(
      async (failedId: string) => {
        const failed = failedMessages.find(m => m.id === failedId);
        if (!failed || !user?.id) return;

        const authorName = user.displayName || user.email?.split('@')[0] || 'You';
        const effectivePrivacyMode = getEffectivePrivacyMode(privacyConfig);

        try {
          await sendTripMessage(
            failed.text,
            authorName,
            undefined,
            undefined,
            user.id,
            effectivePrivacyMode,
            failed.messageType || 'text',
          );
          setFailedMessages(prev => prev.filter(m => m.id !== failedId));
        } catch {
          // Keep in failed list; toast from useTripChat
        }
      },
      [failedMessages, user, privacyConfig, sendTripMessage],
    );

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };

    const { reactions, setReactions, handleReaction } = useChatReactions(
      demoMode.isDemoMode,
      user?.id,
      liveMessages,
      toggleReaction,
    );

    const handleOpenThread = (messageId: string) => {
      const message =
        liveFormattedMessages.find(m => m.id === messageId) ||
        demoMessages.find(m => m.id === messageId);
      if (!message) return;

      // For inline reply:
      const content = (message as any).text || (message as any).content || '';
      const authorName =
        (message as any).sender?.name ||
        (message as any).user?.name ||
        (message as any).author_name ||
        'User';

      setReply(messageId, content, authorName);
    };

    const handleActivateThread = useCallback(
      (
        messageId: string,
        source: 'reply_badge' | 'search_result' | 'notification' = 'reply_badge',
      ) => {
        const streamMessage = liveMessages.find(m => m.id === messageId);
        if (streamMessage) {
          const streamUser = (streamMessage as any).user;
          setActiveThreadMessage({
            id: streamMessage.id,
            content: (streamMessage as any).text || '',
            authorName: streamUser?.name || (streamMessage as any).author_name || 'User',
            authorAvatar: streamUser?.image,
            createdAt: (streamMessage as any).created_at || new Date().toISOString(),
            tripId: resolvedTripId,
          });
          if (!demoMode.isDemoMode) {
            messageEvents.threadOpened({
              trip_id: resolvedTripId,
              parent_message_id: messageId,
              source,
            });
          }
          return;
        }

        const demoMessage = demoMessages.find(m => m.id === messageId);
        if (!demoMessage) return;
        setActiveThreadMessage({
          id: demoMessage.id,
          content: demoMessage.text || '',
          authorName: demoMessage.sender?.name || 'User',
          authorAvatar: demoMessage.sender?.avatar,
          createdAt: demoMessage.createdAt,
          tripId: resolvedTripId,
        });
      },
      [demoMode.isDemoMode, liveMessages, demoMessages, resolvedTripId],
    );

    useEffect(() => {
      if (!user?.id || failedMessages.length === 0 || liveMessages.length === 0) return;

      const matchingLiveMessages = liveMessages
        .map(msg => {
          const streamUser = (msg as any).user;
          return {
            text: ((msg as any).text || '').trim(),
            userId: streamUser?.id || (msg as any).user_id,
            createdAtMs: new Date((msg as any).created_at || 0).getTime(),
          };
        })
        .filter(msg => msg.userId === user.id && msg.text.length > 0);

      if (matchingLiveMessages.length === 0) return;

      setFailedMessages(prev =>
        prev.filter(failed => {
          const failedText = failed.text.trim();
          return !matchingLiveMessages.some(
            live =>
              live.text === failedText && Math.abs(live.createdAtMs - failed.createdAtMs) <= 5000,
          );
        }),
      );
    }, [failedMessages.length, liveMessages, user?.id]);

    // ⚡ PERFORMANCE: Synchronous demo message loading (no unnecessary async wrapper)
    useEffect(() => {
      if (!demoMode.isDemoMode) {
        setDemoMessages([]);
        return;
      }

      // Detect if this is a Pro or Event trip
      const isProTripContext = isPro || params.proTripId;
      const isEventContext = isEvent || params.eventId;

      let demoMessagesData;

      if (isProTripContext) {
        demoMessagesData = demoModeService.getProMockMessages('pro', user?.id || 'demo-user');
      } else if (isEventContext) {
        demoMessagesData = demoModeService.getProMockMessages('event', user?.id || 'demo-user');
      } else {
        demoMessagesData = demoModeService.getMockMessages(
          'friends-trip',
          true,
          user?.id || 'demo-user',
        );
      }

      const formattedMessages = demoMessagesData.map(msg => ({
        id: msg.id,
        text: msg.message_content || '',
        sender: {
          id: msg.sender_id || msg.sender_name || msg.id,
          name: msg.sender_name || 'Unknown',
          avatar: getMockAvatar(msg.sender_name || 'Unknown'),
        },
        createdAt: new Date(Date.now() - (msg.timestamp_offset_days || 0) * 86400000).toISOString(),
        isBroadcast:
          msg.tags?.includes('broadcast') ||
          msg.tags?.includes('logistics') ||
          msg.tags?.includes('urgent') ||
          false,
        trip_type: msg.trip_type,
        sender_name: msg.sender_name,
        message_content: msg.message_content,
        delay_seconds: msg.delay_seconds,
        timestamp_offset_days: msg.timestamp_offset_days,
        tags: msg.tags,
      }));

      setDemoMessages(formattedMessages);
    }, [demoMode.isDemoMode, isPro, isEvent, params.proTripId, params.eventId, user?.id]);

    // Auto-select first channel when switching to 'channels' filter
    useEffect(() => {
      if (messageFilter === 'channels' && availableChannels.length > 0 && !roleActiveChannel) {
        // Sort alphabetically and select first
        const sortedChannels = [...availableChannels].sort((a, b) =>
          a.channelName.localeCompare(b.channelName),
        );
        setRoleActiveChannel(sortedChannels[0]);
      }
    }, [messageFilter, availableChannels, roleActiveChannel, setRoleActiveChannel]);

    // Determine which messages to show - authenticated trips show ONLY live messages
    const messagesToShow = demoMode.isDemoMode ? demoMessages : liveFormattedMessages;

    const filteredMessages = filterMessages(messagesToShow as any);

    const visibleMessages = useMemo(() => {
      if (blockedUserIds.length === 0) return filteredMessages;
      return filteredMessages.filter(
        (msg: any) => !msg.sender?.id || !blockedUserIds.includes(msg.sender.id),
      );
    }, [filteredMessages, blockedUserIds]);

    const messagesWithFailed = useMemo(() => {
      if (failedMessages.length === 0) return visibleMessages;
      const failedFormatted = failedMessages.map(fm => ({
        id: fm.id,
        text: fm.text,
        sender: { id: user?.id || 'unknown', name: fm.authorName, avatar: user?.avatar },
        createdAt: new Date().toISOString(),
        status: 'failed' as const,
        linkPreview: undefined as undefined,
      }));
      return [...visibleMessages, ...failedFormatted];
    }, [visibleMessages, failedMessages, user?.id, user?.avatar]);

    const linkPreviewFallbacks = useLinkPreviews(
      messagesWithFailed.map(message => ({
        id: message.id,
        text: message.text || '',
        linkPreview: message.linkPreview,
      })),
    );

    const messagesWithPreviewFallbacks = useMemo(
      () =>
        messagesWithFailed.map(message => ({
          ...message,
          linkPreview: message.linkPreview || linkPreviewFallbacks[message.id],
        })),
      [messagesWithFailed, linkPreviewFallbacks],
    );

    const isLoading = demoMode.isDemoMode ? false : liveLoading;

    // Scroll to specific message with highlight animation
    const scrollToMessage = ({
      id: targetId,
      type,
      openThread = false,
    }: {
      id: string;
      type: 'message' | 'broadcast';
      openThread?: boolean;
    }) => {
      setShowSearchOverlay(false);

      // Switch to appropriate filter
      if (type === 'broadcast' && messageFilter !== 'broadcasts') {
        setMessageFilter('broadcasts');
      } else if (type === 'message' && messageFilter !== 'all') {
        setMessageFilter('all');
      }

      if (openThread) {
        handleActivateThread(targetId, 'search_result');
      }

      // Wait for filter to apply, then scroll
      setTimeout(() => {
        const messageElement = document.querySelector(`[data-message-id="${targetId}"]`);
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // Add highlight animation
          messageElement.classList.add('search-highlight-flash');
          setTimeout(() => {
            messageElement.classList.remove('search-highlight-flash');
          }, 1000);
        }
      }, 100);
    };

    // Scroll to target message from notification click (when messages finish loading)
    const scrollAttemptedRef = useRef(false);
    useEffect(() => {
      if (!targetMessageId || isLoading || scrollAttemptedRef.current) return;
      scrollAttemptedRef.current = true;

      // Give messages time to render, then scroll
      const timer = setTimeout(() => {
        scrollToMessage({
          id: targetMessageId,
          type: 'message',
          openThread: Boolean(chatNavigationContext?.openThreadId),
        });
      }, 300);

      return () => clearTimeout(timer);
    }, [targetMessageId, isLoading, chatNavigationContext?.openThreadId]);

    // Global keyboard shortcut for search (Ctrl+F or Cmd+F)
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f' && messageFilter !== 'channels') {
          e.preventDefault();
          setShowSearchOverlay(true);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [messageFilter]);

    return (
      <div className="flex flex-col h-full">
        <PullToRefreshIndicator
          isRefreshing={isRefreshing}
          pullDistance={pullDistance}
          threshold={80}
        />

        {/* Search Overlay Modal */}
        {showSearchOverlay && (
          <ChatSearchOverlay
            tripId={resolvedTripId}
            onClose={() => setShowSearchOverlay(false)}
            onResultSelect={scrollToMessage}
            isDemoMode={demoMode.isDemoMode}
            demoMessages={demoMessages}
          />
        )}

        {/* Offline Mode Banner */}
        {isOffline && (
          <Alert className="mx-4 mt-2 mb-0 border-warning/50 bg-warning/10">
            <WifiOff className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Offline Mode – viewing cached messages
            </AlertDescription>
          </Alert>
        )}

        {/* Chat Container - Messages with Integrated Filter Tabs */}
        <div className="flex-1 flex flex-col min-h-0" data-chat-container>
          <div
            ref={messagesContainerRef}
            className="rounded-2xl border border-border/60 bg-card/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden flex-1 flex flex-col relative min-h-0"
          >
            {/* Filter Tabs */}
            <MessageTypeBar
              activeFilter={messageFilter}
              onFilterChange={setMessageFilter}
              hasChannels={availableChannels.length > 0 || participantRoles.length > 0}
              onSearchClick={() => setShowSearchOverlay(true)}
              isPro={isPro}
              broadcastCount={broadcastCount}
              unreadCount={messageUnreadCount}
              availableChannels={availableChannels as any}
              activeChannel={roleActiveChannel}
              onChannelSelect={(channel: any) => {
                setRoleActiveChannel(channel);
                setMessageFilter('channels');
              }}
            />

            {/* Conditional Content Area */}
            {messageFilter === 'channels' && roleActiveChannel ? (
              <ChannelChatView
                channel={roleActiveChannel as any}
                availableChannels={availableChannels as any}
                onChannelChange={setRoleActiveChannel as any}
              />
            ) : (
              <>
                {chatError && !isLoading ? (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {chatError.message || 'Failed to load chat'}
                      </p>
                      <button
                        onClick={() => reload?.()}
                        className="text-sm text-primary underline hover:no-underline"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ) : isLoading ? (
                  <div className="flex-1 overflow-y-auto p-4">
                    <MessageSkeleton />
                  </div>
                ) : (
                  <VirtualizedMessageContainer
                    messages={messagesWithPreviewFallbacks as any}
                    renderMessage={(message: any, _index: number, showSenderInfo: boolean) => (
                      <div data-message-id={message.id}>
                        <MessageItem
                          message={message}
                          reactions={message.reactions || reactions[message.id] || {}}
                          onReaction={handleReaction}
                          onReply={handleOpenThread}
                          onOpenThread={handleActivateThread}
                          onEdit={demoMode.isDemoMode ? undefined : handleMessageEdit}
                          onDelete={demoMode.isDemoMode ? undefined : handleMessageDelete}
                          onRetry={handleRetryFailedMessage}
                          systemMessagePrefs={isConsumer ? systemMessagePrefs : undefined}
                          tripMembers={tripMembers}
                          readStatuses={
                            message.readStatuses || readStatusesByMessage[message.id] || []
                          }
                          showSenderInfo={showSenderInfo}
                          reactionUserNamesById={reactionUserNamesById}
                          isAdmin={isUserAdmin}
                          onBlockUser={demoMode.isDemoMode ? undefined : blockUserAction}
                          onReportContent={
                            demoMode.isDemoMode
                              ? undefined
                              : params =>
                                  reportContentAction({
                                    ...params,
                                    tripId: resolvedTripId,
                                  })
                          }
                          isBlockingUser={isBlocking}
                          isReportingContent={isReporting}
                        />
                      </div>
                    )}
                    onLoadMore={demoMode.isDemoMode ? () => {} : loadMoreMessages}
                    hasMore={demoMode.isDemoMode ? false : hasMore}
                    isLoading={isLoadingMore}
                    initialVisibleCount={10}
                    className="chat-scroll-container native-scroll px-3"
                    autoScroll={true}
                    restoreScroll={true}
                    scrollKey={`chat-scroll-${resolvedTripId}`}
                  />
                )}

                {/* Typing Indicator */}
                {!demoMode.isDemoMode && typingUsers.length > 0 && (
                  <TypingIndicator typingUsers={typingUsers} />
                )}

                {/* Reply Bar */}
                {replyingTo && (
                  <div className="border-t border-border/60 bg-muted/60 px-4 py-2">
                    <InlineReplyComponent
                      replyTo={{
                        id: replyingTo.id,
                        text: replyingTo.text,
                        senderName: replyingTo.senderName,
                      }}
                      onCancel={clearReply}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Persistent Chat Input - Hidden when in Channels mode or user cannot post */}
        {messageFilter !== 'channels' && canPostToChat && (
          <div
            className="chat-input-persistent w-full flex-shrink-0"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
          >
            <div className="w-full">
              <ChatInput
                inputMessage={inputMessage}
                onInputChange={setInputMessage}
                onSendMessage={handleSendMessage}
                onKeyPress={handleKeyPress}
                apiKey=""
                isTyping={isSendingMessage}
                tripMembers={tripMembers}
                hidePayments={true}
                isPro={isPro}
                tripId={resolvedTripId}
                disableFileUpload={!canUploadMedia}
                safeAreaBottom={false}
                onTypingChange={isTyping => {
                  if (!demoMode.isDemoMode && resolvedTripId && user?.id && streamActiveChannel) {
                    if (isTyping) {
                      streamActiveChannel.keystroke().catch(err => {
                        if (import.meta.env.DEV) console.error('[Stream] keystroke failed', err);
                      });
                    } else {
                      streamActiveChannel.stopTyping().catch(err => {
                        if (import.meta.env.DEV) console.error('[Stream] stopTyping failed', err);
                      });
                    }
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Chat mode restriction banner */}
        {messageFilter !== 'channels' && !canPostToChat && !chatModeLoading && (
          <div className="w-full border-t border-border/60 bg-card/70 px-4 py-3 text-center">
            <p className="text-sm text-muted-foreground">
              {effectiveChatMode === 'broadcasts'
                ? 'This chat is in announcements-only mode. Only admins can post.'
                : effectiveChatMode === 'admin_only'
                  ? 'This chat is in admin-only mode. Only admins can post.'
                  : 'You do not have permission to post in this chat.'}
            </p>
          </div>
        )}

        {/* Thread View Drawer/Modal */}
        {activeThreadMessage && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm md:items-center">
            <div className="w-full max-w-lg h-[70vh] md:h-[60vh] m-4 md:m-0">
              <ThreadView
                parentMessage={activeThreadMessage}
                onClose={() => setActiveThreadMessage(null)}
                tripMembers={tripMembers}
              />
            </div>
          </div>
        )}
      </div>
    );
  },
);
