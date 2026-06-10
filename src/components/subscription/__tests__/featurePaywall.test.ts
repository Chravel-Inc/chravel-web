import { describe, expect, it } from 'vitest';
import { getFeaturePaywallConfig } from '../featurePaywall';

describe('featurePaywall', () => {
  it('returns concierge limit config with billing destination query params', () => {
    const config = getFeaturePaywallConfig('concierge_limit');

    expect(config.triggerContext).toBe('concierge_message_limit');
    // Explorer (25 asks/trip) is the correct first step up from the free 10-ask
    // cap; Frequent Chraveler is the unlimited secondary.
    expect(config.recommendedPlan).toBe('Explorer');
    expect(config.secondaryPlan).toBe('Frequent Chraveler');
    expect(config.destination.pathname).toBe('/settings');
    expect(config.destination.search).toContain('gate=concierge_limit');
    expect(config.destination.search).toContain('section=billing');
  });

  it('recommends Frequent Chraveler for the event trip cap (Explorer shares the same cap)', () => {
    const config = getFeaturePaywallConfig('trip_cap_event');

    expect(config.recommendedPlan).toBe('Frequent Chraveler');
    expect(config.destination.search).toContain('gate=trip_cap_event');
  });

  it('keeps smart import gates mapped to Explorer with settings destination', () => {
    const calendar = getFeaturePaywallConfig('smart_import_calendar');
    const agenda = getFeaturePaywallConfig('smart_import_event_agenda');
    const lineup = getFeaturePaywallConfig('smart_import_event_lineup');

    expect(calendar.recommendedPlan).toBe('Explorer');
    expect(agenda.recommendedPlan).toBe('Explorer');
    expect(lineup.recommendedPlan).toBe('Explorer');
    expect(calendar.destination.search).toContain('gate=smart_import_calendar');
    expect(agenda.destination.search).toContain('gate=smart_import_event_agenda');
    expect(lineup.destination.search).toContain('gate=smart_import_event_lineup');
  });
});
