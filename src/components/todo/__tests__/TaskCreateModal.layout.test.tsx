import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskCreateModal } from '../TaskCreateModal';

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => true,
}));

vi.mock('../TaskCreateForm', () => ({
  TaskCreateForm: ({ onClose }: { onClose: () => void }) => (
    <div>
      <button type="button" onClick={onClose}>
        Cancel
      </button>
      <button type="submit">Create Task</button>
    </div>
  ),
}));

describe('TaskCreateModal layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stays a centered Dialog on mobile (not a bottom sheet) with keyboard-stable positioning', () => {
    render(<TaskCreateModal tripId="trip-1" onClose={vi.fn()} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog.className).toMatch(/dialog-keyboard-stable/);
    expect(screen.getByText(/create new task/i)).toBeInTheDocument();

    // Bottom-sheet drawer chrome (vaul drag handle) must not be present.
    expect(document.querySelector('[data-vaul-drawer]')).toBeNull();
  });
});
