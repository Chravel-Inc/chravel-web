import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { peekPendingChatNavigation } from '@/lib/chatNavigationFromNotification';

type Variant = 'consumer' | 'pro' | 'event';

/**
 * When user opens a trip from an in-app notification, `NotificationsDialog` sets
 * `?tab=...` and stashes message id in sessionStorage. Trip shells must read the
 * query (and pending chat nav) because they do not consume React Router location.state.
 */
export function useTripNotificationUrlTabSync(
  tripId: string | undefined,
  setActiveTab: (tab: string) => void,
  options: { variant: Variant },
): void {
  const [searchParams, setSearchParams] = useSearchParams();

  const validTabs = useMemo(() => {
    if (options.variant === 'event') {
      return new Set<string>([
        'admin',
        'agenda',
        'calendar',
        'chat',
        'lineup',
        'media',
        'polls',
        'tasks',
      ]);
    }
    const ids = [
      'chat',
      'calendar',
      'polls',
      'media',
      'places',
      'payments',
      'concierge',
      'tasks',
    ];
    if (options.variant === 'pro') {
      ids.push('team');
    }
    return new Set(ids);
  }, [options.variant]);

  useEffect(() => {
    if (!tripId) return;

    const pending = peekPendingChatNavigation(tripId);
    if (pending?.messageId) {
      setActiveTab('chat');
      return;
    }

    const urlTab = searchParams.get('tab');
    if (urlTab && validTabs.has(urlTab)) {
      setActiveTab(urlTab);
      const next = new URLSearchParams(searchParams);
      next.delete('tab');
      setSearchParams(next, { replace: true });
    }
  }, [tripId, searchParams, validTabs, setActiveTab, setSearchParams]);
}
