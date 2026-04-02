import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Building } from 'lucide-react';

import { SettingsLayout, type SettingsSection } from '../SettingsLayout';

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => true,
}));

const SECTIONS: SettingsSection[] = [
  { id: 'organization', label: 'Organization Profile', icon: Building },
];

describe('SettingsLayout (mobile)', () => {
  it('allows the content region to shrink so long Pro settings panels scroll instead of clipping', () => {
    const { container } = render(
      <SettingsLayout
        title="Pro Settings"
        sections={SECTIONS}
        activeSection="organization"
        onSectionChange={vi.fn()}
      >
        <div>Tall content</div>
      </SettingsLayout>,
    );

    expect(screen.getByText('Tall content')).toBeInTheDocument();

    const scrollRegion = container.querySelector('.overflow-y-auto');
    expect(scrollRegion).not.toBeNull();
    expect(scrollRegion?.className).toMatch(/min-h-0/);
  });
});
