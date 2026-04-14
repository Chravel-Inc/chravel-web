import { describe, it, expect } from 'vitest';
import { applyEntitlementUpserts, USER_ENTITLEMENT_CONFLICT_TARGET } from '../entitlementUpsert.ts';

describe('entitlement upsert conflict target', () => {
  it('uses composite conflict target for purchase-scoped upserts', () => {
    expect(USER_ENTITLEMENT_CONFLICT_TARGET).toBe('user_id,purchase_type');
  });

  it('preserves both subscription and pass rows for the same user', () => {
    const userId = '11111111-1111-1111-1111-111111111111';

    const rows = applyEntitlementUpserts([
      { user_id: userId, purchase_type: 'subscription', plan: 'explorer' },
      { user_id: userId, purchase_type: 'pass', plan: 'frequent-chraveler' },
      { user_id: userId, purchase_type: 'subscription', plan: 'pro-starter' },
    ]);

    expect(rows).toHaveLength(2);
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ purchase_type: 'subscription', plan: 'pro-starter' }),
        expect.objectContaining({ purchase_type: 'pass', plan: 'frequent-chraveler' }),
      ]),
    );
  });
});
