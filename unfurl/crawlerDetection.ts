/**
 * Detects HTTP clients that should receive HTML (OG tags) instead of a 302 redirect.
 * Used by the branded unfurl worker so link previews keep working while real browsers
 * and in-app WebViews land on the SPA join route.
 */
export function isLikelyHtmlCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  const markers = [
    'facebookexternalhit',
    'facebot',
    'twitterbot',
    'slackbot',
    'linkedinbot',
    'discordbot',
    'telegrambot',
    'pinterest',
    'bingpreview',
    'googlebot',
    'google-inspectiontool',
    'embedly',
    'quora link preview',
    'vkshare',
    'redditbot',
    'whatsapp',
    'snapchat',
  ];
  return markers.some(marker => ua.includes(marker));
}
