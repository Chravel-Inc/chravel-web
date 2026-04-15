/// <reference types="vitest/globals" />

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { TripViewToggle } from '../TripViewToggle';

describe('TripViewToggle', () => {
  it('applies expected on/off/hover class tokens in light mode for default tabs', () => {
    const onViewModeChange = vi.fn();

    render(
      <div className="light">
        <TripViewToggle viewMode="myTrips" onViewModeChange={onViewModeChange} />
      </div>,
    );

    const myTrips = screen.getByRole('radio', { name: 'My Trips' });
    const pro = screen.getByRole('radio', { name: 'Pro' });
    const events = screen.getByRole('radio', { name: 'Events' });

    expect(myTrips).toHaveAttribute('data-state', 'on');
    expect(pro).toHaveAttribute('data-state', 'off');
    expect(events).toHaveAttribute('data-state', 'off');

    for (const tab of [myTrips, pro, events]) {
      expect(tab).toHaveClass('data-[state=on]:bg-background');
      expect(tab).toHaveClass('data-[state=off]:text-foreground');
      expect(tab).toHaveClass('hover:text-foreground');
    }
  });

  it('switches state classes when selected tab changes', () => {
    const onViewModeChange = vi.fn();

    const { rerender } = render(
      <TripViewToggle viewMode="myTrips" onViewModeChange={onViewModeChange} />,
    );

    expect(screen.getByRole('radio', { name: 'My Trips' })).toHaveAttribute('data-state', 'on');
    expect(screen.getByRole('radio', { name: 'Events' })).toHaveAttribute('data-state', 'off');

    rerender(<TripViewToggle viewMode="events" onViewModeChange={onViewModeChange} />);

    expect(screen.getByRole('radio', { name: 'My Trips' })).toHaveAttribute('data-state', 'off');
    expect(screen.getByRole('radio', { name: 'Events' })).toHaveAttribute('data-state', 'on');
  });
});
