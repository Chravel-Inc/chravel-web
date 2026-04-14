export type FeaturePaywallGate =
  | 'concierge_limit'
  | 'smart_import_calendar'
  | 'smart_import_event_agenda'
  | 'smart_import_event_lineup'
  | 'archived_restore'
  | 'trip_cap_consumer'
  | 'trip_cap_pro'
  | 'trip_cap_event';

export interface FeaturePaywallDestination {
  pathname: '/settings';
  search: string;
  state?: {
    section?: 'billing';
    modal?: 'upgrade';
  };
}

interface FeaturePaywallConfig {
  triggerContext: string;
  featureBenefitCopy: string;
  recommendedPlan: string;
  destination: FeaturePaywallDestination;
}

const buildSettingsDestination = (
  gate: FeaturePaywallGate,
  trigger: string,
): FeaturePaywallDestination => {
  const params = new URLSearchParams({
    gate,
    trigger,
    section: 'billing',
  });

  return {
    pathname: '/settings',
    search: `?${params.toString()}`,
    state: {
      section: 'billing',
      modal: 'upgrade',
    },
  };
};

const FEATURE_PAYWALL_CONFIG: Record<FeaturePaywallGate, FeaturePaywallConfig> = {
  concierge_limit: {
    triggerContext: 'concierge_message_limit',
    featureBenefitCopy:
      'Keep chatting with AI Concierge for personalized recommendations without trip-level caps.',
    recommendedPlan: 'Frequent Chraveler',
    destination: buildSettingsDestination('concierge_limit', 'concierge'),
  },
  smart_import_calendar: {
    triggerContext: 'calendar_smart_import',
    featureBenefitCopy:
      'Import schedules from links and files instantly so your itinerary stays up to date.',
    recommendedPlan: 'Explorer',
    destination: buildSettingsDestination('smart_import_calendar', 'calendar-smart-import'),
  },
  smart_import_event_agenda: {
    triggerContext: 'event_agenda_smart_import',
    featureBenefitCopy:
      'Turn agenda files and URLs into structured sessions in seconds to save organizer time.',
    recommendedPlan: 'Explorer',
    destination: buildSettingsDestination('smart_import_event_agenda', 'agenda-smart-import'),
  },
  smart_import_event_lineup: {
    triggerContext: 'event_lineup_smart_import',
    featureBenefitCopy:
      'Extract speakers and artists automatically so your Line-up stays accurate and fast to publish.',
    recommendedPlan: 'Explorer',
    destination: buildSettingsDestination('smart_import_event_lineup', 'lineup-smart-import'),
  },
  archived_restore: {
    triggerContext: 'archived_trip_restore',
    featureBenefitCopy:
      'Restore archived trips anytime while keeping unlimited active trips available for new planning.',
    recommendedPlan: 'Explorer',
    destination: buildSettingsDestination('archived_restore', 'archive-restore'),
  },
  trip_cap_consumer: {
    triggerContext: 'consumer_trip_cap',
    featureBenefitCopy: 'Create unlimited trips without archiving older plans to free up space.',
    recommendedPlan: 'Explorer',
    destination: buildSettingsDestination('trip_cap_consumer', 'trip-cap'),
  },
  trip_cap_pro: {
    triggerContext: 'pro_trip_cap',
    featureBenefitCopy:
      'Launch additional Pro trips with higher coordination and operational limits.',
    recommendedPlan: 'Explorer',
    destination: buildSettingsDestination('trip_cap_pro', 'trip-cap'),
  },
  trip_cap_event: {
    triggerContext: 'event_trip_cap',
    featureBenefitCopy: 'Run unlimited Events and keep every production workspace active.',
    recommendedPlan: 'Explorer',
    destination: buildSettingsDestination('trip_cap_event', 'trip-cap'),
  },
};

export const getFeaturePaywallConfig = (gate: FeaturePaywallGate): FeaturePaywallConfig =>
  FEATURE_PAYWALL_CONFIG[gate];
