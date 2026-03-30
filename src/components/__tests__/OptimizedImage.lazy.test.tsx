import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { OptimizedImage } from '../OptimizedImage';

describe('OptimizedImage lazy loading', () => {
  let observeSpy: ReturnType<typeof vi.fn>;
  let disconnectSpy: ReturnType<typeof vi.fn>;
  let intersectionCallback: IntersectionObserverCallback | null = null;

  beforeEach(() => {
    observeSpy = vi.fn();
    disconnectSpy = vi.fn();
    intersectionCallback = null;

    global.IntersectionObserver = class {
      constructor(cb: IntersectionObserverCallback) {
        intersectionCallback = cb;
      }
      observe = observeSpy;
      disconnect = disconnectSpy;
      unobserve = vi.fn();
      takeRecords = vi.fn(() => []);
      root = null;
      rootMargin = '';
      thresholds = [];
    } as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers IntersectionObserver on the root element when lazy (covers desktop trip grid)', async () => {
    render(
      <div style={{ height: 200, width: 400, position: 'relative' }}>
        <OptimizedImage
          src="https://example.com/cover.jpg"
          alt="cover"
          lazy
          priority={false}
          className="absolute inset-0"
        />
      </div>,
    );

    await waitFor(() => {
      expect(observeSpy).toHaveBeenCalled();
    });

    const observedEl = observeSpy.mock.calls[0]?.[0] as HTMLElement;
    expect(observedEl).toBeInstanceOf(HTMLElement);

    await act(async () => {
      intersectionCallback?.(
        [{ isIntersecting: true, target: observedEl } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    await waitFor(() => {
      const img = document.querySelector('img[src="https://example.com/cover.jpg"]');
      expect(img).toBeTruthy();
    });
  });
});
