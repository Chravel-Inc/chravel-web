import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { UpgradeModal } from '../UpgradeModal';
import { CONSUMER_PRICE_DISPLAY, TRIP_PASS_DISPLAY } from '@/billing/pricingDisplay';

// UpgradeModal pulls subscription state from this hook; a lightweight mock is
// enough to render the pricing UI (the focus of these tests).
vi.mock('@/hooks/useConsumerSubscription', () => ({
  useConsumerSubscription: () => ({
    upgradeToTier: vi.fn(),
    isLoading: false,
  }),
}));

// Matches visible text even when it is split across sibling nodes (e.g. "$99" and
// "/year" rendered as separate JSX expressions inside one element).
const hasText = (needle: string) => (content: string) => content.includes(needle);

describe('UpgradeModal pricing', () => {
  it('renders without crashing and shows config-derived consumer prices (Explorer default)', () => {
    // Regression guard: an undefined `consumerPlan` reference previously threw a
    // ReferenceError on render — tsc did not catch it. Rendering must succeed.
    render(<UpgradeModal isOpen onClose={vi.fn()} />);

    expect(screen.getByText('Choose Your Plan')).toBeInTheDocument();
    // Default selected plan is Explorer, default billing cycle is annual ($99).
    expect(
      screen.getAllByText(hasText(CONSUMER_PRICE_DISPLAY.explorer.annual)).length,
    ).toBeGreaterThan(0);
    // Trip Pass price ($39.99) is config-derived.
    expect(screen.getAllByText(hasText(TRIP_PASS_DISPLAY.explorer.price)).length).toBeGreaterThan(
      0,
    );
  });

  it('switches to Frequent Chraveler pricing when that plan is selected', async () => {
    const user = userEvent.setup();
    render(<UpgradeModal isOpen onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Frequent Chraveler/i }));

    // Annual FC price ($199) should now be displayed, derived from config.
    expect(
      screen.getAllByText(hasText(CONSUMER_PRICE_DISPLAY['frequent-chraveler'].annual)).length,
    ).toBeGreaterThan(0);
  });

  it('does not render any paid Events tier ($29/$199 per-organizer pricing)', () => {
    render(<UpgradeModal isOpen onClose={vi.fn()} />);

    // Events were folded into Frequent Chraveler — no standalone Events plan/tab.
    expect(screen.queryByRole('button', { name: /^Events$/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Events Plus')).not.toBeInTheDocument();
    expect(screen.queryByText('Events Pro')).not.toBeInTheDocument();
    expect(screen.queryByText(hasText('$29/mo'))).not.toBeInTheDocument();
  });

  it('lists "Up to 3 events" on Explorer and "Unlimited events" on Frequent Chraveler', async () => {
    const user = userEvent.setup();
    render(<UpgradeModal isOpen onClose={vi.fn()} />);

    // Explorer (default) shows the capped events benefit.
    expect(screen.getByText(/Up to 3 events/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Frequent Chraveler/i }));
    expect(screen.getByText(/Unlimited events/i)).toBeInTheDocument();
  });
});
