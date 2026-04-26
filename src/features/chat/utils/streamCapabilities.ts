export type StreamCapabilityName =
  | 'delete-own-message'
  | 'delete-any-message'
  | 'update-own-message'
  | 'pin-message';

const normalizeCapabilityName = (capability: string): string =>
  capability.toLowerCase().replace(/[^a-z0-9]/g, '');

const STREAM_CAPABILITY_ALIASES: Record<StreamCapabilityName, string[]> = {
  'delete-own-message': ['delete-own-message', 'DeleteOwnMessage'],
  'delete-any-message': ['delete-any-message', 'DeleteAnyMessage'],
  'update-own-message': ['update-own-message', 'UpdateOwnMessage'],
  'pin-message': ['pin-message', 'PinMessage'],
};

export const hasStreamCapability = (
  ownCapabilities: string[],
  capability: StreamCapabilityName,
): boolean => {
  const normalizedCapabilities = new Set(ownCapabilities.map(normalizeCapabilityName));
  return STREAM_CAPABILITY_ALIASES[capability].some(alias =>
    normalizedCapabilities.has(normalizeCapabilityName(alias)),
  );
};
