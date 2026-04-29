import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('apple-app-site-association', () => {
  it('includes branded invite short links for Universal Link claim', () => {
    const raw = readFileSync(
      resolve(process.cwd(), 'public/.well-known/apple-app-site-association'),
      'utf8',
    );
    const aasa = JSON.parse(raw) as {
      applinks: {
        details: Array<{
          appIDs: string[];
          components: Array<Record<string, string | boolean>>;
        }>;
      };
    };
    const details = aasa.applinks.details[0];
    expect(details.appIDs).toContain('2T6WY43H3X.com.chravel.app');

    const inviteShortPath = details.components.find(component => component['/'] === '/j/*');
    expect(inviteShortPath).toBeTruthy();
  });
});
