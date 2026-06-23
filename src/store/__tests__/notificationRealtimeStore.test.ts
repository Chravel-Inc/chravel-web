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

  // Models the badge contract that deleteNotification / realtime onUpdate rely on:
  // clearing an unread notification decrements the count, and it never underflows.
  it('decrements once per cleared unread notification and floors at zero', () => {
    const store = useNotificationRealtimeStore.getState();
    store.setUnreadCount(3);

    // Clear two unread notifications.
    store.decrementUnread();
    store.decrementUnread();
    expect(useNotificationRealtimeStore.getState().unreadCount).toBe(1);

    // Clearing more notifications than are unread must not push the badge negative.
    store.decrementUnread();
    store.decrementUnread();
    expect(useNotificationRealtimeStore.getState().unreadCount).toBe(0);
  });

  it('clearAll zeroes the count and bumps badgeDirty', () => {
    const store = useNotificationRealtimeStore.getState();
    store.setUnreadCount(5);
    const before = useNotificationRealtimeStore.getState().badgeDirty;

    store.clearAll();

    const after = useNotificationRealtimeStore.getState();
    expect(after.unreadCount).toBe(0);
    expect(after.badgeDirty).toBe(before + 1);
  });
});
