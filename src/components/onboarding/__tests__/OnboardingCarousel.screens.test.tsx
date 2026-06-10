import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OnboardingCarousel } from '../OnboardingCarousel';
import { onboardingEvents } from '@/telemetry/events';

vi.mock('@/services/hapticService', () => ({
  hapticService: {
    light: vi.fn(),
    medium: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/telemetry/events', () => ({
  onboardingEvents: {
    screenViewed: vi.fn(),
    skipped: vi.fn(),
    completed: vi.fn(),
    demoTripSelected: vi.fn(),
  },
}));

describe('OnboardingCarousel 5-screen flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.innerWidth = 1280;
  });

  const renderCarousel = () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();
    const onExploreDemoTrip = vi.fn();
    const onCreateTrip = vi.fn();

    render(
      <OnboardingCarousel
        onComplete={onComplete}
        onSkip={onSkip}
        onExploreDemoTrip={onExploreDemoTrip}
        onCreateTrip={onCreateTrip}
      />,
    );

    return { onComplete, onSkip, onExploreDemoTrip, onCreateTrip };
  };

  it('renders exactly 5 progress dots (one per screen)', () => {
    renderCarousel();
    expect(screen.getAllByRole('tab')).toHaveLength(5);
  });

  it('walks Welcome → Chat → Calendar → Payments → Final CTA and fires completion', async () => {
    const user = userEvent.setup();
    const { onComplete, onCreateTrip } = renderCarousel();

    // Titles can render in both the demo screen and the desktop copy column
    // (getAllByText), and screen transitions are animated (find* queries wait).
    // Screen 0: Welcome
    expect(screen.getAllByText('Plan group trips without the chaos').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Get Started' }));
    expect((await screen.findAllByText('One trip. One chat.')).length).toBeGreaterThan(0); // Chat

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect((await screen.findAllByText("Plans that don't drift.")).length).toBeGreaterThan(0); // Calendar

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect((await screen.findAllByText('Money, organized.')).length).toBeGreaterThan(0); // Payments

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    const createTripButton = await screen.findByRole('button', {
      name: /Create Your First Trip/i,
    }); // Final CTA

    // Analytics indices stay consistent with the 5-screen array (0..4)
    expect(vi.mocked(onboardingEvents.screenViewed).mock.calls.map(call => call[0])).toEqual([
      0, 1, 2, 3, 4,
    ]);

    // Completion flag still fires through onComplete
    await user.click(createTripButton);
    expect(onboardingEvents.completed).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onCreateTrip).toHaveBeenCalledTimes(1);
  });

  it('Skip still works from any screen', async () => {
    const user = userEvent.setup();
    const { onSkip } = renderCarousel();

    await user.click(screen.getByRole('button', { name: 'Get Started' }));
    await user.click(screen.getByRole('button', { name: 'Skip tour' }));

    expect(onboardingEvents.skipped).toHaveBeenCalledWith(1);
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
