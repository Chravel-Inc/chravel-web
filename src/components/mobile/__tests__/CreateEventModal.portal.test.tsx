import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { CreateEventModal } from '../CreateEventModal';

// Mock calendarService to avoid actual API calls
vi.mock('@/services/calendarService', () => ({
  calendarService: {
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CreateEventModal portal behavior', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    selectedDate: new Date('2026-04-01'),
    tripId: 'test-trip-id',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders modal as portal to document.body', () => {
    const { baseElement } = render(<CreateEventModal {...defaultProps} />);

    // Modal should be portaled to body, not inside the root container
    const modal = screen.getByRole('heading', { name: /add event/i });
    expect(modal).toBeTruthy();

    // The fixed overlay should be a direct child of body (via portal)
    const overlay = baseElement.querySelector('body > div.fixed.z-\\[60\\]');
    expect(overlay).toBeTruthy();
  });

  it('has z-index higher than trip header (z-50)', () => {
    const { baseElement } = render(<CreateEventModal {...defaultProps} />);

    // Check for z-[60] class on the portal container
    const portalContainer = baseElement.querySelector('.z-\\[60\\]');
    expect(portalContainer).toBeTruthy();
  });

  it('has max-height that accounts for mobile header and tabs', () => {
    const { baseElement } = render(<CreateEventModal {...defaultProps} />);

    // Find the modal content div with the inline style
    const modalContent = baseElement.querySelector(
      '.bg-glass-slate-card.rounded-t-3xl',
    ) as HTMLElement;
    expect(modalContent).toBeTruthy();

    // Check that maxHeight style is set with CSS calc using mobile vars
    const style = modalContent?.getAttribute('style') || '';
    expect(style).toContain('max-height');
    expect(style).toContain('--mobile-header-h');
    expect(style).toContain('--mobile-tabs-h');
  });

  it('does not render when isOpen is false', () => {
    render(<CreateEventModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('heading', { name: /add event/i })).toBeNull();
  });
});
