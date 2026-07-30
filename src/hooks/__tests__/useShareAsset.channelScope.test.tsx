// Verifies the channel-scoped attachment transport: shares from a Pro
// sub-channel composer must post to that channel (not the trip chat) and tag
// index rows with the channel id + real Stream message id.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShareAsset } from '../useShareAsset';
import {
  sendChannelMessageWithCanonicalTransport,
  sendTripMessageWithCanonicalTransport,
} from '@/services/stream/canonicalTripMessageTransport';
import { insertMediaIndex, uploadToStorage } from '@/services/uploadService';
import { insertLinkIndex, fetchOpenGraphData } from '@/services/linkService';

vi.mock('@/services/uploadService', () => ({
  uploadToStorage: vi.fn(),
  uploadVoiceNoteToStorage: vi.fn(),
  insertMediaIndex: vi.fn(),
  insertFileIndex: vi.fn(),
}));

vi.mock('@/services/linkService', () => ({
  insertLinkIndex: vi.fn(),
  fetchOpenGraphData: vi.fn(),
}));

vi.mock('@/services/stream/canonicalTripMessageTransport', () => ({
  sendTripMessageWithCanonicalTransport: vi.fn(),
  sendChannelMessageWithCanonicalTransport: vi.fn(),
}));

vi.mock('@/services/chatContentParser', () => ({
  autoParseContent: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'a@b.co' } }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

const mockUpload = vi.mocked(uploadToStorage);
const mockSendTrip = vi.mocked(sendTripMessageWithCanonicalTransport);
const mockSendChannel = vi.mocked(sendChannelMessageWithCanonicalTransport);
const mockInsertMedia = vi.mocked(insertMediaIndex);
const mockInsertLink = vi.mocked(insertLinkIndex);
const mockFetchOg = vi.mocked(fetchOpenGraphData);

describe('useShareAsset channel scope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpload.mockResolvedValue({ publicUrl: 'https://cdn/x.jpg', key: 'trip/u/images/x.jpg' });
    mockSendTrip.mockResolvedValue({ id: 'stream-msg-1' });
    mockSendChannel.mockResolvedValue({ id: 'stream-msg-2' });
    mockInsertMedia.mockResolvedValue({ id: 'row-1' } as never);
    mockInsertLink.mockResolvedValue({ id: 'link-1' } as never);
    mockFetchOg.mockResolvedValue({ title: 'T', domain: 'ex.com' });
  });

  const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });

  it('routes image shares to the CHANNEL transport when channel scope is set', async () => {
    const { result } = renderHook(() =>
      useShareAsset('trip-1', { channelId: 'chan-9', channelName: 'Logistics' }),
    );

    await act(async () => {
      await result.current.shareFile('image', file);
    });

    expect(mockSendChannel).toHaveBeenCalledTimes(1);
    expect(mockSendTrip).not.toHaveBeenCalled();
    const [channelId, channelName, tripId] = mockSendChannel.mock.calls[0];
    expect(channelId).toBe('chan-9');
    expect(channelName).toBe('Logistics');
    expect(tripId).toBe('trip-1');

    // Index row is tagged with the channel and the REAL stream message id
    expect(mockInsertMedia).toHaveBeenCalledWith(
      expect.objectContaining({ channelId: 'chan-9', messageId: 'stream-msg-2' }),
    );
  });

  it('routes image shares to the TRIP transport without channel scope', async () => {
    const { result } = renderHook(() => useShareAsset('trip-1'));

    await act(async () => {
      await result.current.shareFile('image', file);
    });

    expect(mockSendTrip).toHaveBeenCalledTimes(1);
    expect(mockSendChannel).not.toHaveBeenCalled();
    expect(mockInsertMedia).toHaveBeenCalledWith(
      expect.objectContaining({ channelId: undefined, messageId: 'stream-msg-1' }),
    );
  });

  it('links carry channel scope and real message id too', async () => {
    const { result } = renderHook(() =>
      useShareAsset('trip-1', { channelId: 'chan-9', channelName: 'Logistics' }),
    );

    await act(async () => {
      await result.current.shareLink('https://example.com/page');
    });

    expect(mockSendChannel).toHaveBeenCalledTimes(1);
    expect(mockInsertLink).toHaveBeenCalledWith(
      expect.objectContaining({
        channelId: 'chan-9',
        messageId: 'stream-msg-2',
        submittedBy: 'user-1',
      }),
    );
  });

  it('a failed index insert after a successful send does NOT fail the share', async () => {
    mockInsertMedia.mockRejectedValue(new Error('db blip'));
    const { result } = renderHook(() => useShareAsset('trip-1'));

    await act(async () => {
      const res = await result.current.shareFile('image', file);
      expect(res).toBeTruthy();
    });

    expect(mockSendTrip).toHaveBeenCalledTimes(1);
    // one retry happened
    expect(mockInsertMedia).toHaveBeenCalledTimes(2);
  });
});
