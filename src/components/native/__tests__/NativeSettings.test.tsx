import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NativeSettings } from '../NativeSettings';

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock('@/services/hapticService', () => ({
  hapticService: {
    light: vi.fn().mockResolvedValue(undefined),
    warning: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/integrations/revenuecat/revenuecatClient', () => ({
  getPlatform: () => 'web',
}));

describe('NativeSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes free-plan upgrade press to subscription navigation on web', async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();

    render(<NativeSettings subscriptionTier="free" onNavigate={onNavigate} />);

    await user.click(screen.getByRole('button', { name: /free plan/i }));

    expect(onNavigate).toHaveBeenCalledWith('subscription');
  });
});
