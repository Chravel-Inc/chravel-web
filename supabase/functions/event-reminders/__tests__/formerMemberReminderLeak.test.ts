import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '../../../..');
const read = (path: string) => readFileSync(resolve(repoRoot, path), 'utf8');

// Regression for a finding on PR #888: leave_trip() (20260705182923)
// soft-deletes membership via `UPDATE trip_members SET status = 'left'`
// without removing the row. sync_member_calendar_reminders() originally only
// ran on INSERT/DELETE, so a status transition to 'left' never cleared the
// member's pending calendar_reminders — event-reminders would go on
// notifying a departed member with event title, trip name, and start time.
describe('event-reminders: former-member reminder leak on leave_trip', () => {
  const migration = read(
    'supabase/migrations/20260805093000_fix_calendar_reminder_leave_trip_leak.sql',
  );
  const fn = read('supabase/functions/event-reminders/index.ts');

  it('adds an UPDATE OF status trigger that fires on an active-state transition', () => {
    expect(migration).toMatch(
      /AFTER UPDATE OF status ON public\.trip_members[\s\S]{0,120}WHEN \(OLD\.status IS DISTINCT FROM NEW\.status\)/,
    );
  });

  it('deletes unsent reminders when a member goes inactive (leave_trip path)', () => {
    expect(migration).toMatch(
      /v_was_active AND NOT v_is_active THEN[\s\S]{0,400}DELETE FROM public\.calendar_reminders/,
    );
  });

  it('fans reminders back out when a member rejoins (active-state transition the other way)', () => {
    expect(migration).toContain('NOT v_was_active AND v_is_active THEN');
  });

  it('has a live-active-membership guard in the drain function as defense-in-depth', () => {
    // Even if a future departure path skips the trigger, event-reminders
    // itself must refuse to notify a non-active member.
    expect(fn).toMatch(
      /\.from\('trip_members'\)[\s\S]{0,40}\.select\('trip_id, user_id, status'\)/,
    );
    expect(fn).toMatch(/filter\(row => row\.status === null \|\| row\.status === 'active'\)/);
    expect(fn).toContain('if (!event || !isActiveMember)');
  });
});
