import { describe, expect, it } from 'vitest';
import { buildTripCoverStoragePath, TRIP_COVER_BUCKET } from '../tripCoverStorage';

describe('tripCoverStorage', () => {
  it('uses dedicated trip-covers bucket', () => {
    expect(TRIP_COVER_BUCKET).toBe('trip-covers');
  });

  it('builds cover storage path scoped by trip id', () => {
    expect(buildTripCoverStoragePath('trip-123', 'cover.jpg')).toBe('trip-123/cover.jpg');
  });
});
