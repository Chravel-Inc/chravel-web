import { describe, expect, it } from 'vitest';

/**
 * Mirrors JoinTrip.formatInviteEventWhen formatting rules for invite itinerary
 * preview — keeps the join-page value-before-signup contract explicit in tests.
 * No auth/RLS surface: pure date formatting helper only.
 */
function formatInviteEventWhen(item: { start_time: string; is_all_day: boolean | null }): string {
  const start = new Date(item.start_time);
  if (Number.isNaN(start.getTime())) return '';
  if (item.is_all_day) {
    return start.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
  return start.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

describe('join invite itinerary preview formatting', () => {
  it('formats all-day events as a date without a clock time', () => {
    const label = formatInviteEventWhen({
      start_time: '2026-08-01T00:00:00.000Z',
      is_all_day: true,
    });
    expect(label).toMatch(/Aug/);
    expect(label).not.toMatch(/\d{1,2}:\d{2}/);
  });

  it('formats timed events with a clock time', () => {
    const label = formatInviteEventWhen({
      start_time: '2026-08-01T18:30:00.000Z',
      is_all_day: false,
    });
    expect(label.length).toBeGreaterThan(0);
  });

  it('returns empty string for invalid dates', () => {
    expect(formatInviteEventWhen({ start_time: 'not-a-date', is_all_day: false })).toBe('');
  });
});
