import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '../../../..');
const sql = readFileSync(
  resolve(repoRoot, 'supabase/migrations/20260723190000_dismiss_join_request_active_admin.sql'),
  'utf8',
);

describe('dismiss_join_request active-admin hardening (2026-07-23)', () => {
  it('requires active admin membership (status filter added to the admin check)', () => {
    expect(sql).toContain(
      'CREATE OR REPLACE FUNCTION public.dismiss_join_request(_request_id uuid)',
    );
    expect(sql).toMatch(/role = 'admin'\s*\n\s*AND \(status IS NULL OR status = 'active'\)/);
  });
});
