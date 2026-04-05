import { describe, expect, it } from 'vitest';
import { processInChunks } from '../concurrency.ts';

describe('processInChunks', () => {
  it('processes all items with bounded chunk concurrency', async () => {
    const items = Array.from({ length: 10 }, (_, i) => i);
    let active = 0;
    let maxActive = 0;

    await processInChunks(items, 3, async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise(resolve => setTimeout(resolve, 5));
      active -= 1;
    });

    expect(maxActive).toBeLessThanOrEqual(3);
  });

  it('throws when chunk size is invalid', async () => {
    await expect(processInChunks([1, 2, 3], 0, async () => {})).rejects.toThrow(
      'chunkSize must be a positive integer',
    );
  });
});
