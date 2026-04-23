/**
 * ThreadView Component
 *
 * Displays threaded replies for a message in an iMessage-style inline view.
 * Supports realtime updates and reply submission.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Send, MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/utils/avatarUtils';
import { defaultAvatar } from '@/utils/mockAvatars';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  getStreamClient,
  onStreamClientConnectionStatusChange,
} from '@/services/stream/streamClient';
import { CHANNEL_TYPE_TRIP, tripChannelId } from '@/services/stream/streamChannelFactory';
import type { Channel, Event, MessageResponse, UserResponse } from 'stream-chat';

export interface ThreadViewProps {
  parentMessage: {
    id: string;
    content: string;
    authorName: string;
    authorAvatar?: string;
    createdAt: string;
    tripId: string;
  };
  onClose: () => void;
  tripMembers?: Array<{ id: string; name: string; avatar?: string }>;
}

interface ThreadReply {
  id: string;
  content: string;
  authorName: string;
  authorId?: string;
  authorAvatar?: string;
  createdAt: string;
  isEdited?: boolean;
}

const REPLIES_PAGE_SIZE = 25;
const EMPTY_TRIP_MEMBERS: Array<{ id: string; name: string; avatar?: string }> = [];

const sortRepliesByCreatedAt = (list: ThreadReply[]) =>
  [...list].sort((a, b) => {
    const createdAtDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (createdAtDiff !== 0) return createdAtDiff;
    return a.id.localeCompare(b.id);
  });

const mergeRepliesDeduped = (current: ThreadReply[], incoming: ThreadReply[]) => {
  const map = new Map<string, ThreadReply>();
  current.forEach(reply => {
    map.set(reply.id, reply);
  });
  incoming.forEach(reply => {
    map.set(reply.id, reply);
  });
  return sortRepliesByCreatedAt(Array.from(map.values()));
};

export const ThreadView: React.FC<ThreadViewProps> = ({
  parentMessage,
  onClose,
  tripMembers = EMPTY_TRIP_MEMBERS,
}) => {
  const { user } = useAuth();
  const [replies, setReplies] = useState<ThreadReply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [loadMoreErrorType, setLoadMoreErrorType] = useState<'pagination' | 'backfill' | null>(
    null,
  );
  const [hasMoreReplies, setHasMoreReplies] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const repliesEndRef = useRef<HTMLDivElement>(null);
  const wasDisconnectedRef = useRef(false);

  const client = getStreamClient();

  const formatReply = useCallback(
    (
      row: MessageResponse,
      members: Array<{ id: string; name: string; avatar?: string }>,
    ): ThreadReply => {
      const u = row.user as UserResponse | undefined;
      const member = members.find(m => m.id === u?.id);
      return {
        id: row.id,
        content: row.text || '',
        authorId: u?.id || 'unknown',
        authorName: u?.name || member?.name || 'Unknown User',
        authorAvatar: u?.image || member?.avatar,
        createdAt: row.created_at as string,
        isEdited: row.created_at !== row.updated_at,
      };
    },
    [],
  );

  const threadChannel = useMemo<Channel | null>(() => {
    if (!client) return null;
    return client.channel(CHANNEL_TYPE_TRIP, tripChannelId(parentMessage.tripId));
  }, [client, parentMessage.tripId]);

  const applyPage = useCallback(
    (rows: MessageResponse[], mode: 'replace' | 'append') => {
      const formatted = rows.map(row => formatReply(row, tripMembers));
      setReplies(prev =>
        mode === 'replace'
          ? sortRepliesByCreatedAt(formatted)
          : mergeRepliesDeduped(prev, formatted),
      );
      setHasMoreReplies(rows.length >= REPLIES_PAGE_SIZE);
    },
    [formatReply, tripMembers],
  );

  const loadInitialReplies = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!threadChannel) return;

      if (options?.silent) {
        setIsBackfilling(true);
      } else {
        setIsLoading(true);
        setLoadError(null);
      }
      setLoadMoreError(null);
      setLoadMoreErrorType(null);

      try {
        const data = await threadChannel.getReplies(parentMessage.id, { limit: REPLIES_PAGE_SIZE });
        applyPage((data.messages || []) as MessageResponse[], 'replace');
      } catch (err) {
        if (import.meta.env.DEV) console.error('[ThreadView] Failed to load replies:', err);
        if (options?.silent) {
          setLoadMoreError('Connection restored, but thread refresh failed. Tap retry.');
          setLoadMoreErrorType('backfill');
        } else {
          setLoadError('Failed to load replies. Please try again.');
        }
      } finally {
        if (options?.silent) {
          setIsBackfilling(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [threadChannel, parentMessage.id, applyPage],
  );

  const loadOlderReplies = useCallback(async () => {
    if (!threadChannel || isLoadingMore || !hasMoreReplies || replies.length === 0) return;

    setIsLoadingMore(true);
    setLoadMoreError(null);
    setLoadMoreErrorType(null);

    try {
      const oldestReplyId = replies[0]?.id;
      const data = await threadChannel.getReplies(parentMessage.id, {
        limit: REPLIES_PAGE_SIZE,
        ...(oldestReplyId ? { id_lt: oldestReplyId } : {}),
      });
      applyPage((data.messages || []) as MessageResponse[], 'append');
    } catch (err) {
      if (import.meta.env.DEV) console.error('[ThreadView] Failed to load older replies:', err);
      setLoadMoreError('Failed to load older replies. Please try again.');
      setLoadMoreErrorType('pagination');
    } finally {
      setIsLoadingMore(false);
    }
  }, [threadChannel, isLoadingMore, hasMoreReplies, replies, parentMessage.id, applyPage]);

  const handleRetryLoad = useCallback(() => {
    void loadInitialReplies();
  }, [loadInitialReplies]);

  const handleRetryLoadMore = useCallback(() => {
    if (loadMoreErrorType === 'backfill') {
      void loadInitialReplies({ silent: true });
      return;
    }
    void loadOlderReplies();
  }, [loadMoreErrorType, loadInitialReplies, loadOlderReplies]);

  useEffect(() => {
    void loadInitialReplies();
  }, [loadInitialReplies]);

  // Subscribe to realtime thread updates
  useEffect(() => {
    if (!threadChannel) return;

    const handleEvent = (event: Event) => {
      if (event.message?.parent_id !== parentMessage.id) return;

      if (event.type === 'message.new' || event.type === 'message.updated') {
        setReplies(prev =>
          mergeRepliesDeduped(prev, [formatReply(event.message as MessageResponse, tripMembers)]),
        );
      } else if (event.type === 'message.deleted') {
        setReplies(prev => prev.filter(r => r.id !== event.message.id));
      }
    };

    threadChannel.on('message.new', handleEvent);
    threadChannel.on('message.updated', handleEvent);
    threadChannel.on('message.deleted', handleEvent);

    return () => {
      threadChannel.off('message.new', handleEvent);
      threadChannel.off('message.updated', handleEvent);
      threadChannel.off('message.deleted', handleEvent);
    };
  }, [threadChannel, parentMessage.id, tripMembers, formatReply]);

  // Backfill thread replies when connection is restored
  useEffect(() => {
    const unsubscribe = onStreamClientConnectionStatusChange(isConnected => {
      if (!isConnected) {
        wasDisconnectedRef.current = true;
        return;
      }

      if (wasDisconnectedRef.current) {
        wasDisconnectedRef.current = false;
        void loadInitialReplies({ silent: true });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadInitialReplies]);

  // Scroll to bottom when new replies come in
  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies.length]);

  const handleSendReply = useCallback(async () => {
    if (!replyContent.trim() || isSending || !threadChannel) return;

    setIsSending(true);
    setSendError(null);

    try {
      await threadChannel.sendMessage({
        text: replyContent.trim(),
        parent_id: parentMessage.id,
      });

      setReplyContent('');
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error('[ThreadView] Failed to send reply:', err);
      setSendError('Failed to send reply. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [replyContent, isSending, parentMessage.id, threadChannel]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOwnMessage = (authorId?: string) => {
    return authorId === user?.id;
  };

  return (
    <div className="flex flex-col h-full bg-background/95 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Thread</span>
          <span className="text-xs text-muted-foreground">
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Parent Message */}
      <div className="px-4 py-3 border-b border-border/30 bg-muted/10">
        <div className="flex gap-2">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={parentMessage.authorAvatar || defaultAvatar} />
            <AvatarFallback>{getInitials(parentMessage.authorName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{parentMessage.authorName}</span>
              <span className="text-xs text-muted-foreground">
                {formatTime(parentMessage.createdAt)}
              </span>
            </div>
            <p className="text-sm text-foreground/90 mt-0.5 whitespace-pre-wrap break-words">
              {parentMessage.content}
            </p>
          </div>
        </div>
      </div>

      {/* Replies */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin gold-gradient-spinner" />
          </div>
        ) : loadError ? (
          <div className="text-center py-8">
            <AlertCircle className="h-5 w-5 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive">{loadError}</p>
            <Button variant="outline" size="sm" onClick={handleRetryLoad} className="mt-3">
              Retry
            </Button>
          </div>
        ) : replies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No replies yet. Be the first to reply!
          </div>
        ) : (
          <>
            {(hasMoreReplies || loadMoreError) && (
              <div className="pt-1">
                {loadMoreError ? (
                  <div className="flex items-center justify-center gap-2 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{loadMoreError}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={handleRetryLoadMore}
                    >
                      Retry
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={loadOlderReplies}
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore ? 'Loading older replies...' : 'Load older replies'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {replies.map(reply => (
              <div
                key={reply.id}
                className={cn('flex gap-2', isOwnMessage(reply.authorId) && 'flex-row-reverse')}
              >
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarImage src={reply.authorAvatar || defaultAvatar} />
                  <AvatarFallback className="text-xs">
                    {getInitials(reply.authorName)}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-3 py-1.5',
                    isOwnMessage(reply.authorId)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted',
                  )}
                >
                  {!isOwnMessage(reply.authorId) && (
                    <span className="text-xs font-medium opacity-70 block mb-0.5">
                      {reply.authorName}
                    </span>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{reply.content}</p>
                  <span className="text-[10px] opacity-60 mt-0.5 block">
                    {formatTime(reply.createdAt)}
                    {reply.isEdited && ' (edited)'}
                  </span>
                </div>
              </div>
            ))}

            {isBackfilling && (
              <div className="flex items-center justify-center text-xs text-muted-foreground py-1">
                Refreshing thread…
              </div>
            )}
          </>
        )}
        <div ref={repliesEndRef} />
      </div>

      {/* Reply Input */}
      <div className="px-4 py-3 border-t border-border/50 bg-muted/10">
        {sendError && (
          <div className="flex items-center gap-2 text-destructive text-xs mb-2 px-1">
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            <span>{sendError}</span>
          </div>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            value={replyContent}
            onChange={e => setReplyContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Reply to thread..."
            className="min-h-[44px] max-h-[120px] resize-none text-sm"
            disabled={isSending}
          />
          <Button
            size="sm"
            onClick={handleSendReply}
            disabled={!replyContent.trim() || isSending}
            className="h-[44px] px-4"
          >
            {isSending ? (
              <div className="h-4 w-4 animate-spin gold-gradient-spinner" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
