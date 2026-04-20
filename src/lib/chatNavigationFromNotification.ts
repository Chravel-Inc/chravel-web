/**
 * Persist chat deep-link context from in-app notifications.
 * Trip shell pages do not read React Router location.state; sessionStorage
 * bridges notification click → TripChat scroll/highlight.
 */
export const CHAT_FROM_NOTIFICATION_STORAGE_PREFIX = 'chravel:pendingChatNav:';

export type ChatNavigationFromNotification = {
  v: 1;
  notificationId?: string;
  messageId?: string;
  channelId?: string;
  channelType?: string;
  openThreadId?: string;
};

export function pendingChatNavigationStorageKey(tripId: string): string {
  return `${CHAT_FROM_NOTIFICATION_STORAGE_PREFIX}${tripId}`;
}

export function stashPendingChatNavigation(
  tripId: string,
  context: Omit<ChatNavigationFromNotification, 'v'>,
): void {
  if (typeof window === 'undefined' || !tripId) return;

  const payload: ChatNavigationFromNotification = {
    v: 1,
    ...context,
  };

  try {
    window.sessionStorage.setItem(
      pendingChatNavigationStorageKey(tripId),
      JSON.stringify(payload),
    );
  } catch {
    // Quota or private mode — deep link best-effort only
  }
}

function readPendingChatNavigationRaw(tripId: string): ChatNavigationFromNotification | null {
  if (typeof window === 'undefined' || !tripId) return null;

  const key = pendingChatNavigationStorageKey(tripId);
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(key);
  } catch {
    return null;
  }

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as ChatNavigationFromNotification;
    if (parsed && parsed.v === 1) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

/** Read without removing — use until chat is ready to scroll. */
export function peekPendingChatNavigation(tripId: string): ChatNavigationFromNotification | null {
  return readPendingChatNavigationRaw(tripId);
}

export function clearPendingChatNavigation(tripId: string): void {
  if (typeof window === 'undefined' || !tripId) return;
  try {
    window.sessionStorage.removeItem(pendingChatNavigationStorageKey(tripId));
  } catch {
    // ignore
  }
}

export function consumePendingChatNavigation(
  tripId: string,
): ChatNavigationFromNotification | null {
  const parsed = readPendingChatNavigationRaw(tripId);
  if (!parsed) return null;
  clearPendingChatNavigation(tripId);
  return parsed;
}
