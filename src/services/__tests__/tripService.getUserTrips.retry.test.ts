/**
 * Regression spec for DEBUG_PATTERNS.md "Dashboard trip cards missing after
 * join approval (status-column drift)".
 *
 * getUserTrips' member-trip lookup must not silently drop member trips when
 * the primary trip_members query errors: it retries once with the legacy
 * active-membership status filter, and reports (instead of swallowing) when
 * both attempts fail.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tripService } from '../tripService';
import { supabase } from '@/integrations/supabase/client';
import { errorTracking } from '@/utils/errorTracking';

type SupabaseResponse<T> = {
  data: T;
  error: { message?: string } | null;
};

type ChainableResponse<T> = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  not: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  then: (onFulfilled?: (value: SupabaseResponse<T>) => unknown) => Promise<unknown>;
};

function createChainableMock<T>(response: SupabaseResponse<T>): ChainableResponse<T> {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    or: vi.fn(),
    not: vi.fn(),
    neq: vi.fn(),
    limit: vi.fn(),
    then: (onFulfilled?: (value: SupabaseResponse<T>) => unknown) =>
      Promise.resolve(response).then(onFulfilled),
  } as ChainableResponse<T>;

  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.or.mockReturnValue(chain);
  chain.not.mockReturnValue(chain);
  chain.neq.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);

  return chain;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      refreshSession: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock('@/utils/errorTracking', () => ({
  errorTracking: {
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    addBreadcrumb: vi.fn(),
  },
}));

/** Install a per-table mock implementation without leaking `any` (mock shape ≠ full Supabase generics). */
function mockSupabaseFrom(impl: (table: string) => unknown): void {
  (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation(impl);
}

const tripRecord = {
  id: 'trip-member-1',
  name: 'Approved Member Trip',
  description: null,
  start_date: '2026-07-24',
  end_date: '2026-07-28',
  destination: 'Philadelphia, PA',
  trip_type: 'consumer',
  created_at: '2026-03-01T00:00:00.000Z',
  updated_at: '2026-03-01T00:00:00.000Z',
  cover_image_url: null,
  created_by: 'owner-user',
  is_archived: false,
  card_color: null,
  organizer_display_name: null,
};

const ownedTripRecord = {
  ...tripRecord,
  id: 'trip-owned-1',
  name: 'Owned Trip',
  created_by: 'member-user',
};

describe('tripService.getUserTrips member lookup compatibility retry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retries without the status filter when the primary member lookup errors', async () => {
    let tripsQueryCount = 0;
    let memberLookupCount = 0;
    const memberLookupChains: ChainableResponse<unknown>[] = [];

    // intentional: mock implementation doesn't match full Supabase generics
    (vi.mocked(supabase.from) as any).mockImplementation(((table: string) => {
      if (table === 'trips') {
        tripsQueryCount += 1;
        if (tripsQueryCount === 1) {
          return createChainableMock({ data: [], error: null });
        }
        return createChainableMock({ data: [tripRecord], error: null });
      }

      if (table === 'trip_members') {
        memberLookupCount += 1;
        if (memberLookupCount === 1) {
          // Primary lookup fails when status column is absent / transient error
          const chain = createChainableMock({
            data: null,
            error: { message: 'column trip_members.status does not exist' },
          });
          memberLookupChains.push(chain);
          return chain;
        }
        if (memberLookupCount === 2) {
          // Compatibility retry succeeds without status filter
          const chain = createChainableMock({
            data: [{ trip_id: 'trip-member-1' }],
            error: null,
          });
          memberLookupChains.push(chain);
          return chain;
        }
        if (memberLookupCount === 3) {
          return createChainableMock({ data: [], error: null });
        }
        // Subsequent batch member-count query
        return createChainableMock({
          data: [{ trip_id: 'trip-member-1', user_id: 'member-user' }],
          error: null,
        });
      }

      if (table === 'trip_events') {
        return createChainableMock({ data: [], error: null });
      }

      return createChainableMock({ data: [], error: null });
    }) as unknown);

    const trips = await tripService.getUserTrips(false, undefined, 'member-user');

    // The approved member trip is present despite the primary lookup failure
    expect(trips).toHaveLength(1);
    expect(trips[0].id).toBe('trip-member-1');
    expect(trips[0].membership_status).toBe('member');

    // The retry omitted the active-membership filter for legacy schemas
    expect(memberLookupChains[0].or).toHaveBeenCalledWith('status.is.null,status.eq.active');
    expect(memberLookupChains[1].or).not.toHaveBeenCalled();

    // The primary failure was reported, not swallowed silently
    expect(vi.mocked(errorTracking.captureException)).toHaveBeenCalledTimes(1);
  });

  it('reports loudly and still returns owner trips when both member lookups fail', async () => {
    let memberLookupCount = 0;

    // intentional: mock implementation doesn't match full Supabase generics
    (vi.mocked(supabase.from) as any).mockImplementation(((table: string) => {
      if (table === 'trips') {
        return createChainableMock({ data: [ownedTripRecord], error: null });
      }

      if (table === 'trip_members') {
        memberLookupCount += 1;
        if (memberLookupCount <= 2) {
          return createChainableMock({
            data: null,
            error: { message: 'permission denied for table trip_members' },
          });
        }
        return createChainableMock({ data: [], error: null });
      }

      if (table === 'trip_events') {
        return createChainableMock({ data: [], error: null });
      }

      return createChainableMock({ data: [], error: null });
    }) as unknown);

    const trips = await tripService.getUserTrips(false, undefined, 'member-user');

    // Owner trips still render — the member-lookup failure does not nuke the dashboard
    expect(trips).toHaveLength(1);
    expect(trips[0].id).toBe('trip-owned-1');
    expect(trips[0].membership_status).toBe('owner');

    // Both the primary failure and the retry failure were reported
    expect(vi.mocked(errorTracking.captureException)).toHaveBeenCalledTimes(2);
    expect(memberLookupCount).toBeGreaterThanOrEqual(2);
  });

  it('does not retry when the primary member lookup succeeds', async () => {
    let tripsQueryCount = 0;
    let memberSelectTripIdCount = 0;
    const memberLookupChains: ChainableResponse<unknown>[] = [];

    // intentional: mock implementation doesn't match full Supabase generics
    (vi.mocked(supabase.from) as any).mockImplementation(((table: string) => {
      if (table === 'trips') {
        tripsQueryCount += 1;
        if (tripsQueryCount === 1) {
          return createChainableMock({ data: [], error: null });
        }
        return createChainableMock({ data: [tripRecord], error: null });
      }

      if (table === 'trip_members') {
        memberSelectTripIdCount += 1;
        const chain = createChainableMock({
          data:
            memberSelectTripIdCount === 1
              ? [{ trip_id: 'trip-member-1' }]
              : memberSelectTripIdCount === 2
                ? []
                : [{ trip_id: 'trip-member-1', user_id: 'member-user' }],
          error: null,
        });
        if (memberSelectTripIdCount === 1) {
          memberLookupChains.push(chain);
        }
        return chain;
      }

      if (table === 'trip_events') {
        return createChainableMock({ data: [], error: null });
      }

      return createChainableMock({ data: [], error: null });
    }) as unknown);

    const trips = await tripService.getUserTrips(false, undefined, 'member-user');

    expect(trips).toHaveLength(1);
    expect(trips[0].membership_status).toBe('member');
    expect(memberLookupChains[0].or).toHaveBeenCalledWith('status.is.null,status.eq.active');
    expect(vi.mocked(errorTracking.captureException)).not.toHaveBeenCalled();
  });
});
