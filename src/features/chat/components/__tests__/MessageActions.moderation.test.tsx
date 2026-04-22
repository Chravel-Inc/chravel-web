import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageActions } from '../MessageActions';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('MessageActions moderation controls', () => {
  it('hides moderation actions for non-moderator roles', async () => {
    render(
      <MessageActions
        messageId="msg-1"
        messageContent="hello"
        messageType="trip"
        isOwnMessage={false}
        senderUserId="target-user"
        canModerate={false}
      />,
    );

    fireEvent.pointerDown(screen.getByRole('button'));

    expect(screen.queryByText('Hide message')).not.toBeInTheDocument();
    expect(screen.queryByText('Shadow ban user')).not.toBeInTheDocument();
    expect(screen.queryByText('Mute user')).not.toBeInTheDocument();
    expect(screen.queryByText('Ban user')).not.toBeInTheDocument();
  });

  it('shows moderation actions and invokes callback for authorized roles', async () => {
    const onModerationAction = vi.fn().mockResolvedValue(undefined);

    render(
      <MessageActions
        messageId="msg-2"
        messageContent="needs moderation"
        messageType="trip"
        isOwnMessage={false}
        senderUserId="user-2"
        canModerate={true}
        onModerationAction={onModerationAction}
      />,
    );

    fireEvent.pointerDown(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Mute user'));

    expect(onModerationAction).toHaveBeenCalledTimes(1);
    expect(onModerationAction).toHaveBeenCalledWith({
      messageId: 'msg-2',
      targetUserId: 'user-2',
      action: 'mute_user',
    });
  });
});
