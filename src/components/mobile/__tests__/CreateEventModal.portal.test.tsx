import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CreateEventModal } from '../CreateEventModal';

vi.mock('@/services/calendarService', () => ({
  calendarService: {
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
  },
}));

describe('CreateEventModal', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders into document.body so fixed overlays sit above trip tab stacking contexts', () => {
    const { container } = render(
      <div data-testid="nested-parent">
        <CreateEventModal
          isOpen
          onClose={vi.fn()}
          selectedDate={new Date(2026, 3, 1)}
          tripId="trip-1"
        />
      </div>,
    );

    expect(document.body.querySelector('[class*="z-[60]"]')).toBeTruthy();
    expect(container.querySelector('[class*="z-[60]"]')).toBeNull();
    expect(screen.getByRole('heading', { name: /add event/i })).toBeInTheDocument();
  });
});
