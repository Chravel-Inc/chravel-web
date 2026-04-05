/**
 * Platform-agnostic external URL handler (web-only).
 *
 * Opens URLs in a new tab. Native navigation is handled by
 * the separate chravel-mobile Expo app.
 */

export function openExternalUrl(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}
