import { describe, expect, it } from 'vitest';

import { splitUnreadCounts } from '../useUnreadCounts';

const userId = 'user-1';
const baseReadState = { last_read: '2026-04-13T10:00:00.000Z', unread_messages: 2 };

describe('splitUnreadCounts', () => {
  it('splits unread counts using explicit last_read marker when confidence is high', () => {
    const result = splitUnreadCounts({
      userId,
      totalUnread: 2,
      readState: baseReadState,
      messages: [
        {
          id: 'm1',
          user: { id: 'user-2' },
          created_at: '2026-04-13T10:01:00.000Z',
          privacy_mode: 'broadcast',
        },
        {
          id: 'm2',
          user: { id: 'user-3' },
          created_at: '2026-04-13T10:02:00.000Z',
        },
      ],
    });

    expect(result).toEqual({ broadcastCount: 1, messageUnreadCount: 1 });
  });

  it('falls back to total-only unread when marker-based split confidence is low', () => {
    const result = splitUnreadCounts({
      userId,
      totalUnread: 2,
      readState: { unread_messages: 2 },
      messages: [
        {
          id: 'm1',
          user: { id: 'user-2' },
          created_at: '2026-04-13T10:01:00.000Z',
          privacy_mode: 'broadcast',
        },
        {
          id: 'm2',
          user: { id: 'user-3' },
          created_at: '2026-04-13T10:02:00.000Z',
        },
      ],
    });

    expect(result).toEqual({ broadcastCount: 0, messageUnreadCount: 2 });
  });

  it('falls back to total-only unread when marker-derived unread count mismatches stream total', () => {
    const result = splitUnreadCounts({
      userId,
      totalUnread: 3,
      readState: baseReadState,
      messages: [
        {
          id: 'm1',
          user: { id: 'user-2' },
          created_at: '2026-04-13T10:01:00.000Z',
          privacy_mode: 'broadcast',
        },
        {
          id: 'm2',
          user: { id: 'user-3' },
          created_at: '2026-04-13T10:02:00.000Z',
        },
      ],
    });

    expect(result).toEqual({ broadcastCount: 0, messageUnreadCount: 3 });
  });
});
