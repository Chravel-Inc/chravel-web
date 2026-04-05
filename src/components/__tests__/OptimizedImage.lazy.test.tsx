import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { OptimizedImage } from '../OptimizedImage';

// Mock IntersectionObserver
let observerCallback: IntersectionObserverCallback;
let observerInstance: {
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  unobserve: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  observerInstance = {
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
  };

  global.IntersectionObserver = class MockIntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {
      observerCallback = callback;
      Object.assign(this, observerInstance);
    }
    observe = observerInstance.observe;
    disconnect = observerInstance.disconnect;
    unobserve = observerInstance.unobserve;
    root = null;
    rootMargin = '';
    thresholds = [0];
    takeRecords = () => [];
  } as unknown as typeof IntersectionObserver;
});

describe('OptimizedImage lazy loading', () => {
  it('does not render <img> until IntersectionObserver fires', () => {
    render(<OptimizedImage src="https://example.com/photo.jpg" alt="test" />);

    // The wrapper div should exist but no <img> yet
    expect(screen.queryByRole('img')).toBeNull();
    expect(observerInstance.observe).toHaveBeenCalledTimes(1);
  });

  it('renders <img> after intersection is observed', () => {
    render(<OptimizedImage src="https://example.com/photo.jpg" alt="test" />);

    // Simulate intersection
    act(() => {
      observerCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        observerInstance as unknown as IntersectionObserver,
      );
    });

    expect(screen.getByRole('img')).toBeDefined();
    expect(observerInstance.disconnect).toHaveBeenCalled();
  });

  it('renders <img> immediately when priority=true', () => {
    render(<OptimizedImage src="https://example.com/photo.jpg" alt="test" priority />);

    // img should be present immediately — no observer needed
    expect(screen.getByRole('img')).toBeDefined();
    expect(observerInstance.observe).not.toHaveBeenCalled();
  });

  it('renders <img> immediately when lazy=false', () => {
    render(<OptimizedImage src="https://example.com/photo.jpg" alt="test" lazy={false} />);

    expect(screen.getByRole('img')).toBeDefined();
    expect(observerInstance.observe).not.toHaveBeenCalled();
  });

  it('falls back to fallbackSrc on error', () => {
    render(
      <OptimizedImage
        src="https://example.com/broken.jpg"
        alt="test"
        fallbackSrc="https://example.com/fallback.jpg"
        priority
      />,
    );

    const img = screen.getByRole('img') as HTMLImageElement;
    act(() => {
      img.dispatchEvent(new Event('error'));
    });

    expect(img.src).toBe('https://example.com/fallback.jpg');
  });

  it('uses contain fit and renders blur backdrop when requested', () => {
    const { container } = render(
      <OptimizedImage
        src="https://example.com/photo.jpg"
        alt="test"
        priority
        fit="contain"
        showBlurBackdrop
      />,
    );

    const backdrop = container.querySelector('img[aria-hidden="true"]');
    expect(backdrop).toBeTruthy();
    expect(backdrop?.className).toContain('blur-md');
    const mainImage = screen.getByRole('img');
    expect(mainImage.className).toContain('object-contain');
  });
});
