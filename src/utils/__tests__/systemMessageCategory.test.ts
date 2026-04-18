import { describe, it, expect } from 'vitest';
import {
  getSystemMessageCategory,
  shouldShowSystemMessage,
  DEFAULT_SYSTEM_MESSAGE_CATEGORIES,
  SystemMessageCategoryPrefs,
} from '@/utils/systemMessageCategory';

const allOn: SystemMessageCategoryPrefs = {
  member: true,
  basecamp: true,
  uploads: true,
  polls: true,
  calendar: true,
  tasks: true,
  payments: true,
};

describe('getSystemMessageCategory', () => {
  it.each([
    ['member_joined', 'member'],
    ['member_left', 'member'],
    ['member_join_approved', 'member'],
    ['trip_base_camp_updated', 'basecamp'],
    ['personal_base_camp_updated', 'basecamp'],
    ['photos_uploaded', 'uploads'],
    ['files_uploaded', 'uploads'],
    ['attachments_uploaded', 'uploads'],
    ['poll_created', 'polls'],
    ['poll_closed', 'polls'],
    ['calendar_item_added', 'calendar'],
    ['task_created', 'tasks'],
    ['task_completed', 'tasks'],
    ['payment_recorded', 'payments'],
    ['payment_settled', 'payments'],
    ['trip_created', 'member'],
    ['trip_updated', 'member'],
  ])('maps %s → %s', (event, category) => {
    expect(getSystemMessageCategory(event)).toBe(category);
  });

  it('returns null for unknown event types', () => {
    expect(getSystemMessageCategory('something_else')).toBeNull();
    expect(getSystemMessageCategory('')).toBeNull();
  });
});

describe('shouldShowSystemMessage', () => {
  it('master toggle off hides everything regardless of category prefs', () => {
    for (const event of ['member_joined', 'poll_created', 'task_created']) {
      expect(shouldShowSystemMessage(false, allOn, event)).toBe(false);
    }
  });

  it('master toggle on + category off hides only that category', () => {
    const prefs: SystemMessageCategoryPrefs = { ...allOn, polls: false };
    expect(shouldShowSystemMessage(true, prefs, 'poll_created')).toBe(false);
    expect(shouldShowSystemMessage(true, prefs, 'poll_closed')).toBe(false);
    expect(shouldShowSystemMessage(true, prefs, 'task_created')).toBe(true);
    expect(shouldShowSystemMessage(true, prefs, 'member_joined')).toBe(true);
  });

  it('hidden-by-default categories: tasks + payments OFF in DEFAULTS', () => {
    expect(DEFAULT_SYSTEM_MESSAGE_CATEGORIES.tasks).toBe(false);
    expect(DEFAULT_SYSTEM_MESSAGE_CATEGORIES.payments).toBe(false);
    expect(DEFAULT_SYSTEM_MESSAGE_CATEGORIES.member).toBe(true);
    expect(DEFAULT_SYSTEM_MESSAGE_CATEGORIES.polls).toBe(true);
    expect(shouldShowSystemMessage(true, DEFAULT_SYSTEM_MESSAGE_CATEGORIES, 'task_created')).toBe(
      false,
    );
    expect(
      shouldShowSystemMessage(true, DEFAULT_SYSTEM_MESSAGE_CATEGORIES, 'payment_recorded'),
    ).toBe(false);
    expect(shouldShowSystemMessage(true, DEFAULT_SYSTEM_MESSAGE_CATEGORIES, 'member_joined')).toBe(
      true,
    );
  });

  it('shows messages with no/unknown event type when master is on (legacy fallback)', () => {
    expect(shouldShowSystemMessage(true, allOn, undefined)).toBe(true);
    expect(shouldShowSystemMessage(true, allOn, null)).toBe(true);
    expect(shouldShowSystemMessage(true, allOn, 'unknown_future_event')).toBe(true);
  });
});
