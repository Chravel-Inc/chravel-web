/// <reference types="vitest/globals" />
/**
 * Regression test for the bulk-delete preview leak (Data Flow Map — AI Concierge action).
 *
 * `bulkDeleteCalendarEvents` writes a `status: 'pending'` row to trip_pending_actions
 * as a preview, then resolves it through its own server-side preview-token flow.
 * Because usePendingActions auto-confirms every self-owned pending row, that preview
 * row used to be routed into the confirm switch, fall through to the default
 * `assertNeverToolName` throw, and surface a spurious
 * "Unknown tool: bulkDeleteCalendarEvents" error toast while the real delete was
 * still being reviewed.
 *
 * The hook must exclude bespoke-flow tools from what it fetches, so the preview row
 * is never surfaced and never auto-confirmed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { toast } from 'sonner';
import { usePendingActions } from '../usePendingActions';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/hooks/useDemoMode', () => ({
  useDemoMode: () => ({ isDemoMode: false }),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

// Pending fetch chain: .from().select().eq().eq().order() resolves to { data, error }.
const createSelectChain = (rows: unknown[]) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: rows, error: null }),
  };
  return chain;
};

describe('usePendingActions — bespoke preview flow exclusion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('excludes self-owned bulkDeleteCalendarEvents preview rows and never auto-confirms them', async () => {
    const rows = [
      {
        id: 'preview-1',
        trip_id: 'trip-1',
        user_id: 'user-1', // self-owned: would have been auto-confirmed before the fix
        tool_name: 'bulkDeleteCalendarEvents',
        tool_call_id: 'tc-1',
        payload: { matched_event_ids: ['e1', 'e2'] },
        status: 'pending',
        source_type: 'ai_concierge',
        created_at: new Date().toISOString(),
        resolved_at: null,
        resolved_by: null,
      },
      {
        id: 'task-1',
        trip_id: 'trip-1',
        user_id: 'user-2', // owned by someone else, so it is surfaced but not auto-confirmed
        tool_name: 'createTask',
        tool_call_id: 'tc-2',
        payload: { title: 'Pack bags' },
        status: 'pending',
        source_type: 'ai_concierge',
        created_at: new Date().toISOString(),
        resolved_at: null,
        resolved_by: null,
      },
    ];

    mockFrom.mockImplementation(() => createSelectChain(rows));

    const { result } = renderHook(() => usePendingActions('trip-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // The bulk-delete preview is filtered out entirely.
    expect(result.current.pendingActions.map(a => a.tool_name)).toEqual(['createTask']);
    expect(
      result.current.pendingActions.some(a => a.tool_name === 'bulkDeleteCalendarEvents'),
    ).toBe(false);

    // Auto-confirm must never have routed the preview into the confirm switch,
    // which would have produced an "Unknown tool" error toast.
    expect(toast.error).not.toHaveBeenCalledWith(expect.stringContaining('Unknown tool'));
  });
});
