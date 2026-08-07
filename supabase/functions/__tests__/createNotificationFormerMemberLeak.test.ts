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
      /from\('trip_members'\)[\s\S]{0,120}\.select\('role'\)[\s\S]{0,120}\.or\('status\.is\.null,status\.eq\.active'\)[\s\S]{0,120}\.maybeSingle\(\)/,
    );
  });

  it('fans out only to active trip members', () => {
    expect(source).toMatch(
      /from\('trip_members'\)[\s\S]{0,120}\.select\('user_id, status'\)[\s\S]{0,120}\.or\('status\.is\.null,status\.eq\.active'\)/,
    );
  });
});
