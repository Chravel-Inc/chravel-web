/**
 * Determines the media category from a MIME type
 */
export function getMediaCategory(mimeType: string): 'video' | 'image' | 'document' {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('image/')) return 'image';
  return 'document';
}

/**
 * Checks if a URL is a blob or data URL
 */
export function isBlobOrDataUrl(url: string): boolean {
  return url.startsWith('blob:') || url.startsWith('data:');
}
