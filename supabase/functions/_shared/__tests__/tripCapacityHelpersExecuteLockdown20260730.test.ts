import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '../../../..');
const read = (p: string) => readFileSync(resolve(repoRoot, p), 'utf8');

describe('trip capacity helpers EXECUTE lockdown (2026-07-30)', () => {
  const sql = read(
    'supabase/migrations/20260730160500_revoke_authenticated_trip_capacity_helpers.sql',
  );
  const joinTrip = read('supabase/functions/join-trip/index.ts');

  it('revokes PUBLIC/anon/authenticated EXECUTE on both capacity helpers', () => {
    expect(sql).toContain("'get_trip_member_limit', 'is_trip_at_member_capacity'");
    expect(sql).toContain(
      "EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig)",
    );
    expect(sql).toContain("EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig)");
  });

  it('does not re-grant authenticated EXECUTE (regression of 20260727140000)', () => {
    expect(sql).not.toMatch(
      /GRANT EXECUTE ON FUNCTION public\.(get_trip_member_limit|is_trip_at_member_capacity)\([^)]*\) TO authenticated/i,
    );
  });

  it('keeps join-trip as the service-role capacity caller and fails closed on RPC errors', () => {
    expect(joinTrip).toContain("Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')");
    expect(joinTrip).toContain("'is_trip_at_member_capacity'");
    expect(joinTrip).toContain('Unable to verify trip capacity right now');
    expect(joinTrip).toContain('503');
    expect(joinTrip).not.toContain('WARNING: member capacity check failed');
  });
});
