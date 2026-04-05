import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsLayout, type SettingsSection } from '../SettingsLayout';
import { Settings, Bell, CreditCard } from 'lucide-react';

// Mock the useIsMobile hook
vi.mock('../../../hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => false),
}));

import { useIsMobile } from '../../../hooks/use-mobile';
const mockUseIsMobile = useIsMobile as ReturnType<typeof vi.fn>;

const mockSections: SettingsSection[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

describe('SettingsLayout', () => {
  const defaultProps = {
    title: 'Test Settings',
    sections: mockSections,
    activeSection: 'general',
    onSectionChange: vi.fn(),
    children: <div data-testid="content">Content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseIsMobile.mockReturnValue(false);
  });

  it('renders desktop layout with sidebar', () => {
    render(<SettingsLayout {...defaultProps} />);

    expect(screen.getByText('Test Settings')).toBeInTheDocument();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('renders mobile layout with dropdown', () => {
    mockUseIsMobile.mockReturnValue(true);
    render(<SettingsLayout {...defaultProps} />);

    // Should show current section label in button
    expect(screen.getByText('General')).toBeInTheDocument();
    // Should not show sidebar title on mobile
    expect(screen.queryByText('Test Settings')).not.toBeInTheDocument();
  });

  it('toggles mobile menu on click', () => {
    mockUseIsMobile.mockReturnValue(true);
    render(<SettingsLayout {...defaultProps} />);

    const menuButton = screen.getByRole('button', { name: /general/i });
    fireEvent.click(menuButton);

    // All sections should now be visible
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
  });

  it('calls onSectionChange when section is clicked', () => {
    const onSectionChange = vi.fn();
    render(<SettingsLayout {...defaultProps} onSectionChange={onSectionChange} />);

    const notificationsTab = screen.getByRole('tab', { name: /notifications/i });
    fireEvent.click(notificationsTab);

    expect(onSectionChange).toHaveBeenCalledWith('notifications');
  });

  it('has min-h-0 on scrollable area for proper flex shrinking (mobile)', () => {
    mockUseIsMobile.mockReturnValue(true);
    const { container } = render(<SettingsLayout {...defaultProps} />);

    // The scrollable area should have min-h-0 to allow shrinking in flex container
    const scrollableArea = container.querySelector('.flex-1.min-h-0.overflow-y-auto');
    expect(scrollableArea).toBeInTheDocument();
  });

  it('has min-h-0 on main element for proper flex shrinking (desktop)', () => {
    mockUseIsMobile.mockReturnValue(false);
    const { container } = render(<SettingsLayout {...defaultProps} />);

    // The main element should have min-h-0
    const mainElement = container.querySelector('main.flex-1.min-h-0.overflow-y-auto');
    expect(mainElement).toBeInTheDocument();
  });
});
