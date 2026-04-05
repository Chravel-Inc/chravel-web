export async function processInChunks<T>(
  items: T[],
  chunkSize: number,
  handler: (item: T) => Promise<void>,
): Promise<void> {
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new Error('chunkSize must be a positive integer');
  }

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await Promise.all(chunk.map(handler));
  }
}
