import { describe, expect, it } from 'vitest';
import { resolveUnfurlMiddlewareDecision } from '../middlewareHandler';

const BROWSER_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

describe('resolveUnfurlMiddlewareDecision', () => {
  it('always proxies trip share paths so previews include the trip cover photo', () => {
    const decision = resolveUnfurlMiddlewareDecision(
      '/t/f91fb178-dcea-453f-ac73-71f42856b163',
      BROWSER_UA,
    );

    expect(decision).toEqual({
      action: 'proxy',
      destination: 'https://p.chravel.app/t/f91fb178-dcea-453f-ac73-71f42856b163',
    });
  });

  it('always proxies branded invite short links', () => {
    const decision = resolveUnfurlMiddlewareDecision('/j/chravelabc123', BROWSER_UA);

    expect(decision).toEqual({
      action: 'proxy',
      destination: 'https://p.chravel.app/j/chravelabc123',
    });
  });

  it('proxies legacy /join links only for crawlers', () => {
    expect(resolveUnfurlMiddlewareDecision('/join/chravelabc123', BROWSER_UA)).toEqual({
      action: 'pass',
    });

    expect(
      resolveUnfurlMiddlewareDecision('/join/chravelabc123', 'facebookexternalhit/1.1'),
    ).toEqual({
      action: 'proxy',
      destination: 'https://p.chravel.app/j/chravelabc123',
    });
  });

  it('passes through unrelated paths', () => {
    expect(resolveUnfurlMiddlewareDecision('/trip/abc/preview', BROWSER_UA)).toEqual({
      action: 'pass',
    });
  });
});
