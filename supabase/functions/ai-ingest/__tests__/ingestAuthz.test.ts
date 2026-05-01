import { describe, expect, it } from 'vitest';
import {
  isServiceRoleRequest,
  resolveSourceContentForTrip,
  verifyActiveTripMembership,
} from '../ingestAuthz.ts';

interface MockQueryResponse {
  data: unknown;
  error?: { message?: string } | null;
}

class MockQueryBuilder {
  private filters: Record<string, unknown> = {};

  constructor(
    private readonly table: string,
    private readonly responseFactory: (
      table: string,
      filters: Record<string, unknown>,
    ) => MockQueryResponse,
  ) {}

  select(_columns: string): this {
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters[column] = value;
    return this;
  }

  async maybeSingle(): Promise<MockQueryResponse> {
    return this.responseFactory(this.table, this.filters);
  }
}

function createMockSupabase(
  responseFactory: (table: string, filters: Record<string, unknown>) => MockQueryResponse,
) {
  return {
    from(table: string) {
      return new MockQueryBuilder(table, responseFactory);
    },
  };
}

describe('isServiceRoleRequest', () => {
  it('returns true only for exact service role bearer header', () => {
    expect(isServiceRoleRequest('Bearer service-key', 'service-key')).toBe(true);
    expect(isServiceRoleRequest('Bearer user-jwt', 'service-key')).toBe(false);
    expect(isServiceRoleRequest(null, 'service-key')).toBe(false);
  });
});

describe('verifyActiveTripMembership', () => {
  it('requires an active trip_members row', async () => {
    const supabase = createMockSupabase((_table, filters) => ({
      data:
        filters.trip_id === 'trip-1' &&
        filters.user_id === 'user-1' &&
        filters.status === 'active'
          ? { user_id: 'user-1' }
          : null,
      error: null,
    }));

    await expect(verifyActiveTripMembership(supabase, 'user-1', 'trip-1')).resolves.toBe(true);
    await expect(verifyActiveTripMembership(supabase, 'user-1', 'trip-2')).resolves.toBe(false);
  });
});

describe('resolveSourceContentForTrip', () => {
  it('rejects cross-trip message lookups', async () => {
    const supabase = createMockSupabase((table, filters) => {
      if (
        table === 'trip_chat_messages' &&
        filters.id === 'message-1' &&
        filters.trip_id === 'trip-1'
      ) {
        return {
          data: { author_name: 'Alex', content: 'Dinner at 7?' },
          error: null,
        };
      }

      return { data: null, error: null };
    });

    await expect(resolveSourceContentForTrip(supabase, 'message', 'message-1', 'trip-1')).resolves
      .toEqual({
        found: true,
        content: 'Alex: Dinner at 7?',
      });

    await expect(resolveSourceContentForTrip(supabase, 'message', 'message-1', 'trip-2')).resolves
      .toEqual({
        found: false,
        content: '',
      });
  });

  it('fails closed for broadcast placeholders without verified source binding', async () => {
    const supabase = createMockSupabase(() => ({ data: null, error: null }));

    await expect(
      resolveSourceContentForTrip(supabase, 'broadcast', 'broadcast-1', 'trip-1'),
    ).resolves.toEqual({
      found: false,
      content: '',
    });
  });
});
