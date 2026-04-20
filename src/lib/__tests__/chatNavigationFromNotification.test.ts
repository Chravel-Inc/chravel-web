import { describe, it, expect, beforeEach } from 'vitest';
import {
  stashPendingChatNavigation,
  peekPendingChatNavigation,
  clearPendingChatNavigation,
  consumePendingChatNavigation,
  pendingChatNavigationStorageKey,
} from '../chatNavigationFromNotification';

describe('chatNavigationFromNotification', () => {
  const tripId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    sessionStorage.clear();
  });

  it('stashes and consumes pending navigation payload', () => {
    stashPendingChatNavigation(tripId, {
      notificationId: 'n1',
      messageId: 'msg-stream-1',
    });

    expect(sessionStorage.getItem(pendingChatNavigationStorageKey(tripId))).toContain(
      'msg-stream-1',
    );

    const consumed = consumePendingChatNavigation(tripId);
    expect(consumed?.messageId).toBe('msg-stream-1');
    expect(sessionStorage.getItem(pendingChatNavigationStorageKey(tripId))).toBeNull();
  });

  it('peek does not remove storage', () => {
    stashPendingChatNavigation(tripId, { messageId: 'm2' });
    expect(peekPendingChatNavigation(tripId)?.messageId).toBe('m2');
    expect(sessionStorage.getItem(pendingChatNavigationStorageKey(tripId))).not.toBeNull();
    clearPendingChatNavigation(tripId);
    expect(sessionStorage.getItem(pendingChatNavigationStorageKey(tripId))).toBeNull();
  });
});
