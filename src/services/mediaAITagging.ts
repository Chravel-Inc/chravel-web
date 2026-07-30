/**
 * Media AI Tagging Service
 *
 * Client-side filter for media items tagged with AI metadata.
 *
 * @module services/mediaAITagging
 */

/**
 * Filter media items by AI tags
 *
 * @param items - Media items to filter
 * @param query - Search query (e.g., "beach photos", "receipts")
 * @returns Filtered items
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

    // Check if any query word matches tags, category, or description
    return queryWords.some(word => {
      return (
        tags.some(tag => tag.includes(word)) ||
        category.includes(word) ||
        description.includes(word)
      );
    });
  });
}
