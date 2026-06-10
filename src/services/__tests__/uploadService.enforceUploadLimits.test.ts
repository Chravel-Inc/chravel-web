/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadToStorage, MediaCountExceededError } from '../uploadService';
import { supabase } from '../../integrations/supabase/client';
import { resolveEffectiveTier } from '../entitlementService';

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
    storage: { from: vi.fn() },
  },
}));

vi.mock('../entitlementService', () => ({
  resolveEffectiveTier: vi.fn(),
}));

vi.mock('browser-image-compression', () => ({
  default: vi.fn(async (file: File) => file),
}));

/**
 * Chainable Supabase query mock: every method returns the chain, and awaiting the
 * chain resolves to `result` ({ data, error } or { count, error }).
 */
function makeChain(result: Record<string, unknown>) {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    then: (resolve: any) => resolve(result),
  };
  return chain;
}

function makeStorageBucket() {
  return {
    upload: vi.fn().mockResolvedValue({ data: { path: 'x' }, error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn/x.jpg' } }),
  };
}

const USER_ID = 'user-1';
const TRIP_ID = 'trip-1';

describe('uploadService media count enforcement (per uploader, not trip-wide)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: USER_ID } } });
    (supabase.from as any).mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it("blocks a free user at their OWN cap and filters the count by the uploader's id", async () => {
    (resolveEffectiveTier as any).mockResolvedValue('free');

    const storageUsageChain = makeChain({ data: [], error: null });
    // The user already has 5 of their own photos in this trip (free cap = 5).
    const countChain = makeChain({ count: 5, error: null });
    (supabase.from as any).mockReturnValueOnce(storageUsageChain).mockReturnValueOnce(countChain);

    const file = new File(['abc'], 'photo.jpg', { type: 'image/jpeg' });

    await expect(uploadToStorage(file as any, TRIP_ID, 'images')).rejects.toThrow(
      MediaCountExceededError,
    );

    // The count is scoped to the trip, the media type, AND the uploading user —
    // other members' uploads must not count against this user's tier limit.
    expect(countChain.eq).toHaveBeenCalledWith('trip_id', TRIP_ID);
    expect(countChain.eq).toHaveBeenCalledWith('media_type', 'image');
    expect(countChain.eq).toHaveBeenCalledWith('metadata->>uploaded_by', USER_ID);

    // The upload never reaches storage.
    expect(supabase.storage.from).not.toHaveBeenCalled();
  });

  it('uses a personal ("your limit") error message when blocked', async () => {
    (resolveEffectiveTier as any).mockResolvedValue('free');

    (supabase.from as any)
      .mockReturnValueOnce(makeChain({ data: [], error: null }))
      .mockReturnValueOnce(makeChain({ count: 5, error: null }));

    const file = new File(['abc'], 'photo.jpg', { type: 'image/jpeg' });

    await expect(uploadToStorage(file as any, TRIP_ID, 'images')).rejects.toThrow(
      /your limit of 5 photos/i,
    );
  });

  it("allows the upload when the trip has other members' media but the user is under their cap", async () => {
    (resolveEffectiveTier as any).mockResolvedValue('free');

    const storageUsageChain = makeChain({ data: [], error: null });
    // Only 2 of the user's own photos — even if the trip holds 50 from others.
    const countChain = makeChain({ count: 2, error: null });
    (supabase.from as any).mockReturnValueOnce(storageUsageChain).mockReturnValueOnce(countChain);

    const bucket = makeStorageBucket();
    (supabase.storage.from as any).mockReturnValue(bucket);

    const file = new File(['abc'], 'photo.jpg', { type: 'image/jpeg' });
    const result = await uploadToStorage(file as any, TRIP_ID, 'images');

    expect(countChain.eq).toHaveBeenCalledWith('metadata->>uploaded_by', USER_ID);
    expect(bucket.upload).toHaveBeenCalledTimes(1);
    expect(result.publicUrl).toBe('https://cdn/x.jpg');
  });

  it('fails OPEN when the count query errors — the upload proceeds', async () => {
    (resolveEffectiveTier as any).mockResolvedValue('free');

    (supabase.from as any)
      .mockReturnValueOnce(makeChain({ data: [], error: null }))
      .mockReturnValueOnce(makeChain({ count: null, error: { message: 'count failed' } }));

    const bucket = makeStorageBucket();
    (supabase.storage.from as any).mockReturnValue(bucket);

    const file = new File(['abc'], 'photo.jpg', { type: 'image/jpeg' });
    await expect(uploadToStorage(file as any, TRIP_ID, 'images')).resolves.toBeTruthy();
    expect(bucket.upload).toHaveBeenCalledTimes(1);
  });

  it('never runs quota/count queries for unlimited tiers', async () => {
    (resolveEffectiveTier as any).mockResolvedValue('frequent-chraveler');

    const bucket = makeStorageBucket();
    (supabase.storage.from as any).mockReturnValue(bucket);

    const file = new File(['abc'], 'photo.jpg', { type: 'image/jpeg' });
    await expect(uploadToStorage(file as any, TRIP_ID, 'images')).resolves.toBeTruthy();

    expect(supabase.from).not.toHaveBeenCalled();
    expect(bucket.upload).toHaveBeenCalledTimes(1);
  });

  it('counts files against the uploader via the trip_files.uploaded_by column', async () => {
    (resolveEffectiveTier as any).mockResolvedValue('free');

    const storageUsageChain = makeChain({ data: [], error: null });
    const fileCountChain = makeChain({ count: 5, error: null });
    (supabase.from as any)
      .mockReturnValueOnce(storageUsageChain)
      .mockReturnValueOnce(fileCountChain);

    const file = new File(['abc'], 'doc.pdf', { type: 'application/pdf' });

    await expect(uploadToStorage(file as any, TRIP_ID, 'files')).rejects.toThrow(
      MediaCountExceededError,
    );
    expect(fileCountChain.eq).toHaveBeenCalledWith('trip_id', TRIP_ID);
    expect(fileCountChain.eq).toHaveBeenCalledWith('uploaded_by', USER_ID);
  });
});
