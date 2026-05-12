import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrandBootSplash } from '../BrandBootSplash';

describe('BrandBootSplash', () => {
  it('renders ChravelApp headline, globe icon, and coordination tagline', () => {
    render(<BrandBootSplash />);

    expect(screen.getByRole('status', { name: /loading chravelapp/i })).toBeInTheDocument();
    expect(screen.getByText('ChravelApp')).toBeInTheDocument();
    expect(screen.getByText(/less chaos, more coordination/i)).toBeInTheDocument();

    const img = document.querySelector('img[src="/chravel-pwa-icon.png"]');
    expect(img).toBeTruthy();
    expect(img).toHaveAttribute('alt', '');
  });
});
