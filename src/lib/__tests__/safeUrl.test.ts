import { describe, it, expect } from 'vitest';
import { sanitizeExternalHref, isSafeExternalUrl } from '../safeUrl';

describe('safeUrl', () => {
  it('allows http and https URLs', () => {
    expect(sanitizeExternalHref('https://example.com/x')).toBe('https://example.com/x');
    expect(sanitizeExternalHref('http://example.com')).toBe('http://example.com');
    expect(isSafeExternalUrl('https://example.com')).toBe(true);
  });

  it('rejects javascript: and data: URLs (stored-XSS vectors)', () => {
    expect(sanitizeExternalHref('javascript:alert(1)')).toBeUndefined();
    expect(sanitizeExternalHref('JavaScript:alert(document.cookie)')).toBeUndefined();
    expect(sanitizeExternalHref('data:text/html,<script>alert(1)</script>')).toBeUndefined();
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects empty, null, and malformed / scheme-less input', () => {
    expect(sanitizeExternalHref('')).toBeUndefined();
    expect(sanitizeExternalHref(null)).toBeUndefined();
    expect(sanitizeExternalHref(undefined)).toBeUndefined();
    expect(sanitizeExternalHref('not a url')).toBeUndefined();
  });

  it('trims surrounding whitespace on valid URLs', () => {
    expect(sanitizeExternalHref('  https://example.com  ')).toBe('https://example.com');
  });
});
