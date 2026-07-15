import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Regression guard: task assignment Alerts/push must target the assignee only.
 *
 * create_notification_for_trip_members(p_actor := assignee) fans out to every
 * OTHER member and excludes the actor — the opposite of assignment semantics.
 * The original 20251105000000 path notified ARRAY[NEW.user_id] only.
 */
const migrationSql = readFileSync(
  resolve(__dirname, '../../migrations/20260715214500_task_assignment_notify_assignee_only.sql'),
  'utf8',
);

/** Strip leading comment block so documentation of the old bug cannot false-positive. */
const functionBody = migrationSql.replace(
  /^[\s\S]*?CREATE OR REPLACE FUNCTION/i,
  'CREATE OR REPLACE FUNCTION',
);

describe('notify_on_task_assignment assignee-only migration', () => {
  it('recreates notify_on_task_assignment', () => {
    expect(functionBody).toContain('CREATE OR REPLACE FUNCTION public.notify_on_task_assignment()');
  });

  it('does not fan out via create_notification_for_trip_members', () => {
    expect(functionBody).not.toMatch(/create_notification_for_trip_members\s*\(/i);
  });

  it('inserts the notification for NEW.user_id (the assignee) only', () => {
    expect(functionBody).toMatch(/INSERT INTO public\.notifications/);
    expect(functionBody).toMatch(/VALUES\s*\(\s*NEW\.user_id,/);
  });

  it('gates on the tasks preference and per-trip mute', () => {
    expect(functionBody).toContain("should_send_notification(NEW.user_id, 'tasks')");
    expect(functionBody).toContain('notifications_muted');
  });

  it('skips self-assignment when assigned_by equals the assignee', () => {
    expect(functionBody).toContain('NEW.assigned_by = NEW.user_id');
  });

  it('keeps assignee-scoped idempotency key', () => {
    expect(functionBody).toContain(
      "'task_assignment:' || NEW.task_id::text || ':' || NEW.user_id::text",
    );
  });

  it('uses assignee-directed generic copy', () => {
    expect(functionBody).toContain("'Task assigned in ' || v_trip_name");
    expect(functionBody).toContain('A task was assigned to you in your ');
  });
});
