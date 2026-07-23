import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '../../../..');
const read = (p: string) => readFileSync(resolve(repoRoot, p), 'utf8');

describe('channel role-access fail-open fix (2026-07-23)', () => {
  const sql = read('supabase/migrations/20260723150000_close_channel_role_access_fail_open.sql');

  it('redefines can_access_channel', () => {
    expect(sql).toContain(
      'CREATE OR REPLACE FUNCTION public.can_access_channel(_user_id uuid, _channel_id uuid)',
    );
  });

  it('treats any channel_role_access row as a restriction (closes the is_private=false fail-open)', () => {
    // The open-channel branch must now exclude channels that carry role-access rows.
    expect(sql).toMatch(
      /is_private = false[\s\S]*NOT EXISTS[\s\S]*channel_role_access cra2 WHERE cra2\.channel_id = tc\.id/,
    );
  });

  it('adds active-status filter to the member join (defense in depth)', () => {
    expect(sql).toContain("(tm.status IS NULL OR tm.status = 'active')");
  });
});

describe('anon EXECUTE lockdown on mutating RPCs (2026-07-23)', () => {
  const sql = read('supabase/migrations/20260723160000_revoke_anon_execute_mutating_rpcs.sql');

  it('revokes anon EXECUTE via a catalog-driven loop', () => {
    expect(sql).toContain("EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', r.sig)");
    expect(sql).toContain("n.nspname = 'public'");
  });

  it('targets the privileged mutating RPCs', () => {
    for (const fn of [
      'grant_super_admin',
      'revoke_super_admin',
      'assign_trip_role',
      'promote_to_admin',
      'assign_org_seat',
      'approve_join_request',
    ]) {
      expect(sql).toContain(`'${fn}'`);
    }
  });

  it('does NOT revoke the RLS predicate helpers (would break anon policy evaluation)', () => {
    for (const helper of [
      "'is_active_trip_member'",
      "'has_admin_permission'",
      "'can_access_channel'",
      "'is_trip_member'",
    ]) {
      expect(sql).not.toContain(helper);
    }
  });
});
