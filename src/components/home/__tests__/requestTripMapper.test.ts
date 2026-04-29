import { describe, expect, it } from 'vitest';
import { formatRequestDateRange, mapOutboundRequestToTripCard } from '../requestTripMapper';

describe('requestTripMapper', () => {
  it('formats date ranges using start and end date when both are present', () => {
    const label = formatRequestDateRange('2026-04-20', '2026-06-25');
    expect(label).toContain('Apr');
    expect(label).toContain('Jun');
    expect(label).toContain('2026');
  });

  it('maps outbound request data without placeholder defaults when metadata exists', () => {
    const card = mapOutboundRequestToTripCard({
      id: 'req-1',
      trip_id: 'trip-1',
      user_id: 'user-1',
      requested_at: '2026-04-28T00:00:00Z',
      direction: 'outbound',
      trip: {
        id: 'trip-1',
        name: 'Investfest Chat',
        destination: 'Paris, France',
        start_date: '2026-04-20',
        end_date: '2026-06-25',
        member_count: 3,
        cover_image_url: 'https://example.com/cover.jpg',
        trip_type: 'consumer',
      },
    });

    expect(card.title).toBe('Investfest Chat');
    expect(card.location).toBe('Paris, France');
    expect(card.peopleCount).toBe(3);
    expect(card.dateRange).toContain('2026');
  });

  it('uses safe fallback values when trip relation is missing', () => {
    const card = mapOutboundRequestToTripCard({
      id: 'req-2',
      trip_id: 'trip-2',
      user_id: 'user-2',
      requested_at: '2026-04-28T00:00:00Z',
      direction: 'outbound',
    });

    expect(card.title).toBe('Untitled trip');
    expect(card.location).toBe('Destination unavailable');
    expect(card.dateRange).toBe('Date TBD');
    expect(card.peopleCount).toBe(1);
  });
});
