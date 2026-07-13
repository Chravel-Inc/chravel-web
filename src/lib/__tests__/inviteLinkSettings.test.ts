import { describe, expect, it } from 'vitest';
import {
  areInviteSettingsEqual,
  buildAppliedInviteSettings,
  normalizeInviteMaxUses,
} from '../inviteLinkSettings';

describe('inviteLinkSettings', () => {
  it('normalizes invalid max uses to null', () => {
    expect(normalizeInviteMaxUses(null)).toBeNull();
    expect(normalizeInviteMaxUses(undefined)).toBeNull();
    expect(normalizeInviteMaxUses(0)).toBeNull();
    expect(normalizeInviteMaxUses(10)).toBe(10);
  });

  it('detects when current settings differ from applied settings', () => {
    const applied = buildAppliedInviteSettings(false, null);
    const current = buildAppliedInviteSettings(true, 10);

    expect(areInviteSettingsEqual(applied, applied)).toBe(true);
    expect(areInviteSettingsEqual(applied, current)).toBe(false);
    expect(areInviteSettingsEqual(null, current)).toBe(false);
  });
});
