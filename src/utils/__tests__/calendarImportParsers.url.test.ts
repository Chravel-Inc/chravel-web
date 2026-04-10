import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseURLSchedule } from '@/utils/calendarImportParsers';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('calendarImportParsers parseURLSchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('surfaces scraper method in user-facing errors', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: {
        success: false,
        error: 'Could not access this website',
        scrape_method: 'blocked',
      },
      error: null,
    } as unknown as Awaited<ReturnType<typeof supabase.functions.invoke>>);

    const result = await parseURLSchedule('https://example.com/blocked');

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('(blocked)');
  });

  it('maps events and falls back url meta counts safely', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: {
        success: true,
        events: [{ title: 'Flight to JFK', date: '2026-06-01', start_time: '09:30' }],
      },
      error: null,
    } as unknown as Awaited<ReturnType<typeof supabase.functions.invoke>>);

    const result = await parseURLSchedule('https://example.com/itinerary');

    expect(result.isValid).toBe(true);
    expect(result.events).toHaveLength(1);
    expect(result.urlMeta).toEqual({ eventsFound: 1, eventsFiltered: 0 });
  });
});
