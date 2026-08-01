import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ConsumerAIConciergeSection } from '../ConsumerAIConciergeSection';

vi.mock('@/hooks/useConsumerSubscription', () => ({
  useConsumerSubscription: () => ({ isPlus: true }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('@/hooks/useDemoMode', () => ({
  useDemoMode: () => ({ isDemoMode: true }),
}));

vi.mock('@/components/TripPreferences', () => ({
  TripPreferences: () => <div>Trip preferences</div>,
}));

vi.mock('@/features/concierge/components/ConciergeLanguagePicker', () => ({
  ConciergeLanguagePicker: () => <div>Reply Language</div>,
}));

vi.mock('@/features/concierge/components/ConciergeVoicePicker', () => ({
  ConciergeVoicePicker: () => <div>Concierge Voice</div>,
}));

describe('ConsumerAIConciergeSection', () => {
  it('does not offer the disabled conversation mode in Concierge settings', async () => {
    render(<ConsumerAIConciergeSection />);

    await waitFor(() => expect(screen.getByText('Reply Language')).toBeInTheDocument());
    expect(screen.getByText('Concierge Voice')).toBeInTheDocument();
    expect(screen.queryByText('Conversation Mode')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('switch', { name: /hands-free conversation mode/i }),
    ).not.toBeInTheDocument();
  });
});
