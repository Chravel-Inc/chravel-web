import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migrationSql = readFileSync(
  resolve(__dirname, '../../migrations/20260717190000_trip_payment_messages_need_to_know.sql'),
  'utf8',
);

const splitsMigrationSql = readFileSync(
  resolve(__dirname, '../../migrations/20260717180000_security_privacy_hardening_pass.sql'),
  'utf8',
);

describe('trip_payment_messages need-to-know RLS', () => {
  it('mirrors payment_splits consumer/pro/event visibility predicates', () => {
    expect(migrationSql).toContain('Trip members can view payment messages');
    expect(migrationSql).toContain("COALESCE(t.trip_type, 'consumer') = 'consumer'");
    expect(migrationSql).toContain("COALESCE(t.trip_type, 'consumer') IN ('pro', 'event')");
    expect(migrationSql).toContain(
      'public.is_payment_debtor(public.trip_payment_messages.id, auth.uid())',
    );
    expect(migrationSql).toContain("feature_permissions -> 'payments' ->> 'can_view'");
    expect(migrationSql).toContain("(tm.status IS NULL OR tm.status = 'active')");

    // Parity with the hardened splits policy language
    expect(splitsMigrationSql).toContain("COALESCE(t.trip_type, 'consumer') = 'consumer'");
    expect(splitsMigrationSql).toContain('public.is_payment_debtor(tpm.id, auth.uid())');
  });

  it('blocks former members from inserting payment messages', () => {
    expect(migrationSql).toContain('Trip members can create payment messages');
    expect(migrationSql).toContain('public.is_active_trip_member(auth.uid(), trip_id)');
    expect(migrationSql).toContain('auth.uid() = created_by');
  });
});
