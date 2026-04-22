import { useCallback, useEffect, useRef, useState } from 'react';
import { TypingIndicatorService } from '@/services/typingIndicatorService';

type ChatTransportMode = 'stream' | 'legacy';

type StreamChannelLike = {
  on: (eventType: string, listener: (event: unknown) => void) => void;
  off: (eventType: string, listener: (event: unknown) => void) => void;
  keystroke: () => Promise<unknown>;
  stopTyping: () => Promise<unknown>;
};

const STREAM_KEYSTROKE_THROTTLE_MS = 1200;

export function useChatTypingIndicators(
  isDemoMode: boolean,
  resolvedTripId: string | undefined,
  user: { id?: string; displayName?: string; email?: string } | null,
  effectiveChatMode: string,
  tripMembersLength: number,
  activeChannel: StreamChannelLike | null,
  transportMode: ChatTransportMode,
) {
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; userName: string }>>([]);
  const typingServiceRef = useRef<TypingIndicatorService | null>(null);
  const streamStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStreamKeystrokeAtRef = useRef(0);

  // Determine if typing indicators should be enabled
  const shouldEnableTyping =
    !isDemoMode &&
    !!user?.id &&
    !!resolvedTripId &&
    effectiveChatMode !== 'disabled' &&
    tripMembersLength <= 50;
  const currentUserId = user?.id;

  const clearStreamStopTimer = useCallback(() => {
    if (streamStopTimerRef.current) {
      clearTimeout(streamStopTimerRef.current);
      streamStopTimerRef.current = null;
    }
  }, []);

  const handleTypingChange = useCallback(
    (isTyping: boolean) => {
      if (transportMode !== 'stream' || !activeChannel) return;

      if (isTyping) {
        clearStreamStopTimer();
        const now = Date.now();
        if (now - lastStreamKeystrokeAtRef.current < STREAM_KEYSTROKE_THROTTLE_MS) {
          return;
        }

        lastStreamKeystrokeAtRef.current = now;
        activeChannel.keystroke().catch(err => {
          if (import.meta.env.DEV) console.error('[Stream] keystroke failed', err);
        });
        return;
      }

      clearStreamStopTimer();
      streamStopTimerRef.current = setTimeout(() => {
        activeChannel.stopTyping().catch(err => {
          if (import.meta.env.DEV) console.error('[Stream] stopTyping failed', err);
        });
      }, 150);
    },
    [activeChannel, clearStreamStopTimer, transportMode],
  );

  useEffect(() => {
    if (!shouldEnableTyping) {
      setTypingUsers([]);
      return;
    }

    // Stream-based typing indicator handling
    if (transportMode === 'stream') {
      // Active channel may not be ready yet in Stream mode; do not fall back to legacy transport.
      if (!activeChannel) {
        setTypingUsers([]);
        return;
      }

      setTypingUsers([]);

      const handleTypingStart = (e: unknown) => {
        const typingEvent = e as { user?: { id?: string; name?: string } };
        if (typingEvent.user?.id === currentUserId) return;
        setTypingUsers(prev => {
          if (prev.some(u => u.userId === typingEvent.user?.id)) return prev;
          return [
            ...prev,
            {
              userId: typingEvent.user?.id || 'unknown',
              userName: typingEvent.user?.name || 'Unknown',
            },
          ];
        });
      };

      const handleTypingStop = (e: unknown) => {
        const typingEvent = e as { user?: { id?: string } };
        if (typingEvent.user?.id === currentUserId) return;
        setTypingUsers(prev => prev.filter(u => u.userId !== typingEvent.user?.id));
      };

      const handleConnectionChanged = (e: unknown) => {
        const connectionEvent = e as { online?: boolean };
        if (!connectionEvent.online) {
          setTypingUsers([]);
        }
      };

      activeChannel.on('typing.start', handleTypingStart);
      activeChannel.on('typing.stop', handleTypingStop);
      activeChannel.on('connection.changed', handleConnectionChanged);

      return () => {
        clearStreamStopTimer();
        activeChannel.off('typing.start', handleTypingStart);
        activeChannel.off('typing.stop', handleTypingStop);
        activeChannel.off('connection.changed', handleConnectionChanged);
      };
    }

    // Supabase-based typing indicator handling (legacy explicit mode only)
    const userName = user?.displayName || user?.email?.split('@')[0] || 'You';
    typingServiceRef.current = new TypingIndicatorService(resolvedTripId, currentUserId!, userName);

    typingServiceRef.current.initialize(setTypingUsers).catch(error => {
      if (import.meta.env.DEV) {
        console.error(error);
      }
    });

    return () => {
      typingServiceRef.current?.cleanup().catch(error => {
        if (import.meta.env.DEV) {
          console.error(error);
        }
      });
    };
  }, [
    shouldEnableTyping,
    resolvedTripId,
    currentUserId,
    user?.displayName,
    user?.email,
    activeChannel,
    transportMode,
    clearStreamStopTimer,
  ]);

  useEffect(() => {
    return () => {
      clearStreamStopTimer();
    };
  }, [clearStreamStopTimer]);

  return { typingUsers, typingServiceRef, handleTypingChange };
}
