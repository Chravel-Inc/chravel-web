import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddExistingMemberSection } from '../AddExistingMemberSection';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe('AddExistingMemberSection', () => {
  it('adds by email and clears the field on success', async () => {
    const onAdd = vi.fn().mockResolvedValue(true);
    render(<AddExistingMemberSection onAdd={onAdd} />);

    fireEvent.change(screen.getByLabelText(/member email address/i), {
      target: { value: 'friend@email.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith({ email: 'friend@email.com' });
    });
    expect(screen.getByLabelText(/member email address/i)).toHaveValue('');
  });

  it('switches to phone mode and submits phone contact', async () => {
    const onAdd = vi.fn().mockResolvedValue(true);
    render(<AddExistingMemberSection onAdd={onAdd} />);

    fireEvent.click(screen.getByRole('tab', { name: /phone/i }));
    fireEvent.change(screen.getByLabelText(/member phone number/i), {
      target: { value: '+1 555 123 4567' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith({ phone: '+1 555 123 4567' });
    });
  });
});
