import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ConsumerProfileSection } from '../ConsumerProfileSection';

const mockUpdateProfile = vi.fn();
const mockSignOut = vi.fn();
const mockToast = vi.fn();
const mockGetConsistentAvatar = vi.fn();

let mockUser: {
  id: string;
  email: string;
  displayName: string;
  realName?: string;
  phone?: string;
  avatar?: string;
} | null = {
  id: 'user-1',
  email: 'traveler@example.com',
  displayName: 'Traveler',
  realName: 'Taylor Traveler',
  phone: '+1 555 0100',
  avatar: 'https://example.com/avatar.png',
};

let mockShowDemoContent = false;

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    updateProfile: mockUpdateProfile,
    signOut: mockSignOut,
  }),
}));

vi.mock('../../../hooks/useDemoMode', () => ({
  useDemoMode: () => ({
    isDemoMode: mockShowDemoContent,
    showDemoContent: mockShowDemoContent,
  }),
}));

vi.mock('../../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

vi.mock('../../../integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(),
    },
  },
}));

vi.mock('../../../utils/avatarUtils', () => ({
  getConsistentAvatar: (...args: unknown[]) => mockGetConsistentAvatar(...args),
}));

describe('ConsumerProfileSection', () => {
  beforeEach(() => {
    mockUser = {
      id: 'user-1',
      email: 'traveler@example.com',
      displayName: 'Traveler',
      realName: 'Taylor Traveler',
      phone: '+1 555 0100',
      avatar: 'https://example.com/avatar.png',
    };
    mockShowDemoContent = false;
    mockGetConsistentAvatar.mockReset();
    mockGetConsistentAvatar.mockReturnValue('https://example.com/demo-avatar.png');
    vi.clearAllMocks();
  });

  it('renders the signed-in user avatar preview', () => {
    render(<ConsumerProfileSection />);

    expect(screen.getByRole('img', { name: /traveler profile/i })).toHaveAttribute(
      'src',
      'https://example.com/avatar.png',
    );
    expect(screen.getByRole('button', { name: /upload photo/i })).toBeInTheDocument();
  });

  it('renders the demo avatar preview when demo content is shown', () => {
    mockUser = null;
    mockShowDemoContent = true;

    render(<ConsumerProfileSection />);

    expect(mockGetConsistentAvatar).toHaveBeenCalledWith('Demo User');
    expect(screen.getByRole('img', { name: /demo user profile/i })).toHaveAttribute(
      'src',
      'https://example.com/demo-avatar.png',
    );
  });
});
