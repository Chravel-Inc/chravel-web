import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { ChannelChatView } from '../ChannelChatView';
import { getStreamClient } from '@/services/stream/streamClient';
import { deleteChatMessage, editChatMessage } from '@/services/chatService';

const mockDeleteMessage = vi.fn();
const mockUpdateMessage = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', displayName: 'Tester' } }),
}));

vi.mock('@/hooks/useRolePermissions', () => ({
  useRolePermissions: () => ({ canPerformAction: () => true }),
}));

vi.mock('@/hooks/useRoleAssignments', () => ({
  useRoleAssignments: () => ({ leaveRole: vi.fn().mockResolvedValue(undefined) }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/features/chat/hooks/useLinkPreviews', () => ({
  useLinkPreviews: () => ({}),
}));

vi.mock('@/hooks/stream/useStreamProChannel', () => ({
  useStreamProChannel: () => ({
    messages: [
      {
        id: 'm1',
        text: 'hello stream',
        user: { id: 'u2', name: 'Alex' },
        created_at: new Date().toISOString(),
      },
    ],
    isLoading: false,
    sendMessage: vi.fn().mockResolvedValue(true),
    activeChannel: null,
  }),
}));

vi.mock('@/services/stream/streamClient', () => ({
  getStreamClient: vi.fn(),
}));

vi.mock('@/services/chatService', () => ({
  deleteChatMessage: vi.fn(),
  editChatMessage: vi.fn(),
  deleteChannelMessage: vi.fn(),
  editChannelMessage: vi.fn(),
}));

vi.mock('@/features/chat/components/VirtualizedMessageContainer', () => ({
  VirtualizedMessageContainer: ({ messages, renderMessage }: any) => (
    <div data-testid="virtualized">
      {messages.map((message: any) => (
        <React.Fragment key={message.id}>{renderMessage(message, 0, true)}</React.Fragment>
      ))}
    </div>
  ),
}));

vi.mock('@/features/chat/components/MessageItem', () => ({
  MessageItem: ({
    message,
    onDelete,
    onEdit,
  }: {
    message: { id: string; text: string };
    onDelete?: (messageId: string) => void;
    onEdit?: (messageId: string, text: string) => void;
  }) => (
    <>
      <div>{message.text}</div>
      <button onClick={() => onDelete?.(message.id)} data-testid={`delete-${message.id}`}>
        delete
      </button>
      <button onClick={() => onEdit?.(message.id, 'edited')} data-testid={`edit-${message.id}`}>
        edit
      </button>
    </>
  ),
}));

vi.mock('@/features/chat/components/ChatInput', () => ({
  ChatInput: () => <div data-testid="chat-input" />,
}));

vi.mock('@/features/chat/components/InlineReplyComponent', () => ({
  InlineReplyComponent: () => null,
}));

const channel = {
  id: 'c1',
  tripId: 'real-trip-id',
  channelName: 'General',
  channelSlug: 'general',
  requiredRoleId: null,
  requiredRoleName: null,
  channelDescription: null,
  isPrivate: false,
  isDefault: false,
  isArchived: false,
  createdBy: 'user-1',
  messageCount: 0,
  memberCount: 1,
  isMuted: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as const;

describe('ChannelChatView (stream)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getStreamClient).mockReturnValue({
      userID: 'u2',
      deleteMessage: mockDeleteMessage,
      updateMessage: mockUpdateMessage,
    } as any);
  });

  it('renders stream mode channel view without crashing', () => {
    render(<ChannelChatView channel={channel} />);

    expect(screen.getByLabelText('Channel General')).toBeInTheDocument();
    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
  });

  it('uses Stream callbacks for edit/delete and never hits legacy chatService in stream mode', () => {
    render(<ChannelChatView channel={channel} />);

    fireEvent.click(screen.getByTestId('delete-m1'));
    fireEvent.click(screen.getByTestId('edit-m1'));

    expect(mockDeleteMessage).toHaveBeenCalledWith('m1');
    expect(mockUpdateMessage).toHaveBeenCalledWith({ id: 'm1', text: 'edited' });
    expect(vi.mocked(deleteChatMessage)).not.toHaveBeenCalled();
    expect(vi.mocked(editChatMessage)).not.toHaveBeenCalled();
  });
});
