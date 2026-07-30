import { describe, expect, it } from 'vitest';
import { USE_CASE_VIDEOS, getUseCaseVideo } from '../useCaseVideos';
import { USE_CASES, hasDetail } from '../useCases';

describe('useCaseVideos', () => {
  it('resolves a published use-case reel by slug', () => {
    const video = getUseCaseVideo('travel-concierge-client-portal');
    expect(video).toBeDefined();
    expect(video!.src).toBe('/videos/use-cases/travel-concierge-client-portal.mp4');
    expect(video!.poster).toBe('/videos/use-cases/travel-concierge-client-portal-poster.jpg');
  });

  it('returns undefined for unknown slugs', () => {
    expect(getUseCaseVideo('not-a-real-use-case')).toBeUndefined();
  });

  it('covers every published UseCasePage (internal detail pages)', () => {
    for (const uc of USE_CASES) {
      if (uc.status !== 'published' || !hasDetail(uc) || uc.href) continue;
      expect(
        USE_CASE_VIDEOS[uc.slug],
        `${uc.slug} is a published detail page but has no web reel`,
      ).toBeDefined();
    }
  });
});
