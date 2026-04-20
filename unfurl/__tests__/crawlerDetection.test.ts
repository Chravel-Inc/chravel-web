import { describe, expect, it } from 'vitest';
import { isLikelyHtmlCrawler } from '../crawlerDetection';

describe('isLikelyHtmlCrawler', () => {
  it('returns false for null and typical mobile browsers', () => {
    expect(isLikelyHtmlCrawler(null)).toBe(false);
    expect(
      isLikelyHtmlCrawler(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      ),
    ).toBe(false);
    expect(
      isLikelyHtmlCrawler(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ),
    ).toBe(false);
  });

  it('returns true for common preview / crawler user agents', () => {
    expect(isLikelyHtmlCrawler('facebookexternalhit/1.1')).toBe(true);
    expect(isLikelyHtmlCrawler('Twitterbot/1.0')).toBe(true);
    expect(isLikelyHtmlCrawler('Slackbot-LinkExpanding 1.0')).toBe(true);
    expect(isLikelyHtmlCrawler('LinkedInBot/1.0')).toBe(true);
  });
});
