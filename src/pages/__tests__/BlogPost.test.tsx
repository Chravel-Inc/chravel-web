import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BlogPost from '../BlogPost';
import BlogIndex from '../BlogIndex';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/blog" element={<BlogIndex />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
      </Routes>
    </MemoryRouter>,
  );

describe('BlogPost', () => {
  it('renders the travel-concierge article with an in-content link to the use-case page', () => {
    renderAt('/blog/travel-concierge-better-client-experience-after-booking');
    expect(
      screen.getByRole('heading', { level: 1, name: /better client experience after booking/i }),
    ).toBeInTheDocument();
    // The contextual link uses the page name "travel concierge client portal".
    const link = screen.getByRole('link', { name: /travel concierge client portal/i });
    expect(link).toHaveAttribute('href', '/use-cases/travel-concierge-client-portal');
  });

  it('shows a not-found state for unknown slugs', () => {
    renderAt('/blog/not-a-real-post');
    expect(screen.getByRole('heading', { level: 1, name: /available/i })).toBeInTheDocument();
  });
});

describe('BlogIndex', () => {
  it('lists the post linking to its page', () => {
    renderAt('/blog');
    const link = screen.getByRole('link', { name: /better client experience after booking/i });
    expect(link).toHaveAttribute(
      'href',
      '/blog/travel-concierge-better-client-experience-after-booking',
    );
  });
});
