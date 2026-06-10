import { describe, expect, it } from 'vitest';

import {
  filterPlaceholderTabs,
  getVisibleTabs,
  isReadOnlyTab,
  PLACEHOLDER_PRO_TAB_IDS,
  proTabs,
  type ProTab,
} from '../ProTabsConfig';
import { getAllCategories } from '../../../types/proCategories';

/**
 * Honesty gate: tabs whose backing data convertSupabaseTripToProTrip hardcodes
 * to empty (finance/settlement, medical, compliance, sponsors) render static
 * placeholder empty states in ProTabContent. Real (non-demo) trips must never
 * offer them; demo trips keep everything (the demo is the product vision).
 */
describe('Pro tab placeholder visibility gate', () => {
  const adminPermissions = ['read', 'write', 'admin'];

  // Synthetic list proving the gate behavior even though proTabs does not
  // currently include placeholder ids (regression guard if they are re-added).
  const tabsWithPlaceholders: ProTab[] = [
    ...proTabs,
    { id: 'finance', label: 'Finance', icon: null },
    { id: 'medical', label: 'Medical', icon: null },
    { id: 'compliance', label: 'Compliance', icon: null },
    { id: 'sponsors', label: 'Sponsors', icon: null },
  ];

  it('filterPlaceholderTabs removes placeholder tabs on real trips', () => {
    const realTripTabs = filterPlaceholderTabs(tabsWithPlaceholders, false);
    const realTripIds = realTripTabs.map(tab => tab.id);

    for (const placeholderId of PLACEHOLDER_PRO_TAB_IDS) {
      expect(realTripIds).not.toContain(placeholderId);
    }
    // Non-placeholder tabs are untouched
    expect(realTripIds).toEqual(proTabs.map(tab => tab.id));
  });

  it('filterPlaceholderTabs keeps placeholder tabs on demo trips', () => {
    const demoTripTabs = filterPlaceholderTabs(tabsWithPlaceholders, true);
    expect(demoTripTabs).toEqual(tabsWithPlaceholders);
  });

  it('getVisibleTabs never returns placeholder tabs for real trips in any category', () => {
    for (const category of getAllCategories()) {
      const visibleIds = getVisibleTabs('admin', adminPermissions, category, {
        isDemoTrip: false,
      }).map(tab => tab.id);

      for (const placeholderId of PLACEHOLDER_PRO_TAB_IDS) {
        expect(visibleIds).not.toContain(placeholderId);
      }
    }
  });

  it('getVisibleTabs defaults to the safe (real trip) behavior when options are omitted', () => {
    const visibleIds = getVisibleTabs('admin', adminPermissions, 'sports').map(tab => tab.id);
    for (const placeholderId of PLACEHOLDER_PRO_TAB_IDS) {
      expect(visibleIds).not.toContain(placeholderId);
    }
  });

  it('demo trips keep the full category tab set (demo experience unchanged)', () => {
    const demoIds = getVisibleTabs('admin', adminPermissions, 'sports', {
      isDemoTrip: true,
    }).map(tab => tab.id);

    expect(demoIds).toEqual([
      'chat',
      'calendar',
      'ai-chat',
      'media',
      'payments',
      'places',
      'polls',
      'tasks',
      'team',
    ]);
  });
});

describe('isReadOnlyTab finance/compliance role carve-out', () => {
  const writePermissions = ['read', 'write'];

  it("treats the Sports 'player' role as read-only on finance and compliance", () => {
    expect(isReadOnlyTab('finance', 'Player', writePermissions)).toBe(true);
    expect(isReadOnlyTab('compliance', 'player', writePermissions)).toBe(true);
  });

  it('keeps existing read-only roles intact', () => {
    for (const role of ['talent', 'cast', 'student', 'artist']) {
      expect(isReadOnlyTab('finance', role, writePermissions)).toBe(true);
    }
  });

  it('does not make staff roles with write access read-only', () => {
    expect(isReadOnlyTab('finance', 'Coach', writePermissions)).toBe(false);
  });

  it('demo mode still overrides read-only restrictions', () => {
    expect(isReadOnlyTab('finance', 'player', writePermissions, true)).toBe(false);
  });
});
