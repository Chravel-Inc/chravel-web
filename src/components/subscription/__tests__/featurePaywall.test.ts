import { describe, expect, it } from 'vitest';
import { getFeaturePaywallConfig } from '../featurePaywall';

describe('featurePaywall', () => {
  it('returns concierge limit config with billing destination query params', () => {
    const config = getFeaturePaywallConfig('concierge_limit');

    expect(config.triggerContext).toBe('concierge_message_limit');
    expect(config.recommendedPlan).toBe('Frequent Chraveler');
    expect(config.destination.pathname).toBe('/settings');
    expect(config.destination.search).toContain('gate=concierge_limit');
    expect(config.destination.search).toContain('section=billing');
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
