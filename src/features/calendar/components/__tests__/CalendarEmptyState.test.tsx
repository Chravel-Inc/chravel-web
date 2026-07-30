import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarEmptyState } from '../CalendarEmptyState';

describe('CalendarEmptyState', () => {
  it('renders add and import CTAs when both handlers are provided', () => {
    const onAddEvent = vi.fn();
    const onImport = vi.fn();
    render(<CalendarEmptyState onAddEvent={onAddEvent} onImport={onImport} />);

    fireEvent.click(screen.getByRole('button', { name: /add first event/i }));
    fireEvent.click(screen.getByRole('button', { name: /import schedule/i }));

    expect(onAddEvent).toHaveBeenCalledTimes(1);
    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it('omits import CTA when onImport is missing', () => {
    render(<CalendarEmptyState onAddEvent={() => undefined} />);
    expect(screen.queryByRole('button', { name: /import schedule/i })).toBeNull();
    expect(screen.getByRole('button', { name: /add first event/i })).toBeTruthy();
  });
});
