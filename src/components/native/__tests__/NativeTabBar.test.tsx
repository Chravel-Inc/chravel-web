import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NativeTabBar } from '../NativeTabBar';

vi.mock('@/hooks/useOrientationTransition', () => ({
  useOrientationTransition: () => ({ isMobile: true, isTransitioning: false }),
}));

describe('NativeTabBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls onTabChange when Profile is tapped while already the active tab', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(<NativeTabBar activeTab="profile" onTabChange={onTabChange} onNewPress={() => {}} />);

    await user.click(screen.getByRole('button', { name: /profile/i }));
    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith('profile');
  });

  it('calls onTabChange when Alerts is tapped while already the active tab', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(<NativeTabBar activeTab="alerts" onTabChange={onTabChange} onNewPress={() => {}} />);

    await user.click(screen.getByRole('button', { name: /alerts/i }));
    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith('alerts');
  });
});
