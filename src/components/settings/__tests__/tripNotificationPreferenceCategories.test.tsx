import { describe, it, expect } from 'vitest';
import { getTripNotificationPreferenceCategories } from '../tripNotificationPreferenceCategories';

describe('getTripNotificationPreferenceCategories', () => {
  it('includes broadcast/pin and trip chat as the first two rows for consumer shells', () => {
    const rows = getTripNotificationPreferenceCategories({ includeTripInvites: false });
    expect(rows[0]?.label).toBe('Broadcast and pinned messages');
    expect(rows[0]?.dbKey).toBe('broadcasts');
    expect(rows[1]?.label).toBe('Trip chat');
    expect(rows[1]?.dbKey).toBe('chat_messages');
    expect(rows.some(r => r.key === 'tripInvites')).toBe(false);
  });

  it('appends trip invitations for enterprise shells', () => {
    const rows = getTripNotificationPreferenceCategories({ includeTripInvites: true });
    const invites = rows.find(r => r.key === 'tripInvites');
    expect(invites?.label).toBe('Trip Invitations');
    expect(invites?.dbKey).toBe('trip_invites');
  });

  it('exposes a Mentions row that persists to the `mentions` column, right after trip chat', () => {
    const rows = getTripNotificationPreferenceCategories({ includeTripInvites: false });
    const mentionsIndex = rows.findIndex(r => r.key === 'mentions');
    const chatIndex = rows.findIndex(r => r.key === 'chat');

    expect(mentionsIndex).toBeGreaterThan(-1);
    expect(mentionsIndex).toBe(chatIndex + 1);
    expect(rows[mentionsIndex]?.label).toBe('Mentions');
    // dbKey drives the userPreferencesService write path — it must target `mentions`.
    expect(rows[mentionsIndex]?.dbKey).toBe('mentions');
    expect(rows[mentionsIndex]?.description).toMatch(/@mention/i);
  });

  it('offers Mentions in both consumer and enterprise shells', () => {
    const consumer = getTripNotificationPreferenceCategories({ includeTripInvites: false });
    const enterprise = getTripNotificationPreferenceCategories({ includeTripInvites: true });
    expect(consumer.some(r => r.dbKey === 'mentions')).toBe(true);
    expect(enterprise.some(r => r.dbKey === 'mentions')).toBe(true);
  });
});
