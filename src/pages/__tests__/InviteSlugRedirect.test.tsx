import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import InviteSlugRedirect from '../InviteSlugRedirect';

describe('InviteSlugRedirect', () => {
  it('redirects /j/:token to /join/:token', () => {
    render(
      <MemoryRouter initialEntries={['/j/chravelabc']}>
        <Routes>
          <Route path="/j/:token" element={<InviteSlugRedirect />} />
          <Route path="/join/:token" element={<div data-testid="join">join</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('join')).toBeInTheDocument();
  });

  it('redirects to home when token param is absent', () => {
    render(
      <MemoryRouter initialEntries={['/j']}>
        <Routes>
          <Route path="/j" element={<InviteSlugRedirect />} />
          <Route path="/" element={<div data-testid="home">home</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('home')).toBeInTheDocument();
  });
});
