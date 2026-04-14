import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SmartImport } from '../SmartImport';

vi.mock('@/features/smart-import/components/SmartImportGmail', () => ({
  SmartImportGmail: () => <div data-testid="gmail-import-widget">gmail-import-widget</div>,
}));

vi.mock('@/features/smart-import/components/SmartImportReview', () => ({
  SmartImportReview: () => <div data-testid="gmail-import-review">gmail-import-review</div>,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/utils/calendarImportParsers', () => ({
  parseCalendarFile: vi.fn(),
  parseURLSchedule: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('SmartImport Gmail visibility', () => {
  const parseConfig = {
    targetType: 'schedule' as const,
    expectedFields: ['title', 'date'],
    description: 'Import schedule data',
  };

  it('shows contextual guidance when tripId is not provided', () => {
    render(
      <SmartImport
        targetCollection="trip_events"
        parseConfig={parseConfig}
        onDataImported={vi.fn()}
      />,
    );

    expect(screen.getByText(/gmail import is available when this modal is opened/i)).toBeVisible();
    expect(screen.queryByTestId('gmail-import-widget')).not.toBeInTheDocument();
  });

  it('renders Gmail import widget when tripId is provided', () => {
    render(
      <SmartImport
        targetCollection="trip_events"
        parseConfig={parseConfig}
        onDataImported={vi.fn()}
        tripId="trip-123"
      />,
    );

    expect(screen.getByTestId('gmail-import-widget')).toBeVisible();
  });
});
