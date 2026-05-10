import { describe, expect, it } from 'vitest';
import { getSafeReturnTo } from '@/utils/safeReturnTo';

describe('getSafeReturnTo', () => {
  it('returns the value when it is a same-origin relative path', () => {
    expect(getSafeReturnTo('/trip/abc', '/')).toBe('/trip/abc');
    expect(getSafeReturnTo('/join/CODE?invite=1', '/')).toBe('/join/CODE?invite=1');
  });

  it('falls back when the value is null or empty', () => {
    expect(getSafeReturnTo(null, '/')).toBe('/');
    expect(getSafeReturnTo(undefined, '/')).toBe('/');
    expect(getSafeReturnTo('', '/')).toBe('/');
  });

  it('rejects absolute and protocol-relative URLs', () => {
    expect(getSafeReturnTo('https://evil.example/foo', '/')).toBe('/');
    expect(getSafeReturnTo('//evil.example/foo', '/')).toBe('/');
    expect(getSafeReturnTo('http://localhost/foo', '/')).toBe('/');
  });

  it('rejects values that do not start with a slash', () => {
    expect(getSafeReturnTo('javascript:alert(1)', '/')).toBe('/');
    expect(getSafeReturnTo('trip/abc', '/')).toBe('/');
  });
});
