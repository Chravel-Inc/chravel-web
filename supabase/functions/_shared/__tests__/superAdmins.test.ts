import { describe, expect, it } from 'vitest';
import {
  FOUNDER_SUPER_ADMIN_EMAILS,
  getSuperAdminEmails,
  isSuperAdminEmail,
} from '../superAdmins.ts';

const mockEnv = (values: Record<string, string | undefined>) => ({
  get: (key: string) => values[key],
});

describe('superAdmins', () => {
  it('returns founder defaults and excludes demo by default', () => {
    const emails = getSuperAdminEmails(mockEnv({}));

    for (const founder of FOUNDER_SUPER_ADMIN_EMAILS) {
      expect(emails.has(founder.toLowerCase())).toBe(true);
    }
    expect(emails.has('demo@chravelapp.com')).toBe(false);
  });

  it('supports explicit demo enable flag and csv env extension', () => {
    const env = mockEnv({
      SUPER_ADMIN_ENABLE_DEMO_EMAIL: 'true',
      SUPER_ADMIN_EMAILS: 'ops@chravelapp.com, partner@chravelapp.com',
    });

    const emails = getSuperAdminEmails(env);
    expect(emails.has('demo@chravelapp.com')).toBe(true);
    expect(emails.has('ops@chravelapp.com')).toBe(true);
    expect(emails.has('partner@chravelapp.com')).toBe(true);
  });

  it('matches emails case-insensitively', () => {
    const env = mockEnv({ SUPER_ADMIN_EMAILS: 'ADMIN@ChravelApp.com' });
    expect(isSuperAdminEmail('admin@chravelapp.com', env)).toBe(true);
    expect(isSuperAdminEmail('non-admin@chravelapp.com', env)).toBe(false);
  });
});
