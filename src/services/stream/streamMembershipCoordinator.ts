import { connectStreamClient } from './streamClient';
import {
  addMemberToProChannel,
  addMemberToTripChannels,
  removeMemberFromProChannel,
  removeMemberFromTripChannels,
} from './streamMembershipSync';

const MAX_ATTEMPTS = 4;
const BASE_DELAY_MS = 500;

const pendingOps = new Map<string, Promise<void>>();

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function opKey(kind: string, idA: string, idB: string): string {
  return `${kind}:${idA}:${idB}`;
}

async function withRetries(
  key: string,
  operation: () => Promise<void>,
  onAttemptFailure?: (attempt: number, error: unknown) => void,
): Promise<void> {
  const existing = pendingOps.get(key);
  if (existing) return existing;

  const runner = (async () => {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        const client = await connectStreamClient();
        if (!client?.userID) {
          throw new Error('Stream client unavailable');
        }

        await operation();
        return;
      } catch (error) {
        lastError = error;
        onAttemptFailure?.(attempt, error);

        if (attempt < MAX_ATTEMPTS) {
          await wait(BASE_DELAY_MS * 2 ** (attempt - 1));
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Membership sync failed');
  })()
    .catch(error => {
      if (import.meta.env.DEV) {
        console.warn('[StreamMembershipCoordinator] operation failed after retries', {
          key,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      throw error;
    })
    .finally(() => {
      pendingOps.delete(key);
    });

  pendingOps.set(key, runner);
  return runner;
}

export async function syncAddMemberToTripChannels(tripId: string, userId: string): Promise<void> {
  return withRetries(opKey('add-trip-member', tripId, userId), () =>
    addMemberToTripChannels(tripId, userId),
  );
}

export async function syncRemoveMemberFromTripChannels(
  tripId: string,
  userId: string,
): Promise<void> {
  return withRetries(opKey('remove-trip-member', tripId, userId), () =>
    removeMemberFromTripChannels(tripId, userId),
  );
}

export async function syncAddMemberToProChannel(channelId: string, userId: string): Promise<void> {
  return withRetries(opKey('add-pro-channel-member', channelId, userId), () =>
    addMemberToProChannel(channelId, userId),
  );
}

export async function syncRemoveMemberFromProChannel(
  channelId: string,
  userId: string,
): Promise<void> {
  return withRetries(opKey('remove-pro-channel-member', channelId, userId), () =>
    removeMemberFromProChannel(channelId, userId),
  );
}
