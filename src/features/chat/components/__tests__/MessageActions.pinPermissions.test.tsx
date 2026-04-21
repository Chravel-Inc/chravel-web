import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageActions } from '../MessageActions';

vi.mock('@/services/chatService', () => ({
  editChatMessage: vi.fn(),
  editChannelMessage: vi.fn(),
  deleteChatMessage: vi.fn(),
  deleteChannelMessage: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('MessageActions pin permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows Pin action for moderators/admins and triggers callback', async () => {
    const onTogglePin = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <MessageActions
        messageId="msg-1"
        messageContent="Hello"
        messageType="trip"
        isOwnMessage={false}
        canManagePins={true}
        isPinned={false}
        onTogglePin={onTogglePin}
      />,
    );

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('Pin'));

    expect(onTogglePin).toHaveBeenCalledWith('msg-1', true);
  });

  it('shows Unpin label when message is already pinned', async () => {
    const user = userEvent.setup();

    render(
      <MessageActions
        messageId="msg-2"
        messageContent="Hello"
        messageType="trip"
        isOwnMessage={false}
        canManagePins={true}
        isPinned={true}
        onTogglePin={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Unpin')).toBeInTheDocument();
  });

  it('hides pin actions for non-moderators', async () => {
    const user = userEvent.setup();

    render(
      <MessageActions
        messageId="msg-3"
        messageContent="Hello"
        messageType="trip"
        isOwnMessage={false}
        canManagePins={false}
      />,
    );

    await user.click(screen.getByRole('button'));
    expect(screen.queryByText('Pin')).not.toBeInTheDocument();
    expect(screen.queryByText('Unpin')).not.toBeInTheDocument();
  });
});
