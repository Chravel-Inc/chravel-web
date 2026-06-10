import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { ItineraryView } from '../ItineraryView';
import type { CalendarEvent } from '../../types/calendar';

const mocks = vi.hoisted(() => ({
  usageState: {
    canExport: true,
    isPaidUser: false,
    recordExport: vi.fn(),
  },
  generateClientPDF: vi.fn(),
  openOrDownloadBlob: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('../../hooks/usePdfExportUsage', () => ({
  usePdfExportUsage: () => mocks.usageState,
}));

vi.mock('../../utils/exportPdfClient', () => ({
  generateClientPDF: mocks.generateClientPDF,
}));

vi.mock('../../utils/download', () => ({
  openOrDownloadBlob: mocks.openOrDownloadBlob,
}));

vi.mock('sonner', () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));

const buildEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: 'event-1',
  title: 'Rehearsal Dinner',
  date: new Date('2026-06-10T19:00:00Z'),
  time: '19:00',
  location: 'The Vineyard',
  description: 'Welcome dinner for all guests',
  createdBy: 'user-1',
  include_in_itinerary: true,
  event_category: 'dining',
  source_type: 'manual',
  ...overrides,
});

describe('ItineraryView export wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.usageState.canExport = true;
    mocks.usageState.isPaidUser = false;
    mocks.generateClientPDF.mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));
    mocks.openOrDownloadBlob.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  it('invokes the shared PDF export path and records free-tier usage', async () => {
    render(<ItineraryView events={[buildEvent()]} tripName="Smith Wedding" tripId="trip-1" />);

    fireEvent.click(screen.getByRole('button', { name: /export pdf/i }));

    await waitFor(() => {
      expect(mocks.generateClientPDF).toHaveBeenCalledTimes(1);
    });

    const [exportData, sections] = mocks.generateClientPDF.mock.calls[0];
    expect(sections).toEqual(['calendar']);
    expect(exportData.tripId).toBe('trip-1');
    expect(exportData.tripTitle).toBe('Smith Wedding');
    expect(exportData.calendar).toEqual([
      {
        title: 'Rehearsal Dinner',
        start_time: '2026-06-10T19:00:00.000Z',
        end_time: undefined,
        location: 'The Vineyard',
        description: 'Welcome dinner for all guests',
      },
    ]);

    await waitFor(() => {
      expect(mocks.openOrDownloadBlob).toHaveBeenCalledTimes(1);
    });
    expect(mocks.usageState.recordExport).toHaveBeenCalledTimes(1);
    expect(mocks.toastSuccess).toHaveBeenCalled();
  });

  it('blocks export for free users who already used their 1 free export', async () => {
    mocks.usageState.canExport = false;
    mocks.usageState.isPaidUser = false;

    render(<ItineraryView events={[buildEvent()]} tripName="Smith Wedding" tripId="trip-1" />);

    fireEvent.click(screen.getByRole('button', { name: /export pdf/i }));

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith(expect.stringContaining('1 free PDF export'));
    });
    expect(mocks.generateClientPDF).not.toHaveBeenCalled();
    expect(mocks.usageState.recordExport).not.toHaveBeenCalled();
  });

  it('does not record usage for paid users', async () => {
    mocks.usageState.canExport = true;
    mocks.usageState.isPaidUser = true;

    render(<ItineraryView events={[buildEvent()]} tripName="Smith Wedding" tripId="trip-1" />);

    fireEvent.click(screen.getByRole('button', { name: /export pdf/i }));

    await waitFor(() => {
      expect(mocks.openOrDownloadBlob).toHaveBeenCalledTimes(1);
    });
    expect(mocks.usageState.recordExport).not.toHaveBeenCalled();
  });

  it('falls back to copying the share URL when navigator.share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    // jsdom has no navigator.share by default; assert the assumption explicitly
    expect(navigator.share).toBeUndefined();

    render(<ItineraryView events={[buildEvent()]} tripName="Smith Wedding" tripId="trip-1" />);

    fireEvent.click(screen.getByRole('button', { name: /share/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(window.location.href);
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Itinerary link copied to clipboard');
  });
});
