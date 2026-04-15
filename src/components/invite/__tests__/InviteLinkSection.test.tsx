/// <reference types="vitest/globals" />
/**
 * Unit tests for InviteLinkSection.
 *
 * Covers:
 * - Demo link detection uses /j/demo- format (p.chravel.app)
 * - Demo mode indicator shows for demo links
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InviteLinkSection } from '../InviteLinkSection';

describe('InviteLinkSection', () => {
  const defaultProps = {
    inviteLink: '',
    loading: false,
    copied: false,
    onCopyLink: vi.fn(),
    onRegenerate: vi.fn(),
  };

  it('demo link detector correctly identifies demo links (p.chravel.app/j/demo-...)', () => {
    const { rerender } = render(
      <InviteLinkSection
        {...defaultProps}
        inviteLink="https://p.chravel.app/j/demo-abc123-xyz789"
      />,
    );
    expect(screen.getByText(/Demo Mode: Link is for demonstration only/)).toBeInTheDocument();

    rerender(
      <InviteLinkSection
        {...defaultProps}
        inviteLink="https://p.chravel.app/j/chravel7x9k2m"
        isDemoMode={false}
      />,
    );
    expect(screen.queryByText(/Demo Mode: Link is for demonstration only/)).not.toBeInTheDocument();
  });

  it('demo link generator format: https://p.chravel.app/j/demo-...', () => {
    const demoLink = 'https://p.chravel.app/j/demo-trip123-m5k9x';
    render(<InviteLinkSection {...defaultProps} inviteLink={demoLink} />);
    const linkDisplay = screen.getByText(demoLink);
    expect(linkDisplay).toBeInTheDocument();
    expect(demoLink).toMatch(/\/j\/demo-/);
  });

  it('calls onRegenerate when Regenerate is clicked', () => {
    const onRegenerate = vi.fn();
    render(
      <InviteLinkSection
        {...defaultProps}
        inviteLink="https://p.chravel.app/j/chravel7x9k2m"
        onRegenerate={onRegenerate}
      />,
    );
    fireEvent.click(screen.getByText('Regenerate'));
    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });

  it('keeps Copy/Share button utility classes compatible with light mode overrides', () => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: vi.fn(),
    });

    render(
      <div className="light">
        <InviteLinkSection {...defaultProps} inviteLink="https://p.chravel.app/j/chravel7x9k2m" />
      </div>,
    );

    const copyButton = screen.getByRole('button', { name: 'Copy invite link to clipboard' });
    const shareButton = screen.getByRole('button', {
      name: 'Share invite link via Messages, Email, and more',
    });

    for (const button of [copyButton, shareButton]) {
      expect(button).toHaveClass('bg-[#2a2a2a]');
      expect(button).toHaveClass('hover:bg-[#3a3a3a]');
      expect(button).toHaveClass('text-white');
      expect(button).toHaveClass('border-gold-primary/40');
    }
  });

  it('calls onCopyLink when Copy is clicked', () => {
    const onCopyLink = vi.fn();
    render(
      <InviteLinkSection
        {...defaultProps}
        inviteLink="https://p.chravel.app/j/chravel7x9k2m"
        onCopyLink={onCopyLink}
      />,
    );
    fireEvent.click(screen.getByText('Copy'));
    expect(onCopyLink).toHaveBeenCalledTimes(1);
  });
});
