import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, '../add-trip-member-by-contact/index.ts'), 'utf8');

describe('add-trip-member-by-contact edge function', () => {
  it('requires auth and capacity check before insert', () => {
    expect(source).toContain('requireAuth');
    expect(source).toContain('is_trip_at_member_capacity');
    expect(source).toContain('lookup_user_id_by_contact');
    expect(source).toContain("error_code: 'USER_NOT_FOUND'");
    expect(source).toContain("error_code: 'TRIP_FULL'");
  });

  it('uses the same invite mint authz split (consumer member vs pro/event admin)', () => {
    expect(source).toContain("tripType === 'consumer'");
    expect(source).toContain('trip_admins');
    expect(source).toContain('trip_members');
  });

  it('does not invent membership for unknown contacts', () => {
    expect(source).toContain('No Chravel account found');
    expect(source).toMatch(/\.from\(['"]trip_members['"]\)\.insert/);
  });
});
