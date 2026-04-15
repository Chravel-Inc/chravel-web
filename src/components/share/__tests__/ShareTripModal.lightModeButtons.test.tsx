/// <reference types="vitest/globals" />

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ShareTripModal } from '../ShareTripModal';

const baseTrip = {
  id: 'trip-1',
  title: 'Austin Weekend',
  location: 'Austin, TX',
  dateRange: 'May 20 - May 22',
  participants: [{ id: 1, name: 'Alex', avatar: '' }],
};

describe('ShareTripModal light mode action button classes', () => {
  beforeEach(() => {
    document.body.classList.add('light');
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    document.body.classList.remove('light');
    vi.restoreAllMocks();
  });

  it('keeps Copy and Share buttons on light-mode safe utility classes', () => {
    render(<ShareTripModal isOpen onClose={vi.fn()} trip={baseTrip} />);

    const copyButton = screen.getByRole('button', { name: 'Copy share link to clipboard' });
    const shareButton = screen.getByRole('button', { name: 'Share via device share sheet' });

    for (const button of [copyButton, shareButton]) {
      expect(button).toHaveClass('bg-[#2a2a2a]');
      expect(button).toHaveClass('hover:bg-[#3a3a3a]');
      expect(button).toHaveClass('text-white');
      expect(button).toHaveClass('border-gold-primary/40');
    }
  });
});
