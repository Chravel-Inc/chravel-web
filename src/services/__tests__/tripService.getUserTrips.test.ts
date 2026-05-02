import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tripService } from '../tripService';
import { supabase } from '@/integrations/supabase/client';

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

describe('tripService.getUserTrips', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns member trips without status filter (status column does not exist)', async () => {
    const tripRecord = {
      id: 'trip-member-1',
      name: 'MLB All Star Weekend',
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

    let tripsQueryCount = 0;

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
        return createChainableMock({
          data: [{ trip_id: 'trip-member-1' }],
          error: null,
        });
      }

      if (table === 'trip_events') {
        return createChainableMock({ data: [], error: null });
      }

      return createChainableMock({ data: [], error: null });
    }) as unknown);

    const trips = await tripService.getUserTrips(false, undefined, 'member-user');

    expect(trips).toHaveLength(1);
    expect(trips[0].id).toBe('trip-member-1');
    expect(trips[0].membership_status).toBe('member');
  });

  it('does not append pending requests and returns member trip after membership appears', async () => {
    const tripRecord = {
      id: 'trip-approval-1',
      name: 'Summer Camp',
      description: null,
      start_date: '2026-08-01',
      end_date: '2026-08-05',
      destination: 'San Diego, CA',
      trip_type: 'consumer',
      created_at: '2026-03-01T00:00:00.000Z',
      updated_at: '2026-03-01T00:00:00.000Z',
      cover_image_url: null,
      created_by: 'owner-user',
      is_archived: false,
      card_color: null,
      organizer_display_name: null,
    };

    let isApproved = false;
    let tripsQueryCount = 0;

    // intentional: mock implementation doesn't match full Supabase generics
    (vi.mocked(supabase.from) as any).mockImplementation(((table: string) => {
      if (table === 'trips') {
        tripsQueryCount += 1;

        if (!isApproved) {
          return createChainableMock({ data: [], error: null });
        }

        if (tripsQueryCount === 2) {
          return createChainableMock({ data: [], error: null });
        }

        if (tripsQueryCount === 3) {
          return createChainableMock({ data: [tripRecord], error: null });
        }

        return createChainableMock({ data: [], error: null });
      }

      if (table === 'trip_members') {
        if (!isApproved) {
          return createChainableMock({ data: [], error: null });
        }

        return createChainableMock({
          data: [{ trip_id: 'trip-approval-1', user_id: 'member-user' }],
          error: null,
        });
      }

      if (table === 'trip_events') {
        return createChainableMock({ data: [], error: null });
      }

      if (table === 'trip_join_requests') {
        throw new Error('getUserTrips should not query trip_join_requests');
      }

      return createChainableMock({ data: [], error: null });
    }) as unknown);

    const pendingTrips = await tripService.getUserTrips(false, undefined, 'member-user');
    expect(pendingTrips).toHaveLength(0);
    expect(vi.mocked(supabase.rpc)).not.toHaveBeenCalled();

    isApproved = true;
    const approvedTrips = await tripService.getUserTrips(false, undefined, 'member-user');
    expect(approvedTrips).toHaveLength(1);
    expect(approvedTrips[0].id).toBe('trip-approval-1');
    expect(approvedTrips[0].membership_status).toBe('member');
    expect(vi.mocked(supabase.rpc)).not.toHaveBeenCalled();
  });

  it('never fetches pending-request cards RPC in owner/member trip query path', async () => {
    // intentional: mock implementation doesn't match full Supabase generics
    (vi.mocked(supabase.from) as any).mockImplementation(((table: string) => {
      if (table === 'trips') {
        return createChainableMock({ data: [], error: null });
      }

      if (table === 'trip_members' || table === 'trip_events') {
        return createChainableMock({ data: [], error: null });
      }

      throw new Error(`Unexpected table query in getUserTrips contract test: ${table}`);
    }) as unknown);

    await tripService.getUserTrips(false, undefined, 'member-user');

    expect(vi.mocked(supabase.rpc)).not.toHaveBeenCalled();
  });
});
