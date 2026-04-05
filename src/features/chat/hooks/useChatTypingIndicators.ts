import { useEffect, useRef, useState } from 'react';
import { TypingIndicatorService } from '@/services/typingIndicatorService';

export function useChatTypingIndicators(
  isDemoMode: boolean,
  resolvedTripId: string | undefined,
  user: { id?: string; displayName?: string; email?: string } | null,
  effectiveChatMode: string,
  tripMembersLength: number,
  activeChannel: any, // Stream Channel
) {
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; userName: string }>>([]);
  const typingServiceRef = useRef<TypingIndicatorService | null>(null);

  // Determine if typing indicators should be enabled
  const shouldEnableTyping =
    !isDemoMode &&
    !!user?.id &&
    !!resolvedTripId &&
    effectiveChatMode === 'everyone' &&
    tripMembersLength <= 50;

  useEffect(() => {
    if (!shouldEnableTyping) return;

    // Stream-based typing indicator handling
    if (activeChannel) {
      const handleTypingStart = (e: any) => {
        if (e.user?.id === user?.id) return;
        setTypingUsers(prev => {
          if (prev.some(u => u.userId === e.user?.id)) return prev;
          return [...prev, { userId: e.user?.id, userName: e.user?.name || 'Unknown' }];
        });
      };

      const handleTypingStop = (e: any) => {
        if (e.user?.id === user?.id) return;
        setTypingUsers(prev => prev.filter(u => u.userId !== e.user?.id));
      };

      activeChannel.on('typing.start', handleTypingStart);
      activeChannel.on('typing.stop', handleTypingStop);

      return () => {
        activeChannel.off('typing.start', handleTypingStart);
        activeChannel.off('typing.stop', handleTypingStop);
      };
    } else {
      // Supabase-based typing indicator handling
      const userName = user?.displayName || user?.email?.split('@')[0] || 'You';
      typingServiceRef.current = new TypingIndicatorService(resolvedTripId, user!.id, userName);

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
    }
  }, [shouldEnableTyping, resolvedTripId, user?.id, user?.displayName, user?.email, activeChannel]);

  return { typingUsers, typingServiceRef };
}
