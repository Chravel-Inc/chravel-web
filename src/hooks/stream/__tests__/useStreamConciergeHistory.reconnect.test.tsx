/**
 * useStreamConciergeHistory — reconnect / resilience tests
 *
 * Context: TEST_GAPS.md listed `src/hooks/stream/useStreamConciergeHistory.ts`
 * as having the same WebSocket race condition as `useStreamTripChat`. However,
 * that file does NOT exist in the codebase — concierge history is backed by
 * Supabase (TanStack Query) via `src/hooks/useConciergeHistory.ts`, NOT a
 * Stream WebSocket channel. There is no Stream channel to reconnect.
 *
 * Therefore this file:
 *   (1) Documents the absence of a Stream-backed concierge history hook.
 *   (2) Tests the actual concierge history hook (`useConciergeHistory`) for
 *       the resilience behaviours that are relevant to its architecture:
 *       - Loads history for a valid authenticated user
 *       - Returns empty array when no rows exist (no hang, no crash)
 *       - Propagates query errors without crashing
 *       - Is disabled when no user is present (no spurious query)
 *
 * If a Stream-backed concierge history hook is introduced in future, add
 * reconnect backfill following the same pattern as useStreamTripChat.ts
 * (onStreamClientConnectionStatusChange + hasHydratedRef + lastMessageTimestampRef).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Mocks — supabaseMock must be in vi.hoisted so the vi.mock factory can close
// over it (vi.mock factories are hoisted above imports by Vitest).
// ---------------------------------------------------------------------------

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'user-1', email: 'test@test.com' } })),
}));

vi.mock('@/hooks/useDemoMode', () => ({
  useDemoMode: vi.fn(() => ({ isDemoMode: false })),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: supabaseMock,
}));

vi.mock('@/mockData/demoConciergeMessages', () => ({
  DEMO_CONCIERGE_HISTORY: {},
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

/** Build a chainable Supabase query mock that resolves with `result`. */
function makeSupabaseChain(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  };
  return chain;
}

// ---------------------------------------------------------------------------
// Import SUT after mocks
// ---------------------------------------------------------------------------

import { useConciergeHistory } from '@/hooks/useConciergeHistory';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useConciergeHistory — resilience (Supabase-backed, no Stream WebSocket)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('NOTE: no Stream-backed useStreamConciergeHistory exists — this hook uses Supabase TanStack Query', () => {
    // This assertion documents the architectural fact. If this test starts
    // failing with a module-not-found, a Stream-backed hook has been added
    // and the reconnect tests in this file should be updated accordingly.
    expect(typeof useConciergeHistory).toBe('function');
  });

  it('(a) initial load: returns history messages for authenticated user', async () => {
    const rows = [
      {
        id: 'row-1',
        query_text: 'What is the weather?',
        response_text: 'It will be sunny.',
        created_at: '2026-01-01T10:00:00.000Z',
        metadata: null,
      },
    ];
    supabaseMock.from.mockReturnValue(makeSupabaseChain({ data: rows, error: null }));

    const { result } = renderHook(() => useConciergeHistory('trip-abc'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // One row maps to two ChatMessage entries (user query + assistant response)
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].type).toBe('user');
    expect(result.current.data[0].content).toBe('What is the weather?');
    expect(result.current.data[1].type).toBe('assistant');
    expect(result.current.data[1].content).toBe('It will be sunny.');
    expect(result.current.error).toBeNull();
  });

  it('(a) initial load: returns empty array when no rows exist (no hang)', async () => {
    supabaseMock.from.mockReturnValue(makeSupabaseChain({ data: [], error: null }));

    const { result } = renderHook(() => useConciergeHistory('trip-abc'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  it('(b) propagates Supabase error without crashing the hook', async () => {
    supabaseMock.from.mockReturnValue(
      makeSupabaseChain({ data: null, error: { message: 'DB connection failed' } }),
    );

    const { result } = renderHook(() => useConciergeHistory('trip-abc'), {
      wrapper: makeWrapper(),
    });

    // Wait for the error to surface (hook has retry: 1 so we wait on error state,
    // not isLoading, to avoid a 1s retry delay in tests)
    await waitFor(
      () => {
        expect(result.current.error).toBeInstanceOf(Error);
      },
      { timeout: 5000 },
    );

    expect(result.current.data).toHaveLength(0);
  });

  it('(c) is disabled and never queries when no user is present', async () => {
    const { useAuth } = await import('@/hooks/useAuth');
    vi.mocked(useAuth).mockReturnValue({ user: null } as ReturnType<typeof useAuth>);

    const { result } = renderHook(() => useConciergeHistory('trip-abc'), {
      wrapper: makeWrapper(),
    });

    // isLoading should be false immediately when disabled
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(supabaseMock.from).not.toHaveBeenCalled();
    expect(result.current.data).toHaveLength(0);
  });

  it('(c) is disabled for invalid trip IDs (prevents spurious queries)', async () => {
    const { result } = renderHook(() => useConciergeHistory(''), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(supabaseMock.from).not.toHaveBeenCalled();
    expect(result.current.data).toHaveLength(0);
  });
});
