import React, { type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNotificationRealtime } from '../useNotificationRealtime';
import { useNotificationRealtimeStore } from '@/store/notificationRealtimeStore';

// Independent DB total for the unread badge. Pagination only appends already-persisted
// rows to the visible list, so this must never change when loadMore runs.
const UNREAD_TOTAL = 5;

const firstPage = [
  {
    id: 'n1',
    type: 'chat',
    title: 'Newest',
    message: 'newest message',
    is_read: false,
    metadata: {},
    trip_id: 'trip-1',
    created_at: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'n2',
    type: 'chat',
    title: 'Older',
    message: 'older message',
    is_read: true,
    metadata: {},
    trip_id: 'trip-1',
    created_at: '2026-01-01T00:00:00.000Z',
  },
];

// Second page intentionally re-includes n2 to prove the merge de-dupes by id.
const secondPage = [
  {
    id: 'n2',
    type: 'chat',
    title: 'Older (dup)',
    message: 'older message',
    is_read: true,
    metadata: {},
    trip_id: 'trip-1',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'n3',
    type: 'chat',
    title: 'Even older',
    message: 'even older',
    is_read: true,
    metadata: {},
    trip_id: 'trip-1',
    created_at: '2025-12-31T00:00:00.000Z',
  },
  {
    id: 'n4',
    type: 'chat',
    title: 'Oldest',
    message: 'oldest',
    is_read: true,
    metadata: {},
    trip_id: 'trip-1',
    created_at: '2025-12-30T00:00:00.000Z',
  },
];

let capturedLtCursor: string | null = null;

// Stable user reference (real useAuth memoizes it). A fresh object each render would churn
// the hook's useCallback identities and re-fire the realtime effect in an infinite loop.
vi.mock('@/hooks/useAuth', () => {
  const user = { id: 'user-1' };
  return { useAuth: () => ({ user }) };
});

vi.mock('@/hooks/useDemoMode', () => ({
  useDemoMode: () => ({ isDemoMode: false }),
}));

vi.mock('@/integrations/supabase/client', () => {
  const channel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  };
  return {
    supabase: {
      channel: vi.fn(() => channel),
      removeChannel: vi.fn(),
      from: vi.fn(() => {
        const state = { isCount: false, isLt: false };
        const builder: Record<string, unknown> = {};
        builder.select = vi.fn((_cols: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.count) state.isCount = true;
          return builder;
        });
        builder.eq = vi.fn(() => builder);
        builder.lt = vi.fn((_col: string, value: string) => {
          capturedLtCursor = value;
          state.isLt = true;
          return builder;
        });
        builder.order = vi.fn(() => builder);
        builder.limit = vi.fn(() => builder);
        // Thenable: `await builder` resolves to the right payload for each query shape.
        builder.then = (resolve: (value: unknown) => unknown) => {
          if (state.isCount) return resolve({ count: UNREAD_TOTAL, error: null });
          if (state.isLt) return resolve({ data: secondPage, error: null });
          return resolve({ data: firstPage, error: null });
        };
        return builder;
      }),
    },
  };
});

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useNotificationRealtime pagination (loadMore)', () => {
  beforeEach(() => {
    capturedLtCursor = null;
    useNotificationRealtimeStore.getState().setUnreadCount(0);
  });

  it('loads an older page via the oldest created_at cursor, de-dupes, and leaves the unread total intact', async () => {
    const { result } = renderHook(() => useNotificationRealtime(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.notifications).toHaveLength(2));
    await waitFor(() => expect(result.current.unreadCount).toBe(UNREAD_TOTAL));

    await act(async () => {
      await result.current.loadMore();
    });

    // Cursor is the OLDEST loaded created_at, not the newest.
    expect(capturedLtCursor).toBe('2026-01-01T00:00:00.000Z');

    // n2 appeared in both pages but must not double: n1,n2,n3,n4 => 4 rows.
    const ids = result.current.notifications.map(n => n.id);
    expect(ids).toEqual(['n1', 'n2', 'n3', 'n4']);
    expect(new Set(ids).size).toBe(4);
    expect(result.current.notifications[0].id).toBe('n1');

    // Unread is a separate DB COUNT — paging in older rows must not change it.
    expect(result.current.unreadCount).toBe(UNREAD_TOTAL);

    // A short follow-up page (< PAGE_SIZE) means the feed is exhausted.
    expect(result.current.hasMore).toBe(false);
  });
});
