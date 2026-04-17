import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateSafeUuid } from '../uuid';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('generateSafeUuid', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses crypto.randomUUID when available', () => {
    const randomUUID = vi.fn().mockReturnValue('123e4567-e89b-42d3-a456-426614174000');
    vi.stubGlobal('crypto', { randomUUID, getRandomValues: vi.fn() });

    const id = generateSafeUuid();

    expect(id).toBe('123e4567-e89b-42d3-a456-426614174000');
    expect(randomUUID).toHaveBeenCalledTimes(1);
  });

  it('falls back to crypto.getRandomValues when randomUUID is unavailable', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: vi.fn((arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) arr[i] = i + 1;
        return arr;
      }),
    });

    const id = generateSafeUuid();

    expect(id).toMatch(UUID_REGEX);
  });

  it('returns a UUID-shaped string when crypto is unavailable', () => {
    vi.stubGlobal('crypto', undefined);

    const id = generateSafeUuid();

    expect(id).toMatch(UUID_REGEX);
  });
});
