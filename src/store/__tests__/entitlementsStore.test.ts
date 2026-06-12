/**
 * Regression coverage for the entitlements TTL cache:
 * - The 5-min TTL absorbs duplicate refreshes per user; force bypasses it.
 * - Concurrent refreshes share one in-flight request.
 * - Demo-exit contamination: entering demo mode must clear the TTL stamps so
 *   the refresh after exiting demo always hits the server (otherwise the demo
 *   'frequent-chraveler' plan survives for up to 5 minutes).
 * - Write-generation guard: a slow refresh resolving after clear() (sign-out)
 *   must not repopulate the cleared store.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { useEntitlementsStore } from '../entitlementsStore';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

const USER_A = '11111111-2222-4333-8444-555555555555';
const USER_B = '99999999-8888-4777-8666-555555555555';
const EMAIL = 'traveler@example.com'; // not a super-admin email

type EntitlementRows = { data: unknown[] | null; error: { message: string } | null };

const fromMock = supabase.from as ReturnType<typeof vi.fn>;

/** Wire the two queries performRefresh issues (user_roles, user_entitlements). */
const mockEntitlementQueries = (
  entitlements: EntitlementRows = { data: [], error: null },
  entitlementsPromise?: Promise<EntitlementRows>,
): void => {
  fromMock.mockImplementation((table: string) => {
    if (table === 'user_roles') {
      return { select: () => ({ eq: () => Promise.resolve({ data: [] }) }) };
    }
    return {
      select: () => ({
        eq: () => ({
          in: () => ({
            order: () => entitlementsPromise ?? Promise.resolve(entitlements),
          }),
        }),
      }),
    };
  });
};

describe('entitlementsStore refresh TTL + write guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEntitlementsStore.getState().clear();
    mockEntitlementQueries();
  });

  it('TTL-skips a second non-forced refresh for the same user', async () => {
    const store = useEntitlementsStore.getState();
    await store.refreshEntitlements(USER_A, EMAIL);
    expect(fromMock).toHaveBeenCalledTimes(2); // user_roles + user_entitlements

    await store.refreshEntitlements(USER_A, EMAIL);
    expect(fromMock).toHaveBeenCalledTimes(2); // warm path, no new queries
  });

  it('force bypasses the TTL', async () => {
    const store = useEntitlementsStore.getState();
    await store.refreshEntitlements(USER_A, EMAIL);
    await store.refreshEntitlements(USER_A, EMAIL, { force: true });
    expect(fromMock).toHaveBeenCalledTimes(4);
  });

  it('a different user never hits the warm path', async () => {
    const store = useEntitlementsStore.getState();
    await store.refreshEntitlements(USER_A, EMAIL);
    await store.refreshEntitlements(USER_B, EMAIL);
    expect(fromMock).toHaveBeenCalledTimes(4);
    expect(useEntitlementsStore.getState().ownerUserId).toBe(USER_B);
  });

  it('concurrent refreshes share one in-flight request', async () => {
    const store = useEntitlementsStore.getState();
    await Promise.all([
      store.refreshEntitlements(USER_A, EMAIL),
      store.refreshEntitlements(USER_A, EMAIL),
    ]);
    expect(fromMock).toHaveBeenCalledTimes(2);
  });

  it('refreshes from the server after exiting demo mode (no contamination)', async () => {
    const store = useEntitlementsStore.getState();

    // Boot: real refresh stamps the TTL; user is free tier
    await store.refreshEntitlements(USER_A, EMAIL);
    expect(useEntitlementsStore.getState().plan).toBe('free');

    // Demo tour grants the demo plan as an override
    store.setDemoMode(true);
    expect(useEntitlementsStore.getState().plan).toBe('frequent-chraveler');

    // Exit demo → effect re-runs a NON-forced refresh well inside 5 minutes.
    // It must hit the server (stamps were cleared) and restore the real plan.
    await store.refreshEntitlements(USER_A, EMAIL);
    expect(fromMock).toHaveBeenCalledTimes(4);
    expect(useEntitlementsStore.getState().plan).toBe('free');
    expect(useEntitlementsStore.getState().source).not.toBe('demo');
  });

  it('a slow refresh resolving after clear() cannot repopulate the store', async () => {
    const store = useEntitlementsStore.getState();

    let resolveEntitlements!: (rows: EntitlementRows) => void;
    mockEntitlementQueries(undefined, new Promise(resolve => (resolveEntitlements = resolve)));

    const slowRefresh = store.refreshEntitlements(USER_A, EMAIL);

    // Sign-out clears the store while the refresh is still in flight
    useEntitlementsStore.getState().clear();

    resolveEntitlements({
      data: [
        {
          plan: 'frequent-chraveler',
          status: 'active',
          source: 'stripe',
          purchase_type: 'subscription',
          current_period_end: null,
          updated_at: new Date().toISOString(),
        },
      ],
      error: null,
    });
    await slowRefresh;

    const state = useEntitlementsStore.getState();
    expect(state.plan).toBe('free');
    expect(state.ownerUserId).toBeNull();
    expect(state.lastSyncedAt).toBeNull();
  });
});
