import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { ThreadView } from '../ThreadView';
import {
  getStreamClient,
  onStreamClientConnectionStatusChange,
} from '@/services/stream/streamClient';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/services/stream/streamClient', async importOriginal => {
  const actual = await importOriginal<typeof import('@/services/stream/streamClient')>();
  return {
    ...actual,
    getStreamClient: vi.fn(),
    onStreamClientConnectionStatusChange: vi.fn(() => () => {}),
  };
});

const mockGetStreamClient = vi.mocked(getStreamClient);
const mockOnStreamClientConnectionStatusChange = vi.mocked(onStreamClientConnectionStatusChange);

const makeMessage = (
  id: string,
  text: string,
  createdAt: string,
  overrides: Record<string, unknown> = {},
) => ({
  id,
  text,
  created_at: createdAt,
  updated_at: createdAt,
  parent_id: 'parent-1',
  user: { id: 'user-2', name: 'Alice' },
  ...overrides,
});

describe('ThreadView', () => {
  const onHandlers = new Map<string, (event: any) => void>();
  const getReplies = vi.fn();
  const sendMessage = vi.fn();
  const channel = {
    getReplies,
    sendMessage,
    on: vi.fn((event: string, handler: (event: any) => void) => {
      onHandlers.set(event, handler);
    }),
    off: vi.fn((event: string) => {
      onHandlers.delete(event);
    }),
  };

  const parentMessage = {
    id: 'parent-1',
    content: 'Parent message',
    authorName: 'Parent Author',
    createdAt: '2026-01-02T09:00:00.000Z',
    tripId: 'trip-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    onHandlers.clear();
    getReplies.mockReset();
    sendMessage.mockReset();
    getReplies.mockResolvedValue({ messages: [] });

    Element.prototype.scrollIntoView = vi.fn();

    mockGetStreamClient.mockReturnValue({
      channel: vi.fn(() => channel),
    } as any);

    mockOnStreamClientConnectionStatusChange.mockImplementation(() => () => {});
  });

  it('keeps replies sorted by created_at and dedupes message.new/update events by id', async () => {
    getReplies.mockResolvedValueOnce({
      messages: [
        makeMessage('b', 'newer', '2026-01-02T10:01:00.000Z'),
        makeMessage('a', 'older', '2026-01-02T10:00:00.000Z'),
      ],
    });

    render(<ThreadView parentMessage={parentMessage} onClose={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('older')).toBeInTheDocument());

    const textBeforeEvents = screen.getAllByText(/older|newer/).map(node => node.textContent);
    expect(textBeforeEvents).toEqual(['older', 'newer']);

    act(() => {
      onHandlers.get('message.new')?.({
        type: 'message.new',
        message: makeMessage('b', 'newer updated', '2026-01-02T10:01:00.000Z'),
      });
      onHandlers.get('message.new')?.({
        type: 'message.new',
        message: makeMessage('c', 'newest', '2026-01-02T10:02:00.000Z'),
      });
      onHandlers.get('message.updated')?.({
        type: 'message.updated',
        message: makeMessage('b', 'newer final', '2026-01-02T10:01:00.000Z'),
      });
    });

    await waitFor(() => expect(screen.getByText('newer final')).toBeInTheDocument());

    const orderedTexts = screen
      .getAllByText(/older|newer final|newest/)
      .map(node => node.textContent);
    expect(orderedTexts).toEqual(['older', 'newer final', 'newest']);
    expect(screen.queryByText('newer updated')).not.toBeInTheDocument();
  });

  it('handles message.deleted events for thread replies', async () => {
    getReplies.mockResolvedValueOnce({
      messages: [
        makeMessage('a', 'first', '2026-01-02T10:00:00.000Z'),
        makeMessage('b', 'second', '2026-01-02T10:01:00.000Z'),
      ],
    });

    render(<ThreadView parentMessage={parentMessage} onClose={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('second')).toBeInTheDocument());

    act(() => {
      onHandlers.get('message.deleted')?.({
        type: 'message.deleted',
        message: { id: 'b', parent_id: 'parent-1' },
      });
    });

    await waitFor(() => expect(screen.queryByText('second')).not.toBeInTheDocument());
    expect(screen.getByText('first')).toBeInTheDocument();
  });

  it('supports pagination via id_lt and handles pagination boundary + retry', async () => {
    let pagedCallCount = 0;
    getReplies.mockImplementation(
      (_parentId: string, options?: { id_lt?: string; limit: number }) => {
        if (options?.id_lt) {
          pagedCallCount += 1;
          if (pagedCallCount === 1) {
            return Promise.reject(new Error('page failed'));
          }
          if (pagedCallCount === 2) {
            return Promise.resolve({
              messages: [
                makeMessage('old-1', 'older-one', '2026-01-02T09:40:00.000Z'),
                makeMessage('old-2', 'older-two', '2026-01-02T09:41:00.000Z'),
              ],
            });
          }
          return Promise.resolve({ messages: [] });
        }
        return Promise.resolve({
          messages: Array.from({ length: 25 }, (_, i) =>
            makeMessage(
              `seed-${i + 1}`,
              `seed-${i + 1}`,
              `2026-01-02T10:${String(i).padStart(2, '0')}:00.000Z`,
            ),
          ),
        });
      },
    );

    render(<ThreadView parentMessage={parentMessage} onClose={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('seed-1')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Load older replies' }));

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load older replies. Please try again.'),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(screen.getByText('older-one')).toBeInTheDocument());

    expect(getReplies).toHaveBeenCalledWith('parent-1', { id_lt: 'seed-1', limit: 25 });
    expect(screen.queryByRole('button', { name: 'Load older replies' })).not.toBeInTheDocument();
  });

  it('backfills thread replies after reconnect status transition', async () => {
    let statusHandler: ((isConnected: boolean) => void) | null = null;

    mockOnStreamClientConnectionStatusChange.mockImplementation(callback => {
      statusHandler = callback;
      return () => {
        statusHandler = null;
      };
    });

    let disconnected = false;
    getReplies.mockImplementation(() =>
      Promise.resolve({
        messages: [
          disconnected
            ? makeMessage('seed-2', 'after reconnect', '2026-01-02T10:03:00.000Z')
            : makeMessage('seed-1', 'original', '2026-01-02T10:00:00.000Z'),
        ],
      }),
    );

    render(<ThreadView parentMessage={parentMessage} onClose={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('original')).toBeInTheDocument());

    act(() => {
      statusHandler?.(false);
      disconnected = true;
      statusHandler?.(true);
    });

    await waitFor(() => expect(screen.getByText('after reconnect')).toBeInTheDocument());
    expect(getReplies.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('retries reconnect backfill via initial fetch when pagination is exhausted', async () => {
    let statusHandler: ((isConnected: boolean) => void) | null = null;
    mockOnStreamClientConnectionStatusChange.mockImplementation(callback => {
      statusHandler = callback;
      return () => {
        statusHandler = null;
      };
    });

    let callCount = 0;
    getReplies.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return Promise.resolve({
          messages: [makeMessage('m-1', 'first-load', '2026-01-02T10:00:00.000Z')],
        });
      }
      if (callCount === 2) {
        return Promise.reject(new Error('reconnect failed'));
      }
      return Promise.resolve({
        messages: [makeMessage('m-2', 'reconnect-retry-success', '2026-01-02T10:05:00.000Z')],
      });
    });

    render(<ThreadView parentMessage={parentMessage} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('first-load')).toBeInTheDocument());

    act(() => {
      statusHandler?.(false);
      statusHandler?.(true);
    });

    await waitFor(() =>
      expect(
        screen.getByText('Connection restored, but thread refresh failed. Tap retry.'),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(screen.getByText('reconnect-retry-success')).toBeInTheDocument());
    expect(getReplies).toHaveBeenNthCalledWith(3, 'parent-1', { limit: 25 });
  });
});
