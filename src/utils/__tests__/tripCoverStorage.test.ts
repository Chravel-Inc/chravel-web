import { describe, expect, it } from 'vitest';
import {
  buildTripCoverStoragePath,
  normalizeTripCoverUrl,
  TRIP_COVER_BUCKET,
} from '../tripCoverStorage';

describe('tripCoverStorage', () => {
  it('stores covers in trip-media bucket', () => {
    expect(TRIP_COVER_BUCKET).toBe('trip-media');
  });

  it('builds cover storage path scoped by trip id', () => {
    expect(buildTripCoverStoragePath('trip-123', 'cover.jpg')).toBe(
      'trip-covers/trip-123/cover.jpg',
    );
  });

  it('normalizes signed trip-covers URLs to stable public URLs', () => {
    expect(
      normalizeTripCoverUrl(
        'https://abc.supabase.co/storage/v1/object/sign/trip-media/trip-covers/trip-123/cover.jpg?token=deadbeef',
      ),
    ).toBe(
      'https://abc.supabase.co/storage/v1/object/public/trip-media/trip-covers/trip-123/cover.jpg',
    );
  });

  it('does not rewrite non-cover storage URLs', () => {
    const url =
      'https://abc.supabase.co/storage/v1/object/sign/trip-media/trip-123/cover.jpg?token=deadbeef';
    expect(normalizeTripCoverUrl(url)).toBe(url);
  });
});
