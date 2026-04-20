import { describe, it, expect } from 'vitest';
import { normalizeEventItinerary } from '../eventItinerary';

describe('normalizeEventItinerary', () => {
  it('returns empty array when itinerary is missing', () => {
    expect(normalizeEventItinerary(undefined)).toEqual([]);
    expect(normalizeEventItinerary(null)).toEqual([]);
  });

  it('passes through valid itinerary arrays', () => {
    const days = [{ date: '2026-01-01', events: [{ title: 'A', location: '', time: '' }] }];
    expect(normalizeEventItinerary(days)).toEqual(days);
  });
});
