import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * 2026-07-23 — Trip-type-aware calendar + task write authorization.
 *
 * Live pg_policies on prod showed `trip_events` and `trip_tasks` writes gated only
 * on active membership, so on PRO/EVENT trips an `event_attendee` / `pro_viewer`
 * could create/update/DELETE any calendar event (the DELETE policy had no ownership
 * check — one attendee could wipe an entire event schedule) and create tasks against
 * the permission model. The migration keeps the consumer open model and restricts
 * pro/event writes to owner/admin/coordinator (+ the row's own creator on update/delete).
 */

const repoRoot = resolve(__dirname, '../../../..');
const migration = readFileSync(
  resolve(repoRoot, 'supabase/migrations/20260723140000_trip_type_aware_calendar_task_writes.sql'),
  'utf8',
);

describe('trip-type-aware calendar/task write authorization (2026-07-23)', () => {
  it('adds the trip-type-aware authority helpers', () => {
    expect(migration).toContain(
      'CREATE OR REPLACE FUNCTION public.can_manage_trip_calendar(_user_id uuid, _trip_id text)',
    );
    expect(migration).toContain(
      'CREATE OR REPLACE FUNCTION public.can_create_trip_task(_user_id uuid, _trip_id text)',
    );
    // Both helpers keep the consumer open model and branch pro/event to authority.
    expect(migration).toContain("COALESCE(t.trip_type, 'consumer') = 'consumer'");
    expect(migration).toContain('public.is_trip_admin(_user_id, _trip_id)');
    expect(migration).toContain(
      "public.has_coordinator_capability(_user_id, _trip_id, 'can_manage_shared_calendar')",
    );
    expect(migration).toContain(
      "public.has_coordinator_capability(_user_id, _trip_id, 'can_manage_shared_tasks')",
    );
  });

  it('replaces the membership-only calendar write policies with authority-gated ones', () => {
    for (const name of [
      'Allow calendar event creation',
      'Allow calendar event updates',
      'Allow calendar event deletion',
    ]) {
      expect(migration).toContain(`DROP POLICY IF EXISTS "${name}" ON public.trip_events;`);
      expect(migration).toContain(`CREATE POLICY "${name}"`);
    }
    // Every calendar write path now flows through the authority helper.
    expect(migration).toContain('public.can_manage_trip_calendar(auth.uid(), trip_id)');
    // DELETE now has a per-row ownership fallback (previously absent).
    expect(migration).toMatch(/FOR DELETE[\s\S]*created_by = auth\.uid\(\)/);
  });

  it('gates task creation on trip-type authority', () => {
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "Trip members can create tasks" ON public.trip_tasks;',
    );
    expect(migration).toContain('public.can_create_trip_task(auth.uid(), trip_id)');
  });

  it('does not grant anon EXECUTE on the new authority helpers', () => {
    expect(migration).toContain(
      'REVOKE EXECUTE ON FUNCTION public.can_manage_trip_calendar(uuid, text) FROM anon;',
    );
    expect(migration).toContain(
      'REVOKE EXECUTE ON FUNCTION public.can_create_trip_task(uuid, text) FROM anon;',
    );
  });
});
