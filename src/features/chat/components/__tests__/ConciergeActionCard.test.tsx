import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ConciergeActionCard, type ConciergeActionResult } from '../ConciergeActionCard';

const makeAction = (overrides: Partial<ConciergeActionResult>): ConciergeActionResult => ({
  actionType: 'add_to_calendar',
  success: true,
  message: 'Done',
  ...overrides,
});

describe('ConciergeActionCard', () => {
  it('renders a mapped action type (add_to_calendar)', () => {
    render(<ConciergeActionCard action={makeAction({ entityName: 'Dinner at Nobu' })} />);
    expect(screen.getByText(/Calendar Event/i)).toBeInTheDocument();
    expect(screen.getByText(/Dinner at Nobu/)).toBeInTheDocument();
  });

  it('renders a confirmation card for every executor-emitted write action type (no silent drops)', () => {
    // Every actionType the edge executors emit for write tools. A successful
    // mutation must never render as nothing — that reads as "it didn't work".
    const emittedWriteActionTypes = [
      'add_expense',
      'add_to_agenda',
      'add_to_calendar',
      'bulk_delete_result',
      'bulk_mark_tasks_done',
      'clone_activity',
      'close_poll',
      'create_broadcast',
      'create_notification',
      'create_poll',
      'create_task',
      'delete_calendar_event',
      'delete_task',
      'duplicate_calendar_event',
      'generate_trip_image',
      'make_reservation',
      'move_calendar_event',
      'save_link',
      'save_place',
      'set_basecamp',
      'set_trip_header',
      'settle_expense',
      'split_task_assignments',
      'update_calendar_event',
      'update_task',
      'update_trip_details',
    ];

    for (const actionType of emittedWriteActionTypes) {
      const { container, unmount } = render(
        <ConciergeActionCard action={makeAction({ actionType, message: 'ok' })} />,
      );
      expect(container.firstChild, `actionType "${actionType}" rendered nothing`).not.toBeNull();
      unmount();
    }
  });

  it('renders a generic fallback card for an unknown action type instead of nothing', () => {
    const { container } = render(
      <ConciergeActionCard
        action={makeAction({ actionType: 'some_future_tool_result', message: 'All done' })}
      />,
    );
    expect(container.firstChild).not.toBeNull();
    // Humanized from the action type — no raw snake_case leaking to the UI.
    expect(container.textContent).not.toContain('some_future_tool_result');
  });

  it('does not produce broken grammar for verb-containing labels', () => {
    render(<ConciergeActionCard action={makeAction({ actionType: 'update_task' })} />);
    // Regression: title used to render "Task Updated created".
    expect(screen.queryByText(/updated created/i)).toBeNull();
  });

  it('renders failure state with the message', () => {
    render(
      <ConciergeActionCard
        action={makeAction({ actionType: 'add_expense', success: false, message: 'RLS denied' })}
      />,
    );
    expect(screen.getByText(/RLS denied/)).toBeInTheDocument();
  });
});
