import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePendingActions } from '../usePendingActions';

// Pending action rows that the query returns on each test.
const pendingRows: Record<string, unknown>[] = [];

const inserts: Array<{ table: string; values: unknown }> = [];
const bulkDeleteMock = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/hooks/useDemoMode', () => ({
  useDemoMode: () => ({ isDemoMode: false }),
}));

vi.mock('@/services/calendarService', () => ({
  calendarService: {
    bulkDeleteEvents: (ids: string[], tripId: string) => bulkDeleteMock(ids, tripId),
  },
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

// Minimal supabase chainable mock — supports the call shapes used by
// usePendingActions: select/eq/order, insert/select/single, update/eq/eq/select/single,
// and the trip_events query used by emitBulkDeletePreview.
vi.mock('@/integrations/supabase/client', () => {
  const makeChain = (table: string): any => {
    const chain: any = {
      _table: table,
      _filters: {} as Record<string, unknown>,
      _payload: undefined as unknown,
      _select: undefined as string | undefined,
      select(cols?: string) {
        chain._select = cols;
        return chain;
      },
      eq(col: string, val: unknown) {
        chain._filters[col] = val;
        return chain;
      },
      gt() {
        return chain;
      },
      lt() {
        return chain;
      },
      in() {
        return chain;
      },
      order() {
        return chain;
      },
      single() {
        // Fetch single pending action by id
        if (table === 'trip_pending_actions' && chain._filters.id) {
          const row = pendingRows.find(
            r => (r as Record<string, unknown>).id === chain._filters.id,
          );
          if (!row) return Promise.resolve({ data: null, error: { message: 'not found' } });
          return Promise.resolve({ data: row, error: null });
        }
        if (chain._insertResult) {
          return Promise.resolve({ data: chain._insertResult, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      },
      insert(values: unknown) {
        inserts.push({ table, values });
        if (table === 'trip_tasks') {
          chain._insertResult = { id: 'new-task-id' };
        } else {
          chain._insertResult = { id: 'inserted-id' };
        }
        return chain;
      },
      update() {
        return chain;
      },
      delete() {
        return chain;
      },
      then(resolve: (v: unknown) => unknown) {
        // The `select(...).eq(...)` query for trip_events (used by
        // emitBulkDeletePreview) is awaited directly — resolve to an empty
        // candidate set by default; specific tests override with mocks.
        return Promise.resolve({ data: [], error: null }).then(resolve);
      },
    };
    return chain;
  };

  return {
    supabase: {
      from: (table: string) => makeChain(table),
    },
  };
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('usePendingActions confirm switch', () => {
  beforeEach(() => {
    pendingRows.length = 0;
    inserts.length = 0;
    bulkDeleteMock.mockReset();
    bulkDeleteMock.mockResolvedValue({ deleted: 2, alreadyMissing: 0, failed: 0 });
  });

  it('splitTaskAssignments: inserts one trip_tasks row per task on confirm', async () => {
    pendingRows.push({
      id: 'pa-1',
      trip_id: 'trip-1',
      user_id: 'user-2', // not self, prevents auto-confirm
      tool_name: 'splitTaskAssignments',
      status: 'pending',
      payload: {
        tasks: [
          { title: 'Book hotel', assignee: 'Alex' },
          { title: 'Reserve dinner', assignee: 'Sam', notes: 'Italian please' },
        ],
        tripId: 'trip-1',
      },
    });

    const { result } = renderHook(() => usePendingActions('trip-1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.confirmActionAsync('pa-1');

    const taskInserts = inserts.filter(i => i.table === 'trip_tasks');
    expect(taskInserts).toHaveLength(2);
    expect((taskInserts[0].values as Record<string, unknown>).title).toBe('Book hotel');
    expect((taskInserts[1].values as Record<string, unknown>).title).toBe('Reserve dinner');
    expect((taskInserts[1].values as Record<string, unknown>).description).toBe('Italian please');

    // parity rows
    expect(inserts.filter(i => i.table === 'task_assignments')).toHaveLength(2);
    expect(inserts.filter(i => i.table === 'task_status')).toHaveLength(2);
  });

  it('splitTaskAssignments: throws when tasks array is empty', async () => {
    pendingRows.push({
      id: 'pa-2',
      trip_id: 'trip-1',
      user_id: 'user-2',
      tool_name: 'splitTaskAssignments',
      status: 'pending',
      payload: { tasks: [], tripId: 'trip-1' },
    });

    const { result } = renderHook(() => usePendingActions('trip-1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(result.current.confirmActionAsync('pa-2')).rejects.toThrow(/No tasks/);
    expect(inserts.filter(i => i.table === 'trip_tasks')).toHaveLength(0);
  });

  it('emitBulkDeletePreview: throws when no events match the criteria', async () => {
    // Default supabase mock resolves trip_events query to empty array,
    // so filtering produces no IDs and the case should throw.
    pendingRows.push({
      id: 'pa-3',
      trip_id: 'trip-1',
      user_id: 'user-2',
      tool_name: 'emitBulkDeletePreview',
      status: 'pending',
      payload: {
        titleContains: 'practice',
        afterDate: '2026-04-01',
        tripId: 'trip-1',
      },
    });

    const { result } = renderHook(() => usePendingActions('trip-1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(result.current.confirmActionAsync('pa-3')).rejects.toThrow(/No matching events/);
    expect(bulkDeleteMock).not.toHaveBeenCalled();
  });
});
