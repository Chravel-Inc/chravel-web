import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePendingActions } from '../usePendingActions';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
  }),
}));

vi.mock('@/hooks/useDemoMode', () => ({
  useDemoMode: () => ({
    isDemoMode: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('usePendingActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('materializes assignee task status when a pending task is confirmed', async () => {
    const insertTaskSingle = vi.fn().mockResolvedValue({
      data: { id: 'task-1' },
      error: null,
    });
    const insertTaskSelect = vi.fn().mockReturnValue({ single: insertTaskSingle });
    const insertTask = vi.fn().mockReturnValue({ select: insertTaskSelect });

    const taskStatusInsert = vi.fn().mockResolvedValue({ error: null });
    const taskAssignmentsUpsert = vi.fn().mockResolvedValue({ error: null });

    const updatePendingSingle = vi.fn().mockResolvedValue({
      data: { id: 'pending-1', status: 'confirmed' },
      error: null,
    });
    const updatePendingSelect = vi.fn().mockReturnValue({ single: updatePendingSingle });
    const updatePendingEqStatus = vi.fn().mockReturnValue({ select: updatePendingSelect });
    const updatePendingEqId = vi.fn().mockReturnValue({ eq: updatePendingEqStatus });
    const updatePending = vi.fn().mockReturnValue({ eq: updatePendingEqId });

    const membersSelectEqTrip = vi.fn().mockResolvedValue({
      data: [{ user_id: 'member-1' }, { user_id: 'member-2' }],
      error: null,
    });
    const membersSelect = vi.fn().mockReturnValue({ eq: membersSelectEqTrip });

    const profilesIn = vi.fn().mockResolvedValue({
      data: [
        {
          user_id: 'member-1',
          display_name: 'John Doe',
          resolved_display_name: 'John Doe',
          first_name: 'John',
          last_name: 'Doe',
        },
      ],
      error: null,
    });
    const profilesSelect = vi.fn().mockReturnValue({ in: profilesIn });

    const fetchPendingSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'pending-1',
        trip_id: 'trip-1',
        user_id: 'user-1',
        tool_name: 'createTask',
        tool_call_id: 'call-1',
        payload: {
          title: 'Book dinner',
          description: 'At 7pm',
          assignee: 'John Doe',
          creator_id: 'user-1',
          due_at: null,
        },
        status: 'pending',
        source_type: 'ai_concierge',
        created_at: new Date().toISOString(),
        resolved_at: null,
        resolved_by: null,
      },
      error: null,
    });
    const loadPendingOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const tripPendingSelect = vi.fn().mockImplementation(() => ({
      eq: vi.fn((column: string) => {
        if (column === 'id') {
          return {
            eq: vi.fn((innerColumn: string) => {
              if (innerColumn === 'status') {
                return {
                  single: fetchPendingSingle,
                };
              }

              throw new Error(
                `Unexpected trip_pending_actions select inner eq column: ${innerColumn}`,
              );
            }),
          };
        }

        if (column === 'trip_id') {
          return {
            eq: vi.fn((innerColumn: string) => {
              if (innerColumn === 'status') {
                return {
                  order: loadPendingOrder,
                };
              }

              throw new Error(
                `Unexpected trip_pending_actions list inner eq column: ${innerColumn}`,
              );
            }),
          };
        }

        throw new Error(`Unexpected trip_pending_actions select eq column: ${column}`);
      }),
    }));

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      switch (table) {
        case 'trip_pending_actions':
          return {
            select: tripPendingSelect,
            update: updatePending,
          } as any;
        case 'trip_tasks':
          return {
            insert: insertTask,
          } as any;
        case 'trip_members':
          return {
            select: membersSelect,
          } as any;
        case 'profiles_public':
          return {
            select: profilesSelect,
          } as any;
        case 'task_status':
          return {
            insert: taskStatusInsert,
          } as any;
        case 'task_assignments':
          return {
            upsert: taskAssignmentsUpsert,
          } as any;
        default:
          throw new Error(`Unexpected table ${table}`);
      }
    });

    const { result } = renderHook(() => usePendingActions('trip-1'), {
      wrapper: createWrapper(),
    });

    await result.current.confirmActionAsync('pending-1');

    expect(insertTask).toHaveBeenCalledWith(
      expect.objectContaining({
        trip_id: 'trip-1',
        title: 'Book dinner',
      }),
    );
    expect(taskStatusInsert).toHaveBeenCalledWith([
      { task_id: 'task-1', user_id: 'user-1', completed: false },
      { task_id: 'task-1', user_id: 'member-1', completed: false },
    ]);
    expect(taskAssignmentsUpsert).toHaveBeenCalledWith(
      [
        { task_id: 'task-1', user_id: 'user-1', assigned_by: 'user-1' },
        { task_id: 'task-1', user_id: 'member-1', assigned_by: 'user-1' },
      ],
      { onConflict: 'task_id,user_id' },
    );
    await waitFor(() => {
      expect(updatePending).toHaveBeenCalled();
    });
  });
});
