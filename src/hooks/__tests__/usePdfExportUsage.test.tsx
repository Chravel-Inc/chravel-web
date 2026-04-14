import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode } from 'react';
import { usePdfExportUsage } from '../usePdfExportUsage';

const rpcMock = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'free@example.com' } }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('usePdfExportUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps unlimited rpc usage to paid-user state', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          export_count: 0,
          limit_count: null,
          remaining: null,
          can_export: true,
          is_unlimited: true,
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => usePdfExportUsage('trip-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isPaidUser).toBe(true);
    expect(result.current.canExport).toBe(true);
    expect(result.current.getUsageStatus().status).toBe('unlimited');
  });

  it('uses rpc increment and invalidates usage after successful free export', async () => {
    rpcMock
      .mockResolvedValueOnce({
        data: [
          {
            export_count: 0,
            limit_count: 1,
            remaining: 1,
            can_export: true,
            is_unlimited: false,
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          {
            used_count: 1,
            remaining: 0,
            incremented: true,
            limit_count: 1,
            can_export: false,
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          {
            export_count: 1,
            limit_count: 1,
            remaining: 0,
            can_export: false,
            is_unlimited: false,
          },
        ],
        error: null,
      });

    const { result } = renderHook(() => usePdfExportUsage('trip-2'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.usage?.exportCount).toBe(0));

    act(() => {
      result.current.recordExport();
    });

    await waitFor(() => expect(result.current.usage?.exportCount).toBe(1));

    expect(rpcMock).toHaveBeenCalledWith('get_trip_pdf_export_usage', { p_trip_id: 'trip-2' });
    expect(rpcMock).toHaveBeenCalledWith('increment_trip_pdf_export_usage', {
      p_trip_id: 'trip-2',
    });
    expect(result.current.canExport).toBe(false);
    expect(result.current.getUsageStatus().status).toBe('used');
  });
});
