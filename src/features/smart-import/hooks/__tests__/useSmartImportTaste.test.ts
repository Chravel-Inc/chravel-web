import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  computeSmartImportTaste,
  useSmartImportTaste,
  FREE_SMART_IMPORT_TASTE_LIMIT,
} from '../useSmartImportTaste';

const queryResult = vi.hoisted(() => ({
  data: [] as Array<{ usage_count: number | null }>,
  error: null as { message: string } | null,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'free@example.com' } }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ data: queryResult.data, error: queryResult.error }),
        }),
      }),
    }),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('computeSmartImportTaste', () => {
  it('allows the first import when no usage is recorded', () => {
    const taste = computeSmartImportTaste([]);
    expect(taste.usedCount).toBe(0);
    expect(taste.canUseFreeImport).toBe(true);
  });

  it('blocks after the single free import is consumed', () => {
    const taste = computeSmartImportTaste([{ usage_count: 1 }]);
    expect(taste.usedCount).toBe(1);
    expect(taste.canUseFreeImport).toBe(false);
  });

  it('sums usage across months (rows are per user/trip/month)', () => {
    const taste = computeSmartImportTaste([{ usage_count: 1 }, { usage_count: 2 }]);
    expect(taste.usedCount).toBe(3);
    expect(taste.canUseFreeImport).toBe(false);
  });

  it('treats null counts as zero and never goes negative', () => {
    const taste = computeSmartImportTaste([{ usage_count: null }, { usage_count: -2 }]);
    expect(taste.usedCount).toBe(0);
    expect(taste.canUseFreeImport).toBe(true);
  });

  it('keeps the free taste limit at exactly 1', () => {
    expect(FREE_SMART_IMPORT_TASTE_LIMIT).toBe(1);
  });
});

describe('useSmartImportTaste', () => {
  beforeEach(() => {
    queryResult.data = [];
    queryResult.error = null;
  });

  it('reports the taste as available for a trip with no imports', async () => {
    const { result } = renderHook(() => useSmartImportTaste('trip-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.usedCount).toBe(0);
    expect(result.current.canUseFreeImport).toBe(true);
  });

  it('blocks the taste once usage rows exist for the trip', async () => {
    queryResult.data = [{ usage_count: 1 }];

    const { result } = renderHook(() => useSmartImportTaste('trip-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.usedCount).toBe(1));
    expect(result.current.canUseFreeImport).toBe(false);
  });

  it('fails open when the usage query errors (server quota still enforces)', async () => {
    queryResult.error = { message: 'permission denied' };
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { result } = renderHook(() => useSmartImportTaste('trip-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.canUseFreeImport).toBe(true);
    consoleSpy.mockRestore();
  });
});
