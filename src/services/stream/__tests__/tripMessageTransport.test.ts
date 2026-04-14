import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendTripMessageViaStream } from '../tripMessageTransport';

const getStreamClientMock = vi.fn();
const getOrCreateTripChannelMock = vi.fn();

vi.mock('../streamClient', () => ({
  getStreamClient: () => getStreamClientMock(),
}));

vi.mock('../streamChannelFactory', () => ({
  getOrCreateTripChannel: (...args: unknown[]) => getOrCreateTripChannelMock(...args),
}));

describe('sendTripMessageViaStream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_STREAM_API_KEY', 'stream-key');
  });

  it('returns null when stream chat is not active', async () => {
    getStreamClientMock.mockReturnValue(null);

    const result = await sendTripMessageViaStream({
      tripId: 'trip-1',
      content: 'hello',
    });

    expect(result).toBeNull();
    expect(getOrCreateTripChannelMock).not.toHaveBeenCalled();
  });

  it('sends normalized message through stream when active', async () => {
    const sendMessageMock = vi.fn().mockResolvedValue({
      message: { id: 'stream-msg-1' },
    });

    getStreamClientMock.mockReturnValue({ userID: 'user-1' });
    getOrCreateTripChannelMock.mockResolvedValue({
      sendMessage: sendMessageMock,
    });

    const result = await sendTripMessageViaStream({
      tripId: 'trip-1',
      content: '  hello  ',
      mediaType: 'image',
      mediaUrl: 'https://cdn.example.com/photo.jpg',
      attachments: [{ type: 'file', url: 'https://cdn.example.com/file.pdf' }],
      linkPreview: {
        url: 'https://example.com',
        title: 'Example',
      },
      messageType: 'broadcast',
      privacyMode: 'private',
    });

    expect(getOrCreateTripChannelMock).toHaveBeenCalledWith('trip-1');
    expect(sendMessageMock).toHaveBeenCalledWith({
      text: 'hello',
      message_type: 'broadcast',
      privacy_mode: 'private',
      attachments: [
        { type: 'file', asset_url: 'https://cdn.example.com/file.pdf', title: undefined },
        { type: 'image', asset_url: 'https://cdn.example.com/photo.jpg' },
        {
          type: 'link',
          og_scrape_url: 'https://example.com',
          title: 'Example',
          text: undefined,
          asset_url: undefined,
        },
      ],
    });
    expect(result).toEqual({ id: 'stream-msg-1' });
  });
});
