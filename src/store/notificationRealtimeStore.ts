import { create } from 'zustand';

interface NotificationRealtimeState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  decrementUnread: () => void;
  clearAll: () => void;
}

export const useNotificationRealtimeStore = create<NotificationRealtimeState>(set => ({
  unreadCount: 0,
  setUnreadCount: unreadCount => set({ unreadCount }),
  incrementUnread: () => set(state => ({ unreadCount: state.unreadCount + 1 })),
  decrementUnread: () => set(state => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
  clearAll: () => set({ unreadCount: 0 }),
}));
