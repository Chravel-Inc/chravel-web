/**
 * Filter media items by AI tags stored in item metadata.
 * Tagging/write APIs were never wired from the client and were removed.
 */

export function filterMediaByAITags<T extends { metadata?: Record<string, unknown> }>(
  items: T[],
  query: string,
): T[] {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);

  return items.filter(item => {
    const metadata = (item.metadata || {}) as Record<string, unknown>;
    const tags = [
      ...(Array.isArray(metadata.tags) ? (metadata.tags as unknown[]) : []),
      ...(Array.isArray(metadata.ai_tags) ? (metadata.ai_tags as unknown[]) : []),
    ].map((t: unknown) => String(t).toLowerCase());

    const category = String(metadata.ai_category || '').toLowerCase();
    const description = String(metadata.ai_description || '').toLowerCase();

    return queryWords.some(word => {
      return (
        tags.some(tag => tag.includes(word)) ||
        category.includes(word) ||
        description.includes(word)
      );
    });
  });
}
