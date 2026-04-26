import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageActions } from '../MessageActions';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('MessageActions stream mutation callbacks', () => {
  it('invokes stream onEdit only once', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn().mockResolvedValue(undefined);

    render(
      <MessageActions
        transportMode="stream"
        messageId="msg-1"
        messageContent="hello"
        messageType="trip"
        isOwnMessage
        onEdit={onEdit}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('Edit'));
    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), 'updated');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith('msg-1', 'updated');
  });

  it('invokes stream onDelete only once', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);

    render(
      <MessageActions
        transportMode="stream"
        messageId="msg-2"
        messageContent="hello"
        messageType="trip"
        isOwnMessage
        onEdit={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('Delete'));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith('msg-2');
  });
});
