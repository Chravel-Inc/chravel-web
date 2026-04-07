import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PendingTripCard } from '../PendingTripCard';

describe('PendingTripCard', () => {
  it('renders secondary CTA for non-interactive pending trips', () => {
    const onSecondaryCta = vi.fn();

    render(
      <PendingTripCard
        tripId="trip-1"
        tripName="Summer Trip"
        requestedAt="2026-04-01T00:00:00.000Z"
        secondaryCtaLabel="Cancel request"
        onSecondaryCta={onSecondaryCta}
      />,
    );

    const button = screen.getByRole('button', { name: /cancel request/i });
    fireEvent.click(button);

    expect(onSecondaryCta).toHaveBeenCalledTimes(1);
  });

  it('renders primary CTA for interactive cards', () => {
    const onCta = vi.fn();

    render(
      <PendingTripCard
        tripId="trip-2"
        tripName="Team Retreat"
        requestedAt="2026-04-02T00:00:00.000Z"
        interactive
        ctaLabel="Review in trip"
        onCta={onCta}
      />,
    );

    const button = screen.getByRole('button', { name: /review in trip/i });
    fireEvent.click(button);

    expect(onCta).toHaveBeenCalledTimes(1);
  });
});
