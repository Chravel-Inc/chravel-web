export const expectedAiConciergeServiceUser = {
  id: 'ai-concierge-bot',
  name: 'AI Concierge',
  role: 'admin',
} as const;

export const expectedConfiguredChannelTypes = [
  'chravel-trip',
  'chravel-broadcast',
  'chravel-channel',
  'chravel-concierge',
] as const;

export const expectedAppLevelUserGrants = [
  'update-own-message',
  'delete-own-message',
  'update-message-owner',
  'delete-message-owner',
] as const;
