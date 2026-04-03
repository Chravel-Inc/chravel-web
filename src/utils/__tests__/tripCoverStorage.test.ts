import { describe, expect, it } from 'vitest';
import { buildTripCoverStoragePath, TRIP_COVER_BUCKET } from '../tripCoverStorage';

describe('tripCoverStorage', () => {
  it('stores covers in trip-media bucket', () => {
    expect(TRIP_COVER_BUCKET).toBe('trip-media');
  });

  it('builds cover storage path scoped by trip id', () => {
    expect(buildTripCoverStoragePath('trip-123', 'cover.jpg')).toBe(
      'trip-covers/trip-123/cover.jpg',
    );
  });
});
