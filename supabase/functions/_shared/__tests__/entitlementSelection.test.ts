import { describe, it, expect } from 'vitest';
import { mapPrimaryEntitlementsByUser, pickPrimaryEntitlement } from '../entitlementSelection.ts';

describe('entitlementSelection', () => {
  it('prefers active subscription over pass for same user', () => {
    const picked = pickPrimaryEntitlement([
      {
        user_id: 'u1',
        plan: 'explorer',
        status: 'active',
        current_period_end: new Date(Date.now() + 86400000).toISOString(),
        purchase_type: 'pass',
        updated_at: new Date().toISOString(),
      },
      {
        user_id: 'u1',
        plan: 'pro-starter',
        status: 'active',
        current_period_end: null,
        purchase_type: 'subscription',
        updated_at: new Date().toISOString(),
      },
    ]);

    expect(picked?.purchase_type).toBe('subscription');
    expect(picked?.plan).toBe('pro-starter');
  });

  it('builds deterministic per-user map without row-order overwrite', () => {
    const map = mapPrimaryEntitlementsByUser([
      {
        user_id: 'u1',
        plan: 'explorer',
        status: 'active',
        current_period_end: null,
        purchase_type: 'subscription',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        user_id: 'u2',
        plan: 'explorer',
        status: 'active',
        current_period_end: null,
        purchase_type: 'pass',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        user_id: 'u1',
        plan: 'frequent-chraveler',
        status: 'active',
        current_period_end: null,
        purchase_type: 'pass',
        updated_at: '2026-01-02T00:00:00.000Z',
      },
    ]);

    expect(map.get('u1')?.purchase_type).toBe('subscription');
    expect(map.get('u2')?.purchase_type).toBe('pass');
  });
});
