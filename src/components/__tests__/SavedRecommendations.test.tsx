import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { SavedRecommendations } from '../SavedRecommendations';

// Regression coverage for the 2026-08-04 audit fix: the add-to-trip picker was
// built from the 12 hardcoded demo trips (src/data/tripsData) for every user —
// a demo-data leak into a real-user surface whose addToTrip calls targeted
// demo trip ids. The picker must derive from useTrips() (demo-aware), and
// addToTrip failures must surface a toast instead of escaping the onClick.

const mockAddToTrip = vi.fn();
const mockToast = vi.fn();

vi.mock('@/hooks/useSavedRecommendations', () => ({
  useSavedRecommendations: () => ({
    items: [
      {
        id: 'saved-1',
        title: 'Sushi Bar Aoki',
        description: 'Omakase counter',
        image_url: null,
        location: 'Tokyo',
        category: 'restaurant',
        data: { id: 'rec-1' },
      },
    ],
    loading: false,
    addToTrip: mockAddToTrip,
    refresh: vi.fn(),
  }),
}));

vi.mock('@/hooks/useTrips', () => ({
  useTrips: () => ({
    trips: [
      {
        id: 'a1b2c3d4-real-trip',
        name: 'Lisbon Getaway',
        destination: 'Lisbon',
        is_archived: false,
      },
      {
        id: 'archived-trip',
        name: 'Old Trip',
        destination: 'Nowhere',
        is_archived: true,
      },
    ],
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('SavedRecommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds the trip picker from the user's real trips, not the demo fixtures", () => {
    render(<SavedRecommendations />);

    fireEvent.click(screen.getByRole('combobox'));

    // The user's active trip is offered…
    expect(screen.getByText('Lisbon Getaway • Lisbon')).toBeInTheDocument();
    // …archived trips are not…
    expect(screen.queryByText(/Old Trip/)).not.toBeInTheDocument();
    // …and no hardcoded demo trip leaks in (spot-check canonical demo entries).
    expect(screen.queryByText(/Tokyo Adventure/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bali/)).not.toBeInTheDocument();
  });

  it('passes the selected real trip id to addToTrip', async () => {
    mockAddToTrip.mockResolvedValue({ status: 'ok' });
    render(<SavedRecommendations />);

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Lisbon Getaway • Lisbon'));
    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(mockAddToTrip).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'saved-1' }),
        'a1b2c3d4-real-trip',
      );
    });
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Added to trip' }));
  });

  it('surfaces a destructive toast when addToTrip throws instead of failing silently', async () => {
    mockAddToTrip.mockRejectedValue(new Error('RLS denial'));
    render(<SavedRecommendations />);

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Lisbon Getaway • Lisbon'));
    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Couldn't add to trip", variant: 'destructive' }),
      );
    });
  });
});
