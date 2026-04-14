import { describe, it, expect } from 'vitest';
import { pickPrimaryEntitlement, resolveEffectiveEntitlement } from '../selectors';

describe('pickPrimaryEntitlement', () => {
  it('prioritizes active subscription over active pass', () => {
    const row = pickPrimaryEntitlement([
      {
        plan: 'explorer',
        status: 'active',
        source: 'stripe',
        purchase_type: 'pass',
        current_period_end: new Date(Date.now() + 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        plan: 'pro-starter',
        status: 'active',
        source: 'revenuecat',
        purchase_type: 'subscription',
        current_period_end: null,
        updated_at: new Date().toISOString(),
      },
    ]);

    expect(row?.purchase_type).toBe('subscription');
    expect(row?.plan).toBe('pro-starter');
  });
});

describe('resolveEffectiveEntitlement', () => {
  it('treats canceled subscription with future period as effective access', () => {
    const effective = resolveEffectiveEntitlement([
      {
        plan: 'explorer',
        status: 'canceled',
        source: 'stripe',
        purchase_type: 'subscription',
        current_period_end: new Date(Date.now() + 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    expect(effective?.hasAccess).toBe(true);
    expect(effective?.status).toBe('canceled');
  });
});
