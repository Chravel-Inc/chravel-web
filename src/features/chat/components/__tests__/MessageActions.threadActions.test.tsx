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

describe('MessageActions thread semantics', () => {
  it('renders disambiguated thread actions and preserves callbacks', async () => {
    const onReply = vi.fn();
    const onOpenThread = vi.fn();

    const user = userEvent.setup();
    render(
      <MessageActions
        messageId="msg-1"
        messageContent="hello"
        messageType="trip"
        isOwnMessage={false}
        onReply={onReply}
        onOpenThread={onOpenThread}
      />,
    );

    await user.click(screen.getByRole('button'));

    await user.click(screen.getByText('Reply in thread'));
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('Open thread'));

    expect(onReply).toHaveBeenCalledWith('msg-1');
    expect(onOpenThread).toHaveBeenCalledWith('msg-1');
  });
});
