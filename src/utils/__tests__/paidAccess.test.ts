import { describe, expect, it } from 'vitest';
import { hasPaidAccess } from '@/utils/paidAccess';

describe('hasPaidAccess', () => {
  it('returns false for free users', () => {
    expect(hasPaidAccess({ tier: 'free', status: 'active' })).toBe(false);
    expect(hasPaidAccess({ tier: 'free', status: 'inactive' })).toBe(false);
  });

  it('returns true for active paid tiers', () => {
    expect(hasPaidAccess({ tier: 'explorer', status: 'active' })).toBe(true);
    expect(hasPaidAccess({ tier: 'frequent-chraveler', status: 'active' })).toBe(true);
    expect(hasPaidAccess({ tier: 'pro-growth', status: 'active' })).toBe(true);
  });

  it('returns true for trial paid tiers and false for expired', () => {
    expect(hasPaidAccess({ tier: 'pro-enterprise', status: 'trial' })).toBe(true);
    expect(hasPaidAccess({ tier: 'explorer', status: 'expired' })).toBe(false);
  });

  it('always returns true for super admin', () => {
    expect(hasPaidAccess({ tier: 'free', status: 'inactive', isSuperAdmin: true })).toBe(true);
  });

  it('never grants paid access from a client-supplied roles array', () => {
    // roles[] is not an input to the gate. A free/inactive user stays gated
    // regardless of any forged role claim — only tier/status and the
    // server-verified isSuperAdmin boolean can grant access.
    const forged = {
      tier: 'free',
      status: 'inactive',
      roles: ['super_admin', 'enterprise_admin'],
      appRole: 'super_admin',
    } as Parameters<typeof hasPaidAccess>[0];
    expect(hasPaidAccess(forged)).toBe(false);
  });
});
