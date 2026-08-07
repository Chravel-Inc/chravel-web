import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(
  resolve(__dirname, '../create-notification/index.ts'),
  'utf8',
);

describe('create-notification former-member recipient guard', () => {
  it('keeps the sender-side membership check status-aware', () => {
    expect(source).toMatch(
      /Authorization Check[\s\S]*from\('trip_members'\)[\s\S]*select\('role'\)[\s\S]*or\('status\.is\.null,status\.eq\.active'\)[\s\S]*maybeSingle\(\)/,
    );
  });

  it('fans out only to active trip members', () => {
    expect(source).toMatch(
      /Determine target users[\s\S]*from\('trip_members'\)[\s\S]*select\('user_id, status'\)[\s\S]*or\('status\.is\.null,status\.eq\.active'\)/,
    );
  });
});
