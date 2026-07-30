import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UseCaseReelSection } from '../UseCaseReelSection';

const video = {
  src: '/videos/use-cases/wedding-guest-coordination-app.mp4',
  poster: '/videos/use-cases/wedding-guest-coordination-app-poster.jpg',
  ariaLabel: 'ChravelApp weddings use-case reel',
  durationLabel: '20 sec',
};

describe('UseCaseReelSection', () => {
  it('shows the skimmer invitation and poster before play', () => {
    render(<UseCaseReelSection video={video} title="Weddings" />);
    expect(screen.getByText(/Prefer watching/i)).toBeInTheDocument();
    expect(screen.getByText(/Get the gist in 20 sec/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Watch the reel/i })).toBeInTheDocument();

    const player = screen.getByLabelText(video.ariaLabel) as HTMLVideoElement;
    expect(player).toHaveAttribute('poster', video.poster);
    // Bandwidth: src is not attached until the visitor hits Watch.
    expect(player.getAttribute('src')).toBeNull();
  });

  it('attaches the video src when Watch is clicked', () => {
    render(<UseCaseReelSection video={video} title="Weddings" />);
    const player = screen.getByLabelText(video.ariaLabel) as HTMLVideoElement;
    player.play = vi.fn().mockResolvedValue(undefined);

    fireEvent.click(screen.getByRole('button', { name: /Watch the reel/i }));
    expect(player.src).toContain(video.src);
  });
});
