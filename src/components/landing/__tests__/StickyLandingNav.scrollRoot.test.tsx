import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('@/components/HeaderAuthButton', () => ({
  HeaderAuthButton: () => <span data-testid="mock-header-auth">Log in</span>,
}));

import { StickyLandingNav } from '../StickyLandingNav';

function LandingScrollHarness() {
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);

  return (
    <BrowserRouter>
      <StickyLandingNav onSignUp={() => {}} scrollRoot={scrollRoot} />
      <div
        ref={setScrollRoot}
        data-testid="landing-scroll"
        style={{ height: 400, overflow: 'auto' }}
      >
        <section id="section-hero" style={{ height: 900 }}>
          hero
        </section>
        <section id="section-faq" style={{ height: 900 }}>
          faq
        </section>
      </div>
    </BrowserRouter>
  );
}

describe('StickyLandingNav scrollRoot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reacts to nested scroll container (not window)', () => {
    render(<LandingScrollHarness />);

    const root = screen.getByTestId('landing-scroll');
    Object.defineProperty(root, 'clientHeight', { configurable: true, value: 400 });
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 2000 });

    const nav = root.parentElement?.querySelector('nav');
    expect(nav).toBeTruthy();

    // Past 30% of viewport (400 * 0.3 = 120) should reveal sticky nav
    root.scrollTop = 200;
    fireEvent.scroll(root);

    expect(nav).toHaveClass('translate-y-0');
    expect(nav).not.toHaveClass('-translate-y-full');
  });
});
