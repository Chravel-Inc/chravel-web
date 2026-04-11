import { useEffect, useState } from 'react';

export function useChatTypingIndicators(
  isDemoMode: boolean,
  resolvedTripId: string | undefined,
  user: { id?: string; displayName?: string; email?: string } | null,
  effectiveChatMode: string,
  tripMembersLength: number,
  activeChannel: any, // Stream Channel
) {
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; userName: string }>>([]);

  // Determine if typing indicators should be enabled
  const shouldEnableTyping =
    !isDemoMode &&
    !!user?.id &&
    !!resolvedTripId &&
    effectiveChatMode === 'everyone' &&
    tripMembersLength <= 50;

  useEffect(() => {
    if (!shouldEnableTyping) return;

    if (!activeChannel) return;

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
  }, [shouldEnableTyping, activeChannel, user?.id]);

  return { typingUsers };
}
