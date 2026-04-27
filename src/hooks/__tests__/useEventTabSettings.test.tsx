import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEventTabSettings } from '@/hooks/useEventTabSettings';

const {
  maybeSingleMock,
  onMock,
  subscribeMock,
  channelMock,
  removeChannelMock,
} = vi.hoisted(() => {
  const maybeSingleMock = vi.fn();
  const onMock = vi.fn();
  const subscribeMock = vi.fn(() => 'subscription');
  const channelMock = vi.fn(() => ({
    on: onMock,
    subscribe: subscribeMock,
  }));
  const removeChannelMock = vi.fn();

  return {
    maybeSingleMock,
    onMock,
    subscribeMock,
    channelMock,
    removeChannelMock,
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: maybeSingleMock,
        })),
      })),
    })),
    channel: channelMock,
    removeChannel: removeChannelMock,
  },
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

describe('useEventTabSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onMock.mockReturnThis();
    maybeSingleMock.mockResolvedValue({ data: { enabled_features: null }, error: null });
  });

  it('treats legacy null enabled_features as default enabled tabs', async () => {
    const { result } = renderHook(() => useEventTabSettings({ eventId: 'evt-legacy' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.enabledFeatures).toBeUndefined();
    });

    expect(result.current.enabledTabs.chat).toBe(true);
    expect(result.current.enabledTabs.calendar).toBe(true);
    expect(result.current.enabledTabs.media).toBe(true);
    expect(result.current.enabledTabs.polls).toBe(true);
    expect(result.current.enabledTabs.tasks).toBe(true);
    expect(result.current.enabledTabs.agenda).toBe(true);
    expect(result.current.enabledTabs.lineup).toBe(true);
  });
});
