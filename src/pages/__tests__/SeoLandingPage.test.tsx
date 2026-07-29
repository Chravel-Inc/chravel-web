import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SeoLandingPage from '../SeoLandingPage';

const baseProps = {
  config: {
    path: '/group-travel-planning-app',
    title: 'Group Travel Planning App | ChravelApp',
    description: 'Plan group trips without the group-chat chaos.',
  },
  h1: 'The group travel planning app that replaces the chaos',
  intro: 'One shared workspace for the itinerary, chat, polls, and payments.',
  faq: [{ q: 'Is there a free plan?', a: 'Yes for small groups.' }],
};

describe('SeoLandingPage', () => {
  it('does not show a reel when reelSlug is omitted', () => {
    render(
      <MemoryRouter>
        <SeoLandingPage {...baseProps} />
      </MemoryRouter>,
    );
    expect(screen.queryByText(/Prefer watching/i)).not.toBeInTheDocument();
  });

  it('shows Prefer watching for Group Trips when reelSlug is set', () => {
    render(
      <MemoryRouter>
        <SeoLandingPage
          {...baseProps}
          reelSlug="group-travel-planning-app"
          reelTitle="Group Trips"
        />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Prefer watching/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Watch the reel/i })).toBeInTheDocument();
    expect(screen.getByText(/how Group Trips runs on ChravelApp/i)).toBeInTheDocument();
  });
});
