/**
 * useStreamTripChat — Stream-backed trip chat hook
 *
 * Drop-in replacement for the Supabase-backed useTripChat.
 * Returns the exact same shape so TripChat.tsx and all downstream
 * components work without changes.
 *
 * Architecture:
 *   - Uses stream-chat JS client (low-level, no UI components)
 *   - Messages are transformed via messageMapper to match TripChatMessage shape
 *   - Realtime delivery via Stream WebSocket (replaces dual-path broadcast+CDC)
 *   - Read state, typing, reactions handled by Stream built-ins
 *   - Offline support via Stream SDK's built-in persistence
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  connectStreamClient,
  getStreamApiKey,
  getStreamClient,
  onStreamClientConnected,
  onStreamClientConnectionStatusChange,
} from '@/services/stream/streamClient';
import { CHANNEL_TYPE_TRIP, tripChannelId } from '@/services/stream/streamChannelFactory';
import { messageEvents } from '@/telemetry/events';
import type { Channel, Event, MessageResponse } from 'stream-chat';
import { buildTripStreamMessagePayload } from '@/services/stream/streamMessagePayload';
import { supabase } from '@/integrations/supabase/client';

const PAGE_SIZE = 30;
type StreamSendPayload = Parameters<Channel['sendMessage']>[0];
const MEMBERSHIP_ERROR_MESSAGE =
  'We could not verify your trip chat access. Please refresh and try again.';

type MembershipFailureCode =
  | 'join_failed'
  | 'join_timeout'
  | 'membership_denied'
  | 'stream_api_failure'
  | 'invalid_response'
  | 'unknown';

type MembershipFailure = {
  code: MembershipFailureCode;
  reason: string;
};

type MembershipRecoveryResult =
  | { ok: true }
  | {
      ok: false;
      failure: MembershipFailure;
    };

export function isStreamReadChannelPermissionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /ReadChannel|read-channel|GetOrCreateChannel failed|error code 17/i.test(message);
}

function isAbortLikeError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  const message = error instanceof Error ? error.message : String(error);
  return /abort|aborted/i.test(message);
}

function toNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function extractMembershipFailure(value: unknown): MembershipFailure | null {
  if (!value || typeof value !== 'object') return null;
  const code = toNonEmptyString((value as { code?: unknown }).code);
  const reason = toNonEmptyString((value as { reason?: unknown }).reason);
  if (!code && !reason) return null;
  return {
    code: (code as MembershipFailureCode | null) ?? 'unknown',
    reason: reason ?? 'Membership recovery failed',
  };
}

function mapMembershipFailureToUiError(failure: MembershipFailure): Error {
  if (failure.code === 'membership_denied') {
    return new Error(
      'You no longer have access to this trip chat. Ask the trip organizer to re-add you.',
    );
  }
  return new Error(MEMBERSHIP_ERROR_MESSAGE);
}

function isStreamCreateMentionPermissionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /CreateMention|action CreateMention/i.test(message);
}

function hasMentionedUsers(payload: StreamSendPayload): payload is StreamSendPayload & {
  mentioned_users: string[];
} {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'mentioned_users' in payload &&
    Array.isArray((payload as { mentioned_users?: unknown }).mentioned_users) &&
    ((payload as { mentioned_users?: unknown[] }).mentioned_users?.length || 0) > 0
  );
}

function withoutMentionedUsers(payload: StreamSendPayload): StreamSendPayload {
  const { mentioned_users: _mentionedUsers, ...rest } = payload as StreamSendPayload & {
    mentioned_users?: unknown;
  };
  return rest as StreamSendPayload;
}

async function sendMessageWithMentionFallback(channel: Channel, payload: StreamSendPayload) {
  try {
    return await channel.sendMessage(payload);
  } catch (err) {
    if (isStreamCreateMentionPermissionError(err) && hasMentionedUsers(payload)) {
      if (import.meta.env.DEV) {
        console.warn(
          '[Stream] CreateMention denied; retrying send without mentioned_users payload',
        );
      }
      return channel.sendMessage(withoutMentionedUsers(payload));
    }
    throw err;
  }
}

/**
 * Stream-backed trip chat hook.
 * Return type matches useTripChat exactly for seamless routing.
 */
export const useStreamTripChat = (tripId: string | undefined, options?: { enabled?: boolean }) => {
  const isEnabled = options?.enabled !== false;
  const { toast } = useToast();

  // Return native MessageResponse objects directly to take advantage of Stream capabilities
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [streamClientReady, setStreamClientReady] = useState(Boolean(getStreamClient()?.userID));

  const channelRef = useRef<Channel | null>(null);
  const messagesRef = useRef<MessageResponse[]>([]);
  const hasHydratedMessagesRef = useRef(false);
  // State mirror of channelRef for triggering the event subscription effect
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const isMountedRef = useRef(true);
  const membershipRecoveryAttemptedRef = useRef(false);
  const guardedReloadAttemptedRef = useRef(false);
  const membershipFailureRef = useRef<MembershipFailure | null>(null);
  const [reloadSeed, setReloadSeed] = useState(0);

  const triggerGuardedReload = useCallback(() => {
    if (guardedReloadAttemptedRef.current) return;
    guardedReloadAttemptedRef.current = true;
    setReloadSeed(prev => prev + 1);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onStreamClientConnected(() => {
      setStreamClientReady(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onStreamClientConnectionStatusChange(isConnected => {
      if (!isMountedRef.current) return;
      setStreamClientReady(isConnected);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isEnabled || !tripId || streamClientReady || getStreamClient()?.userID) return;

    let cancelled = false;
    void connectStreamClient().then(client => {
      if (cancelled) return;
      if (client?.userID) {
        setStreamClientReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isEnabled, tripId, streamClientReady]);

  useEffect(() => {
    if (!isEnabled || !tripId) return;

    if (streamClientReady && getStreamClient()?.userID) return;

    const timer = window.setTimeout(() => {
      if (streamClientReady || getStreamClient()?.userID) return;

      if (!getStreamApiKey()) {
        setError(new Error('Stream chat is not configured'));
        setIsLoading(false);
        return;
      }

      setError(new Error('Timed out waiting for chat connection'));
      setIsLoading(false);
    }, 10000);

    return () => window.clearTimeout(timer);
  }, [isEnabled, tripId, streamClientReady]);

  useEffect(() => {
    membershipRecoveryAttemptedRef.current = false;
    guardedReloadAttemptedRef.current = false;
    membershipFailureRef.current = null;
    hasHydratedMessagesRef.current = false;
  }, [tripId]);

  useEffect(() => {
    messagesRef.current = messages;
    if (messages.length > 0) {
      hasHydratedMessagesRef.current = true;
    }
  }, [messages]);

  // Initialize channel and load messages
  useEffect(() => {
    if (!tripId || !isEnabled) {
      setIsLoading(false);
      return;
    }

    const client = getStreamClient();
    if (!client?.userID || !streamClientReady) {
      return;
    }

    let cancelled = false;

    const init = async () => {
      const watchChannel = async () => {
        // Ensure the user is a Stream channel member before watching.
        // Stream error code 17 means the user has role 'user' (not 'channel_member')
        // and cannot ReadChannel. We call the server-side join function to add them,
        // then retry. This also runs proactively on every init to handle users who
        // joined the trip before Stream membership sync was in place.
        const supabaseSession = (await import('@/integrations/supabase/client')).supabase.auth;
        const { data: sessionData } = await supabaseSession.getSession();
        const jwt = sessionData?.session?.access_token;

        if (jwt) {
          const controller = new AbortController();
          const timeout = window.setTimeout(() => controller.abort(), 3000);
          try {
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stream-join-channel`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${jwt}`,
                  'Content-Type': 'application/json',
                  apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                },
                body: JSON.stringify({ tripId }),
                signal: controller.signal,
              },
            );

            if (!response.ok) {
              const payload = (await response.json().catch(() => null)) as unknown;
              const failure =
                extractMembershipFailure(payload) ??
                ({
                  code: 'join_failed',
                  reason: `stream-join-channel returned ${response.status}`,
                } satisfies MembershipFailure);
              membershipFailureRef.current = failure;
              if (import.meta.env.DEV) {
                console.warn('[Stream] stream-join-channel returned non-OK', failure);
              }
            } else {
              membershipFailureRef.current = null;
            }
          } catch (joinErr) {
            const failure: MembershipFailure = isAbortLikeError(joinErr)
              ? { code: 'join_timeout', reason: 'stream-join-channel timed out' }
              : {
                  code: 'join_failed',
                  reason:
                    joinErr instanceof Error
                      ? joinErr.message
                      : 'stream-join-channel request failed',
                };
            membershipFailureRef.current = failure;
            // Join is best-effort before watch; deterministic recovery is handled on ReadChannel errors.
            if (import.meta.env.DEV) {
              console.warn('[Stream] stream-join-channel failed before watch; continuing', failure);
            }
          } finally {
            window.clearTimeout(timeout);
          }
        }

        if (cancelled) return null;

        const channel = client.channel(CHANNEL_TYPE_TRIP, tripChannelId(tripId));
        const state = await channel.watch({ state: true, messages: { limit: PAGE_SIZE } });
        return { channel, state };
      };

      const ensureMembership = async (): Promise<MembershipRecoveryResult> => {
        const response = await supabase.functions.invoke('stream-ensure-membership', {
          body: { tripId, userId: client.userID },
        });

        if (response.error) {
          return {
            ok: false,
            failure: {
              code: 'stream_api_failure',
              reason: response.error.message || 'stream-ensure-membership invocation failed',
            },
          };
        }

        if (!response.data || typeof response.data !== 'object') {
          return {
            ok: false,
            failure: {
              code: 'invalid_response',
              reason: 'stream-ensure-membership returned an invalid response body',
            },
          };
        }

        const parsed = response.data as {
          success?: unknown;
          code?: unknown;
          reason?: unknown;
        };

        if (parsed.success === true) {
          membershipFailureRef.current = null;
          return { ok: true };
        }

        return {
          ok: false,
          failure: extractMembershipFailure(parsed) ?? {
            code: 'invalid_response',
            reason: 'stream-ensure-membership did not return success=true',
          },
        };
      };

      try {
        let watched = await watchChannel();
        if (!watched || cancelled) return;

        if (
          membershipRecoveryAttemptedRef.current === false &&
          !watched.state.membership &&
          client.userID
        ) {
          membershipRecoveryAttemptedRef.current = true;
          const ensured = await ensureMembership();
          if (!ensured.ok) {
            throw mapMembershipFailureToUiError(ensured.failure);
          }
          watched = await watchChannel();
          if (!watched || cancelled) return;
        }

        const streamMessages = (watched.state.messages || []) as MessageResponse[];
        const sortedMessages = [...streamMessages].sort((a, b) => {
          const aDate = new Date(a.created_at || 0).getTime();
          const bDate = new Date(b.created_at || 0).getTime();
          return aDate - bDate;
        });

        if (cancelled) return;

        channelRef.current = watched.channel;
        setActiveChannel(watched.channel);

        if (streamMessages.length > 0) {
          setMessages(sortedMessages);
        } else if (!hasHydratedMessagesRef.current) {
          // First load can legitimately be empty; preserve hydrated state on re-watch.
          setMessages([]);
        }
        setHasMore(streamMessages.length === PAGE_SIZE);
        setError(null);
        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        let resolvedError: unknown = err;

        if (
          isStreamReadChannelPermissionError(resolvedError) &&
          !membershipRecoveryAttemptedRef.current
        ) {
          membershipRecoveryAttemptedRef.current = true;
          try {
            const ensured = await ensureMembership();
            if (!ensured.ok) {
              throw mapMembershipFailureToUiError(ensured.failure);
            }
            const channel = client.channel(CHANNEL_TYPE_TRIP, tripChannelId(tripId));
            const state = await channel.watch({ state: true, messages: { limit: PAGE_SIZE } });
            const streamMessages = (state.messages || []) as MessageResponse[];
            const sortedMessages = [...streamMessages].sort((a, b) => {
              const aDate = new Date(a.created_at || 0).getTime();
              const bDate = new Date(b.created_at || 0).getTime();
              return aDate - bDate;
            });

            if (!cancelled) {
              channelRef.current = channel;
              setActiveChannel(channel);
              if (streamMessages.length > 0) {
                setMessages(sortedMessages);
              } else if (!hasHydratedMessagesRef.current) {
                setMessages([]);
              }
              setHasMore(streamMessages.length === PAGE_SIZE);
              setError(null);
              setIsLoading(false);
            }
            return;
          } catch (membershipErr) {
            const failure = membershipFailureRef.current;
            if (import.meta.env.DEV && failure) {
              console.warn('[Stream] membership recovery failed', failure);
            }
            resolvedError = membershipErr;
          }
        }

        if (isStreamReadChannelPermissionError(resolvedError)) {
          setError(
            mapMembershipFailureToUiError(
              membershipFailureRef.current ?? { code: 'unknown', reason: 'ReadChannel denied' },
            ),
          );
          triggerGuardedReload();
          setIsLoading(false);
          return;
        }

        const genericMessage =
          resolvedError instanceof Error ? resolvedError.message : 'Failed to connect to chat';
        setError(new Error(genericMessage));
        setIsLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        channelRef.current.stopWatching();
        channelRef.current = null;
        setActiveChannel(null);
      }
    };
  }, [tripId, isEnabled, streamClientReady, reloadSeed, triggerGuardedReload]);

  const reload = useCallback(async () => {
    if (!tripId || !isEnabled || !channelRef.current) return;
    const channel = channelRef.current;

    try {
      setIsLoading(true);
      const state = await channel.query({
        messages: { limit: PAGE_SIZE },
      });

      const streamMessages = (state.messages || []) as MessageResponse[];
      const sortedMessages = [...streamMessages].sort(
        (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime(),
      );

      if (streamMessages.length > 0) {
        setMessages(sortedMessages);
      } else if (!hasHydratedMessagesRef.current) {
        setMessages([]);
      }
      setHasMore(streamMessages.length === PAGE_SIZE);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[Stream] reload failed:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [tripId, isEnabled]);

  // Subscribe to realtime events
  useEffect(() => {
    const channel = activeChannel;
    if (!channel || !tripId) return;

    const handleNewMessage = (event: Event) => {
      if (!event.message) return;
      const newMsg = event.message as MessageResponse;

      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) {
          return prev.map(m => (m.id === newMsg.id ? newMsg : m));
        }
        return [...prev, newMsg];
      });
    };

    const handleUpdatedMessage = (event: Event) => {
      if (!event.message) return;
      const updated = event.message as MessageResponse;
      setMessages(prev => prev.map(m => (m.id === updated.id ? updated : m)));
    };

    const handleDeletedMessage = (event: Event) => {
      if (!event.message) return;
      setMessages(prev => prev.filter(m => m.id !== event.message!.id));
    };

    const handleReaction = () => {
      // Stream mutates channel.state.messages in place on reaction events.
      // Re-cloning the array forces React to re-render.
      const freshMessages = channelRef.current?.state.messages || channel.state.messages;
      if (freshMessages.length > 0 || messagesRef.current.length === 0) {
        setMessages([...freshMessages] as unknown as MessageResponse[]);
      }
    };

    channel.on('message.new', handleNewMessage);
    channel.on('message.updated', handleUpdatedMessage);
    channel.on('message.deleted', handleDeletedMessage);
    channel.on('reaction.new', handleReaction);
    channel.on('reaction.updated', handleReaction);
    channel.on('reaction.deleted', handleReaction);

    return () => {
      channel.off('message.new', handleNewMessage);
      channel.off('message.updated', handleUpdatedMessage);
      channel.off('message.deleted', handleDeletedMessage);
      channel.off('reaction.new', handleReaction);
      channel.off('reaction.updated', handleReaction);
      channel.off('reaction.deleted', handleReaction);
    };
  }, [activeChannel, tripId]);

  /**
   * Fire-and-forget send: Stream confirms via WebSocket (`message.new`).
   * We intentionally do NOT expose `isCreating` / await the HTTP round-trip here.
   * Otherwise TripChat's `await sendTripMessage` + ChatInput's `isTyping={isCreating}`
   * block the composer until `sendMessage` resolves — if that promise stalls (network,
   * SDK edge case), the send button spins forever and `sendLockRef` never clears.
   */
  const dispatchStreamSend = useCallback(
    (
      content: string,
      mediaType: string | undefined,
      mediaUrl: string | undefined,
      privacyMode: string | undefined,
      messageType: 'text' | 'broadcast' | 'payment' | 'system' | undefined,
      replyToId: string | undefined,
      mentionedUserIds: string[] | undefined,
    ) => {
      const channel = channelRef.current;
      if (!channel || !tripId) return;
      const normalizedContent = content.trim();
      const payloadResult = buildTripStreamMessagePayload({
        content,
        mediaType,
        mediaUrl,
        privacyMode,
        messageType,
        replyToId,
        mentionedUserIds,
      });

      if (!payloadResult.ok) {
        if ('error' in payloadResult && payloadResult.error === 'empty_content') return;
        toast({
          title: 'Message too long',
          description: 'Please keep messages under 4000 characters.',
          variant: 'destructive',
        });
        return;
      }

      void sendMessageWithMentionFallback(channel, payloadResult.payload)
        .then(() => {
          messageEvents.sent({
            trip_id: tripId,
            message_type:
              (messageType as 'text' | 'media' | 'broadcast' | 'payment' | 'system') || 'text',
            has_media: Boolean(mediaUrl),
            character_count: payloadResult.normalizedContent.length,
            is_offline_queued: false,
          });
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Failed to send message';
          messageEvents.sendFailed(tripId, msg);
          toast({
            title: 'Send Failed',
            description: msg,
            variant: 'destructive',
          });
        });
    },
    [tripId, toast],
  );

  // Send message — matches useTripChat signature exactly
  const sendMessage = useCallback(
    (
      content: string,
      _authorName: string,
      mediaType?: string,
      mediaUrl?: string,
      _userId?: string,
      privacyMode?: string,
      messageType?: 'text' | 'broadcast' | 'payment' | 'system',
      replyToId?: string,
      mentionedUserIds?: string[],
    ) => {
      dispatchStreamSend(
        content,
        mediaType,
        mediaUrl,
        privacyMode,
        messageType,
        replyToId,
        mentionedUserIds,
      );
    },
    [dispatchStreamSend],
  );

  /**
   * sendMessageAsync — awaits real channel.sendMessage() and returns the confirmed message.
   * Throws on rejection so callers (TripChat) can restore the draft and show errors.
   */
  const sendMessageAsync = useCallback(
    async (
      content: string,
      _authorName: string,
      mediaType?: string,
      mediaUrl?: string,
      _userId?: string,
      privacyMode?: string,
      messageType?: 'text' | 'broadcast' | 'payment' | 'system',
      replyToId?: string,
      mentionedUserIds?: string[],
    ): Promise<MessageResponse | undefined> => {
      const channel = channelRef.current;
      if (!channel || !tripId) return undefined;

      const payloadResult = buildTripStreamMessagePayload({
        content,
        mediaType,
        mediaUrl,
        privacyMode,
        messageType,
        replyToId,
        mentionedUserIds,
      });

      if (!payloadResult.ok) {
        if ('error' in payloadResult && payloadResult.error === 'empty_content') return undefined;
        throw new Error('Message too long. Please keep messages under 4000 characters.');
      }

      setIsCreating(true);
      try {
        const response = await sendMessageWithMentionFallback(channel, payloadResult.payload);
        const sentMessage = response.message as MessageResponse;

        // Immediately insert or update the sent message in local state
        // so it appears without waiting for the `message.new` WebSocket event.
        if (sentMessage) {
          setMessages(prev => {
            if (prev.some(m => m.id === sentMessage.id)) {
              return prev.map(m => (m.id === sentMessage.id ? sentMessage : m));
            }
            return [...prev, sentMessage];
          });

          messageEvents.sent({
            trip_id: tripId,
            message_type:
              (messageType as 'text' | 'media' | 'broadcast' | 'payment' | 'system') || 'text',
            has_media: Boolean(mediaUrl),
            character_count: payloadResult.normalizedContent.length,
            is_offline_queued: false,
          });
        }

        return sentMessage;
      } finally {
        setIsCreating(false);
      }
    },
    [tripId, toast],
  );

  // Load more (older messages)
  const toggleReaction = useCallback(async (messageId: string, reactionType: string) => {
    if (!channelRef.current) return;
    const channel = channelRef.current;

    try {
      // Capture prior state in case of revert
      const originalMessages = [...messagesRef.current];

      // Optimistically check if we already reacted
      const message = messagesRef.current.find(m => m.id === messageId);
      const hasReacted =
        message?.own_reactions?.some(reaction => reaction.type === reactionType) ?? false;

      try {
        if (hasReacted) {
          await channel.deleteReaction(messageId, reactionType);
        } else {
          await channel.sendReaction(messageId, { type: reactionType });
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[Stream] toggleReaction failed:', err);
        }
        // Revert optimistic update
        setMessages(originalMessages);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[Stream] toggleReaction prep failed:', err);
      }
    }
  }, []);

  const loadMore = useCallback(async () => {
    const channel = channelRef.current;
    if (!channel || !hasMore || isLoadingMore || messages.length === 0) return;

    setIsLoadingMore(true);
    try {
      const oldestId = messages[0]?.id;
      const result = await channel.query({
        messages: { limit: PAGE_SIZE, id_lt: oldestId },
      });

      const olderMessages = (result.messages || []) as MessageResponse[];

      if (olderMessages.length > 0) {
        setMessages(prev => [...olderMessages, ...prev]);
        setHasMore(olderMessages.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch {
      // Pagination failure is non-fatal
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, messages]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    sendMessageAsync,
    isCreating,
    loadMore,
    hasMore,
    isLoadingMore,
    toggleReaction,
    reload,
    activeChannel,
  };
};
