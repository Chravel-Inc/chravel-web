import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { authorizeDirectPushUserIds } from './pushTargetAuthorization.ts';

Deno.test('authorizeDirectPushUserIds allows self-only direct notifications', () => {
  const result = authorizeDirectPushUserIds({
    callerId: 'user-1',
    requestedUserIds: ['user-1'],
    callerTripIds: [],
    sharedUserIds: [],
  });

  assertEquals(result, {
    authorizedUserIds: ['user-1'],
    unauthorizedUserIds: [],
  });
});

Deno.test('authorizeDirectPushUserIds rejects unrelated direct targets when caller shares no trips', () => {
  const result = authorizeDirectPushUserIds({
    callerId: 'user-1',
    requestedUserIds: ['user-2'],
    callerTripIds: [],
    sharedUserIds: [],
  });

  assertEquals(result, {
    authorizedUserIds: ['user-2'],
    unauthorizedUserIds: ['user-2'],
  });
});

Deno.test('authorizeDirectPushUserIds allows direct targets who share a trip with the caller', () => {
  const result = authorizeDirectPushUserIds({
    callerId: 'user-1',
    requestedUserIds: ['user-2', 'user-3'],
    callerTripIds: ['trip-1'],
    sharedUserIds: ['user-2', 'user-3'],
  });

  assertEquals(result, {
    authorizedUserIds: ['user-2', 'user-3'],
    unauthorizedUserIds: [],
  });
});

Deno.test('authorizeDirectPushUserIds flags only the unrelated subset of mixed targets', () => {
  const result = authorizeDirectPushUserIds({
    callerId: 'user-1',
    requestedUserIds: ['user-1', 'user-2', 'user-4'],
    callerTripIds: ['trip-1', 'trip-2'],
    sharedUserIds: ['user-2'],
  });

  assertEquals(result, {
    authorizedUserIds: ['user-1', 'user-2', 'user-4'],
    unauthorizedUserIds: ['user-4'],
  });
});
