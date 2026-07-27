import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { OptimizedImage } from '../OptimizedImage';

// jsdom has no IntersectionObserver; the component uses it to drive `isInView`.
class MockIntersectionObserver {
  constructor(private cb: IntersectionObserverCallback) {}
  observe() {
    this.cb([{ isIntersecting: true } as IntersectionObserverEntry], this as never);
  }
  disconnect() {}
  unobserve() {}
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

/**
 * Regression: 12 production trips stored a cover URL pointing at
 * /storage/v1/object/public/trip-media/... while the `trip-media` bucket is
 * private, so the request 404s. The broken <img> stayed mounted and the browser
 * painted its alt text ("Katt Williams Tour cover") on the card.
 */
describe('OptimizedImage error fallback', () => {
  it('unmounts the image once it fails so alt text is never painted', () => {
    const { container } = render(
      <OptimizedImage src="https://example.test/missing.jpg" alt="Katt Williams Tour cover" />,
    );

    const img = container.querySelector('img');
    expect(img).not.toBeNull();

    fireEvent.error(img as HTMLImageElement);

    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).not.toContain('Katt Williams Tour cover');
  });

  it('tries fallbackSrc before giving up', () => {
    const { container } = render(
      <OptimizedImage
        src="https://example.test/missing.jpg"
        fallbackSrc="https://example.test/fallback.jpg"
        alt="Trip cover"
      />,
    );

    fireEvent.error(container.querySelector('img') as HTMLImageElement);

    const retried = container.querySelector('img');
    expect(retried).not.toBeNull();
    expect(retried?.getAttribute('src')).toBe('https://example.test/fallback.jpg');
  });

  it('unmounts when the fallback fails too', () => {
    const { container } = render(
      <OptimizedImage
        src="https://example.test/missing.jpg"
        fallbackSrc="https://example.test/fallback.jpg"
        alt="Trip cover"
      />,
    );

    fireEvent.error(container.querySelector('img') as HTMLImageElement);
    fireEvent.error(container.querySelector('img') as HTMLImageElement);

    expect(container.querySelector('img')).toBeNull();
  });
});
