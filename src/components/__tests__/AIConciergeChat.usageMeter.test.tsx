/**
 * AIConciergeChat usage meter tests (REPORT.md §5 C1 / B1+B2)
 *
 * Verifies the "X/Y asks" status chip renders for plans with a finite
 * per-trip limit, hides for unlimited plans and demo mode, and that the
 * limit-reached state exposes an in-place upgrade CTA (no /settings route).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AIConciergeChat } from '../AIConciergeChat';

interface MockUsage {
  used: number;
  limit: number | null;
  remaining: number | null;
  isLimitReached: boolean;
  plan: 'free' | 'explorer' | 'frequent_chraveler';
}

const usageState = vi.hoisted(() => ({
  usage: {
    used: 1,
    limit: 3,
    remaining: 2,
    isLimitReached: false,
    plan: 'free',
  } as MockUsage,
  userPlan: 'free' as 'free' | 'explorer' | 'frequent_chraveler',
}));

vi.mock('../../integrations/supabase/client', () => ({
  SUPABASE_PROJECT_URL: 'https://test.supabase.co',
  SUPABASE_PUBLIC_ANON_KEY: 'test-key',
  supabase: {
    auth: {
      onAuthStateChange: vi
        .fn()
        .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    functions: { invoke: vi.fn() },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null }),
            order: () => Promise.resolve({ data: [] }),
          }),
          order: () => Promise.resolve({ data: [] }),
        }),
      }),
    }),
  },
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } }),
}));

vi.mock('../../hooks/useConsumerSubscription', () => ({
  useConsumerSubscription: () => ({
    isPlus: false,
    tier: 'free',
    isLoading: false,
    upgradeToTier: vi.fn(),
  }),
}));

vi.mock('../../hooks/useConciergeUsage', () => ({
  useConciergeUsage: () => ({
    usage: usageState.usage,
    getUsageStatus: () => ({
      status: usageState.usage.isLimitReached ? 'limit_reached' : 'ok',
      message: `${usageState.usage.remaining}/${usageState.usage.limit} Asks`,
      color: usageState.usage.isLimitReached ? 'text-red-500' : 'text-green-500',
    }),
    incrementUsageOnSuccess: vi.fn(),
    isLimitedPlan: usageState.usage.limit !== null,
    isFreeUser: usageState.userPlan === 'free',
    userPlan: usageState.userPlan,
    upgradeUrl: '/settings',
  }),
}));

vi.mock('@/features/smart-import/hooks/useSmartImportTaste', () => ({
  useSmartImportTaste: () => ({
    usedCount: 0,
    canUseFreeImport: true,
    isLoading: false,
    invalidateTaste: vi.fn(),
  }),
}));

vi.mock('../../hooks/useOfflineStatus', () => ({
  useOfflineStatus: () => ({ isOffline: false, isOnline: true }),
}));

vi.mock('../../hooks/useConciergeHistory', () => ({
  useConciergeHistory: () => ({ data: [], isLoading: false, error: null }),
}));

vi.mock('../../hooks/usePendingActions', () => ({
  usePendingActions: () => ({
    pendingActions: [],
    isLoading: false,
    confirmAction: vi.fn(),
    confirmActionAsync: vi.fn(),
    rejectAction: vi.fn(),
    rejectActionAsync: vi.fn(),
    isConfirming: false,
    isRejecting: false,
    hasPendingActions: false,
  }),
}));

vi.mock('@/hooks/useWebSpeechVoice', () => ({
  useWebSpeechVoice: () => ({
    voiceState: 'idle',
    toggleVoice: vi.fn(),
    errorMessage: null,
  }),
}));

vi.mock('../../contexts/BasecampContext', () => ({
  useBasecamp: () => ({
    basecamp: { name: 'Test Basecamp', address: '123 Test St, Test City' },
  }),
}));

describe('AIConciergeChat usage meter', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    usageState.usage = {
      used: 1,
      limit: 3,
      remaining: 2,
      isLimitReached: false,
      plan: 'free',
    };
    usageState.userPlan = 'free';
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  const renderChat = (props: Partial<React.ComponentProps<typeof AIConciergeChat>> = {}) =>
    render(
      <QueryClientProvider client={queryClient}>
        <AIConciergeChat tripId="test-trip" {...props} />
      </QueryClientProvider>,
    );

  it('renders the usage chip when the plan has a finite limit', () => {
    renderChat();

    const chip = screen.getByTestId('concierge-usage-chip');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveTextContent('2/3 free asks');
  });

  it('labels explorer usage without the "free" qualifier', () => {
    usageState.usage = {
      used: 5,
      limit: 25,
      remaining: 20,
      isLimitReached: false,
      plan: 'explorer',
    };
    usageState.userPlan = 'explorer';

    renderChat();

    expect(screen.getByTestId('concierge-usage-chip')).toHaveTextContent('20/25 asks');
  });

  it('hides the chip when the plan is unlimited', () => {
    usageState.usage = {
      used: 42,
      limit: null,
      remaining: null,
      isLimitReached: false,
      plan: 'frequent_chraveler',
    };
    usageState.userPlan = 'frequent_chraveler';

    renderChat();

    expect(screen.queryByTestId('concierge-usage-chip')).not.toBeInTheDocument();
    expect(screen.queryByTestId('concierge-limit-upgrade-cta')).not.toBeInTheDocument();
  });

  it('hides the chip in demo mode', () => {
    renderChat({ isDemoMode: true });

    expect(screen.queryByTestId('concierge-usage-chip')).not.toBeInTheDocument();
  });

  it('shows an in-place upgrade CTA when the limit is reached', () => {
    usageState.usage = { used: 3, limit: 3, remaining: 0, isLimitReached: true, plan: 'free' };

    renderChat();

    expect(screen.getByTestId('concierge-usage-chip')).toHaveTextContent('0/3 free asks');
    const cta = screen.getByTestId('concierge-limit-upgrade-cta');
    expect(cta).toBeInTheDocument();
    expect(cta.tagName).toBe('BUTTON');
  });

  it('opens the upgrade modal (not /settings) from the limit CTA', async () => {
    usageState.usage = { used: 3, limit: 3, remaining: 0, isLimitReached: true, plan: 'free' };

    renderChat();

    const { fireEvent } = await import('@testing-library/react');
    fireEvent.click(screen.getByTestId('concierge-limit-upgrade-cta'));

    // PlusUpsellModal is lazy-loaded + portaled to body
    expect(await screen.findByText(/Start Free Trial/i)).toBeInTheDocument();
    // Trip Pass affordance (B3) is reachable from the same surface
    expect(screen.getByTestId('trip-pass-affordance')).toBeInTheDocument();
  });
});
