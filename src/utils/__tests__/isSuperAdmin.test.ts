import { describe, it, expect, vi } from 'vitest';

// Fixed allowlist so tests don't depend on VITE_SUPER_ADMIN_EMAILS.
vi.mock('@/constants/admins', () => ({
  SUPER_ADMIN_EMAILS: ['admin@example.com', 'founder@chravel.com'],
}));

import * as isSuperAdminModule from '@/utils/isSuperAdmin';
import { isSuperAdminEmail } from '@/utils/isSuperAdmin';

describe('isSuperAdminEmail', () => {
  it('returns false for missing/empty email', () => {
    expect(isSuperAdminEmail()).toBe(false);
    expect(isSuperAdminEmail(null)).toBe(false);
    expect(isSuperAdminEmail('')).toBe(false);
  });

  it('matches allowlisted emails case-insensitively and trims whitespace', () => {
    expect(isSuperAdminEmail('admin@example.com')).toBe(true);
    expect(isSuperAdminEmail('ADMIN@example.com')).toBe(true);
    expect(isSuperAdminEmail('  founder@chravel.com  ')).toBe(true);
  });

  it('returns false for non-allowlisted emails', () => {
    expect(isSuperAdminEmail('user@example.com')).toBe(false);
    expect(isSuperAdminEmail('attacker@evil.com')).toBe(false);
  });
});

describe('super-admin util security invariant', () => {
  // The authoritative super-admin check is the server public.is_super_admin()
  // RPC (via useSuperAdmin). Super-admin roles[] / appRole are attacker-
  // controllable, so this client util must NEVER expose a roles-based grant.
  // If someone re-introduces one, these assertions fail.
  const mod = isSuperAdminModule as Record<string, unknown>;

  it('does not export a roles-based super-admin check', () => {
    expect(mod.hasSuperAdminRole).toBeUndefined();
  });

  it('does not export a comprehensive isSuperAdmin() that could trust client roles', () => {
    expect(mod.isSuperAdmin).toBeUndefined();
  });

  it('only exposes the sync email allowlist hint', () => {
    expect(typeof isSuperAdminModule.isSuperAdminEmail).toBe('function');
  });
});
