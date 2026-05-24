import { beforeEach, describe, expect, it } from 'vitest';
import { useNotificationRealtimeStore } from '../notificationRealtimeStore';

describe('notificationRealtimeStore unread counter', () => {
  beforeEach(() => {
    useNotificationRealtimeStore.getState().clearAll();
  });

  it('increments/decrements unread count', () => {
    const store = useNotificationRealtimeStore.getState();

    store.incrementUnread();
    store.incrementUnread();
    expect(useNotificationRealtimeStore.getState().unreadCount).toBe(2);

    store.decrementUnread();
    expect(useNotificationRealtimeStore.getState().unreadCount).toBe(1);

    store.decrementUnread();
    store.decrementUnread();
    expect(useNotificationRealtimeStore.getState().unreadCount).toBe(0);
  });

  it('setUnreadCount sets exact value', () => {
    const store = useNotificationRealtimeStore.getState();
    store.setUnreadCount(7);
    expect(useNotificationRealtimeStore.getState().unreadCount).toBe(7);
  });
});
