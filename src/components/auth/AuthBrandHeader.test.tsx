import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthBrandHeader } from './AuthBrandHeader';

describe('AuthBrandHeader', () => {
  it('renders the gold ChravelApp wordmark above the safe-area offset', () => {
    render(<AuthBrandHeader />);

    const label = screen.getByText('ChravelApp');
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass('gold-gradient-text');
  });
});
