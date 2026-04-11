import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatSearchOverlay } from '../ChatSearchOverlay';
import { parseMessageSearchQuery } from '@/lib/parseMessageSearchQuery';
import { searchChatContentWithFilters } from '@/services/chatSearchService';

vi.mock('@/lib/parseMessageSearchQuery', () => ({
  parseMessageSearchQuery: vi.fn(),
}));

vi.mock('@/services/chatSearchService', () => ({
  searchChatContentWithFilters: vi.fn(),
}));

describe('ChatSearchOverlay search behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses filter query and renders both message and broadcast results', async () => {
    const user = userEvent.setup();
    const parsedQuery = {
      text: 'practice',
      sender: 'Coach',
      isBroadcastOnly: true,
    };

    vi.mocked(parseMessageSearchQuery).mockReturnValue(parsedQuery);
    vi.mocked(searchChatContentWithFilters).mockResolvedValue({
      messages: [
        {
          id: 'msg-1',
          content: 'Practice starts at 7',
          author_name: 'Coach Mike',
          user_id: 'user-1',
          created_at: '2026-04-10T10:00:00.000Z',
          type: 'message',
        },
      ],
      broadcasts: [
        {
          id: 'bc-1',
          message: 'Broadcast: Practice moved to field 2',
          created_by: 'user-1',
          created_by_name: 'Coach Mike',
          priority: 'urgent',
          created_at: '2026-04-10T11:00:00.000Z',
          type: 'broadcast',
        },
      ],
    });

    const onResultSelect = vi.fn();
    render(<ChatSearchOverlay tripId="trip-1" onClose={vi.fn()} onResultSelect={onResultSelect} />);

    const searchInput = screen.getByPlaceholderText('Search messages and broadcasts...');
    await user.type(searchInput, 'broadcast from:Coach practice');

    await waitFor(() => {
      expect(parseMessageSearchQuery).toHaveBeenCalledWith('broadcast from:Coach practice');
      expect(searchChatContentWithFilters).toHaveBeenCalledWith('trip-1', parsedQuery);
    });

    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByText('Broadcasts')).toBeInTheDocument();
    expect(screen.getByText('Practice starts at 7')).toBeInTheDocument();
    expect(screen.getByText('Broadcast: Practice moved to field 2')).toBeInTheDocument();

    await user.click(screen.getByText('Broadcast: Practice moved to field 2'));
    expect(onResultSelect).toHaveBeenCalledWith('bc-1', 'broadcast');
  });
});
