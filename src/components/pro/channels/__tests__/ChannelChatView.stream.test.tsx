import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { ChannelChatView } from '../ChannelChatView';
import { getStreamClient } from '@/services/stream/streamClient';
import { deleteChatMessage, editChatMessage } from '@/services/chatService';

const mockDeleteMessage = vi.fn();
const mockUpdateMessage = vi.fn();
const mockPinMessage = vi.fn();
const mockUnpinMessage = vi.fn();
const mockMessageItem = vi.fn();

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
        pinned: true,
        pinned_at: '2026-04-26T15:00:00.000Z',
      },
    ],
    isLoading: false,
    hasMore: false,
    isLoadingMore: false,
    loadMore: vi.fn(),
    sendMessage: vi.fn().mockResolvedValue(true),
    activeChannel: {
      state: { own_capabilities: ['update-own-message', 'delete-own-message', 'pin-message'] },
    },
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
  MessageItem: (props: any) => {
    mockMessageItem(props);
    return (
      <>
        <div>{props.message.text}</div>
        <button
          onClick={() => props.onDelete?.(props.message.id)}
          data-testid={`delete-${props.message.id}`}
        >
          delete
        </button>
        <button
          onClick={() => props.onEdit?.(props.message.id, 'edited')}
          data-testid={`edit-${props.message.id}`}
        >
          edit
        </button>
        <button
          onClick={() => props.onTogglePin?.(props.message.id, !props.message.isPinned)}
          data-testid={`pin-${props.message.id}`}
        >
          pin
        </button>
      </>
    );
  },
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
      pinMessage: mockPinMessage,
      unpinMessage: mockUnpinMessage,
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

  it('wires pin controls from Stream metadata and uses Stream pin APIs', () => {
    render(<ChannelChatView channel={channel} />);

    const firstMessageProps = mockMessageItem.mock.calls[0][0];
    expect(firstMessageProps.canManagePins).toBe(true);
    expect(firstMessageProps.message.isPinned).toBe(true);
    expect(firstMessageProps.message.pinnedAt).toBe('2026-04-26T15:00:00.000Z');

    fireEvent.click(screen.getByTestId('pin-m1'));
    expect(mockUnpinMessage).toHaveBeenCalledWith('m1');
    expect(mockPinMessage).not.toHaveBeenCalled();
  });
});
