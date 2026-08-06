import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '../../../..');
const read = (path: string) => readFileSync(resolve(repoRoot, path), 'utf8');

// Regression for a 2026-08-05 finding: a single shared HTML body is sent to
// every address in a batched `to` array. buildEmailFooterLink(recipients[0])
// embeds a signed, WORKING one-click unsubscribe token for recipients[0]. If
// that call is ever made unconditionally, every other recipient in the same
// batch receives a copy of the email containing a valid credential to
// silently disable recipients[0]'s email notifications — an IDOR via
// cross-recipient credential leakage, not a hypothetical.
describe('send-email-with-retry: batched-send unsubscribe token leak', () => {
  const source = read('supabase/functions/send-email-with-retry/index.ts');

  it('only personalizes the unsubscribe token for single-recipient sends', () => {
    expect(source).toMatch(
      /recipients\.length === 1\s*\?\s*await buildEmailFooterLink\(recipients\[0\]\)\s*:\s*GENERIC_SETTINGS_LINK/,
    );
  });

  it('never calls buildEmailFooterLink unconditionally on the batched send path', () => {
    // The only occurrence of buildEmailFooterLink(recipients[0]) must be
    // inside the length-gated ternary above, not a bare top-level call.
    const bareCall = /(?<!\?\s{0,40})await buildEmailFooterLink\(recipients\[0\]\);/;
    expect(source).not.toMatch(bareCall);
  });

  it('defines a single shared GENERIC_SETTINGS_LINK fallback (no per-recipient PII in the fallback)', () => {
    expect(source).toContain(
      'const GENERIC_SETTINGS_LINK = `<a href="https://chravel.app/settings">Manage notification settings</a>`;',
    );
    // buildEmailFooterLink's own failure/no-profile paths must reuse the same
    // constant rather than re-deriving anything recipient-specific.
    expect(source).toContain('return GENERIC_SETTINGS_LINK;');
  });
});
