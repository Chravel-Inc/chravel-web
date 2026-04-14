import { describe, expect, it } from 'vitest';
import { getSmartImportErrorMessage, isSmartImportPaywall } from '../smartImportPaywall';

describe('smartImportPaywall', () => {
  it('returns upgrade CTA message for smart import limit payload', () => {
    const message = getSmartImportErrorMessage(
      {
        error_code: 'SMART_IMPORT_LIMIT_REACHED',
        upgrade_required: true,
        remaining: 0,
      },
      'Fallback message',
    );

    expect(message).toContain('monthly limit reached');
    expect(
      isSmartImportPaywall({ error_code: 'SMART_IMPORT_LIMIT_REACHED', upgrade_required: true }),
    ).toBe(true);
  });

  it('falls back to API error when payload is not paywall-shaped', () => {
    expect(getSmartImportErrorMessage({ error: 'Bad input' }, 'Fallback message')).toBe(
      'Bad input',
    );
    expect(isSmartImportPaywall({ error: 'Bad input' })).toBe(false);
  });
});
