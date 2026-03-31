import { describe, expect, it } from 'vitest';
import { getCoverImageUrlFromTripRow } from '../tripCoverUrl';

describe('getCoverImageUrlFromTripRow', () => {
  it('returns undefined when no cover fields', () => {
    expect(getCoverImageUrlFromTripRow({})).toBeUndefined();
  });

  it('prefers cover_image_url over cover_photo', () => {
    expect(
      getCoverImageUrlFromTripRow({
        cover_image_url: 'https://cdn.example/a.jpg',
        cover_photo: 'https://legacy.example/b.jpg',
      }),
    ).toBe('https://cdn.example/a.jpg');
  });

  it('falls back to cover_photo when cover_image_url missing', () => {
    expect(
      getCoverImageUrlFromTripRow({
        cover_photo: 'https://legacy.example/b.jpg',
      }),
    ).toBe('https://legacy.example/b.jpg');
  });

  it('trims whitespace and treats empty as undefined', () => {
    expect(getCoverImageUrlFromTripRow({ cover_image_url: '  ' })).toBeUndefined();
    expect(getCoverImageUrlFromTripRow({ cover_image_url: ' https://x.test/y  ' })).toBe(
      'https://x.test/y',
    );
  });
});
