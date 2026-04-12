import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStreamProChannel } from '../useStreamProChannel';

const watchMock = vi.fn();
const sendMessageMock = vi.fn();
const stopWatchingMock = vi.fn();
const onMock = vi.fn();
const offMock = vi.fn();
const mockChannel = {
  watch: watchMock,
  sendMessage: sendMessageMock,
  stopWatching: stopWatchingMock,
  on: onMock,
  off: offMock,
  state: { messages: [] },
};

const channelFactoryMock = vi.fn(() => mockChannel);
const getStreamClientMock = vi.fn();
let onConnectedCallback: (() => void) | null = null;

vi.mock('@/services/stream/streamClient', () => ({
  getStreamClient: (...args: unknown[]) => getStreamClientMock(...args),
  onStreamClientConnected: (cb: () => void) => {
    onConnectedCallback = cb;
    return () => {
      onConnectedCallback = null;
    };
  },
  onStreamClientConnectionStatusChange: () => () => {},
}));

describe('useStreamProChannel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onConnectedCallback = null;
    watchMock.mockResolvedValue({ messages: [] });
    sendMessageMock.mockResolvedValue({ message: { id: 'm1' } });
    getStreamClientMock.mockReturnValue({
      userID: undefined,
      channel: channelFactoryMock,
    });
  });

  it('re-initializes channel watch after Stream client connects', async () => {
    renderHook(() => useStreamProChannel('channel-1'));

    expect(watchMock).not.toHaveBeenCalled();

    getStreamClientMock.mockReturnValue({
      userID: 'user-1',
      channel: channelFactoryMock,
    });

    await act(async () => {
      onConnectedCallback?.();
    });

    await waitFor(() => {
      expect(watchMock).toHaveBeenCalledTimes(1);
    });
  });

  it('includes isBroadcast in Stream message payload when requested', async () => {
    getStreamClientMock.mockReturnValue({
      userID: 'user-1',
      channel: channelFactoryMock,
    });

    const { result } = renderHook(() => useStreamProChannel('channel-1'));

    await waitFor(() => {
      expect(watchMock).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await result.current.sendMessage('hello', { isBroadcast: true });
    });

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(sendMessageMock.mock.calls[0]?.[0]?.isBroadcast).toBe(true);
  });
});
