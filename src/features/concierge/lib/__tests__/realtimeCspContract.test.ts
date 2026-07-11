import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

describe('Concierge realtime CSP contract', () => {
  it('allows Vercel AI Gateway HTTP and WSS in the meta CSP connect-src', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    expect(html).toMatch(/https:\/\/ai-gateway\.vercel\.sh/);
    expect(html).toMatch(/wss:\/\/ai-gateway\.vercel\.sh/);
  });
});
