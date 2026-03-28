import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ConsumerProfileSection } from '../ConsumerProfileSection';

const mockUpdateProfile = vi.fn();
const mockSignOut = vi.fn();
const mockToast = vi.fn();

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
    vi.clearAllMocks();
  });

  it('renders the upload photo button for signed-in user', () => {
    render(<ConsumerProfileSection />);

    expect(screen.getByRole('button', { name: /upload photo/i })).toBeInTheDocument();
    expect(screen.getByText(/JPG, PNG or GIF/)).toBeInTheDocument();
  });

  it('renders the upload photo button in demo mode', () => {
    mockUser = null;
    mockShowDemoContent = true;

    render(<ConsumerProfileSection />);

    expect(screen.getByRole('button', { name: /upload photo/i })).toBeInTheDocument();
  });
});
