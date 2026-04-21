import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TripChat } from '../TripChat';
import { toast } from 'sonner';
import { getStreamClient } from '@/services/stream/streamClient';

const mockDeleteMessage = vi.fn();
const mockGetStreamClient = vi.mocked(getStreamClient);

vi.mock('react-router-dom', () => ({
  useParams: () => ({ tripId: 'trip-123' }),
  useLocation: () => ({ state: null }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock('@/services/stream/streamClient', async importOriginal => {
  const actual = await importOriginal<typeof import('@/services/stream/streamClient')>();
  return {
    ...actual,
    getStreamClient: vi.fn(),
    onStreamClientConnected: vi.fn(() => () => {}),
  };
});

vi.mock('@/hooks/useDemoMode', () => ({
  useDemoMode: () => ({ isDemoMode: false }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1', displayName: 'User One', avatar: '' } }),
}));

vi.mock('@/hooks/useTripMembers', () => ({
  useTripMembers: () => ({ tripMembers: [{ id: 'user-1', name: 'User One', avatar: '' }] }),
}));

vi.mock('../../hooks/useTripChat', () => ({
  useTripChat: () => ({
    messages: [
      {
        id: 'msg-123',
        text: 'hello',
        user: { id: 'user-1', name: 'User One' },
        created_at: '2026-01-01T00:00:00.000Z',
      },
    ],
    isLoading: false,
    sendMessageAsync: vi.fn(),
    isCreating: false,
    loadMore: vi.fn(),
    hasMore: false,
    isLoadingMore: false,
    toggleReaction: vi.fn(),
    reload: vi.fn(),
    activeChannel: { state: { read: {} } },
  }),
}));

vi.mock('../../hooks/useChatComposer', () => ({
  useChatComposer: () => ({
    inputMessage: '',
    setInputMessage: vi.fn(),
    messageFilter: 'all',
    setMessageFilter: vi.fn(),
    replyingTo: null,
    setReply: vi.fn(),
    clearReply: vi.fn(),
    sendMessage: vi.fn(),
    filterMessages: (messages: unknown[]) => messages,
  }),
}));

vi.mock('@/hooks/useKeyboardHandler', () => ({
  useKeyboardHandler: () => ({ isKeyboardVisible: false }),
}));
vi.mock('@/hooks/useSwipeGesture', () => ({ useSwipeGesture: vi.fn() }));
vi.mock('@/hooks/useOfflineStatus', () => ({ useOfflineStatus: () => ({ isOffline: false }) }));
vi.mock('@/hooks/useRoleChannels', () => ({
  useRoleChannels: () => ({ availableChannels: [], setActiveChannel: vi.fn() }),
}));
vi.mock('@/hooks/usePullToRefresh', () => ({
  usePullToRefresh: () => ({ isRefreshing: false, pullDistance: 0 }),
}));
vi.mock('@/hooks/useUnreadCounts', () => ({
  useUnreadCounts: () => ({ broadcastCount: 0, messageUnreadCount: 0 }),
}));
vi.mock('../../hooks/useChatReadReceipts', () => ({
  useChatReadReceipts: () => ({ readStatusesByMessage: {} }),
}));
vi.mock('../../hooks/useChatTypingIndicators', () => ({
  useChatTypingIndicators: () => ({ typingUsers: [], handleTypingChange: vi.fn() }),
}));
vi.mock('../../hooks/useChatReactions', () => ({
  useChatReactions: () => ({ reactions: {}, handleReaction: vi.fn() }),
}));
vi.mock('@/hooks/useSystemMessagePreferences', () => ({
  useEffectiveSystemMessagePreferences: () => ({ data: null }),
}));
vi.mock('@/utils/tripTierDetector', () => ({ isConsumerTrip: () => true }));
vi.mock('@/hooks/useTripPrivacyConfig', () => ({
  useTripPrivacyConfig: () => ({ data: null }),
  getEffectivePrivacyMode: () => 'all',
}));
vi.mock('@/hooks/useTripChatMode', () => ({
  useTripChatMode: () => ({
    effectiveChatMode: 'all',
    canPost: true,
    canUploadMedia: true,
    isLoading: false,
    userRole: 'member',
  }),
}));
vi.mock('../../hooks/useLinkPreviews', () => ({ useLinkPreviews: () => ({}) }));
vi.mock('@/hooks/useUserSafety', () => ({
  useBlockedUsers: () => ({ blockedUserIds: [], blockUser: vi.fn(), isBlocking: false }),
  useReportContent: () => ({ reportContent: vi.fn(), isReporting: false }),
}));

vi.mock('../ChatInput', () => ({ ChatInput: () => <div data-testid="chat-input" /> }));
vi.mock('../InlineReplyComponent', () => ({ InlineReplyComponent: () => null }));
vi.mock('../TypingIndicator', () => ({ TypingIndicator: () => null }));
vi.mock('../MessageTypeBar', () => ({ MessageTypeBar: () => null }));
vi.mock('../ChatSearchOverlay', () => ({ ChatSearchOverlay: () => null }));
vi.mock('../ThreadView', () => ({ ThreadView: () => null }));
vi.mock('@/components/mobile/PullToRefreshIndicator', () => ({
  PullToRefreshIndicator: () => null,
}));
vi.mock('@/components/mobile/SkeletonLoader', () => ({ MessageSkeleton: () => null }));
vi.mock('@/components/pro/channels/ChannelChatView', () => ({ ChannelChatView: () => null }));
vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: any) => <div>{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/services/demoModeService', () => ({ demoModeService: { getMessages: vi.fn() } }));
vi.mock('@/services/hapticService', () => ({ hapticService: { light: vi.fn() } }));
vi.mock('@/services/chatContentParser', () => ({ parseMessage: vi.fn() }));

vi.mock('../VirtualizedMessageContainer', () => ({
  VirtualizedMessageContainer: ({ messages, renderMessage }: any) => (
    <div>
      {messages.map((m: any, i: number) => (
        <React.Fragment key={m.id}>{renderMessage(m, i, true)}</React.Fragment>
      ))}
    </div>
  ),
}));

vi.mock('../MessageItem', () => ({
  MessageItem: ({ message, onDelete }: any) => (
    <button onClick={() => onDelete?.(message.id)} data-testid={`delete-${message.id}`}>
      delete
    </button>
  ),
}));

describe('TripChat delete message', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSubject = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <TripChat tripId="trip-123" />
      </QueryClientProvider>,
    );
  };

  it('calls Stream delete API once with message ID', async () => {
    mockGetStreamClient.mockReturnValue({ deleteMessage: mockDeleteMessage } as any);
    mockDeleteMessage.mockResolvedValue(undefined);

    renderSubject();
    fireEvent.click(screen.getByTestId('delete-msg-123'));

    expect(mockDeleteMessage).toHaveBeenCalledTimes(1);
    expect(mockDeleteMessage).toHaveBeenCalledWith('msg-123');
  });

  it('shows deterministic error toast when Stream client is unavailable', async () => {
    mockGetStreamClient.mockReturnValue(null);

    renderSubject();
    fireEvent.click(screen.getByTestId('delete-msg-123'));

    expect(mockDeleteMessage).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Chat connection unavailable. Please try again.');
  });
});
