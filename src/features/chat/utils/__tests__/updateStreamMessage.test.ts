import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { getStreamClient } from '@/services/stream/streamClient';
import { updateStreamMessage } from '../updateStreamMessage';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock('@/services/stream/streamClient', () => ({
  getStreamClient: vi.fn(),
}));

describe('updateStreamMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls stream client updateMessage with the expected payload', async () => {
    const updateMessage = vi.fn().mockResolvedValue({});
    vi.mocked(getStreamClient).mockReturnValue({ updateMessage } as never);

    const result = await updateStreamMessage({ id: 'msg-1', text: 'updated content' });

    expect(result.ok).toBe(true);
    expect(updateMessage).toHaveBeenCalledWith({ id: 'msg-1', text: 'updated content' });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('shows a user-facing toast when stream client is unavailable', async () => {
    vi.mocked(getStreamClient).mockReturnValue(null);

    const result = await updateStreamMessage({ id: 'msg-2', text: 'fallback' });

    expect(result.ok).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Chat connection unavailable. Please try again.');
  });

  it('shows an error toast with the Stream error code when updateMessage fails', async () => {
    const streamError = Object.assign(new Error('not allowed'), { code: 17, StatusCode: 403 });
    const updateMessage = vi.fn().mockRejectedValue(streamError);
    vi.mocked(getStreamClient).mockReturnValue({ updateMessage } as never);

    const result = await updateStreamMessage({ id: 'msg-3', text: 'broken' });

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(17);
    expect(updateMessage).toHaveBeenCalledWith({ id: 'msg-3', text: 'broken' });
    expect(toast.error).toHaveBeenCalledWith('Failed to edit message (code 17)');
  });
});
