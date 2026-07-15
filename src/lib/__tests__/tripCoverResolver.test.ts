import { describe, expect, it } from 'vitest';
import { resolveTripCoverImageUrl } from '../tripCoverResolver';

describe('resolveTripCoverImageUrl', () => {
  it('prefers the assigned cover_image_url over every fallback', () => {
    expect(
      resolveTripCoverImageUrl(
        {
          cover_image_url: 'https://cdn.example.com/actual-cover.jpg',
          coverPhoto: 'https://cdn.example.com/legacy-cover.jpg',
        },
        { fallbackUrl: 'https://chravel.app/chravelapp-og-landscape.png' },
      ),
    ).toBe('https://cdn.example.com/actual-cover.jpg');
  });

  it('falls back only when no assigned cover exists', () => {
    expect(
      resolveTripCoverImageUrl(
        {
          cover_image_url: '   ',
          coverPhoto: null,
        },
        { fallbackUrl: 'https://chravel.app/chravelapp-og-landscape.png' },
      ),
    ).toBe('https://chravel.app/chravelapp-og-landscape.png');
  });

  it('keeps legacy aliases behind the canonical database field', () => {
    expect(
      resolveTripCoverImageUrl({
        cover_image_url: null,
        cover_photo_url: 'https://cdn.example.com/legacy-snake.jpg',
        coverPhotoUrl: 'https://cdn.example.com/legacy-camel.jpg',
      }),
    ).toBe('https://cdn.example.com/legacy-snake.jpg');
  });
});
