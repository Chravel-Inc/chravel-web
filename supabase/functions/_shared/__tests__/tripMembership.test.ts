import { describe, expect, it } from 'vitest';
import { hasActiveTripMembership } from '../tripMembership.ts';

type MembershipResult = {
  data: { user_id: string } | null;
  error: { message?: string; details?: string; hint?: string } | null;
};

function createSupabaseStub(responses: MembershipResult[]) {
  const queue = [...responses];

  return {
    from(table: 'trip_members') {
      expect(table).toBe('trip_members');

      const builder = {
        select(columns: string) {
          expect(columns).toBe('user_id');
          return builder;
        },
        eq(_column: string, _value: string) {
          return builder;
        },
        or(filter: string) {
          expect(filter).toBe('status.is.null,status.eq.active');
          return builder;
        },
        async maybeSingle() {
          return queue.shift() ?? { data: null, error: null };
        },
      };

      return builder;
    },
  };
}

describe('hasActiveTripMembership', () => {
  it('returns true when active membership exists on the first query', async () => {
    const supabase = createSupabaseStub([{ data: { user_id: 'user-1' }, error: null }]);

    await expect(hasActiveTripMembership(supabase, 'trip-1', 'user-1')).resolves.toBe(true);
  });

  it('falls back to legacy membership query when status column is unavailable', async () => {
    const supabase = createSupabaseStub([
      {
        data: null,
        error: { message: 'column trip_members.status does not exist' },
      },
      {
        data: { user_id: 'user-1' },
        error: null,
      },
    ]);

    await expect(hasActiveTripMembership(supabase, 'trip-1', 'user-1')).resolves.toBe(true);
  });

  it('returns false when membership is missing', async () => {
    const supabase = createSupabaseStub([{ data: null, error: null }]);

    await expect(hasActiveTripMembership(supabase, 'trip-1', 'user-1')).resolves.toBe(false);
  });
});
