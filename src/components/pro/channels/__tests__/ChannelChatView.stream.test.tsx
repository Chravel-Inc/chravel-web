import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ChannelChatView } from '../ChannelChatView';

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

vi.mock('@/features/chat/components/VirtualizedMessageContainer', () => ({
  VirtualizedMessageContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="virtualized">{children}</div>
  ),
}));

vi.mock('@/features/chat/components/MessageItem', () => ({
  MessageItem: ({ message }: { message: { text: string } }) => <div>{message.text}</div>,
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
  });

  it('renders stream mode channel view without crashing', () => {
    render(<ChannelChatView channel={channel} />);

    expect(screen.getByLabelText('Channel General')).toBeInTheDocument();
    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
  });
});
