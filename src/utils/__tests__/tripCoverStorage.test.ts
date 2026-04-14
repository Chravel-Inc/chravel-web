import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import {
  buildTripCoverStoragePath,
  normalizeTripCoverUrl,
  TRIP_COVER_BUCKET,
  uploadTripCoverBlob,
} from '../tripCoverStorage';

describe('tripCoverStorage', () => {
  it('stores covers in dedicated trip-covers bucket', () => {
    expect(TRIP_COVER_BUCKET).toBe('trip-covers');
  });

  it('builds cover storage path scoped by trip id', () => {
    expect(buildTripCoverStoragePath('trip-123', 'cover.jpg')).toBe('trip-123/cover.jpg');
  });

  it('normalizes signed trip-covers URLs to stable public URLs', () => {
    expect(
      normalizeTripCoverUrl(
        'https://abc.supabase.co/storage/v1/object/sign/trip-covers/trip-123/cover.jpg?token=deadbeef',
      ),
    ).toBe('https://abc.supabase.co/storage/v1/object/public/trip-covers/trip-123/cover.jpg');
  });

  it('does not rewrite non-cover storage URLs', () => {
    const url = 'https://abc.supabase.co/storage/v1/object/public/trip-media/trip-123/photo.jpg';
    expect(normalizeTripCoverUrl(url)).toBe(url);
  });

  it('uploads a cover blob and returns storage path + public URL', async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const getPublicUrl = vi.fn().mockReturnValue({
      data: {
        publicUrl:
          'https://abc.supabase.co/storage/v1/object/public/trip-covers/trip-123/cover.jpg',
      },
    });
    const from = vi.fn().mockReturnValue({ upload, getPublicUrl });
    const client = { storage: { from } } as unknown as SupabaseClient<Database>;

    const result = await uploadTripCoverBlob({
      client,
      tripId: 'trip-123',
      blob: new Blob(['x'], { type: 'image/jpeg' }),
    });

    expect(from).toHaveBeenCalledWith(TRIP_COVER_BUCKET);
    expect(upload).toHaveBeenCalledTimes(1);
    expect(result.publicUrl).toContain('/object/public/trip-covers/trip-123/');
    expect(result.filePath).toMatch(/^trip-123\/cover-/);
  });

  it('retries upload failures and throws after max attempts', async () => {
    const upload = vi.fn().mockResolvedValue({ error: { message: 'policy violation' } });
    const getPublicUrl = vi.fn();
    const from = vi.fn().mockReturnValue({ upload, getPublicUrl });
    const client = { storage: { from } } as unknown as SupabaseClient<Database>;

    await expect(
      uploadTripCoverBlob({
        client,
        tripId: 'trip-123',
        blob: new Blob(['x'], { type: 'image/jpeg' }),
      }),
    ).rejects.toThrow('policy violation');

    expect(upload).toHaveBeenCalledTimes(3);
  });
});
