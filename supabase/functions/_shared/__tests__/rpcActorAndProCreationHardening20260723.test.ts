import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '../../../..');
const read = (p: string) => readFileSync(resolve(repoRoot, p), 'utf8');

describe('RPC actor-authorization hardening (2026-07-23)', () => {
  const sql = read('supabase/migrations/20260723170000_rpc_actor_authorization_hardening.sql');

  it('authorizes update_trip_basecamp_with_version by the authenticated actor, not p_user_id', () => {
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.update_trip_basecamp_with_version');
    expect(sql).toContain('v_uid uuid := auth.uid()');
    // Trip-type-aware authority (consumer any member; pro/event owner/admin/coordinator).
    expect(sql).toContain('public.is_trip_admin(v_uid, p_trip_id)');
    expect(sql).toContain('public.is_trip_coordinator(v_uid, p_trip_id)');
    expect(sql).toContain("COALESCE(t.trip_type, 'consumer') = 'consumer'");
    // Logs with the authenticated actor, never the untrusted parameter.
    expect(sql).toContain('PERFORM log_basecamp_change(\n      p_trip_id, v_uid');
  });

  it('enforces self on mark_broadcast_viewed', () => {
    expect(sql).toMatch(
      /mark_broadcast_viewed[\s\S]*auth\.uid\(\) IS NULL OR auth\.uid\(\) <> p_user_id/,
    );
  });

  it('restricts the SMS quota/entitlement helpers to service role', () => {
    expect(sql).toContain(
      'REVOKE EXECUTE ON FUNCTION public.increment_sms_counter(uuid) FROM anon, authenticated;',
    );
    expect(sql).toContain(
      'REVOKE EXECUTE ON FUNCTION public.check_sms_rate_limit(uuid, integer) FROM anon, authenticated;',
    );
    expect(sql).toContain(
      'REVOKE EXECUTE ON FUNCTION public.is_user_sms_entitled(uuid) FROM anon, authenticated;',
    );
  });
});

describe('pro/event creation server-side enforcement (2026-07-23)', () => {
  const sql = read('supabase/migrations/20260723180000_enforce_pro_event_creation_server_side.sql');

  it('restricts the client trips INSERT policy to consumer trips', () => {
    expect(sql).toContain(
      'DROP POLICY IF EXISTS "Trip creators can create trips" ON public.trips;',
    );
    expect(sql).toMatch(/FOR INSERT[\s\S]*COALESCE\(trip_type, 'consumer'\) = 'consumer'/);
    expect(sql).toContain('(SELECT auth.uid()) = created_by');
  });
});
