import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLinkPreviews } from '../useLinkPreviews';

const fetchOGMetadata = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    title: 'T',
    description: 'D',
    image: 'https://example.com/i.png',
    error: undefined,
  }),
);

vi.mock('@/services/ogMetadataService', () => ({
  fetchOGMetadata,
}));

describe('useLinkPreviews', () => {
  beforeEach(() => {
    fetchOGMetadata.mockClear();
    fetchOGMetadata.mockResolvedValue({
      title: 'T',
      description: 'D',
      image: 'https://example.com/i.png',
      error: undefined,
    });
  });

  it('does not re-fetch the full list when previews state updates (no dependency feedback loop)', async () => {
    const messages = [
      { id: 'a', text: 'https://one.example/path' },
      { id: 'b', text: 'https://two.example/path' },
      { id: 'c', text: 'https://three.example/path' },
    ];

    const { result } = renderHook(({ msgs }) => useLinkPreviews(msgs), {
      initialProps: { msgs: messages },
    });

    await waitFor(() => {
      expect(result.current.a).toBeDefined();
      expect(result.current.b).toBeDefined();
      expect(result.current.c).toBeDefined();
    });

    // One fetch per unique URL; must not scale with preview completions (would be 9+ if effect re-ran on each setState)
    expect(fetchOGMetadata).toHaveBeenCalledTimes(3);
  });

  it('retries once after a failed fetch then stops', async () => {
    fetchOGMetadata
      .mockResolvedValueOnce({ error: 'fail' })
      .mockResolvedValueOnce({ title: 'OK', error: undefined });

    const messages = [{ id: 'x', text: 'https://retry.example/x' }];

    const { result } = renderHook(() => useLinkPreviews(messages));

    await waitFor(() => {
      expect(result.current.x?.title).toBe('OK');
    });

    expect(fetchOGMetadata).toHaveBeenCalledTimes(2);
  });
});
