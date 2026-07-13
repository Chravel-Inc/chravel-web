import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HeroSection } from '../HeroSection';

// Regression coverage for two production incidents:
// 1) hero video + poster pointed at a sandbox-only asset store (404s in prod)
// 2) hero video showed only the poster on desktop / inside the Lovable preview
//    iframe because the autoplay-promise rejection was silently swallowed.

// jsdom doesn't implement IntersectionObserver — stub one that fires immediately.
class IOStub {
  constructor(private cb: IntersectionObserverCallback) {}
  observe(target: Element) {
    this.cb(
      [{ isIntersecting: true, target } as unknown as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

describe('HeroSection demo video', () => {
  let originalIO: typeof IntersectionObserver | undefined;
  let originalPlay: HTMLMediaElement['play'];

  beforeEach(() => {
    originalIO = (globalThis as { IntersectionObserver?: typeof IntersectionObserver })
      .IntersectionObserver;
    (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IOStub;
    originalPlay = HTMLMediaElement.prototype.play;
  });

  afterEach(() => {
    (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = originalIO;
    HTMLMediaElement.prototype.play = originalPlay;
  });

  it('renders the video from the deploy-local /videos/ path with a matching poster', () => {
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    render(<HeroSection onSignUp={vi.fn()} />);
    const video = screen.getByLabelText('ChravelApp trip dashboard product demo');
    expect(video).toHaveAttribute('src', '/videos/chravel-homepage-demo-60.mp4');
    expect(video).toHaveAttribute('poster', '/videos/chravel-homepage-demo-60-poster.jpg');
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('playsinline');
    expect(video).toHaveAttribute('loop');
  });

  it('explicitly calls play() so autoplay rejections are observable (not swallowed)', async () => {
    const playSpy = vi.fn().mockResolvedValue(undefined);
    HTMLMediaElement.prototype.play = playSpy;
    render(<HeroSection onSignUp={vi.fn()} />);
    await waitFor(() => expect(playSpy).toHaveBeenCalled());
  });

  it('shows a click-to-play overlay when the browser blocks autoplay', async () => {
    HTMLMediaElement.prototype.play = vi.fn().mockRejectedValue(new Error('NotAllowedError'));
    render(<HeroSection onSignUp={vi.fn()} />);
    const overlay = await screen.findByLabelText('Play product demo video');
    expect(overlay).toBeInTheDocument();
    // Video element is still present underneath so a click can resume it.
    expect(screen.getByLabelText('ChravelApp trip dashboard product demo')).toBeInTheDocument();
  });

  it('falls back to the poster image when the video errors', () => {
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    render(<HeroSection onSignUp={vi.fn()} />);
    const video = screen.getByLabelText('ChravelApp trip dashboard product demo');
    fireEvent.error(video);
    expect(screen.queryByLabelText('ChravelApp trip dashboard product demo')).toBeNull();
    const fallback = screen.getByAltText('ChravelApp trips dashboard preview');
    expect(fallback).toHaveAttribute('src', '/videos/chravel-homepage-demo-60-poster.jpg');
  });

  it('still autoplays the muted decorative video (decorative hero; no reduced-motion gate)', () => {
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    render(<HeroSection onSignUp={vi.fn()} />);
    const video = screen.getByLabelText('ChravelApp trip dashboard product demo');
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('poster', '/videos/chravel-homepage-demo-60-poster.jpg');
  });
});
