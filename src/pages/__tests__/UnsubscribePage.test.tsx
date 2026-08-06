import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const invokeMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => invokeMock(...args),
    },
  },
}));

// Import AFTER mocks so the module picks them up.
import UnsubscribePage from '../UnsubscribePage';

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/unsubscribe" element={<UnsubscribePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('UnsubscribePage', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('shows the done state on a successful unsubscribe', async () => {
    invokeMock.mockResolvedValue({ data: { ok: true }, error: null });
    renderAt('/unsubscribe?token=valid-token');

    await waitFor(() => {
      expect(screen.getByText("You're unsubscribed")).toBeInTheDocument();
    });
    expect(invokeMock).toHaveBeenCalledWith('unsubscribe-email', {
      body: { token: 'valid-token' },
    });
  });

  it('shows "invalid link" only for an actual 400 (bad/expired token)', async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: { message: 'bad request', context: { status: 400 } },
    });
    renderAt('/unsubscribe?token=garbage');

    await waitFor(() => {
      expect(screen.getByText("This link didn't work")).toBeInTheDocument();
    });
  });

  it('shows the retryable error state for a 500 — a VALID token that failed server-side must not read as "invalid or expired"', async () => {
    // Regression: a genuine DB failure on a valid token was previously
    // misclassified as an invalid/expired link, telling the user to give up
    // instead of retry.
    invokeMock.mockResolvedValue({
      data: null,
      error: { message: 'server error', context: { status: 500 } },
    });
    renderAt('/unsubscribe?token=valid-but-db-down');

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
    expect(screen.queryByText("This link didn't work")).not.toBeInTheDocument();
  });

  it('shows the invalid state immediately when no token is present in the URL', async () => {
    renderAt('/unsubscribe');

    await waitFor(() => {
      expect(screen.getByText("This link didn't work")).toBeInTheDocument();
    });
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('shows the error state on a network failure (invoke rejects)', async () => {
    invokeMock.mockRejectedValue(new Error('network down'));
    renderAt('/unsubscribe?token=valid-token');

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });
});
