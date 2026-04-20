export type StreamSetupResult = { channelType: string; status: string };

type StreamSetupClient = {
  updateChannelType: (channelType: string, config: Record<string, unknown>) => Promise<unknown>;
  upsertUser: (user: {
    id: string;
    name: string;
    role: 'admin' | 'user' | string;
  }) => Promise<unknown>;
  // Optional — may not be present on older Stream client versions.
  // Used to grant app-level `user` role permissions for owner-scoped
  // edit/delete. Stream authorization is the intersection of channel-type
  // grants AND app-level role grants, so both layers must allow the action.
  updateAppSettings?: (settings: Record<string, unknown>) => Promise<unknown>;
  upsertPermission?: (permission: Record<string, unknown>) => Promise<unknown>;
  updateRole?: (
    role: string,
    config: Record<string, unknown>,
  ) => Promise<unknown>;
};

export const AI_CONCIERGE_BOT_ID = 'ai-concierge-bot';

// Permission aliases — Stream uses both naming conventions across versions.
// Granting both is safe and idempotent.
const APP_LEVEL_USER_GRANTS = [
  'update-own-message',
  'delete-own-message',
  'update-message-owner',
  'delete-message-owner',
] as const;

export async function configureStreamPermissionsAndPrincipal(
  serverClient: StreamSetupClient,
  logger: Pick<Console, 'error'> = console,
): Promise<StreamSetupResult[]> {
  const results: StreamSetupResult[] = [];

  try {
    await serverClient.upsertUser({
      id: AI_CONCIERGE_BOT_ID,
      name: 'AI Concierge',
      role: 'admin',
    });
    results.push({ channelType: 'service-principal:ai-concierge-bot', status: 'ok' });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logger.error('[stream-setup-permissions] service_user_upsert_failed', {
      scope: 'stream-setup-permissions',
      operation: 'upsert_service_user',
      principal_id: AI_CONCIERGE_BOT_ID,
      principal_name: 'AI Concierge',
      error: message,
    });
    results.push({
      channelType: 'service-principal:ai-concierge-bot',
      status: `error: ${message}`,
    });
  }

  // chravel-trip: members can read/write, non-members cannot
  try {
    await serverClient.updateChannelType('chravel-trip', {
      grants: {
        channel_member: [
          'read-channel',
          'create-message',
          'update-message-owner',
          'delete-message-owner',
          'update-own-message',
          'delete-own-message',
          'upload-attachment',
          'flag-message',
          'pin-message',
          'create-reaction',
          'delete-reaction-owner',
        ],
        channel_moderator: [
          'read-channel',
          'create-message',
          'update-message',
          'delete-message',
          'upload-attachment',
          'flag-message',
          'pin-message',
          'create-reaction',
          'delete-reaction',
          'send-custom-event',
        ],
      },
    });
    results.push({ channelType: 'chravel-trip', status: 'ok' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({ channelType: 'chravel-trip', status: `error: ${msg}` });
  }

  // chravel-broadcast: admin-only send, all members can read
  try {
    await serverClient.updateChannelType('chravel-broadcast', {
      grants: {
        channel_member: ['read-channel', 'create-reaction', 'delete-reaction-owner'],
        channel_moderator: [
          'read-channel',
          'create-message',
          'update-message',
          'delete-message',
          'create-reaction',
          'delete-reaction',
          'pin-message',
        ],
      },
    });
    results.push({ channelType: 'chravel-broadcast', status: 'ok' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({ channelType: 'chravel-broadcast', status: `error: ${msg}` });
  }

  // chravel-channel: role-gated, similar to trip but configured per channel
  try {
    await serverClient.updateChannelType('chravel-channel', {
      grants: {
        channel_member: [
          'read-channel',
          'create-message',
          'update-message-owner',
          'delete-message-owner',
          'update-own-message',
          'delete-own-message',
          'send-custom-event',
          'create-reaction',
          'delete-reaction-owner',
        ],
        channel_moderator: [
          'read-channel',
          'create-message',
          'update-message',
          'delete-message',
          'send-custom-event',
          'create-reaction',
          'delete-reaction',
          'pin-message',
        ],
      },
    });
    results.push({ channelType: 'chravel-channel', status: 'ok' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({ channelType: 'chravel-channel', status: `error: ${msg}` });
  }

  // chravel-concierge: 2-member private channel, both can read/write
  try {
    await serverClient.updateChannelType('chravel-concierge', {
      max_message_length: 19999,
      grants: {
        channel_member: ['read-channel', 'create-message', 'send-custom-event'],
      },
    });
    results.push({ channelType: 'chravel-concierge', status: 'ok' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({ channelType: 'chravel-concierge', status: `error: ${msg}` });
  }

  // ── App-level `user` role grants ──────────────────────────────────────
  // Stream's authorization is the INTERSECTION of channel-type grants and
  // app-level role grants. Even if the channel allows owner-edit/delete,
  // the action will 403 if the connected user's app-level role lacks the
  // base capability. Grant both naming conventions for cross-version safety.
  try {
    if (typeof serverClient.updateAppSettings === 'function') {
      await serverClient.updateAppSettings({
        grants: {
          user: APP_LEVEL_USER_GRANTS,
        },
      });
      results.push({ channelType: 'app-grants:user', status: 'ok' });
    } else {
      results.push({
        channelType: 'app-grants:user',
        status: 'skipped: updateAppSettings unavailable on client',
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error('[stream-setup-permissions] app_role_grants_failed', {
      scope: 'stream-setup-permissions',
      operation: 'update_app_settings',
      role: 'user',
      grants: APP_LEVEL_USER_GRANTS,
      error: msg,
    });
    results.push({ channelType: 'app-grants:user', status: `error: ${msg}` });
  }

  return results;
}
