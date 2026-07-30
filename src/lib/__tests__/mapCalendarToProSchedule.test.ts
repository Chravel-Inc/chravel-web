import { describe, expect, it } from 'vitest';
import {
  filterScheduleForLocalDay,
  mapCalendarEventsToProSchedule,
} from '../mapCalendarToProSchedule';

describe('mapCalendarEventsToProSchedule', () => {
  it('maps trip_events into ProSchedule entries sorted by start', () => {
    const schedule = mapCalendarEventsToProSchedule([
      {
        id: '2',
        title: 'Show time',
        start_time: '2026-07-30T20:00:00.000Z',
        end_time: '2026-07-30T22:00:00.000Z',
        location: 'Arena',
      },
      {
        id: '1',
        title: 'Load-in',
        start_time: '2026-07-30T14:00:00.000Z',
        end_time: null,
        location: 'Dock',
      },
    ]);

    expect(schedule).toHaveLength(2);
    expect(schedule[0].id).toBe('1');
    expect(schedule[0].type).toBe('load-in');
    expect(schedule[1].type).toBe('show');
    expect(schedule[0].endTime).toBe('2026-07-30T14:00:00.000Z');
  });

  it('filters to the local calendar day', () => {
    const day = new Date(2026, 6, 30); // local Jul 30 2026
    const schedule = mapCalendarEventsToProSchedule([
      {
        id: 'today',
        title: 'Meeting',
        start_time: new Date(2026, 6, 30, 10, 0, 0).toISOString(),
      },
      {
        id: 'tomorrow',
        title: 'Travel',
        start_time: new Date(2026, 6, 31, 10, 0, 0).toISOString(),
      },
    ]);

    const todayOnly = filterScheduleForLocalDay(schedule, day);
    expect(todayOnly.map(item => item.id)).toEqual(['today']);
  });
});
